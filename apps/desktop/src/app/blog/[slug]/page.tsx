import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ORGANIZATION_ID,
  getAuthor,
  type Author,
  type BlogContentBlock,
  type BlogPost,
} from "@actiondev/shared";
import { getPost, getPosts } from "@/lib/blog";
import { BUSINESS, OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";
import { getLanding } from "@/data/landings";
import { Header } from "@/components/layout/Header";

/**
 * Artículo de blog (/blog/[slug]) — server component, data-driven desde
 * Firestore (colección `posts`, gestionada desde `apps/admin`). Lleva el mismo
 * `Header` que el resto del sitio (nav unificada); el cuerpo sigue
 * deliberadamente al margen del lenguaje holográfico — ver `.post-prose`
 * (globals.css).
 *
 * Un post nuevo no está entre los `generateStaticParams` de build hasta el
 * próximo deploy; `dynamicParams` (default `true`) lo sirve on-demand y lo
 * cachea. El webhook `/api/revalidate` (llamado por `apps/admin` al
 * guardar) es la vía rápida; este `revalidate` es la red de seguridad.
 *
 * SEO por post (campos opcionales de `BlogPost`, retrocompatibles): firma del
 * autor (`author` → `AUTHORS` de shared, mismo `@id` Person que
 * pablo.actiondev.es), fecha de actualización (`updatedAt`), tarjeta de
 * "Servicio relacionado" (`targetLanding` → `landings.ts`), FAQs visibles +
 * FAQPage, e índice con anclas a partir de 3 subtítulos. Todo lo que va al
 * JSON-LD está también pintado en el HTML.
 */
export const revalidate = 3600;

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const ogUrl = postImage(post);
  const author = getAuthor(post.author);

  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      locale: "es_ES",
      url: absoluteUrl(`/blog/${post.slug}`),
      siteName: "Action",
      title: post.title,
      description: post.metaDescription,
      publishedTime: post.date,
      modifiedTime: post.updatedAt ?? post.date,
      authors: author ? [author.url] : undefined,
      section: post.category,
      images: [
        post.image
          ? { url: ogUrl }
          : { url: ogUrl, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ],
    },
    authors: author ? [{ name: author.name, url: author.url }] : undefined,
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
      images: [ogUrl],
    },
  };
}

/** Imagen del post: la suya si la tiene (absolutizada), si no la OG dinámica. */
function postImage(post: BlogPost): string {
  if (post.image) return absoluteUrl(post.image);
  return `${OG_IMAGE.url}?title=${encodeURIComponent(post.h1)}`;
}

/** Texto plano para el JSON-LD: quita `**` y deja solo el texto de los enlaces. */
function stripInline(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}

function personSchema(author: Author) {
  return {
    "@type": "Person",
    "@id": author.schemaId,
    name: author.name,
    url: author.url,
    jobTitle: author.role,
    sameAs: author.sameAs,
    worksFor: { "@id": author.worksFor },
  };
}

