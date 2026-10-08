import type { Metadata } from "next";
import { CtaBlock } from "@/components/m/CtaBlock";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { ProjectsBrowser } from "@/components/m/projects/ProjectsBrowser";
import { StickyCta } from "@/components/m/StickyCta";
import { es } from "@/lib/i18n/es";
import { PROJECTS_METADATA, buildProjectsJsonLd } from "@/lib/projects-metadata";

/**
 * /projects en la web móvil v2 (maqueta `proyectos.html`): los 31 proyectos
 * como enlaces visibles, con filtro por tipo. Mismos metadatos y JSON-LD
 * (`CollectionPage` + `ItemList` + `BreadcrumbList`) que la sala recreativa
 * de escritorio, de `lib/projects-metadata.ts`. Canonical = URL pública.
 */
export const metadata: Metadata = PROJECTS_METADATA;

const CTA_ID = "projects-cta";

export default function MobileProjectsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProjectsJsonLd()) }}
      />
      <MobileHeader />
      <main id="main-content">
        <section aria-labelledby="m-projects-title" className="grid gap-3.5 border-b-2 border-ink px-4 pt-[26px] pb-[22px]">
          {/* H1 e intro: los MISMOS textos que el pasillo de escritorio (`es.arcade`). */}
          <h1 id="m-projects-title" className="font-display text-h1-long uppercase">
            {es.arcade.title}
          </h1>
          <p className="max-w-[34ch] text-lead">{es.arcade.intro}</p>
        </section>
        <ProjectsBrowser />
        <CtaBlock
          id={CTA_ID}
          sub="La primera reunión es gratis y sin compromiso. Te respondemos en 24 horas laborables."
        />
      </main>
      <MobileFooter />
      <StickyCta formId={CTA_ID} />
    </>
  );
}
