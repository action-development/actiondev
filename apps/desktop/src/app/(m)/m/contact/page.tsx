import type { Metadata } from "next";
import type { LeadNeed } from "@actiondev/shared";
import { ContactChannels } from "@/components/m/contact/ContactChannels";
import { ContactMore } from "@/components/m/contact/ContactMore";
import { MobileLeadForm } from "@/components/m/leads/MobileLeadForm";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { StickyCta } from "@/components/m/StickyCta";
import { CONTACT_METADATA } from "@/lib/contact-metadata";
import { es } from "@/lib/i18n/es";

/**
 * `/contact` en la web móvil v2: en vez de la calle 3D, la conversión a la
 * vista — canales directos (WhatsApp, email y oficina) y el formulario
 * cualificador completo, que aquí atribuye como `contact_page`.
 *
 * SEO (mobile-first): mismo title, description, canonical y Open Graph que
 * escritorio (`lib/contact-metadata.ts`), el mismo JSON-LD (Organization +
 * WebSite, del layout raíz) y los mismos textos y enlaces indexables que el
 * HUD de la calle, ahora VISIBLES: H1 «Escríbenos directamente», «Sin
 * compromiso», WhatsApp, email, «¿Prefieres que te contactemos?», «Pregunta a
 * la IA sobre nosotros» y los enlaces a `/projects`, `/resenas` y `/blog`.
 */

export const metadata: Metadata = CONTACT_METADATA;

const HERO_ID = "contacto";
const FORM_ID = "formulario";

/**
 * Página de contacto general: las cuatro opciones que cubren todo lo que se
 * hace (apps, programas, webs) más «Aún no lo sé». Rejilla 2 × 2 del formulario.
 */
const CONTACT_NEEDS: readonly LeadNeed[] = ["app", "software", "web", "unsure"];

export default function MobileContactPage() {
  const t = es.contact;
  return (
    <>
      <MobileHeader ctaHref={`#${FORM_ID}`} />
      <main id="main-content">
        <section id={HERO_ID} aria-labelledby="m-contact-h1">
          <div className="grid gap-[18px] px-4 pt-[26px] pb-6">
            <h1 id="m-contact-h1" data-testid="m-contact-h1" className="font-display text-h1 uppercase">
              {t.headline} {t.accent}
            </h1>
            <p className="max-w-[34ch] text-lead">
              Te responde una persona del equipo en 24 horas laborables. La primera reunión es gratis y sin compromiso.
            </p>
          </div>
          <ContactChannels emailSubject={t.emailSubject} emailBody={t.intro} />
        </section>

        <section aria-labelledby="m-contact-form" className="border-b-2 border-ink">
          <div className="grid gap-3 border-b-2 border-ink px-4 pt-12 pb-4">
            <h2 id="m-contact-form" className="font-display text-h2 uppercase">
              {t.callbackLabel}
            </h2>
            <p className="max-w-[34ch] text-lead">
              Cuéntanos tu proyecto en dos pasos y te llamamos o te escribimos, como prefieras.
            </p>
          </div>
          <MobileLeadForm id={FORM_ID} defaultNeed="app" needs={CONTACT_NEEDS} source="contact_page" offer="contact" />
        </section>

        <ContactMore aiPrompt={t.aiPrompt} />
      </main>
      <MobileFooter />
      <StickyCta href={`#${FORM_ID}`} heroId={HERO_ID} formId={FORM_ID} />
    </>
  );
}
