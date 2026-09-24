"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CONSENT_EVENT, readStoredConsent } from "@actiondev/shared";
import { buildAiAssistants } from "@/data/ai-assistants";
import { CONTACT, buildMailtoUrl, buildWhatsappUrl } from "@/data/socials";
import { usePageTransition } from "@/components/animations/PageTransition";
import { WhatsappIcon } from "@/components/icons/channel-icons";
import { HoloButton } from "@/components/ui/HoloButton";
import { useLocale, useT } from "@/lib/i18n";

/**
 * Atajo de contacto: el visitante con prisa no tiene que aprender a jugar.
 *
 * La web es un juego (grúa, recreativa, plaza) y a quien viene a pedir
 * presupuesto se le puede escapar el contacto. Esto se lo pone delante UNA
 * vez, sin taparle la llegada:
 *
 * - **Cuándo**: intención de salida (el ratón sale por arriba del viewport) o
 *   implicación sin conversión (`ENGAGED_SECONDS` de pestaña visible, o una
 *   segunda ruta con `SECOND_ROUTE_SECONDS` en ella). Nada durante los primeros
 *   `ARM_DELAY_MS`. El disparador por tiempo NO actúa en `/` — ahí se está
 *   jugando y cortarlo es la peor interrupción posible; la salida sí.
 * - **Cuándo no**: en `/contact` y `/legal/*`, con el banner de cookies sin
 *   decidir (nunca dos capas), con la persiana de ruta en marcha, si ya se
 *   mostró en la sesión, si se cerró hace menos de `SNOOZE_DAYS` o si el
 *   visitante ya usó WhatsApp/email en cualquier parte del sitio.
 * - **Qué**: micro-compromiso. Elegir servicio prerredacta el WhatsApp; sin
 *   elegir, el CTA funciona igual con el mensaje genérico de `/contact`.
 *
 * `<dialog>` nativo con `showModal()`: foco atrapado, Esc y capa superior sin
 * pelear z-index con la persiana. Los eventos van a `dataLayer` solo si GTM
 * está cargado, que ya implica consentimiento.
 */

const ARM_DELAY_MS = 8_000;
const ENGAGED_SECONDS = 40;
const SECOND_ROUTE_SECONDS = 15;
const SNOOZE_DAYS = 7;

/** localStorage: `"converted"` o la marca de tiempo del último cierre. */
const STORE_KEY = "action-contact-popup";
/** sessionStorage: ya se mostró (o se visitó /contact) en esta sesión. */
const SESSION_KEY = "action-contact-popup-shown";

type ServiceId = "apps" | "webapp" | "web";
const SERVICE_IDS: readonly ServiceId[] = ["apps", "webapp", "web"];

function isExcluded(pathname: string) {
  return pathname === "/contact" || pathname.startsWith("/legal");
}

function isSuppressed(): boolean {
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return true;
    const stored = window.localStorage.getItem(STORE_KEY);
    if (stored === "converted") return true;
    const closedAt = Number(stored);
    return closedAt > 0 && Date.now() - closedAt < SNOOZE_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function remember(storage: "local" | "session", key: string, value: string) {
  try {
    (storage === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // Storage bloqueado: el tope en memoria del componente sigue valiendo.
  }
}

function track(event: string, params: Record<string, string> = {}) {
  const w = window as unknown as { dataLayer?: unknown[] };
  if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event, ...params });
}

function isContactHref(href: string | null) {
  return !!href && (href.startsWith("https://wa.me/") || href.startsWith("mailto:"));
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
} as const;

const SERVICE_ICONS: Record<ServiceId, React.ReactNode> = {
  apps: (
    <svg {...ICON_PROPS} className="h-7 w-7">
      <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
      <path d="M10.5 5.5h3M11.5 18.5h1" />
    </svg>
  ),
  webapp: (
    <svg {...ICON_PROPS} className="h-7 w-7">
      <rect x="2.5" y="4" width="19" height="15" rx="1.5" />
      <path d="M2.5 8h19M5 6h.01M7 6h.01M9 6h.01" />
      <path d="M12 11l1.8 5.5 1.1-2.1 2.1-1.1z" />
    </svg>
  ),
  web: (
    <svg {...ICON_PROPS} className="h-7 w-7">
      <rect x="2.5" y="3.5" width="15" height="11" rx="1.5" />
      <path d="M7 18.5h6M10 14.5v4" />
      <rect x="15.5" y="9.5" width="6" height="11" rx="1.2" />
    </svg>
  ),
};

