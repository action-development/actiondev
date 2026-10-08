import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LEAD_NEEDS, PLACEHOLDER_IMAGE, projects, type LeadNeed } from "@actiondev/shared";
import { HoloButton } from "@/components/ui/HoloButton";
import { WhatsappIcon } from "@/components/icons/channel-icons";
import { BUSINESS } from "@/lib/seo";
import { NEED_PHRASE, whatsappHref } from "@/lib/leads/whatsapp";

/**
 * Confirmación de un lead (`/hablemos/gracias?tipo=app`). Server component,
 * `noindex`. NO mide nada al cargar: la conversión (`generate_lead`) se envía
 * desde el formulario, con el lead ya guardado — medirla aquí contaría cada
 * recarga o enlace compartido como un lead más.
 */

export const metadata: Metadata = {
  title: "Proyecto recibido",
  alternates: { canonical: "/hablemos/gracias" },
  robots: { index: false, follow: true },
};

const CASES_BY_NEED: Record<LeadNeed, string[]> = {
  app: ["autoescuela-gti", "true-trading-app"],
  software: ["autoescuela-gti", "timetracker"],
  integration: ["nautirent", "autoescuela-gti"],
  web: ["musa", "nautirent"],
  unsure: ["autoescuela-gti", "true-trading-app"],
};

function isLeadNeed(value: string | undefined): value is LeadNeed {
  return !!value && (LEAD_NEEDS as readonly string[]).includes(value);
}

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string | string[] }>;
}) {
  const { tipo } = await searchParams;
  const raw = Array.isArray(tipo) ? tipo[0] : tipo;
  // El parámetro se valida contra la unión: cualquier otra cosa se ignora.
  const need = isLeadNeed(raw) ? raw : undefined;
  const phrase = need ? NEED_PHRASE[need] : null;

  // Sin datos personales en la URL: solo el tipo de proyecto.
  const message = `Hola, acabo de enviar mi proyecto${phrase ? ` de ${phrase}` : ""} desde la web`;

  const cases = (CASES_BY_NEED[need ?? "unsure"] ?? []).flatMap((slug) => {
    const project = projects.find((p) => p.slug === slug);
    return project ? [project] : [];
  });

  return (
    <main id="main-content">
      <div className="container-editorial pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-3xl">
          <p className="micro-label micro-label-accent">Proyecto recibido</p>
          <h1
            data-testid="gracias-h1"
            className="mt-4 text-[clamp(2rem,5.4vw,3.5rem)] font-bold leading-[1.03] tracking-[-0.035em] text-foreground"
          >
            Recibido. Te contactamos en 24 horas laborables.
          </h1>
          <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-foreground/80">
            Para aprovechar la primera llamada, ten a mano quién lo va a usar, qué hacéis hoy a mano y con qué programas
            trabajáis.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <HoloButton href={whatsappHref(message)} variant="solid" className="min-h-[52px] px-8" data-testid="gracias-whatsapp">
              <WhatsappIcon className="h-4 w-4 shrink-0" />
              Escribir ya por WhatsApp
            </HoloButton>
          </div>
        </div>

        <section aria-labelledby="mientras" className="mt-20 border-t border-border pt-10">
          <h2 id="mientras" className="text-2xl font-bold tracking-tight text-foreground">
            Mientras tanto, mira lo que ya hemos hecho
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {cases.map((project) => (
              <li key={project.slug}>
                <Link
                  href={`/projects/${project.slug}`}
                  target="_blank"
                  rel="noopener"
                  data-testid={`gracias-case-${project.slug}`}
                  className="holo-surface holo-corners holo-link group flex h-full flex-col"
                >
                  {project.image && project.image !== PLACEHOLDER_IMAGE && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border">
                      <Image
                        src={project.image}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 560px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="micro-label">{project.nicheEs ?? project.categoryEs ?? project.category}</p>
                    <h3 className="mt-2.5 text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
                      {project.title}
                    </h3>
                    <p className="mt-2.5 text-[0.95rem] leading-relaxed text-foreground/75">
                      {project.descriptionEs ?? project.description}
                    </p>
                    <span className="micro-label micro-label-accent mt-4 inline-block">Ver el caso</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <a
              href={BUSINESS.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="gracias-reviews"
              className="link-sweep micro-label micro-label-accent hover:text-foreground"
            >
              Ver reseñas en Google
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
