import type { Metadata } from "next";
import { BUSINESS } from "@actiondev/shared";
import { buttonClass } from "@/components/m/Button";
import { CaseCard } from "@/components/m/campaign/CaseCard";
import { ProcessSteps, SectionTitle, linkUnderlineClass } from "@/components/m/campaign/parts";
import { Icon } from "@/components/m/Icon";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { THANKS_METADATA, thanksCases, thanksNeed, thanksWhatsappText } from "@/lib/leads/thanks";
import { whatsappHref } from "@/lib/leads/whatsapp";

/**
 * Confirmación de un lead en la web móvil v2 (`/hablemos/gracias?tipo=app`).
 * Misma lógica que escritorio (`lib/leads/thanks.ts`): `noindex`, `?tipo=`
 * validado contra `LEAD_NEEDS` y WhatsApp con el tipo en `?text=`, nunca datos
 * personales en la URL.
 *
 * NO mide nada al cargar: `generate_lead` sale del formulario con el lead ya
 * guardado (contarlo aquí sumaría cada recarga). Página de campaña: cabecera
 * sin menú ni enlace en el logo, ningún `tel:` y casos en pestaña nueva.
 */

export const metadata: Metadata = THANKS_METADATA;

/**
 * Qué pasa ahora, en orden. Solo promesas confirmadas por el cliente (24 horas
 * laborables, primera reunión gratis y sin compromiso) y el proceso de
 * `ads-landings.ts` (reunión en Rúa Colón o por videollamada, propuesta por escrito).
 */
const NEXT_STEPS = [
  { title: "Te contactamos", text: "En 24 horas laborables, por el canal que nos has indicado." },
  {
    title: "Primera reunión",
    text: "Gratis y sin compromiso, en Rúa Colón, 20 (Vigo) o por videollamada.",
  },
  {
    title: "Propuesta cerrada",
    text: "Te enviamos el alcance por escrito: lo que entra en la primera versión y lo que puede esperar.",
  },
] as const;

export default async function MobileThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string | string[] }>;
}) {
  const { tipo } = await searchParams;
  const need = thanksNeed(tipo);
  const message = thanksWhatsappText(need);
  const cases = thanksCases(need);

  return (
    <>
      <MobileHeader menu={false} logoHref={null} whatsappText={message} />
      <main id="main-content">
        <section aria-labelledby="m-gracias-h1" className="border-b-2 border-ink">
          <div className="grid gap-[18px] px-4 pt-[26px] pb-6">
            <h1 id="m-gracias-h1" data-testid="m-gracias-h1" className="font-display text-h1 uppercase">
              Recibido. Te contactamos en 24 horas laborables.
            </h1>
            <p className="max-w-[34ch] text-lead">
              Para aprovechar la primera llamada, ten a mano quién lo va a usar, qué hacéis hoy a mano y con qué
              programas trabajáis.
            </p>
          </div>
          <a
            href={whatsappHref(message)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="m-gracias-whatsapp"
            className={`${buttonClass("lime", "bar")} border-t-2 border-ink`}
          >
            <span>Escribir ya por WhatsApp</span>
            <Icon name="whatsapp" size={28} />
          </a>
        </section>

        <section aria-labelledby="m-gracias-pasos">
          <SectionTitle id="m-gracias-pasos">Qué pasa ahora</SectionTitle>
          <ProcessSteps steps={NEXT_STEPS} free={1} data-testid="m-gracias-steps" />
        </section>

        {cases.length > 0 && (
          <section aria-labelledby="m-gracias-casos">
            <SectionTitle id="m-gracias-casos">Mientras tanto, mira lo que ya hemos hecho</SectionTitle>
            {cases.map((project) => (
              <CaseCard
                key={project.slug}
                project={project}
                before={project.beforeEs}
                after={project.afterEs ?? project.descriptionEs ?? project.description}
                data-testid={`m-gracias-case-${project.slug}`}
              />
            ))}
            <div className="border-b-2 border-ink px-4 py-5">
              <a
                href={BUSINESS.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="m-gracias-reviews"
                className={linkUnderlineClass}
              >
                Ver reseñas en Google
                <Icon name="arrow_outward" size={18} />
              </a>
            </div>
          </section>
        )}
      </main>
      <MobileFooter variant="minimal" withBar={false} whatsappText={message} />
    </>
  );
}
