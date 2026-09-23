"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import { buildAiAssistants } from "@/data/ai-assistants";
import { CONTACT, buildMailtoUrl, buildWhatsappUrl } from "@/data/socials";
import { requestCallback } from "@/lib/callback-request";
import { BUSINESS } from "@/lib/seo";
import { AccentWord } from "@/components/ui/AccentWord";
import { HoloButton } from "@/components/ui/HoloButton";
import { MailIcon, PhoneIcon, WhatsappIcon } from "@/components/icons/channel-icons";
import { useLocale, useT } from "@/lib/i18n";

/**
 * Contacto sin formulario: no hay backend al que enviar nada, así que la
 * página no finge tenerlo. Dos canales directos — WhatsApp y email — y el
 * mensaje se redacta en la app del visitante, donde él lo ve antes de enviarlo.
 */
export function Contact() {
  const t = useT();
  const { locale } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const callbackPhoneRef = useRef<HTMLInputElement>(null);
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackNotes, setCallbackNotes] = useState("");
  const [callbackSubmitted, setCallbackSubmitted] = useState(false);

  const trimmedCallbackPhone = callbackPhone.trim();

  const handleCallbackSubmit = () => {
    if (!trimmedCallbackPhone || callbackSubmitted) return;
    requestCallback(trimmedCallbackPhone, callbackNotes.trim()).catch((error) => {
      console.error("[contact] no se pudo guardar el lead:", error);
    });
    setCallbackSubmitted(true);
  };

  const channels = [
    {
      key: "whatsapp",
      Icon: WhatsappIcon,
      label: t.contact.whatsappLabel,
      value: BUSINESS.phoneDisplay,
      href: buildWhatsappUrl(t.contact.intro),
      external: true,
    },
    {
      key: "email",
      Icon: MailIcon,
      label: t.contact.emailLabel,
      value: CONTACT.email,
      href: buildMailtoUrl(t.contact.emailSubject, t.contact.intro),
      external: false,
    },
  ];

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
      });
      tl.from("[data-anim='heading']", { y: 50, opacity: 0, duration: 0.9, ease: "power3.out" })
        .from("[data-anim='channel']", { y: 28, opacity: 0, duration: 0.65, stagger: 0.1 }, "-=0.45")
        .from("[data-anim='ai']", { y: 18, opacity: 0, duration: 0.55 }, "-=0.25");
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="contact-title"
      className="section-padding relative flex min-h-[100dvh] flex-col justify-center overflow-hidden"
    >
      {/* El header flota sobre los primeros ~84px: sin este desplazamiento el
          bloque se centra contra el viewport y queda pegado a la barra. */}
      <div className="container-editorial mt-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 id="contact-title" data-anim="heading" className="display-l">
            {t.contact.headline} <AccentWord>{t.contact.accent}</AccentWord>
          </h2>
          <p data-anim="heading" className="mt-3 text-xs text-muted">
            {t.contact.subtitle}
          </p>
        </div>

        {/* ── Dos puertas, mismo peso visual: el dato real es todo el contenido ── */}
        <ul role="list" className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-2">
          {channels.map((channel) => (
            <li key={channel.key} data-anim="channel">
              <a
                href={channel.href}
                data-channel={channel.key}
                // El icono es decorativo: sin rótulo visible, el canal solo
                // llega a un lector de pantalla por aquí.
                aria-label={`${channel.label}: ${channel.value}`}
                {...(channel.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="calm-surface group flex h-full items-center gap-4 px-7 py-6"
              >
                {/* Sin medallón: una caja de 48px alrededor de un glifo de 20
                    descuadraba el ritmo (42px del borde al icono, 34 al texto). */}
                <channel.Icon className="h-6 w-6 shrink-0 text-accent" />
                <span className="truncate text-[clamp(1rem,1.5vw,1.2rem)] font-semibold tracking-tight text-foreground">
                  {channel.value}
                </span>
                <span
                  aria-hidden
                  className="ml-auto shrink-0 text-muted transition-[transform,color] duration-[var(--duration)] [transition-timing-function:var(--ease)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                >
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>

        {/* Puerta menor: dejar un teléfono para que le llamen a él, en vez de
            escribir. Una sola pieza —icono + input, sin tarjeta separada de
            botón— con el pie en texto suelto, sin caja. */}
        <form
          data-anim="channel"
          onSubmit={(event) => {
            event.preventDefault();
            handleCallbackSubmit();
          }}
          className="mx-auto mt-6 w-72"
        >
          {/* Toda la fila enfoca el input al clicar, no solo su rectángulo
              interior: el cursor de texto y el hover de `.calm-surface` (ya
              heredado) son lo que la delata como campo, no botón. */}
          <div
            className="calm-surface flex cursor-text items-center gap-2 px-3 py-2"
            onClick={() => callbackPhoneRef.current?.focus()}
          >
            <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
            <label htmlFor="contact-callback-phone" className="sr-only">
              {t.contact.callbackPlaceholder}
            </label>
            {/* Rectángulo propio dentro de la caja: sin él, icono + texto se
                leía como una fila más, no como un campo en el que se escribe. */}
            <input
              ref={callbackPhoneRef}
              id="contact-callback-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={callbackPhone}
              disabled={callbackSubmitted}
              onChange={(event) => setCallbackPhone(event.target.value)}
              placeholder={t.contact.callbackPlaceholder}
              className="w-full border border-border bg-transparent px-2 py-1 text-xs text-foreground outline-none transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] placeholder:text-muted focus:border-accent disabled:opacity-40"
            />
          </div>

          {/* Notas y botón de enviar solo aparecen al empezar a escribir el
              teléfono: pedirlos desde el principio (vacíos) competía
              visualmente con el input real. */}
          {trimmedCallbackPhone && !callbackSubmitted && (
            <div className="animate-fade-in">
              <div className="mt-2">
                <label htmlFor="contact-callback-notes" className="sr-only">
                  {t.contact.callbackNotesPlaceholder}
                </label>
                <textarea
                  id="contact-callback-notes"
                  value={callbackNotes}
                  onChange={(event) => setCallbackNotes(event.target.value)}
                  placeholder={t.contact.callbackNotesPlaceholder}
                  rows={3}
                  className="w-full resize-none border border-border bg-transparent px-3 py-2 text-xs text-foreground outline-none transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] placeholder:text-muted focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="calm-surface mt-2 w-full px-3 py-2 text-center text-xs font-semibold text-foreground transition-opacity duration-[var(--duration)] [transition-timing-function:var(--ease)]"
              >
                {t.contact.callbackCta}
              </button>
            </div>
          )}

          <p className="mt-2 text-center text-xs text-muted">
            {callbackSubmitted ? t.contact.callbackSuccess : t.contact.callbackLabel}
          </p>
        </form>

        <div
          data-anim="ai"
          className="mx-auto mt-16 max-w-3xl text-center"
        >
          <p className="micro-label text-foreground/50">{t.contact.askAI}</p>
          <ul role="list" className="mt-5 flex flex-wrap justify-center gap-3">
            {buildAiAssistants(t.contact.aiPrompt).map((ai) => (
              <li key={ai.name}>
                <HoloButton
                  href={ai.url}
                  size="sm"
                  variant="quiet"
                  aria-label={
                    locale === "es"
                      ? `Pregunta a ${ai.name} sobre Action`
                      : `Ask ${ai.name} about Action`
                  }
                >
                  <ai.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {ai.name}
                </HoloButton>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
