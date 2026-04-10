"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";

export function Contact() {
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
      <div className="mx-auto max-w-7xl">
        {/* ── Title ── */}
        <div className="mb-24">
          <p
            data-anim="label"
            className="mb-5 text-xs uppercase tracking-[0.3em] text-muted font-mono"
          >
            Get in Touch
          </p>
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
            Ready to start your next project? We&apos;d love to hear from you.
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
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
                Phone
              </p>
              <p className="text-xl font-medium">+34 912 345 678</p>
            </div>

            <div data-anim="info">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
                Social
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {["Twitter", "Instagram", "LinkedIn", "Dribbble"].map(
                  (social) => (
                    <a
                      key={social}
                      href="#"
                      className="text-sm text-muted transition-colors duration-300 hover:text-foreground"
                    >
                      {social}
                    </a>
                  )
                )}
              </div>
            </div>

            <div data-anim="info">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
                Location
              </p>
              <p className="text-muted">Madrid, Spain</p>
            </div>
          </div>

          {/* ── Form ── */}
          <form className="space-y-6 md:col-span-3">
            <div data-anim="field" className="grid gap-6 md:grid-cols-2">
              <input
                type="text"
                placeholder="Name"
                className="rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-all duration-300 placeholder:text-muted/40 focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
              />
              <input
                type="email"
                placeholder="Email"
                className="rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-all duration-300 placeholder:text-muted/40 focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
              />
            </div>
            <div data-anim="field">
              <input
                type="text"
                placeholder="Subject"
                className="w-full rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-all duration-300 placeholder:text-muted/40 focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
              />
            </div>
            <div data-anim="field">
              <textarea
                placeholder="Tell us about your project..."
                rows={8}
                className="w-full resize-none rounded-xl border border-border bg-transparent px-5 py-4 text-sm leading-relaxed outline-none transition-all duration-300 placeholder:text-muted/40 focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
              />
            </div>
            <div
              data-anim="field"
              className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
            >
              <p className="text-xs text-muted/40">
                We typically respond within 24 hours.
              </p>
              <button
                type="submit"
                className="rounded-full bg-accent px-8 py-4 text-sm font-semibold text-background transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(200,255,0,0.12)]"
              >
                Send message
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Decorative — lime glow orb */}
      <div className="pointer-events-none absolute -left-32 top-1/2 -z-10 h-[600px] w-[600px] rounded-full bg-accent/[0.02] blur-[150px]" />
    </section>
  );
}
