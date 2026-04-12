"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import dynamic from "next/dynamic";

const FloatingCubeCanvas = dynamic(
  () => import("@/components/canvas/FloatingCube").then((m) => m.FloatingCubeCanvas),
  { ssr: false }
);

import { CUBE_PATHS } from "@/components/canvas/FloatingCube";

const AI_PROMPT = encodeURIComponent(
  "I want to understand what Action.dev is and what they do. They are a digital agency specializing in design and development, immersive web experiences with Three.js and React, brand identity, and growth services like SEO and CRO. Summarise their capabilities, notable work, and what makes them different: https://actiondev.es/"
);

function OpenAIIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 260" fill="currentColor" className={className}>
      <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
    </svg>
  );
}

function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 257" fill="currentColor" className={className}>
      <path d="m50.228 170.321 50.357-28.257.843-2.463-.843-1.361h-2.462l-8.426-.518-28.775-.778-24.952-1.037-24.175-1.296-6.092-1.297L0 125.796l.583-3.759 5.12-3.434 7.324.648 16.202 1.101 24.304 1.685 17.629 1.037 26.118 2.722h4.148l.583-1.685-1.426-1.037-1.101-1.037-25.147-17.045-27.22-18.017-14.258-10.37-7.713-5.25-3.888-4.925-1.685-10.758 7-7.713 9.397.649 2.398.648 9.527 7.323 20.35 15.75L94.817 91.9l3.889 3.24 1.555-1.102.195-.777-1.75-2.917-14.453-26.118-15.425-26.572-6.87-11.018-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0 82.05 1.426l4.472 3.888 6.61 15.101 10.694 23.786 16.591 32.34 4.861 9.592 2.592 8.879.973 2.722h1.685v-1.556l1.36-18.211 2.528-22.36 2.463-28.776.843-8.1 4.018-9.722 7.971-5.25 6.222 2.981 5.12 7.324-.713 4.73-3.046 19.768-5.962 30.98-3.889 20.739h2.268l2.593-2.593 10.499-13.934 17.628-22.036 7.778-8.749 9.073-9.657 5.833-4.601h11.018l8.1 12.055-3.628 12.443-11.342 14.388-9.398 12.184-13.48 18.147-8.426 14.518.778 1.166 2.01-.194 30.46-6.481 16.462-2.982 19.637-3.37 8.88 4.148.971 4.213-3.5 8.62-20.998 5.184-24.628 4.926-36.682 8.685-.454.324.519.648 16.526 1.555 7.065.389h17.304l32.21 2.398 8.426 5.574 5.055 6.805-.843 5.184-12.962 6.611-17.498-4.148-40.83-9.721-14-3.5h-1.944v1.167l11.666 11.406 21.387 19.314 26.767 24.887 1.36 6.157-3.434 4.86-3.63-.518-23.526-17.693-9.073-7.972-20.545-17.304h-1.36v1.814l4.73 6.935 25.017 37.59 1.296 11.536-1.814 3.76-6.481 2.268-7.13-1.297-14.647-20.544-15.1-23.138-12.185-20.739-1.49.843-7.194 77.448-3.37 3.953-7.778 2.981-6.48-4.925-3.436-7.972 3.435-15.749 4.148-20.544 3.37-16.333 3.046-20.285 1.815-6.74-.13-.454-1.49.194-15.295 20.999-23.267 31.433-18.406 19.702-4.407 1.75-7.648-3.954.713-7.064 4.277-6.286 25.47-32.405 15.36-20.092 9.917-11.6-.065-1.686h-.583L44.07 198.125l-12.055 1.555-5.185-4.86.648-7.972 2.463-2.593 20.35-13.999-.064.065Z" />
    </svg>
  );
}

function GeminiIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.04.39C11.41-.13 12.2-.13 12.57.39l.47.89a14.4 14.4 0 0 0 8.7 8.84l1.51.55c.48.17.48.85 0 1.03l-1.51.55a14.4 14.4 0 0 0-8.56 8.56l-.59 1.61c-.18.48-.85.48-1.03 0l-.62-1.67a14.4 14.4 0 0 0-8.53-8.5l-1.54-.57c-.48-.17-.48-.85 0-1.02l1.57-.58A14.4 14.4 0 0 0 10.43 1.4l.61-1.01Z" />
    </svg>
  );
}

