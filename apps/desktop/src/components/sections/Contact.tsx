"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import { buildAiAssistants } from "@/data/ai-assistants";
import { CONTACT, buildMailtoUrl, buildWhatsappUrl } from "@/data/socials";
import { BUSINESS } from "@/lib/seo";
import { AccentWord } from "@/components/ui/AccentWord";
import { HoloButton } from "@/components/ui/HoloButton";
import { MailIcon, WhatsappIcon } from "@/components/icons/channel-icons";
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
