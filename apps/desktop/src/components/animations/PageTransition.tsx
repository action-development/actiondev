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
import { preloadScene } from "@/lib/scene-preload";

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
 * Se deja pasar sin animar: toda página `/hablemos/*` (landings de campaña),
 * modificadores (cmd/ctrl/shift/alt → pestaña
 * nueva), botón no principal, `target="_blank"`, `download`, orígenes externos,
 * `data-no-transition`, un `#ancla` de la misma página y el click a la ruta en
 * la que ya estamos. Si el padre ya hizo `preventDefault` (logo del Header en
 * `/` → scroll a 0) tampoco se toca. Back/forward del navegador no pasan por
 * aquí y cambian de página en seco a propósito: es navegación del usuario
 * fuera del sitio y no debe esperar a la persiana.
 *
 * Precarga: al apuntar o enfocar un enlace interno, y al empezar a navegar, se
 * pide ya el chunk de la escena 3D del destino (`lib/scene-preload`). Sin eso
 * no se pedía hasta montar la ruta, con la persiana ya cerrada esperando.
 */

type Phase = "idle" | "closing" | "closed" | "opening";

/** Si la ruta nueva no llega en este plazo, se abre igualmente: nunca dejar al visitante encerrado. */
const STUCK_TIMEOUT_MS = 4000;

const currentLocation = () =>
  window.location.pathname + window.location.search + window.location.hash;

interface NavigateOptions {
  /** La pantalla YA es la persiana cerrada (lo que ha pintado el llamante es
   * idéntico): se pone cerrada sin animar y solo se anima la apertura. La usa
   * la puerta de /projects, cuya sala de neón acaba en una pared de lamas. */
  covered?: boolean;
}

interface PageTransitionApi {
  /** Navega a `href` (ruta interna que empiece por "/") con la persiana. */
  navigate: (href: string, options?: NavigateOptions) => void;
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
  /** Cierre sin transición (`covered`). Se apaga al abrir: la apertura se anima siempre. */
  const [instant, setInstant] = useState(false);
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
    (href: string, options?: NavigateOptions) => {
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
      const closeMs = options?.covered ? 0 : blindsDuration();
      // El chunk de la escena baja mientras la persiana se cierra (el juego de
      // la home y la puerta de /projects llegan aquí sin pasar por un hover).
      preloadScene(url.pathname);
      router.prefetch(href);
      if (options?.covered) {
        setInstant(true);
        setPhaseSync("closed");
        router.push(href);
      } else {
        setPhaseSync("closing");
        later(() => {
          setPhaseSync("closed");
          router.push(href);
        }, closeMs);
      }

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
          setInstant(false);
          setPhaseSync("opening");
          later(() => setPhaseSync("idle"), blindsDuration());
          return;
        }
        // Cada frame: la URL suele cambiar a los pocos ms del `push`, y con 50
        // ms de sondeo la persiana esperaba de media 25 ms de más.
        later(poll, 16);
      };
      later(poll, closeMs);
    },
    [router, setPhaseSync, later]
  );

  // Interceptor global de links internos.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      // Landings de campaña (`/hablemos/*`): llegan de un anuncio y no es la
      // web de autor — navegación inmediata, sin persiana.
      if (window.location.pathname.startsWith("/hablemos")) return;
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

  // Precarga por intención: apuntar (o enfocar con el teclado) un enlace
  // interno a una escena 3D ya empieza a bajar su chunk. Al hacer click se
  // gana lo que se tarda en apuntar más el cierre de la persiana.
  //
  // `/` no: el logo y "Inicio" se rozan sin querer en todas las páginas y la
  // home son ~1,1 MB gz (GameScene + Rapier); se precarga solo al navegar de
  // verdad (`navigate`). El táctil tampoco: un `pointerover` de dedo puede ser
  // el principio de un scroll, y el toque ya pasa por `navigate`.
  useEffect(() => {
    const onIntent = (e: Event) => {
      if ((e as PointerEvent).pointerType === "touch") return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (url.pathname === "/") return;
      preloadScene(url.pathname);
    };
    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);
    return () => {
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("focusin", onIntent);
    };
  }, []);

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
        <Blinds closed={closed} instant={instant} />
      </div>
    </PageTransitionContext.Provider>
  );
}
