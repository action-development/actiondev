import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PLACEHOLDER_IMAGE, hasCaseStudy, projects, type Project } from "@actiondev/shared";
import { BUSINESS, OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { projectCase, projectCategoryLabel, relatedService } from "@/lib/project-case";
import { LegalLinks } from "@/components/layout/LegalLinks";

/**
 * Ficha de proyecto (/projects/[slug]) — server component, misma familia
 * visual que /blog/[slug]: fuera del lenguaje holográfico a propósito, es
 * una página para leer un caso, no el juego de la home. `brief`/`result`
 * (ES) son opcionales en `Project`: mientras no haya contenido real por
 * proyecto, caen en el placeholder genérico de `lib/project-case.ts`.
 */

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

function findProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/**
 * Título SEO: proyecto + tipo en español + localidad si es verificable
 * ("Musa | Night Club — Aplicación web en Vigo"). El `template` del layout
 * añade " — Action"; el OG title la lleva escrita.
 */
function projectSeoTitle(project: Project): string {
  const kind = projectCategoryLabel(project);
  return `${project.title} — ${kind}${project.location ? ` en ${project.location}` : ""}`;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) return {};

  const description = project.descriptionEs ?? project.description;
  const ogUrl = `${OG_IMAGE.url}?title=${encodeURIComponent(project.title)}`;

  const title = projectSeoTitle(project);

  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    // Sin caso redactado: fuera del índice (ver `hasCaseStudy`). `follow`
    // sigue repartiendo enlaces hacia la web del cliente y el resto del sitio.
    ...(!hasCaseStudy(project) && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "article",
      locale: "es_ES",
      url: absoluteUrl(`/projects/${project.slug}`),
      siteName: "Action",
      title: `${title} — Action`,
      description,
      images: [{ url: ogUrl, width: OG_IMAGE.width, height: OG_IMAGE.height }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Action`,
      description,
      images: [ogUrl],
    },
  };
}

function buildJsonLd(project: Project) {
  const service = relatedService(project);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": absoluteUrl(`/projects/${project.slug}`),
        url: absoluteUrl(`/projects/${project.slug}`),
        name: project.title,
        description: project.descriptionEs ?? project.description,
        dateCreated: String(project.year),
        inLanguage: "es",
        creator: { "@id": absoluteUrl("#organization") },
        isPartOf: { "@id": absoluteUrl("#website") },
        genre: projectCategoryLabel(project),
        about: {
          "@type": "Service",
          name: service.label,
          url: absoluteUrl(service.href),
          provider: { "@id": absoluteUrl("#organization") },
        },
        ...(project.image !== PLACEHOLDER_IMAGE && { image: absoluteUrl(project.image) }),
        ...(project.location && {
          locationCreated: {
            "@type": "Place",
            name: project.location,
            address: {
              "@type": "PostalAddress",
              addressLocality: project.location,
              addressCountry: "ES",
            },
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Trabajo", item: absoluteUrl("/projects") },
          {
            "@type": "ListItem",
            position: 3,
            name: project.title,
            item: absoluteUrl(`/projects/${project.slug}`),
          },
        ],
      },
    ],
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) notFound();

  const category = project.categoryEs ?? project.category;
  const niche = project.nicheEs ?? project.niche;
  const { brief, result } = projectCase(project);
  const service = relatedService(project);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(project)) }}
      />

      <Header />

      <Link
        href="/projects"
        aria-label="Volver a proyectos"
        className="group fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center text-foreground transition-colors duration-[var(--duration)] ease-[var(--ease)] hover:text-accent md:left-6 md:top-5"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
          className="-translate-x-0 transition-transform duration-[var(--duration)] ease-[var(--ease)] group-hover:-translate-x-1"
        >
          <path
            d="M17 10H3M3 10L9 4M3 10L9 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      <main id="main-content" className="pb-32">
        <article className="container-editorial">
          <div className="mx-auto max-w-3xl">
            {/* Título — encima del vídeo. El Header es `fixed` (no reserva alto
                propio), así que aquí hace falta más aire del que parece para que
                el título no quede pegado a la cápsula. */}
            <div className="pt-20 md:pt-24">
              <p className="micro-label">
                {category}
                {niche ? ` · ${niche}` : ""}
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.15] tracking-tight text-foreground md:text-5xl">
                {project.title}
              </h1>
              {project.url !== "#" ? (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-sweep mt-4 inline-block text-lg font-medium text-foreground hover:text-accent"
                >
                  Ver web ↗
                </a>
              ) : null}
            </div>

            {/* Hero: imagen o vídeo del proyecto, contenido en la columna — no a
                toda la pantalla, para que se lea como una ficha y no como un salto
                de escena. */}
            <div
              className="relative mt-8 w-full border border-border bg-card"
              style={{ aspectRatio: "16 / 9" }}
            >
              {project.video ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  poster={project.image}
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src={project.video} type="video/webm" />
                </video>
              ) : (
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="object-cover"
                  priority
                />
              )}
            </div>
          </div>
        </article>

        {/* Qué nos pidieron / Qué conseguimos — a todo el ancho */}
        <div className="container-editorial mt-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-24">
            <div>
              <h2 className="micro-label micro-label-loud">Qué nos pidieron</h2>
              <ul className="mt-6 flex flex-col gap-4">
                {brief.map((objective) => (
                  <li
                    key={objective}
                    className="flex gap-3 text-lg leading-relaxed text-muted"
                  >
                    <span aria-hidden className="text-foreground">
                      —
                    </span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="micro-label micro-label-loud">Qué conseguimos</h2>
              <p className="mt-6 text-lg leading-relaxed text-muted">{result}</p>
            </div>
          </div>
        </div>

        <article className="container-editorial">
          <div className="mx-auto max-w-3xl">
            {/* Servicio relacionado — enlazado interno hacia la landing del
                tipo de proyecto (ver `relatedService`), con ancla descriptiva. */}
            <section className="mt-20 border-t border-border pt-16">
              <h2 className="micro-label micro-label-loud">Servicio relacionado</h2>
              <Link
                href={service.href}
                className="link-sweep group mt-6 inline-flex items-baseline gap-3 text-2xl font-semibold text-foreground hover:text-accent"
              >
                {service.label}
                <span
                  aria-hidden
                  className="transition-transform duration-[var(--duration)] ease-[var(--ease)] group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </section>

            {/* CTA */}
            <section className="mt-20 border-t border-border pt-16">
              <h2 className="text-2xl font-semibold text-foreground">
                Cuéntanos tu proyecto
              </h2>
              <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-muted">
                Escríbenos y recibe una propuesta detallada en 24 horas. Sin
                compromiso y sin letra pequeña.
              </p>
              <p className="mt-8 text-lg">
                <a
                  href={BUSINESS.whatsappUrl}
                  className="font-medium text-foreground underline decoration-border decoration-2 underline-offset-4 hover:decoration-foreground"
                >
                  Hablar por WhatsApp
                </a>
                <span className="text-muted"> · </span>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="font-medium text-foreground underline decoration-border decoration-2 underline-offset-4 hover:decoration-foreground"
                >
                  {BUSINESS.email}
                </a>
              </p>
            </section>

            {/* Volver */}
            <nav className="mt-16 pb-4">
              <Link
                href="/projects"
                className="text-sm text-muted underline decoration-border decoration-2 underline-offset-4 hover:text-foreground hover:decoration-foreground"
              >
                ← Todos los proyectos
              </Link>
            </nav>
          </div>
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="container-editorial flex flex-col gap-2 pt-10 pb-5 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>
            Action — {BUSINESS.address.street}, {BUSINESS.address.postalCode}{" "}
            {BUSINESS.address.locality}, {BUSINESS.address.region}
          </p>
          <p>
            <a href={`mailto:${BUSINESS.email}`} className="hover:text-foreground">
              {BUSINESS.email}
            </a>{" "}
            · {BUSINESS.phoneDisplay}
          </p>
        </div>
        <LegalLinks
          className="container-editorial pb-10 text-sm text-muted"
          linkClassName="hover:text-foreground"
        />
      </footer>
    </>
  );
}
