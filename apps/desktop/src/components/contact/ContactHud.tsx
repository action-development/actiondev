"use client";

import type { HotspotId } from "@/components/canvas/street/street-config";
import { buildAiAssistants } from "@/data/ai-assistants";
import { CONTACT, buildMailtoUrl, buildWhatsappUrl } from "@/data/socials";
import { BUSINESS } from "@/lib/seo";
import { AccentWord } from "@/components/ui/AccentWord";
import { ControlSign } from "@/components/ui/ControlSign";
import { HoloButton } from "@/components/ui/HoloButton";
import { MailIcon, PhoneIcon, WhatsappIcon } from "@/components/icons/channel-icons";
import { useLocale, useT } from "@/lib/i18n";
import { CallbackForm } from "./CallbackForm";

interface ContactHudProps {
  /** Objeto apuntado en la calle: su canal se enciende aquí también. */
  highlight: HotspotId | null;
  /** Apuntar un canal aquí resalta su objeto en la calle. */
  onHighlight: (id: HotspotId | null) => void;
  /** Un canal se ha usado desde aquí: la calle anima su objeto. */
  onUse: (id: HotspotId) => void;
  callbackOpen: boolean;
  onCallbackOpenChange: (open: boolean) => void;
  hintVisible: boolean;
}

const CURSOR_GLYPH = (
  <svg width="15" height="15" viewBox="0 0 16 16">
    <path
      d="M3 2 L3 13.5 L6.2 10.6 L8.1 14.6 L10.2 13.6 L8.3 9.8 L12.5 9.4 Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Chrome DOM de /contact, encima de la calle.
 *
 * La calle es el escaparate; ESTO es la conversión, y no depende de jugar:
 * WhatsApp y email están aquí desde el primer frame, como enlaces de verdad
 * (`data-channel`, lo que miran los e2e), con el mensaje ya redactado. Los dos
 * lados están enlazados: apuntar un canal resalta su objeto en la calle y al
 * revés, y usarlo desde aquí también anima el objeto.
 *
 * Panel sólido (`.holo-solid`): de día la calle es clara y el cristal al 30 %
 * no dejaría leer.
 */
export function ContactHud({
  highlight,
  onHighlight,
  onUse,
  callbackOpen,
  onCallbackOpenChange,
  hintVisible,
}: ContactHudProps) {
  const t = useT();
  const { locale } = useLocale();

  const channels = [
    {
      key: "whatsapp" as const,
      Icon: WhatsappIcon,
      label: t.contact.whatsappLabel,
      value: BUSINESS.phoneDisplay,
      href: buildWhatsappUrl(t.contact.intro),
      external: true,
    },
    {
      key: "email" as const,
      Icon: MailIcon,
      label: t.contact.emailLabel,
      value: CONTACT.email,
      href: buildMailtoUrl(t.contact.emailSubject, t.contact.intro),
      external: false,
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/* Pista: el MISMO cartel del hero, la plaza y la recreativa. */}
      <div
        data-testid="street-hint"
        data-visible={hintVisible}
        aria-hidden={!hintVisible}
        className={`absolute inset-x-0 top-[max(12vh,104px)] hidden justify-center transition-opacity md:flex ${hintVisible ? "opacity-100" : "opacity-0"}`}
      >
        <ControlSign keys={[{ label: CURSOR_GLYPH }]} action={t.contact.street.hint} />
      </div>

      <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
        <section
          id="contact"
          aria-labelledby="contact-title"
          className="holo-surface holo-solid holo-corners pointer-events-auto w-full max-w-[640px] px-5 py-5 sm:px-6"
        >
          <div className="flex items-baseline justify-between gap-4">
            <p className="micro-label">{t.contact.street.address}</p>
            <p className="micro-label">{t.contact.subtitle}</p>
          </div>
          <h1 id="contact-title" className="mt-2 text-[clamp(1.5rem,2.4vw,2rem)] font-bold leading-tight tracking-tight">
            {t.contact.headline} <AccentWord>{t.contact.accent}</AccentWord>
          </h1>

          <ul role="list" className="mt-4 grid gap-3 sm:grid-cols-2">
            {channels.map((channel) => (
              <li key={channel.key}>
                <a
                  href={channel.href}
                  data-channel={channel.key}
                  data-active={highlight === channel.key}
                  aria-label={`${channel.label}: ${channel.value}`}
                  {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onPointerEnter={() => onHighlight(channel.key)}
                  onPointerLeave={() => onHighlight(null)}
                  onFocus={() => onHighlight(channel.key)}
                  onBlur={() => onHighlight(null)}
                  onClick={() => onUse(channel.key)}
                  className="holo-surface holo-link group flex items-center gap-3 px-4 py-3 data-[active=true]:border-[var(--holo-edge)]"
                >
                  <channel.Icon className="h-5 w-5 shrink-0 text-accent" />
                  <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                    {channel.value}
                  </span>
                  <span
                    aria-hidden
                    className="ml-auto shrink-0 text-muted transition-[transform,color] duration-[var(--duration)] [transition-timing-function:var(--ease)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent group-data-[active=true]:text-accent"
                  >
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            {callbackOpen ? (
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <CallbackForm />
                </div>
                <button
                  type="button"
                  onClick={() => onCallbackOpenChange(false)}
                  className="link-sweep micro-label mt-2.5 shrink-0 hover:text-accent"
                >
                  {t.contact.street.callbackClose}
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="callback-toggle"
                onClick={() => {
                  onCallbackOpenChange(true);
                  onUse("callback");
                }}
                onPointerEnter={() => onHighlight("callback")}
                onPointerLeave={() => onHighlight(null)}
                onFocus={() => onHighlight("callback")}
                onBlur={() => onHighlight(null)}
                className={`link-sweep inline-flex items-center gap-2 text-xs hover:text-accent ${highlight === "callback" ? "text-accent" : "text-muted"}`}
              >
                <PhoneIcon className="h-3.5 w-3.5 text-accent" />
                {t.contact.callbackLabel}
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="micro-label">{t.contact.askAI}</p>
            <ul role="list" className="flex flex-wrap gap-2">
              {buildAiAssistants(t.contact.aiPrompt).map((ai) => (
                <li key={ai.name}>
                  <HoloButton
                    href={ai.url}
                    size="sm"
                    variant="quiet"
                    aria-label={locale === "es" ? `Pregunta a ${ai.name} sobre Action` : `Ask ${ai.name} about Action`}
                  >
                    <ai.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {ai.name}
                  </HoloButton>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
