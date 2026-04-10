"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";

export function Map() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.from("[data-anim='label']", { y: 30, opacity: 0, duration: 0.6 })
        .from(
          "[data-anim='heading']",
          { y: 80, opacity: 0, duration: 1 },
          "-=0.3"
        )
        .from(
          "[data-anim='rule']",
          { scaleX: 0, transformOrigin: "left", duration: 0.8 },
          "-=0.5"
        );

      gsap.from("[data-anim='map']", {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "[data-anim='map']",
          start: "top 85%",
        },
      });

      const infos = gsap.utils.toArray(
        "[data-anim='info']"
      ) as HTMLElement[];
      infos.forEach((el, i) => {
        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          delay: i * 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-6 pb-32 pt-12"
    >
      <div className="mx-auto max-w-7xl">
        {/* ── Title ── */}
        <div className="mb-32">
          <p
            data-anim="label"
            className="mb-5 text-xs uppercase tracking-[0.3em] text-muted font-mono"
          >
            Find Us
          </p>
          <h1
            data-anim="heading"
            className="text-7xl font-bold tracking-tighter leading-[0.85] md:text-[9rem]"
          >
            Location
          </h1>
          <div data-anim="rule" className="mt-8 h-px w-32 bg-[#22d3ee]" />
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          {/* ── Map Visualization ── */}
          <div data-anim="map" className="md:col-span-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border/40 bg-background">
              {/* Coordinate grid */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 800 500"
                preserveAspectRatio="xMidYMid slice"
              >
                {/* Vertical grid lines */}
                {Array.from({ length: 17 }, (_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * 50}
                    y1="0"
                    x2={i * 50}
                    y2="500"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-border/30"
                  />
                ))}
                {/* Horizontal grid lines */}
                {Array.from({ length: 11 }, (_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="0"
                    y1={i * 50}
                    x2="800"
                    y2={i * 50}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-border/30"
                  />
                ))}

                {/* Pulsing rings */}
                <circle cx="400" cy="250" r="20" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.2">
                  <animate attributeName="r" from="20" to="80" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="400" cy="250" r="20" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.15">
                  <animate attributeName="r" from="20" to="80" dur="3s" begin="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.2" to="0" dur="3s" begin="1.5s" repeatCount="indefinite" />
                </circle>

                {/* Static rings */}
                <circle cx="400" cy="250" r="40" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.1" />

                {/* Crosshair */}
                <line x1="365" y1="250" x2="393" y2="250" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
                <line x1="407" y1="250" x2="435" y2="250" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
                <line x1="400" y1="215" x2="400" y2="243" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
                <line x1="400" y1="257" x2="400" y2="285" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />

                {/* Center dot */}
                <circle cx="400" cy="250" r="5" fill="#22d3ee" opacity="0.9" />
              </svg>

              {/* Corner labels */}
              <div className="absolute bottom-4 left-5 font-mono text-[10px] tracking-wider text-[#22d3ee]/50">
                40.4168&deg;N, 3.7038&deg;W
              </div>
              <div className="absolute right-5 top-4 font-mono text-[10px] uppercase tracking-wider text-muted/25">
                Madrid, ES
              </div>
            </div>
          </div>

          {/* ── Info Column ── */}
          <div className="flex flex-col justify-center gap-10">
            <div data-anim="info">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#22d3ee]">
                Address
              </p>
              <p className="text-lg font-medium">Calle Gran V&iacute;a, 28</p>
              <p className="text-muted">28013 Madrid, Spain</p>
            </div>

            <div data-anim="info">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#22d3ee]">
                Contact
              </p>
              <a
                href="mailto:hello@action.dev"
                className="text-lg font-medium transition-colors duration-300 hover:text-[#22d3ee]"
              >
                hello@action.dev
              </a>
              <p className="text-muted">+34 912 345 678</p>
            </div>

            <div data-anim="info">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#22d3ee]">
                Hours
              </p>
              <p className="text-lg font-medium">Mon &mdash; Fri</p>
              <p className="text-muted">09:00 &mdash; 18:00 CET</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative — cyan glow orb */}
      <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-[#22d3ee]/[0.03] blur-[150px]" />
    </section>
  );
}