const AI_ASSISTANTS = [
  { name: "ChatGPT", url: `https://chatgpt.com/?q=${AI_PROMPT}`, icon: OpenAIIcon },
  { name: "Claude", url: `https://claude.ai/new?q=${AI_PROMPT}`, icon: ClaudeIcon },
  { name: "Gemini", url: `https://www.google.com/search?q=${AI_PROMPT}&udm=50`, icon: GeminiIcon },
] as const;

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  // Progress always 0 — cube stays fixed, no scroll movement
  const cubeScrollRef = useRef({ progress: 0 });

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
        )
        .from(
          "[data-anim='subtitle']",
          { y: 20, opacity: 0, duration: 0.6 },
          "-=0.4"
        );

      const fields = gsap.utils.toArray(
        "[data-anim='field']"
      ) as HTMLElement[];
      fields.forEach((el, i) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.6,
          delay: i * 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 92%" },
        });
      });

      const infos = gsap.utils.toArray(
        "[data-anim='info']"
      ) as HTMLElement[];
      infos.forEach((el, i) => {
        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          delay: i * 0.1,
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
      <FloatingCubeCanvas scrollRef={cubeScrollRef} color="#ff6600" path={CUBE_PATHS.contact} position="absolute" />
      <div className="mx-auto max-w-7xl">
        {/* ── Title ── */}
        <div className="mb-24">
          <h1
            data-anim="heading"
            className="text-6xl font-bold tracking-tighter leading-[0.9] md:text-[7.5rem]"
          >
            Let&apos;s build
            <br />
            something <span className="text-accent">great</span>
          </h1>
          <div data-anim="rule" className="mt-8 h-px w-32 bg-accent" />
          <p
            data-anim="subtitle"
            className="mt-6 max-w-md text-lg leading-relaxed text-muted"
          >
            No commitment. We reply within 24h.
          </p>
        </div>

        <div className="grid gap-16 md:grid-cols-5">
          {/* ── Info Column ── */}
          <div className="flex flex-col gap-10 md:col-span-2">
            <div data-anim="info">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
                Email
              </p>
              <a
                href="mailto:hello@action.dev"
                className="text-xl font-medium transition-colors duration-300 hover:text-accent"
              >
                hello@action.dev
              </a>
            </div>

            <div data-anim="info">
              <p className="mb-5 font-mono text-sm uppercase tracking-[0.2em] text-accent">
                Ask AI about us
              </p>
              <div className="flex gap-3">
                {AI_ASSISTANTS.map((ai) => (
                  <a
                    key={ai.name}
                    href={ai.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-3 rounded-full border border-border px-4 py-4 text-base font-medium transition-all duration-300 hover:border-accent hover:text-accent hover:shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                  >
                    <ai.icon className="h-5 w-5 shrink-0" />
                    {ai.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Form ── */}
          <form className="space-y-6 md:col-span-3">
            <div data-anim="field" className="grid gap-6 md:grid-cols-2">
              <input
                type="text"
                name="name"
                placeholder="Name *"
                required
                className="rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-all duration-300 placeholder:text-muted/40 focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone"
                className="rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-all duration-300 placeholder:text-muted/40 focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
              />
            </div>
            <div data-anim="field">
              <input
                type="email"
                name="email"
                placeholder="Email *"
                required
                className="w-full rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-all duration-300 placeholder:text-muted/40 focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
              />
            </div>
            <div data-anim="field">
              <input
                type="url"
                name="website"
                placeholder="Website URL (if you already have one)"
                className="w-full rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-all duration-300 placeholder:text-muted/40 focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
              />
            </div>
            <div data-anim="field">
              <textarea
                name="description"
                placeholder="Tell us about your project — goals, timeline, budget range..."
                required
                rows={8}
                className="w-full resize-none rounded-xl border border-border bg-transparent px-5 py-4 text-sm leading-relaxed outline-none transition-all duration-300 placeholder:text-muted/40 focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
              />
            </div>
            <div
              data-anim="field"
              className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
            >
              <p className="text-xs text-muted/40">
                * Required
              </p>
              <button
                type="submit"
                className="rounded-full bg-accent px-8 py-4 text-sm font-semibold text-background transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.12)]"
              >
                Send message
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Decorative — subtle glow orb */}
      <div className="pointer-events-none absolute -left-32 top-1/2 -z-10 h-[600px] w-[600px] rounded-full bg-accent/[0.02] blur-[150px]" />
    </section>
  );
}
