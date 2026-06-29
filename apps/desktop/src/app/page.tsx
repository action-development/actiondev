"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASING, DURATION } from "@/lib/animations";
import dynamic from "next/dynamic";
import { SmoothScroll } from "@/components/animations/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollIndicator } from "@/components/layout/ScrollIndicator";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Projects } from "@/components/sections/Projects";
import { ProjectsIndex } from "@/components/sections/ProjectsIndex";
import { Testimonials } from "@/components/sections/Testimonials";
import { Contact } from "@/components/sections/Contact";
import { StructuredData } from "@/components/seo/StructuredData";

const GameScene = dynamic(
  () => import("@/components/canvas/GameScene").then((m) => m.GameScene),
  { ssr: false }
);

const SESSION_KEY = "action-loaded";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [gamePaused, setGamePaused] = useState(false);
  const [physicsActive, setPhysicsActive] = useState(false);
  const [loadingReady, setLoadingReady] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const transitioning = useRef(false);
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
    requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
  }, []);

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

  // Pause physics when game section leaves viewport
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

  // Score → radial wipe → scroll to section
  const handleNavigate = useCallback((href: string) => {
    const overlay = overlayRef.current;
    if (!overlay || transitioning.current) return;

    transitioning.current = true;
    overlay.style.display = "block";
    overlay.style.clipPath = "circle(0% at 50% 50%)";
    overlay.style.opacity = "1";

    gsap.to(overlay, {
      clipPath: "circle(100% at 50% 50%)",
      duration: DURATION.DEFAULT,
      ease: EASING.EXIT,
      onComplete: () => {
        const sectionId = href.startsWith("#") ? href.slice(1) : href;
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "instant" });

        setTimeout(() => {
          gsap.to(overlay, {
            opacity: 0,
            duration: DURATION.OVERLAY,
            ease: EASING.ENTER,
            onComplete: () => {
              overlay.style.display = "none";
              overlay.style.opacity = "1";
              transitioning.current = false;
            },
          });
        }, 150);
      },
    });
  }, []);

  return (
    <SmoothScroll>
      <StructuredData kind="projects" />
      <StructuredData kind="reviews" />
      <Header />
      <ScrollIndicator />

      <section ref={homeRef} id="home" className="relative overflow-hidden min-h-screen">
        {loading && <LoadingScreen ready={loadingReady} onComplete={handleLoadingComplete} />}
        <GameScene paused={loading || gamePaused} physicsPaused={gamePaused} renderPaused={gamePaused} physicsActive={physicsActive} onNavigate={handleNavigate} onReady={handleGameReady} />
      </section>

      <main id="main-content">
        <div id="projects">
          <Projects />
          <ProjectsIndex />
        </div>
        <div id="reviews">
          <Testimonials />
        </div>
        <div id="contact">
          <Contact />
        </div>
      </main>

      <Footer />

      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{
          display: "none",
          clipPath: "circle(0% at 50% 50%)",
          background: "radial-gradient(ellipse at center, #111 0%, #000 100%)",
        }}
      />
    </SmoothScroll>
  );
}
