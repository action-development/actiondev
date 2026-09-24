"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { usePageTransition } from "@/components/animations/PageTransition";
import { PORT_CONTAINERS } from "@/data/port-containers";
import { landings } from "@/data/landings";
import { BRAND } from "@/lib/seo";

const GameScene = dynamic(
  () => import("@/components/canvas/GameScene").then((m) => m.GameScene),
  { ssr: false }
);

const SESSION_KEY = "action-loaded";

/**
 * Arranca la descarga de Rapier en paralelo, no en cascada.
 *
 * `<Physics>` hace `suspend(() => import("@dimforge/rapier3d-compat"))`, así que
 * sin esto la secuencia es: bundle de la página → chunk de GameScene → render de
 * GameWorld → *ahí* empieza a bajar el módulo de física. Son tres round-trips en
 * serie antes de tocar los 2,2 MB del build `compat` (lleva el WASM embebido en
 * base64, no es un .wasm aparte).
 *
 * Lanzándolo en el mount de la home, esos 2,2 MB viajan a la vez que el chunk de
 * GameScene. Cuando `<Physics>` suspenda, el módulo ya está en el registro del
 * bundler y resuelve al instante. El `catch` vacío es deliberado: si falla, que
 * falle en su sitio (dentro del Suspense) y no como rechazo sin gestionar.
 */
function prefetchPhysics() {
  void import("@dimforge/rapier3d-compat").catch(() => {});
}

/**
 * Home = pantalla de inicio del "videojuego". Solo vive aquí el hero "La Grúa":
 * ocupa el viewport entero, no hay scroll ni secciones debajo. Cada contenedor
 * cargado en el barco navega a su propia ruta (`/projects`, `/resenas`,
 * `/contact` — ver `data/port-containers.ts`), donde las antiguas secciones de
 * la home viven tal cual con Lenis + GSAP.
 */
