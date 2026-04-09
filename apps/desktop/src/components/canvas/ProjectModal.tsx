"use client";

import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import type { Project } from "@/data/projects";

/**
 * ProjectModal — Fullscreen takeover when a project enters the Black Hole.
 *
 * ### Animation sequence (GSAP):
 * 1. Backdrop fades in (black → 95% opacity)
 * 2. Purple radial flash from center (the "absorption" effect)
 * 3. Content slides up from bottom with stagger
 * 4. Close button fades in last
 *
 * On close: reverse sequence, then call onClose callback.
 *
 * Uses useGSAP pattern but with gsap.context() + manual cleanup since
 * the animation is event-driven (not mount-driven). contextSafe pattern
 * for the close handler.
 */

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tlRef.current = tl;

      tl
        // Backdrop fade
        .fromTo(
          containerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.4 }
        )
        // Purple absorption flash
        .fromTo(
          flashRef.current,
          { scale: 0, opacity: 1 },
          { scale: 4, opacity: 0, duration: 0.8 },
          0
        )
        // Content stagger reveal
        .fromTo(
          "[data-modal-item]",
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.6 },
          0.2
        )
        // Close button
        .fromTo(
          "[data-modal-close]",
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.3 },
          0.5
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleClose = useCallback(() => {
    const tl = gsap.timeline({
      defaults: { ease: "expo.in" },
      onComplete: onClose,
    });

    tl.to("[data-modal-item]", {
      y: -40,
      opacity: 0,
      stagger: 0.04,
      duration: 0.3,
    }).to(
      containerRef.current,
      { opacity: 0, duration: 0.3 },
      0.15
    );
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center opacity-0"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
    >
      {/* Purple absorption flash */}
      <div
        ref={flashRef}
        className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, transparent 70%)",
        }}
      />

      {/* Modal content */}
      <div
        ref={contentRef}
        className="relative max-w-2xl w-full mx-6 flex flex-col items-center text-center"
      >
        {/* Project category */}
        <span
          data-modal-item
          className="text-sm uppercase tracking-[0.3em] text-muted mb-4 font-mono"
        >
          {project.category} — {project.year}
        </span>

        {/* Project title */}
        <h2
          data-modal-item
          className="text-6xl md:text-8xl font-bold tracking-tighter text-foreground mb-6"
        >
          {project.title}
        </h2>

        {/* Description */}
        <p
          data-modal-item
          className="text-lg text-muted max-w-md mb-8 leading-relaxed"
        >
          {project.description}
        </p>

        {/* Tech stack */}
        <div data-modal-item className="flex gap-3 mb-10 flex-wrap justify-center">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 border border-border rounded-full text-xs text-muted font-mono uppercase tracking-wider"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* CTA buttons */}
        <div data-modal-item className="flex gap-4">
          <a
            href={project.url}
            className="px-8 py-3 bg-accent text-background font-bold text-sm uppercase tracking-wider rounded-full hover:scale-105 transition-transform duration-300"
          >
            View Project
          </a>
          <button
            onClick={handleClose}
            className="px-8 py-3 border border-border text-foreground font-bold text-sm uppercase tracking-wider rounded-full hover:border-muted transition-colors duration-300"
          >
            Back to Space
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        data-modal-close
        onClick={handleClose}
        className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center border border-border rounded-full text-muted hover:text-foreground hover:border-muted transition-colors duration-300"
        aria-label="Close project details"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
        </svg>
      </button>
    </div>
  );
}
