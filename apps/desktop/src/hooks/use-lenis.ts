"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";

export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({
      // Disable smooth interpolation for users who prefer reduced motion.
      // lerp: 1 makes Lenis a pass-through (instant scroll, no animation).
      lerp: prefersReduced ? 1 : 0.1,
      smoothWheel: !prefersReduced,
    });

    lenisRef.current = lenis;

    // Drive Lenis from GSAP's ticker so ScrollTrigger reads scroll positions
    // at the exact same frame — prevents triggers firing at wrong positions.
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
