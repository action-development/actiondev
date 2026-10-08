"use client";

import { useEffect, useState } from "react";
import { GENERIC_WHATSAPP_TEXT, whatsappHref } from "@/lib/leads/whatsapp";
import { buttonClass } from "./Button";
import { Icon } from "./Icon";
import { MLink } from "./MLink";
import { PROJECT_CTA_HREF, PROJECT_CTA_LABEL } from "./nav";
import { useConsentDecision } from "./useConsentDecision";

/**
 * Barra fija inferior (DESIGN.md §7, `.bar`): «CONTAR MI PROYECTO» en lima +
 * cuadrado de tinta de 64 px con WhatsApp, por encima de la safe area
 * (`viewportFit: "cover"` en el layout).
 *
 * Cuándo se ve (dos `IntersectionObserver`, sin escuchar el scroll, como
 * `leads/StickyCta.tsx` de escritorio):
 * - `heroId`: aparece cuando ese elemento (el `CtaBlock` del hero) sale de
 *   pantalla. Sin `heroId`, desde el principio. Si se pasa, el elemento TIENE
 *   que existir: si no, la barra no aparece nunca.
 * - `formId`: se OCULTA mientras ese elemento (el formulario) está a la vista.
 * - Nunca con el banner de cookies abierto: ocupan la misma franja.
 *
 * Si `href` es un ancla (`#formulario`), el salto lo hace el navegador y aquí
 * solo se enfoca el primer campo. Oculta va con `hidden`: fuera de la vista y
 * del orden de tabulación. El pie reserva su alto (`MobileFooter withBar`).
 */
export function StickyCta({
  href = PROJECT_CTA_HREF,
  heroId,
  formId,
  whatsappText = GENERIC_WHATSAPP_TEXT,
  label = PROJECT_CTA_LABEL,
}: {
  /** Destino del CTA: el ancla del formulario de la página o `/contact`. */
  href?: string;
  /** Id del CTA del hero: la barra aparece cuando sale de pantalla. */
  heroId?: string;
  /** Id del formulario: la barra se oculta mientras está a la vista. */
  formId?: string;
  /** Mensaje precargado de WhatsApp. */
  whatsappText?: string;
  label?: string;
}) {
  const consent = useConsentDecision();
  const [heroIn, setHeroIn] = useState(Boolean(heroId));
  const [formIn, setFormIn] = useState(false);

  useEffect(() => {
    if (!heroId) return;
    const hero = document.getElementById(heroId);
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroIn(entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroId]);

  useEffect(() => {
    if (!formId) return;
    const form = document.getElementById(formId);
    if (!form) return;
    const observer = new IntersectionObserver(([entry]) => setFormIn(entry.isIntersecting));
    observer.observe(form);
    return () => observer.disconnect();
  }, [formId]);

  // `consent === undefined` en servidor e hidratación: la barra nace oculta.
  const cookiesDecided = consent === "granted" || consent === "denied";
  const show = cookiesDecided && !heroIn && !formIn;

  /** Con un ancla, el navegador hace el salto (respeta `scroll-margin`); aquí solo el foco. */
  const focusForm = () => {
    if (!href.startsWith("#")) return;
    const target = document.getElementById(href.slice(1));
    const field =
      target?.querySelector<HTMLElement>('input[name="name"]') ??
      target?.querySelector<HTMLElement>("input:checked") ??
      target?.querySelector<HTMLElement>("input, textarea, button");
    if (field) requestAnimationFrame(() => field.focus({ preventScroll: true }));
  };

  return (
    <nav
      aria-label="Contacto rápido"
      data-testid="m-sticky-cta"
      data-show={show}
      hidden={!show}
      className="fixed inset-x-0 bottom-0 z-60 grid grid-cols-[1fr_var(--spacing-bar)] border-t-2 border-ink bg-ink pb-[env(safe-area-inset-bottom)]"
    >
      <MLink href={href} onClick={focusForm} className={buttonClass("lime", "bar")} data-testid="m-sticky-cta-form">
        <span>{label}</span>
        <Icon name="arrow_outward" size={26} />
      </MLink>
      <a
        href={whatsappHref(whatsappText)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
        data-testid="m-sticky-cta-whatsapp"
        className="on-ink flex items-center justify-center border-l-2 border-ink bg-ink text-paper hover:bg-paper hover:text-ink active:bg-paper active:text-ink"
      >
        <Icon name="whatsapp" size={30} />
      </a>
    </nav>
  );
}