function buildJsonLd(
  post: BlogPost,
  author: Author | undefined,
  landing: ReturnType<typeof getLanding>,
) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const service = landing
    ? {
        "@type": "Service",
        "@id": absoluteUrl(`/${landing.slug}#service`),
        name: landing.serviceName,
        url: absoluteUrl(`/${landing.slug}`),
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: post.h1,
        description: post.metaDescription,
        image: postImage(post),
        datePublished: post.date,
        dateModified: post.updatedAt ?? post.date,
        inLanguage: "es",
        articleSection: post.category,
        author: author ? personSchema(author) : { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        isPartOf: { "@id": absoluteUrl("#website") },
        ...(service ? { about: service, mentions: service } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
          { "@type": "ListItem", position: 3, name: post.h1, item: url },
        ],
      },
      ...(post.faqs?.length
        ? [
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              mainEntity: post.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: stripInline(faq.answer) },
              })),
            },
          ]
        : []),
    ],
  };
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** Ancla estable de un subtítulo (sin tildes, en minúsculas, con guiones). */
function headingId(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ids de los H2 por índice de bloque, sin colisiones (sufijo -2, -3…). */
function headingIds(content: BlogContentBlock[]): Map<number, string> {
  const ids = new Map<number, string>();
  const used = new Set<string>();
  content.forEach((block, index) => {
    if (block.type !== "heading") return;
    const base = headingId(block.text) || `seccion-${index}`;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    ids.set(index, id);
  });
  return ids;
}

/** Slug de landing → texto legible, por si el slug ya no existe en `landings.ts`. */
function humanizeSlug(slug: string): string {
  const text = slug.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Inline del cuerpo: `**negrita**` y `[texto](/ruta)`. Los enlaces internos
 * (`/…`) van por `next/link` y llevan el subrayado del sistema (`link-sweep`);
 * cualquier otro destino se pinta como texto, no como enlace: el contenido lo
 * escribe el panel y no debe poder sacar al lector del sitio sin más.
 */
function renderInline(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(\/(?!\/)[^)\s]*\))/g)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      const link = /^\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)$/.exec(part);
      if (link) {
        return (
          <Link key={i} href={link[2]} className="link-sweep hover:text-accent">
            {link[1]}
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
}

function renderBlock(block: BlogContentBlock, index: number, ids: Map<number, string>) {
  switch (block.type) {
    case "heading":
      return (
        <h2 key={index} id={ids.get(index)} className="scroll-mt-28">
          {block.text}
        </h2>
      );
    case "paragraph":
      return <p key={index}>{renderInline(block.text)}</p>;
    case "list":
      return (
        <ul key={index}>
          {block.items.map((item) => (
            <li key={item.slice(0, 24)}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case "quote":
      return <blockquote key={index}>{renderInline(block.text)}</blockquote>;
  }
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const author = getAuthor(post.author);
  const landing = post.targetLanding ? getLanding(post.targetLanding) : undefined;
  const ids = headingIds(post.content);
  const toc = post.content.flatMap((block, index) =>
    block.type === "heading" ? [{ id: ids.get(index)!, text: block.text }] : [],
  );
  const updated = post.updatedAt && post.updatedAt > post.date ? post.updatedAt : undefined;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(post, author, landing)) }}
      />

      <Header />

      <Link
        href="/blog"
        aria-label="Volver al blog"
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
          {/* Columna centrada en la página — ver nota igual en `/blog`. */}
          <div className="mx-auto max-w-3xl">
            {/* Hero */}
            <div className="pt-20 md:pt-24">
              <p className="text-sm text-muted">
                {post.category} · {post.readingTime} min de lectura
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.15] tracking-tight text-foreground md:text-5xl">
                {post.h1}
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-muted">{post.excerpt}</p>

              {/* Firma y fechas */}
              <div className="mt-10 flex flex-col gap-1 text-sm text-muted">
                {author && (
                  <p>
                    Por{" "}
                    <a
                      href={author.url}
                      rel="author"
                      className="font-medium text-foreground underline decoration-border decoration-2 underline-offset-4 hover:decoration-foreground"
                    >
                      {author.name}
                    </a>
                    <span> · {author.role} en Action</span>
                  </p>
                )}
                <p>
                  Publicado el <time dateTime={post.date}>{formatDate(post.date)}</time>
                  {updated && (
                    <>
                      {" · "}Actualizado el{" "}
                      <time dateTime={updated}>{formatDate(updated)}</time>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Índice — solo si el artículo es lo bastante largo para necesitarlo */}
            {toc.length >= 3 && (
              <nav
                aria-labelledby="post-toc-title"
                className="mt-16 border-t border-border pt-10"
              >
                <p id="post-toc-title" className="text-sm font-medium text-foreground">
                  En este artículo
                </p>
                <ol className="mt-5 flex flex-col gap-3 text-[1.05rem] text-muted">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="link-sweep hover:text-foreground"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Cuerpo */}
            <div className="post-prose mt-20 border-t border-border pt-16">
              {post.content.map((block, index) => renderBlock(block, index, ids))}
            </div>

            {/* Preguntas frecuentes — visibles: el FAQPage del JSON-LD sale de aquí */}
            {post.faqs && post.faqs.length > 0 && (
              <section
                aria-labelledby="post-faq-title"
                className="mt-20 border-t border-border pt-16"
              >
                <h2
                  id="post-faq-title"
                  className="text-2xl font-semibold text-foreground"
                >
                  Preguntas frecuentes
                </h2>
                <div className="mt-8 divide-y divide-border border-y border-border">
                  {post.faqs.map((faq) => (
                    <details key={faq.question} className="disclosure group py-6">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-medium text-foreground [&::-webkit-details-marker]:hidden">
                        <h3>{faq.question}</h3>
                        <span
                          aria-hidden
                          className="mt-1 text-muted transition-transform duration-[var(--duration)] ease-[var(--ease)] group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="mt-4 max-w-[62ch] text-[1.05rem] leading-relaxed text-muted">
                        {renderInline(faq.answer)}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Servicio relacionado */}
            {post.targetLanding && (
              <section aria-label="Servicio relacionado" className="mt-20">
                <Link
                  href={`/${post.targetLanding}`}
                  className="group block border border-border p-8 transition-colors duration-[var(--duration)] ease-[var(--ease)] hover:border-foreground active:translate-y-px md:p-10"
                >
                  <p className="text-sm text-muted">Servicio relacionado</p>
                  <p className="mt-3 flex items-baseline justify-between gap-6 text-2xl font-semibold text-foreground">
                    <span>{landing?.h1 ?? humanizeSlug(post.targetLanding)}</span>
                    <span
                      aria-hidden
                      className="transition-transform duration-[var(--duration)] ease-[var(--ease)] group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </p>
                  {landing && (
                    <p className="mt-4 max-w-[58ch] text-[1.05rem] leading-relaxed text-muted">
                      {landing.metaDescription}
                    </p>
                  )}
                </Link>
              </section>
            )}

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
                href="/blog"
                className="text-sm text-muted underline decoration-border decoration-2 underline-offset-4 hover:text-foreground hover:decoration-foreground"
              >
                ← Todos los artículos
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
