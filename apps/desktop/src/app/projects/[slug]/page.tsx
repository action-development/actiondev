import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, type Project } from "@actiondev/shared";
import { BUSINESS, OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";
import { Header } from "@/components/layout/Header";

/**
 * Ficha de proyecto (/projects/[slug]) — server component, misma familia
 * visual que /blog/[slug]: fuera del lenguaje holográfico a propósito, es
 * una página para leer un caso, no el juego de la home. `brief`/`result`
 * (ES) son opcionales en `Project`: mientras no haya contenido real por
 * proyecto, caen en el placeholder genérico de abajo.
 */

const BRIEF_PLACEHOLDER = [
  "Una presencia digital a la altura de su marca frente a la competencia.",
  "Una web rápida, clara y fácil de gestionar en el día a día.",
  "Una identidad propia, sin recurrir a plantillas genéricas.",
];

const RESULT_PLACEHOLDER =
  "Una web a medida construida desde cero, con una experiencia fluida en cualquier dispositivo y una base técnica pensada para crecer con el negocio.";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

function findProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) return {};

  const description = project.descriptionEs ?? project.description;
  const ogUrl = `${OG_IMAGE.url}?title=${encodeURIComponent(project.title)}`;

  return {
    title: project.title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      locale: "es_ES",
      url: absoluteUrl(`/projects/${project.slug}`),
      siteName: "Action",
      title: project.title,
      description,
      images: [{ url: ogUrl, width: OG_IMAGE.width, height: OG_IMAGE.height }],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: [ogUrl],
    },
  };
}

function buildJsonLd(project: Project) {
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
  const brief = project.briefEs ?? project.brief ?? BRIEF_PLACEHOLDER;
  const result = project.resultEs ?? project.result ?? RESULT_PLACEHOLDER;

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
              <p className="micro-label micro-label-loud">Qué nos pidieron</p>
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
              <p className="micro-label micro-label-loud">Qué conseguimos</p>
              <p className="mt-6 text-lg leading-relaxed text-muted">{result}</p>
            </div>
          </div>
        </div>

        <article className="container-editorial">
          <div className="mx-auto max-w-3xl">
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
        <div className="container-editorial flex flex-col gap-2 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between">
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
      </footer>
    </>
  );
}
