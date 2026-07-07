"use client";

import { useRef, useState, type FormEvent } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import { AI_ASSISTANTS } from "@/data/ai-assistants";
import { CONTACT, buildWhatsappUrl } from "@/data/socials";
import { AccentWord } from "@/components/ui/AccentWord";
import { useLocale, useT } from "@/lib/i18n";

const fieldLabelClass = "micro-label mb-3 block text-foreground/50";
const fieldClass =
  "w-full border-0 border-b border-[var(--hairline-strong)] bg-transparent py-3 text-lg text-foreground placeholder:text-muted/50 outline-none transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] focus:border-accent";

type SubmitState = "idle" | "opening" | "success" | "error";

interface FormPayload {
  name: string;
  email: string;
  phone: string;
  website: string;
  description: string;
}

function buildMessage(p: FormPayload, intro: string, fallbackName: string): string {
  const name = p.name.trim() || fallbackName;
  const lines = [intro, "", `— ${name}`, `Email: ${p.email.trim()}`];
  if (p.phone.trim()) lines.push(`Phone: ${p.phone.trim()}`);
  if (p.website.trim()) lines.push(`Site: ${p.website.trim()}`);
  lines.push("", p.description.trim());
  return lines.join("\n");
}

export function Contact() {
  const t = useT();
  const { locale } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

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
        .from("[data-anim='subtitle']", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
        .from("[data-anim='aside-block']", { y: 20, opacity: 0, duration: 0.5, stagger: 0.08 }, "-=0.3");

      const fields = gsap.utils.toArray("[data-anim='field']") as HTMLElement[];
      if (fields.length) {
        gsap.from(fields, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 60%", once: true },
        });
      }
    },
    { scope: sectionRef }
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if ((data.get("company_url") as string | null)?.trim()) {
      setSubmitState("success");
      return;
    }

    const payload: FormPayload = {
      name: (data.get("name") as string) ?? "",
      email: (data.get("email") as string) ?? "",
      phone: (data.get("phone") as string) ?? "",
      website: (data.get("website") as string) ?? "",
      description: (data.get("description") as string) ?? "",
    };

    const message = buildMessage(payload, t.contact.whatsappIntro, t.contact.whatsappFallbackName);
    const url = buildWhatsappUrl(message);

    setSubmitState("opening");
    const opened = window.open(url, "_blank", "noopener,noreferrer");

    if (!opened) {
      setSubmitState("error");
      return;
    }

    setSubmitState("success");
    form.reset();
  };

  return (
    <section ref={sectionRef} className="section-padding relative overflow-hidden">
      <div className="container-editorial">
        <div className="grid gap-x-16 gap-y-16 lg:grid-cols-12 lg:items-start">
          {/* ── Left column: heading + meta ── */}
          <aside className="flex flex-col gap-12 lg:col-span-5 lg:sticky lg:top-32">
            <div>
              <h2
                data-anim="heading"
                className="display-l max-w-[12ch]"
                style={{ fontSize: "clamp(2.5rem, 4.2vw, 3.25rem)" }}
              >
                {t.contact.headline1}
                <br />
                {t.contact.headline2} <AccentWord>{t.contact.accent}</AccentWord>
              </h2>
              <div data-anim="rule" className="mt-8 h-px w-16 bg-accent/70" />
              <p data-anim="subtitle" className="lede mt-6 max-w-[36ch]">
                {t.contact.subtitle}
              </p>
            </div>

            <div data-anim="aside-block" className="flex flex-col gap-3">
              <p className={fieldLabelClass}>{t.contact.emailLabel}</p>
              <a
                href={`mailto:${CONTACT.email}`}
                className="self-start text-xl font-medium transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:text-accent"
              >
                {CONTACT.email}
              </a>
            </div>

            <div data-anim="aside-block" className="flex flex-col gap-3">
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

          {/* ── Right column: form ── */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            aria-label={t.contact.formAriaLabel}
            className="relative flex flex-col gap-10 lg:col-span-7"
          >
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
                rows={5}
                className={`${fieldClass} resize-none leading-relaxed`}
              />
            </div>

            {/* Honeypot */}
            <div aria-hidden className="pointer-events-none absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
              <label htmlFor="contact-company-url">{t.contact.honeypotLabel}</label>
              <input
                id="contact-company-url"
                type="text"
                name="company_url"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div
              data-anim="field"
              className="flex flex-col items-start justify-between gap-6 pt-2 sm:flex-row sm:items-center"
            >
              <div className="flex min-h-[1.25rem] flex-col gap-1">
                <p className="text-xs text-muted">{t.contact.required}</p>
                {submitState === "success" && (
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                    {t.contact.submitSuccess} · {t.contact.submitSuccessHint}
                  </p>
                )}
                {submitState === "error" && (
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/80">
                    {t.contact.submitError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitState === "opening"}
                className="group inline-flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.22em] text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative py-2">
                  {submitState === "opening" ? t.contact.submitOpening : t.contact.submit}
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
