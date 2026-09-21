"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Blinds, blindsDuration } from "@/components/ui/Blinds";

/**
 * PageTransition — persiana de acento entre rutas.
 *
 * Vive en el layout raíz envolviendo `children` (que siguen siendo server
 * components: solo se pasan como prop). Un único listener de click en
 * `document` intercepta cualquier `<a>` interno — `<Link>` del Header, del
 * Footer, de las legales, de las landings — sin tener que tocar cada uno:
 *
 *   click → cerrar persiana (arriba → abajo) → `router.push` → la ruta nueva
 *   se monta TAPADA → cambia `pathname` → abrir persiana → idle.
 *
 * El juego de la home navega por `usePageTransition().navigate(href)` con la
 * misma secuencia. Es la MISMA cortina que `LoadingScreen`: al aterrizar en `/`
 * en frío (primera visita de la sesión) la pantalla de carga ya está cerrada en
 * lima cuando esta se abre, así que se encadenan sin costura. Con la escena ya
 * cargada en la sesión, la home ni la monta y se queda con esta sola.
 *
 * `busy` dice si la persiana está en movimiento o cerrada. La home lo lee en su
 * primer render para saber que ya llega TAPADA y no montar su pantalla de carga
 * encima: dos cortinas idénticas encadenadas hacían que volver a `/` tardase
 * ~5 s frente a los ~1,9 s de cualquier otra ruta. La escena 3D arranca detrás
 * de esta persiana mientras se recoge, y acaba de entrar con su propio fundido.
 *
 * Se deja pasar sin animar: modificadores (cmd/ctrl/shift/alt → pestaña
 * nueva), botón no principal, `target="_blank"`, `download`, orígenes externos,
 * `data-no-transition`, un `#ancla` de la misma página y el click a la ruta en
 * la que ya estamos. Si el padre ya hizo `preventDefault` (logo del Header en
 * `/` → scroll a 0) tampoco se toca. Back/forward del navegador no pasan por
 * aquí y cambian de página en seco a propósito: es navegación del usuario
 * fuera del sitio y no debe esperar 900 ms.
 */

type Phase = "idle" | "closing" | "closed" | "opening";

/** Si la ruta nueva no llega en este plazo, se abre igualmente: nunca dejar al visitante encerrado. */
const STUCK_TIMEOUT_MS = 4000;

const currentLocation = () =>
  window.location.pathname + window.location.search + window.location.hash;

interface PageTransitionApi {
  /** Navega a `href` (ruta interna que empiece por "/") con la persiana. */
  navigate: (href: string) => void;
  /** `true` mientras la persiana está en movimiento o cerrada. */
  busy: boolean;
}

const PageTransitionContext = createContext<PageTransitionApi>({
  navigate: () => {},
  busy: false,
});

export function usePageTransition(): PageTransitionApi {
  return useContext(PageTransitionContext);
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const timers = useRef<number[]>([]);

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const navigate = useCallback(
    (href: string) => {
      if (phaseRef.current !== "idle") return;
      if (!href.startsWith("/")) return;

      const url = new URL(href, window.location.origin);
      // Misma ruta: no hay nada que tapar. Un hash de la misma página se deja
      // al scroll nativo/Lenis.
      if (url.pathname === window.location.pathname) {
        if (url.hash) window.location.hash = url.hash;
        return;
      }

      const from = currentLocation();
      router.prefetch(href);
      setPhaseSync("closing");

      later(() => {
        setPhaseSync("closed");
        router.push(href);
      }, blindsDuration());

      // Abrir en cuanto la URL cambie (ruta nueva, o un redirect del servidor
      // como `/projects` → `/#projects`). Se mira `location` y no `usePathname`
      // porque un redirect a la misma ruta con hash no re-renderiza el hook.
      // Escotilla por tiempo: chunk que no baja, error de render, lo que sea.
      const startedAt = performance.now();
      const poll = () => {
        if (phaseRef.current !== "closed") return;
        const moved = currentLocation() !== from;
        const stuck = performance.now() - startedAt > STUCK_TIMEOUT_MS;
        if (moved || stuck) {
          setPhaseSync("opening");
          later(() => setPhaseSync("idle"), blindsDuration());
          return;
        }
        later(poll, 50);
      };
      later(poll, blindsDuration());
    },
    [router, setPhaseSync, later]
  );

  // Interceptor global de links internos.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download") || anchor.hasAttribute("data-no-transition")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    };

    // Fase de CAPTURA: el `<Link>` de Next hace su propio `preventDefault` +
    // `router.push` en el bubbling del root de React. Si escuchásemos ahí
    // llegaríamos tarde y con `defaultPrevented` ya a true. En captura vamos
    // primero; Next ve el evento prevenido y no navega por su cuenta.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);

  const closed = phase === "closing" || phase === "closed";
  const active = phase !== "idle";

  return (
    <PageTransitionContext.Provider value={{ navigate, busy: active }}>
      {children}
      <div
        data-testid="page-blinds"
        data-state={phase}
        aria-hidden
        className="fixed inset-0 z-[100]"
        style={{ pointerEvents: active ? "auto" : "none" }}
      >
        <Blinds closed={closed} />
      </div>
    </PageTransitionContext.Provider>
  );
}