export default function HomePage() {
  const router = useRouter();
  const { navigate, busy } = usePageTransition();
  /**
   * ¿Aterrizamos con la persiana de `PageTransition` ya cubriendo la pantalla?
   * (click en un link desde otra ruta). Entonces NO se monta la pantalla de
   * carga: sería una SEGUNDA persiana idéntica encadenada a la primera, y
   * volver a `/` tardaba ~5 s frente a los ~1,9 s de cualquier otra ruta. La
   * escena arranca DETRÁS de la persiana de la transición mientras se recoge
   * (está pintada antes de que se vaya la última lama) y acaba de entrar con
   * su propio `animate-fade-in`, así que no hace falta tapar nada más.
   *
   * Solo se salta con la escena ya cargada alguna vez en esta sesión: en frío
   * hay que bajar el chunk de GameScene y los 2,2 MB de física, y para eso
   * está la pantalla de carga con su `ready`. `busy` es `false` en SSR y en la
   * carga directa de `/`, así que la hidratación no se desajusta (y el
   * cortocircuito evita tocar `sessionStorage` en el servidor).
   */
  const [skipLoader] = useState(() => busy && !!sessionStorage.getItem(SESSION_KEY));
  const [loading, setLoading] = useState(!skipLoader);
  const [gamePaused, setGamePaused] = useState(false);
  const [physicsActive, setPhysicsActive] = useState(false);
  const [loadingReady, setLoadingReady] = useState(false);
  const homeRef = useRef<HTMLElement>(null);

  // Fired once when GameWorld mounts + shaders are compiled.
  // LoadingScreen manages its own minimum display time internally.
  const gameReadyRef  = useRef(false);
  const revealStarted = useRef(false);

  const tryReveal = useCallback(() => {
    if (!gameReadyRef.current || revealStarted.current) return;
    revealStarted.current = true;
    // Physics starts now — cubes fall while LoadingScreen counts to 100% and fades (~750ms).
    setPhysicsActive(true);
    setLoadingReady(true);
  }, []);

  // Called by GameWorld after Rapier mounts + gl.compile() finishes
  const handleGameReady = useCallback(() => {
    gameReadyRef.current = true;
    tryReveal();
  }, [tryReveal]);

  // Called by LoadingScreen after its own fade-out completes
  const handleLoadingComplete = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setLoading(false);
  }, []);

  // Prioridad máxima: los 2,2 MB de física empiezan a bajar en el primer mount,
  // en paralelo con el chunk de GameScene, no después de él.
  useEffect(() => {
    prefetchPhysics();
  }, []);

  // Los destinos del juego son rutas reales: precalentarlas mientras el
  // visitante juega para que el wipe aterrice sin pantalla en blanco.
  useEffect(() => {
    for (const c of PORT_CONTAINERS) {
      if (c.href.startsWith("/")) router.prefetch(c.href);
    }
  }, [router]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      // Return visit — chunk is cached, so game will mount fast. Pre-arm physics
      // so it starts the instant GameWorld mounts. loadingReady is NOT set here —
      // handleGameReady → tryReveal sets it once GameWorld actually signals ready,
      // preventing a black-screen gap when the loading screen ends before the canvas
      // has rendered its first frame.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhysicsActive(true);
      gameReadyRef.current = true;
    }
  }, []);

  // Pause physics/render when the tab is hidden or the canvas leaves the viewport.
  useEffect(() => {
    const el = homeRef.current;
    if (!el) return;

    let sectionInViewport = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionInViewport = entry.isIntersecting;
        setGamePaused(!sectionInViewport);
      },
      { threshold: 0.1 }
    );

    // When the tab becomes visible again, re-apply the correct pause state.
    // Some browsers fire IntersectionObserver with isIntersecting=false on tab hide
    // but don't re-fire on tab show if the element hasn't moved — leaving the game
    // permanently paused.
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setGamePaused(!sectionInViewport);
        // If the context survived but the canvas dimensions are stale, a resize
        // event lets R3F re-measure its container and update the renderer.
        window.dispatchEvent(new Event("resize"));
      }
    };

    observer.observe(el);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Contenedor en la bodega → pantalla de carga (PageTransition) → ruta de esa sección.
  const handleNavigate = useCallback((href: string) => {
    // Solo rutas reales. Un "#algo" es un destino que todavía no existe
    // (p. ej. el contenedor ALCASI): sin esto la pantalla de carga entraba, no
    // había a dónde ir y volvía al mismo sitio. Parecía roto.
    if (!href.startsWith("/")) return;
    navigate(href);
  }, [navigate]);

  return (
    <>
      <Header />

      <main id="main-content">
        {/*
          Texto indexable de la home. El hero es un canvas: sin esto la URL con
          más autoridad del sitio no tiene <h1> ni un solo enlace a los
          servicios. En español fijo (documento `lang="es"`, como el "Saltar al
          contenido"). El <nav> solo se ve al recibir foco de teclado —
          `focus-within`— para que Tab no caiga en enlaces invisibles.
        */}
        <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:left-4 focus-within:top-20 focus-within:z-50 focus-within:border focus-within:border-border focus-within:bg-background focus-within:p-4">
          <h1>{BRAND.tagline}</h1>
          <p>{BRAND.shortDescription}</p>
          <nav aria-label="Servicios">
            <ul>
              <li>
                <Link href="/servicios">Servicios</Link>
              </li>
              {landings.map((l) => (
                <li key={l.slug}>
                  <Link href={`/${l.slug}`}>{l.serviceName}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <section
          ref={homeRef}
          id="home"
          className="relative h-[100dvh] overflow-hidden"
        >
          {loading && <LoadingScreen ready={loadingReady} onComplete={handleLoadingComplete} />}
          <GameScene paused={loading || gamePaused} physicsPaused={gamePaused} renderPaused={gamePaused} physicsActive={physicsActive} onNavigate={handleNavigate} onReady={handleGameReady} />
        </section>
      </main>
    </>
  );
}