export function ContactPopup() {
  const t = useT();
  const { locale } = useLocale();
  const pathname = usePathname();
  const { busy } = usePageTransition();

  const [open, setOpen] = useState(false);
  const [service, setService] = useState<ServiceId | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const shownRef = useRef(false);
  const armedRef = useRef(false);
  const consentRef = useRef(false);
  const busyRef = useRef(busy);
  const pathRef = useRef(pathname);
  const routesRef = useRef(new Set<string>());
  const activeSecondsRef = useRef(0);
  const routeSecondsRef = useRef(0);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  // Ruta: cuenta rutas distintas y reinicia el reloj de la actual. Pasar por
  // /contact cuenta como "ya buscó contacto": no hay nada que ofrecerle.
  useEffect(() => {
    pathRef.current = pathname;
    routesRef.current.add(pathname);
    routeSecondsRef.current = 0;
    if (pathname === "/contact") {
      shownRef.current = true;
      remember("session", SESSION_KEY, "1");
    }
  }, [pathname]);

  const tryOpen = useCallback((trigger: "exit" | "engaged") => {
    if (shownRef.current || !armedRef.current || !consentRef.current) return;
    if (busyRef.current || isExcluded(pathRef.current) || isSuppressed()) return;
    shownRef.current = true;
    remember("session", SESSION_KEY, "1");
    setOpen(true);
    track("contact_popup_view", { trigger, path: pathRef.current });
  }, []);

  useEffect(() => {
    const syncConsent = () => {
      consentRef.current = readStoredConsent() !== null;
    };
    syncConsent();
    window.addEventListener(CONSENT_EVENT, syncConsent);

    const arm = window.setTimeout(() => {
      armedRef.current = true;
    }, ARM_DELAY_MS);

    // Intención de salida: el puntero abandona el documento por arriba
    // (pestañas, barra de direcciones). `relatedTarget` nulo = fuera de la ventana.
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) tryOpen("exit");
    };
    document.addEventListener("mouseout", onMouseOut);

    // Implicación: solo cuenta la pestaña visible.
    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      activeSecondsRef.current += 1;
      routeSecondsRef.current += 1;
      if (pathRef.current === "/") return;
      const engaged =
        activeSecondsRef.current >= ENGAGED_SECONDS ||
        (routesRef.current.size >= 2 && routeSecondsRef.current >= SECOND_ROUTE_SECONDS);
      if (engaged) tryOpen("engaged");
    }, 1000);

    // Quien ya escribió por cualquier canal del sitio no vuelve a verlo.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a");
      if (link && isContactHref(link.getAttribute("href"))) {
        shownRef.current = true;
        remember("local", STORE_KEY, "converted");
      }
    };
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener(CONSENT_EVENT, syncConsent);
      window.clearTimeout(arm);
      document.removeEventListener("mouseout", onMouseOut);
      window.clearInterval(tick);
      document.removeEventListener("click", onClick, true);
    };
  }, [tryOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  // Único punto de cierre: Esc, clic fuera, ✕ o haber contactado pasan por
  // `dialog.close()` y acaban aquí. Contactar ya escribió "converted".
  const handleClose = () => {
    setOpen(false);
    try {
      if (window.localStorage.getItem(STORE_KEY) !== "converted") {
        remember("local", STORE_KEY, String(Date.now()));
        track("contact_popup_close");
      }
    } catch {
      // no-op
    }
  };

  const convert = (channel: "whatsapp" | "email" | "ai", extra: Record<string, string> = {}) => {
    track(`contact_popup_${channel}`, { service: service ?? "none", ...extra });
    if (channel === "ai") return; // informarse no es contactar: el atajo sigue disponible otro día
    remember("local", STORE_KEY, "converted");
    dialogRef.current?.close();
  };

  if (!open) return null;

  const copy = t.contactPopup;
  const message = service ? copy.services[service].message : t.contact.intro;
  const subject = service ? copy.services[service].label : t.contact.emailSubject;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="contact-popup-title"
      data-testid="contact-popup"
      onClose={handleClose}
      onClick={(e) => {
        // Clic en el `::backdrop`: el destino es el propio <dialog>.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="contact-popup m-auto max-h-[calc(100dvh-2rem)] w-[min(880px,calc(100vw-2rem))] max-w-none overflow-y-auto border-0 bg-transparent p-0 text-foreground"
    >
      <div className="holo-surface holo-solid holo-corners grid md:grid-cols-[5fr_7fr]">
        <div className="relative hidden min-h-full md:block">
          <Image
            src="/popup/contact-shortcut.webp"
            alt=""
            fill
            sizes="360px"
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent to-background/80" />
        </div>

        <div className="relative flex flex-col gap-5 p-6 md:p-8">
          <HoloButton
            onClick={() => dialogRef.current?.close()}
            variant="quiet"
            className="holo-btn-icon absolute right-3 top-3"
            aria-label={copy.close}
            data-testid="contact-popup-close"
          >
            <span aria-hidden>✕</span>
          </HoloButton>

          <div className="pr-10">
            <p className="micro-label micro-label-accent">{copy.eyebrow}</p>
            <h2
              id="contact-popup-title"
              className="mt-3 text-[clamp(1.6rem,2.6vw,2.1rem)] font-bold leading-[1.05] tracking-tight"
            >
              {copy.title}
            </h2>
            <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-foreground/75">{copy.lead}</p>
          </div>

          <fieldset>
            <legend className="sr-only">{copy.servicesLegend}</legend>
            <div className="grid grid-cols-3 gap-2.5">
              {SERVICE_IDS.map((id) => (
                <label
                  key={id}
                  data-testid={`contact-popup-service-${id}`}
                  className="holo-surface holo-link group flex cursor-pointer flex-col items-start gap-4 px-3 py-4 text-muted has-[:checked]:border-[var(--holo-edge)] has-[:checked]:bg-accent/10 has-[:checked]:text-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
                >
                  <input
                    type="radio"
                    name="contact-popup-service"
                    value={id}
                    checked={service === id}
                    onChange={() => {
                      setService(id);
                      track("contact_popup_service", { service: id });
                    }}
                    className="sr-only"
                  />
                  <span className="text-accent">{SERVICE_ICONS[id]}</span>
                  <span className="text-[13px] font-semibold leading-tight tracking-tight text-foreground">
                    {copy.services[id].label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3">
            <HoloButton
              href={buildWhatsappUrl(message)}
              variant="solid"
              className="w-full"
              onClick={() => convert("whatsapp")}
              data-testid="contact-popup-whatsapp"
            >
              <WhatsappIcon className="h-4 w-4 shrink-0" />
              {copy.whatsappCta}
            </HoloButton>
            <p className="text-xs text-muted">
              {copy.emailPrefix}{" "}
              <a
                href={buildMailtoUrl(subject, message)}
                onClick={() => convert("email")}
                data-testid="contact-popup-email"
                className="link-sweep text-foreground hover:text-accent"
              >
                {CONTACT.email}
              </a>
            </p>
            <p className="micro-label">{copy.reassurance}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="micro-label">{copy.askAI}</p>
            <ul role="list" className="flex flex-wrap gap-2">
              {buildAiAssistants(t.contact.aiPrompt).map((ai) => (
                <li key={ai.name}>
                  <HoloButton
                    href={ai.url}
                    size="sm"
                    variant="quiet"
                    onClick={() => convert("ai", { assistant: ai.name })}
                    aria-label={locale === "es" ? `Pregunta a ${ai.name} sobre Action` : `Ask ${ai.name} about Action`}
                  >
                    <ai.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {ai.name}
                  </HoloButton>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </dialog>
  );
}
