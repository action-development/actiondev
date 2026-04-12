"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { GameScene } from "@/components/canvas/GameScene";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const SESSION_KEY = "action-loaded";

/**
 * GameLayout — Keeps GameScene always mounted so physics state persists
 * across client-side navigations. Owns the page transition overlay:
 * a radial wipe that expands from center on score, navigates at peak,
 * then contracts on the destination page.
 */
export function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const transitioning = useRef(false);

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setLoading(true);
    }
  }, []);

  const handleComplete = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setLoading(false);
  }, []);

  // --- Transition out on arrival (runs when pathname changes) ---
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !transitioning.current) return;

    // Remove clip-path so opacity fade works on the full rectangle
    overlay.style.clipPath = "none";
    overlay.style.opacity = "1";

    // Small delay so the new page has rendered behind the overlay
    const timer = setTimeout(() => {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        onComplete: () => {
          overlay.style.display = "none";
          overlay.style.opacity = "1";
          transitioning.current = false;
        },
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  // --- Score transition: expand overlay → navigate at peak ---
  const handleNavigate = useCallback(
    (href: string) => {
      const overlay = overlayRef.current;
      if (!overlay || transitioning.current) return;

      transitioning.current = true;
      overlay.style.display = "block";
      overlay.style.clipPath = "circle(0% at 50% 50%)";

      gsap.to(overlay, {
        clipPath: "circle(100% at 50% 50%)",
        duration: 0.6,
        ease: "power2.in",
        onComplete: () => {
          router.push(href);
        },
      });
    },
    [router]
  );

  return (
    <>
      {/* Game canvas — always mounted, hidden + paused when not on home */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: isHome ? 0 : -1,
          visibility: isHome ? "visible" : "hidden",
        }}
      >
        {loading && <LoadingScreen onComplete={handleComplete} />}
        <GameScene paused={loading || !isHome} onNavigate={handleNavigate} />
      </div>

      {/* Page content — renders on top when not on home */}
      {!isHome && <div className="relative z-10">{children}</div>}

      {/* Transition overlay — radial wipe between pages */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100]"
        style={{
          display: "none",
          clipPath: "circle(0% at 50% 50%)",
          background: "radial-gradient(ellipse at center, #111 0%, #000 100%)",
        }}
      />
    </>
  );
}
