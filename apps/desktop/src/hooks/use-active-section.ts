"use client";

import { useState, useEffect } from "react";

const SECTION_IDS = ["home", "projects", "reviews", "contact"];

export function useActiveSection(enabled: boolean): string {
  const [active, setActive] = useState("home");

  useEffect(() => {
    if (!enabled) return;
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [enabled]);

  return active;
}
