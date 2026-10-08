"use client";

import { useEffect, useState } from "react";
import { CONSENT_EVENT, readStoredConsent } from "@actiondev/shared";
import { WhatsappIcon } from "@/components/icons/channel-icons";
import { HoloButton } from "@/components/ui/HoloButton";
import { BUSINESS } from "@/lib/seo";
import { LEAD_FORM_ID, scrollToLeadForm } from "./FormJump";

/**
 * Barra fija de móvil de `/hablemos/*` y de las landings SEO (`heroId="hero"`, `formId="proyecto"`): «Contar mi proyecto» + WhatsApp.
 *
 * Aparece cuando el hero sale de pantalla y se oculta mientras el formulario
 * está a la vista (dos `IntersectionObserver`, sin scroll listeners). Tampoco
 * aparece mientras el banner de cookies esté abierto (decisión sin tomar =
 * `readStoredConsent() === null`): es la misma esquina y taparía sus botones.
 * Solo en `< lg`: en escritorio el formulario ya va fijo a la derecha.
 *
 * En páginas sin hero ni formulario (`/hablemos/gracias`) no pinta nada.
 */
export function StickyCta({
  heroId = "hero",
  formId = LEAD_FORM_ID,
}: {
  /** Id del hero: la barra aparece cuando sale de pantalla. */
  heroId?: string;
  /** Id del bloque del formulario: la barra se oculta mientras está a la vista, y es el destino del botón. */
  formId?: string;
} = {}) {
  const [present, setPresent] = useState(false);
  const [heroIn, setHeroIn] = useState(true);
  const [formIn, setFormIn] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(true);

  useEffect(() => {
    const sync = () => setCookiesOpen(readStoredConsent() === null);
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const form = document.getElementById(formId);
    if (!hero || !form) return;
    // `present` se marca en el primer aviso del observador (se dispara nada más
    // observar), no en el cuerpo del efecto.
    const heroObserver = new IntersectionObserver(([entry]) => {
      setPresent(true);
      setHeroIn(entry.isIntersecting);
    });
    const formObserver = new IntersectionObserver(([entry]) => setFormIn(entry.isIntersecting));
    heroObserver.observe(hero);
    formObserver.observe(form);
    return () => {
      heroObserver.disconnect();
      formObserver.disconnect();
    };
  }, [heroId, formId]);

  if (!present) return null;
  const show = !heroIn && !formIn && !cookiesOpen;

  return (
    <div
      data-testid="sticky-cta"
      data-show={show}
      inert={!show}
      className="lead-sticky fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background lg:hidden"
    >
      <div
        className="flex h-16 items-center gap-3 px-4"
        style={{ boxSizing: "content-box", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          type="button"
          onClick={() => scrollToLeadForm(formId)}
          data-testid="sticky-cta-form"
          className="holo-btn holo-btn-solid h-12 flex-1 text-[13px]"
        >
          <span className="inline-flex items-center gap-2">Contar mi proyecto</span>
        </button>
        <HoloButton
          href={BUSINESS.whatsappUrl}
          variant="quiet"
          aria-label="Escribir por WhatsApp"
          data-testid="sticky-cta-whatsapp"
          className="h-12 w-12 shrink-0 px-0"
        >
          <WhatsappIcon className="h-5 w-5" />
        </HoloButton>
      </div>
    </div>
  );
}
