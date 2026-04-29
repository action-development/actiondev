"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import { AI_ASSISTANTS } from "@/data/ai-assistants";
import { AccentWord } from "@/components/ui/AccentWord";
import { useLocale, useT } from "@/lib/i18n";

/**
 * Editorial contact form — no boxes, no cards. Each input is a baseline rule
 * with a label above (mono) and a bottom hairline that lights up on focus.
 * Submit is a text CTA with an arrow, same vocabulary as the navbar CTA.
 */

const fieldLabelClass = "micro-label mb-3 block text-foreground/50";
const fieldClass =
  "w-full border-0 border-b border-[var(--hairline-strong)] bg-transparent py-3 text-lg text-foreground placeholder:text-muted/50 outline-none transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] focus:border-accent";

export function Contact() {
  const t = useT();
  const { locale } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          once: true,
        },
      });
      tl.from("[data-anim='heading']", { y: 60, opacity: 0, duration: 1, ease: "power3.out" })
        .from("[data-anim='rule']", { scaleX: 0, transformOrigin: "left", duration: 0.8 }, "-=0.5")
        .from("[data-anim='subtitle']", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4");

      const fields = gsap.utils.toArray("[data-anim='field']") as HTMLElement[];
      if (fields.length) {
        gsap.from(fields, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 55%", once: true },
        });
      }

      const infos = gsap.utils.toArray("[data-anim='info']") as HTMLElement[];
      if (infos.length) {
        gsap.from(infos, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 55%", once: true },
        });
      }
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="section-padding relative overflow-hidden">
      <div className="container-editorial">
        {/* ── Title ── */}
        <div className="mb-24 max-w-[18ch]">
          <h2 data-anim="heading" className="display-xl">
            {t.contact.headline1}
            <br />
            {t.contact.headline2} <AccentWord>{t.contact.accent}</AccentWord>
          </h2>
          <div
            data-anim="rule"
            className="mt-10 h-px w-16 bg-accent/70"
          />
          <p data-anim="subtitle" className="lede mt-8">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="grid gap-20 lg:grid-cols-12">
          {/* ── Info column ── */}
          <aside className="flex flex-col gap-14 lg:col-span-4">
            <div data-anim="info">
              <p className={fieldLabelClass}>{t.contact.emailLabel}</p>
              <a
                href="mailto:hello@actiondev.es"
                className="text-xl font-medium transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:text-accent"
              >
                hello@actiondev.es
              </a>
            </div>

            <div data-anim="info">
              <p className={fieldLabelClass}>{t.contact.askAI}</p>
              <ul className="flex flex-col gap-1" role="list">
                {AI_ASSISTANTS.map((ai) => (
                  <li key={ai.name}>
                    <a
                      href={ai.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={locale === "es" ? `Pregunta a ${ai.name} sobre Action` : `Ask ${ai.name} about Action`}
                      className="group flex items-center gap-3 py-2 text-[15px] font-medium text-foreground/80 transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:text-accent"
                    >
                      <ai.icon className="h-4 w-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                      <span>{ai.name}</span>
                      <span
                        aria-hidden
                        className="ml-auto text-muted transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] group-hover:translate-x-1 group-hover:text-accent"
                      >
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── Form ── */}
          <form aria-label={t.contact.formAriaLabel} className="flex flex-col gap-10 lg:col-span-8">
            <div data-anim="field" className="grid gap-10 md:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className={fieldLabelClass}>{t.contact.nameLabel}</label>
                <input id="contact-name" type="text" name="name" placeholder={t.contact.namePlaceholder} required autoComplete="name" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="contact-phone" className={fieldLabelClass}>{t.contact.phoneLabel}</label>
                <input id="contact-phone" type="tel" name="phone" placeholder={t.contact.phonePlaceholder} autoComplete="tel" className={fieldClass} />
              </div>
            </div>

            <div data-anim="field">
              <label htmlFor="contact-email" className={fieldLabelClass}>{t.contact.emailFieldLabel}</label>
              <input id="contact-email" type="email" name="email" placeholder={t.contact.emailPlaceholder} required autoComplete="email" className={fieldClass} />
            </div>

            <div data-anim="field">
              <label htmlFor="contact-website" className={fieldLabelClass}>{t.contact.websiteLabel}</label>
              <input id="contact-website" type="url" name="website" placeholder={t.contact.websitePlaceholder} autoComplete="url" className={fieldClass} />
            </div>

            <div data-anim="field">
              <label htmlFor="contact-description" className={fieldLabelClass}>{t.contact.projectLabel}</label>
              <textarea
                id="contact-description"
                name="description"
                placeholder={t.contact.projectPlaceholder}
                required
                rows={6}
                className={`${fieldClass} resize-none leading-relaxed`}
              />
            </div>

            <div
              data-anim="field"
              className="flex flex-col items-start justify-between gap-6 pt-2 sm:flex-row sm:items-center"
            >
              <p className="text-xs text-muted">{t.contact.required}</p>
              <button
                type="submit"
                className="group inline-flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.22em] text-foreground"
              >
                <span className="relative py-2">
                  {t.contact.submit}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-1 left-0 right-0 h-px origin-left scale-x-100 bg-accent transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] group-hover:scale-x-0"
                  />
                </span>
                <span
                  aria-hidden
                  className="transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] group-hover:translate-x-1"
                >
                  ↗
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
