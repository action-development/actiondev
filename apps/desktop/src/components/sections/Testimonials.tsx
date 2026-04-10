"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import { testimonials } from "@/data/testimonials";

export function Testimonials() {
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

      const cards = gsap.utils.toArray(
        "[data-anim='testimonial']"
      ) as HTMLElement[];
      cards.forEach((card, i) => {
        gsap.from(card, {
          y: 60,
          opacity: 0,
          duration: 0.9,
          delay: i * 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 88%" },
        });
      });
    },
    { scope: sectionRef }
  );

  const featured = testimonials[0];
  const rest = testimonials.slice(1);

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
            What They Say
          </p>
          <h1
            data-anim="heading"
            className="text-7xl font-bold tracking-tighter leading-[0.85] md:text-[9rem]"
          >
            Reviews
          </h1>
          <div data-anim="rule" className="mt-8 h-px w-32 bg-[#ec4899]" />
        </div>

        {/* ── Featured Testimonial ── */}
        <div data-anim="testimonial" className="relative mb-28">
          {/* Decorative quote mark */}
          <span
            className="pointer-events-none absolute -left-4 -top-20 select-none font-serif text-[14rem] leading-none text-[#ec4899]/[0.06]"
            aria-hidden="true"
          >
            &ldquo;
          </span>

          <blockquote className="relative">
            <p className="max-w-4xl text-3xl font-medium leading-[1.35] tracking-tight md:text-5xl md:leading-[1.25]">
              {featured.quote}
            </p>
            <footer className="mt-12 flex items-center gap-5">
              {/* Avatar placeholder */}
              <div className="h-14 w-14 rounded-full border border-border/50 bg-border/20" />
              <div>
                <p className="text-base font-semibold">{featured.name}</p>
                <p className="text-sm text-muted">
                  {featured.role},{" "}
                  <span className="text-[#ec4899]">{featured.company}</span>
                </p>
              </div>
            </footer>
          </blockquote>
        </div>

        {/* ── Remaining Testimonials ── */}
        <div className="grid gap-6 md:grid-cols-2">
          {rest.map((t) => (
            <blockquote
              key={t.id}
              data-anim="testimonial"
              className="rounded-2xl border border-border/40 p-8 transition-all duration-500 hover:border-border hover:bg-white/[0.01]"
            >
              <p className="mb-8 text-lg leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full border border-border/50 bg-border/20" />
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted">
                    {t.role}, {t.company}
                  </p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>

      {/* Decorative — pink glow orb */}
      <div className="pointer-events-none absolute left-0 top-1/3 -z-10 h-[550px] w-[550px] rounded-full bg-[#ec4899]/[0.03] blur-[150px]" />
    </section>
  );
}
