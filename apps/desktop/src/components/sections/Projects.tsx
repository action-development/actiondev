"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { projects } from "@/data/projects";
import Link from "next/link";

/** Inline transition styles — stagger on enter, instant on leave */
function staggerStyle(
  order: number,
  isActive: boolean
): React.CSSProperties {
  return {
    opacity: isActive ? 1 : 0,
    transform: isActive ? "translateY(0)" : "translateY(28px)",
    transition:
      "opacity 700ms cubic-bezier(0.16,1,0.3,1), transform 700ms cubic-bezier(0.16,1,0.3,1)",
    transitionDelay: isActive ? `${order * 90}ms` : "0ms",
  };
}

/* ── Wireframe placeholders per category ──
   Minimal, monochrome mockups that represent each project type.
   Replace with <video> or <Image> when real assets exist. */

function PlaceholderEcommerce() {
  return (
    <div className="flex h-full w-full flex-col bg-black p-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <div className="h-2 w-16 rounded-full bg-white/[0.08]" />
        <div className="flex gap-3">
          <div className="h-2 w-10 rounded-full bg-white/[0.05]" />
          <div className="h-2 w-10 rounded-full bg-white/[0.05]" />
          <div className="h-2 w-10 rounded-full bg-white/[0.05]" />
        </div>
      </div>
      {/* Hero */}
      <div className="mt-6 flex-1 rounded-lg bg-white/[0.03]" />
      {/* Product grid */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-square rounded-md bg-white/[0.04]" />
            <div className="h-1.5 w-3/4 rounded-full bg-white/[0.06]" />
            <div className="h-1.5 w-1/2 rounded-full bg-white/[0.03]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderPortfolio() {
  return (
    <div className="flex h-full w-full flex-col bg-black p-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <div className="h-2 w-20 rounded-full bg-white/[0.08]" />
        <div className="h-2 w-12 rounded-full bg-white/[0.05]" />
      </div>
      {/* Hero with large text block */}
      <div className="mt-8 flex flex-col gap-2">
        <div className="h-3 w-3/4 rounded-full bg-white/[0.1]" />
        <div className="h-3 w-1/2 rounded-full bg-white/[0.07]" />
      </div>
      {/* Gallery grid */}
      <div className="mt-6 grid flex-1 grid-cols-3 gap-3">
        <div className="col-span-2 rounded-lg bg-white/[0.04]" />
        <div className="flex flex-col gap-3">
          <div className="flex-1 rounded-lg bg-white/[0.03]" />
          <div className="flex-1 rounded-lg bg-white/[0.03]" />
        </div>
      </div>
      {/* Bottom bar */}
      <div className="mt-4 flex gap-3">
        <div className="h-8 flex-1 rounded-md bg-white/[0.02]" />
        <div className="h-8 flex-1 rounded-md bg-white/[0.02]" />
        <div className="h-8 flex-1 rounded-md bg-white/[0.02]" />
      </div>
    </div>
  );
}

function PlaceholderSaas() {
  return (
    <div className="flex h-full w-full bg-black">
      {/* Sidebar */}
      <div className="flex w-1/5 flex-col gap-3 border-r border-white/[0.04] p-4">
        <div className="h-2.5 w-full rounded-full bg-white/[0.08]" />
        <div className="mt-3 h-2 w-3/4 rounded-full bg-white/[0.04]" />
        <div className="h-2 w-full rounded-full bg-white/[0.04]" />
        <div className="h-2 w-2/3 rounded-full bg-white/[0.06]" />
        <div className="h-2 w-3/4 rounded-full bg-white/[0.04]" />
        <div className="mt-auto h-2 w-1/2 rounded-full bg-white/[0.03]" />
      </div>
      {/* Main content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-24 rounded-full bg-white/[0.07]" />
          <div className="h-6 w-6 rounded-full bg-white/[0.04]" />
        </div>
        {/* Metric cards */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border border-white/[0.04] p-3"
            >
              <div className="h-1.5 w-1/2 rounded-full bg-white/[0.05]" />
              <div className="h-3 w-2/3 rounded-full bg-white/[0.1]" />
            </div>
          ))}
        </div>
        {/* Chart area */}
        <div className="mt-4 flex-1 rounded-lg border border-white/[0.04] p-4">
          <div className="flex h-full items-end gap-2">
            {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 68].map(
              (h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-white/[0.06]"
                  style={{ height: `${h}%` }}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderProduct() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black p-6">
      {/* Nav */}
      <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
        <div className="h-2 w-14 rounded-full bg-white/[0.08]" />
        <div className="flex gap-3">
          <div className="h-2 w-8 rounded-full bg-white/[0.05]" />
          <div className="h-2 w-8 rounded-full bg-white/[0.05]" />
        </div>
      </div>
      {/* Centered product */}
      <div className="h-28 w-28 rounded-2xl bg-white/[0.04]" />
      <div className="mt-6 h-3 w-40 rounded-full bg-white/[0.1]" />
      <div className="mt-2 h-2 w-56 rounded-full bg-white/[0.04]" />
      <div className="mt-1 h-2 w-44 rounded-full bg-white/[0.04]" />
      {/* CTA */}
      <div className="mt-6 h-8 w-28 rounded-full bg-white/[0.08]" />
    </div>
  );
}

const PLACEHOLDERS: Record<string, () => React.JSX.Element> = {
  "E-commerce": PlaceholderEcommerce,
  Portfolio: PlaceholderPortfolio,
  SaaS: PlaceholderSaas,
  Product: PlaceholderProduct,
};

function ProjectPlaceholder({ category }: { category: string }) {
  const Component = PLACEHOLDERS[category] ?? PlaceholderProduct;
  return <Component />;
}

/* ═══════════════════════════════════════════════ */

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useGSAP(
    () => {
      /* ── Entrance timeline ── */
      const tl = gsap.timeline();
      tl.from("[data-anim='label']", {
        y: 30,
        opacity: 0,
        duration: 0.6,
      })
        .from(
          "[data-anim='heading']",
          { y: 80, opacity: 0, duration: 1 },
          "-=0.3"
        )
        .from(
          "[data-anim='rule']",
          { scaleX: 0, transformOrigin: "left", duration: 0.8 },
          "-=0.5"
        )
        .from(
          "[data-anim='count']",
          { y: 20, opacity: 0, duration: 0.5 },
          "-=0.3"
        );

      /* ── Hero parallax fade on scroll ── */
      gsap.to("[data-anim='hero']", {
        y: -120,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-anim='hero']",
          start: "top top+=100",
          end: "+=500",
          scrub: 1.5,
        },
      });

      /* ── Rule line extends to full width on scroll ── */
      gsap.to("[data-anim='rule']", {
        width: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: "[data-anim='rule']",
          start: "top 80%",
          end: "top 30%",
          scrub: 1,
        },
      });

      /* ── Sticky video subtle parallax ── */
      gsap.to("[data-sticky-video]", {
        y: 50,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 2,
        },
      });

      /* ── Scroll-driven project activation ── */
      const panels = gsap.utils.toArray(
        "[data-project-panel]"
      ) as HTMLElement[];
      panels.forEach((panel, i) => {
        ScrollTrigger.create({
          trigger: panel,
          start: "top center",
          end: "bottom center",
          onEnter: () => setActiveIndex(i),
          onEnterBack: () => setActiveIndex(i),
        });
      });
    },
    { scope: sectionRef }
  );

  const active = projects[activeIndex];

  return (
    <section ref={sectionRef} className="relative bg-black text-white">
      {/* ═══════════ Hero ═══════════ */}
      <div data-anim="hero" className="px-6 pb-8 pt-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-end justify-between">
            <div>
              <p
                data-anim="label"
                className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500"
              >
                Selected Work
              </p>
              <h1
                data-anim="heading"
                className="text-6xl font-bold leading-[0.85] tracking-tighter md:text-8xl"
              >
                Projects
              </h1>
            </div>
            <p
              data-anim="count"
              className="hidden font-mono text-sm text-neutral-600 md:block"
            >
              {String(projects.length).padStart(2, "0")} Projects
            </p>
          </div>
          <div
            data-anim="rule"
            className="mt-8 h-px w-32 bg-white/[0.08]"
          />
        </div>
      </div>

      {/* ═══════════ Split scroll ═══════════ */}
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="grid grid-cols-12 gap-x-8 md:gap-x-12">
          {/* ── LEFT: Scrollable project list ── */}
          <div className="col-span-12 md:col-span-5">
            {projects.map((project, i) => {
              const isActive = i === activeIndex;

              return (
                <div
                  key={project.id}
                  data-project-panel
                  className="flex min-h-[90vh] items-center py-8"
                >
                  <div className="w-full">
                    {/* Number */}
                    <span
                      className="block font-mono text-[7rem] font-bold leading-none text-white/[0.04] md:text-[9rem]"
                      style={staggerStyle(0, isActive)}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* Title */}
                    <h2
                      className="-mt-6 text-3xl font-bold tracking-tight md:-mt-8 md:text-4xl"
                      style={staggerStyle(1, isActive)}
                    >
                      {project.title}
                    </h2>

                    {/* Category */}
                    <span
                      className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-white/40"
                      style={staggerStyle(2, isActive)}
                    >
                      {project.category}
                    </span>

                    {/* Description */}
                    <p
                      className="mt-5 max-w-sm text-[15px] leading-relaxed text-neutral-400"
                      style={staggerStyle(3, isActive)}
                    >
                      {project.description}
                    </p>

                    {/* Tech pills */}
                    <div
                      className="mt-6 flex flex-wrap gap-2"
                      style={staggerStyle(4, isActive)}
                    >
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-white/[0.08] px-3 py-1 text-[10px] uppercase tracking-wider text-neutral-500"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Year + link */}
                    <div
                      className="mt-8 flex items-center gap-6"
                      style={staggerStyle(5, isActive)}
                    >
                      <span className="font-mono text-xs text-neutral-600">
                        {project.year}
                      </span>
                      <Link
                        href={project.url}
                        className="group/link flex items-center gap-2 text-xs font-medium text-neutral-500 transition-colors duration-300 hover:text-white"
                      >
                        View project
                        <span className="inline-block transition-transform duration-300 group-hover/link:translate-x-1">
                          &rarr;
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: Sticky preview ── */}
          <div className="col-span-7 hidden md:block">
            <div data-sticky-video className="sticky top-[12vh]">
              {/* Browser mockup */}
              <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-black shadow-2xl shadow-black/80">
                {/* Chrome */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                  </div>
                  <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-white/[0.03] px-3">
                    <span className="font-mono text-[10px] text-neutral-600 transition-all duration-500">
                      {active.url === "#"
                        ? `${active.title.toLowerCase().replace(/\s+/g, "")}.com`
                        : active.url}
                    </span>
                  </div>
                </div>

                {/* Preview area */}
                <div className="relative aspect-[16/10]">
                  {projects.map((project, i) => (
                    <div
                      key={project.id}
                      className="absolute inset-0"
                      style={{
                        opacity: i === activeIndex ? 1 : 0,
                        transform:
                          i === activeIndex
                            ? "scale(1)"
                            : "scale(1.04)",
                        filter:
                          i === activeIndex
                            ? "blur(0px)"
                            : "blur(8px)",
                        transition:
                          "opacity 700ms cubic-bezier(0.16,1,0.3,1), transform 700ms cubic-bezier(0.16,1,0.3,1), filter 700ms cubic-bezier(0.16,1,0.3,1)",
                      }}
                    >
                      <ProjectPlaceholder
                        category={project.category}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-6 flex items-center gap-3">
                {projects.map((_, i) => (
                  <div
                    key={i}
                    className="h-px flex-1 overflow-hidden bg-white/[0.04]"
                  >
                    <div
                      className="h-full bg-white"
                      style={{
                        transform:
                          i === activeIndex
                            ? "scaleX(1)"
                            : "scaleX(0)",
                        transformOrigin: "left",
                        transition:
                          "transform 700ms cubic-bezier(0.16,1,0.3,1)",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Counter */}
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-[10px] text-neutral-500">
                  {String(activeIndex + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px] text-neutral-700">
                  {String(projects.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ Bottom CTA ═══════════ */}
      <div className="border-t border-white/[0.06] px-6 py-20">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-600">
            Want to see your project here?
          </p>
          <Link
            href="/contact"
            className="group/btn flex items-center gap-3 rounded-full border border-white/[0.1] px-6 py-3 text-sm font-medium transition-all duration-300 hover:border-white/30 hover:bg-white/[0.03]"
          >
            Start a project
            <span className="inline-block transition-transform duration-300 group-hover/btn:translate-x-1">
              &rarr;
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
