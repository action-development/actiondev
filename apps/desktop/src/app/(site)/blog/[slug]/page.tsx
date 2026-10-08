import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthor, type BlogContentBlock } from "@actiondev/shared";
import { getPost, getPosts } from "@/lib/blog";
import { buildPostJsonLd, headingIds, humanizeSlug, parseInline, postMetadata, postToc } from "@/lib/blog-seo";
import { BUSINESS } from "@/lib/seo";
import { getLanding } from "@/data/landings";
import { Header } from "@/components/layout/Header";
import { LegalLinks } from "@/components/layout/LegalLinks";

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
 * pablo.actiondev.es), tarjeta de "Servicio relacionado" (`targetLanding` →
 * `landings.ts`), FAQs visibles + FAQPage, e índice con anclas a partir de 3
 * subtítulos. Todo lo que va al JSON-LD está también pintado en el HTML, salvo
 * las fechas: no se muestran (decisión del cliente), pero `date`/`updatedAt`
 * siguen en `datePublished`/`dateModified` y en el `article:*_time` de Open
 * Graph, que es donde Google y las redes las leen. Metadatos, JSON-LD, anclas
 * y enlaces en línea: `lib/blog-seo.ts`, compartidos con la web móvil v2.
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
  return postMetadata(post);
}

/**
 * Inline del cuerpo (`parseInline` de `lib/blog-seo.ts`): `**negrita**` y
 * `[texto](/ruta)`. Los enlaces internos (`/…`) van por `next/link` y llevan
 * el subrayado del sistema (`link-sweep`); cualquier otro destino se pinta
 * como texto, no como enlace: el contenido lo escribe el panel y no debe poder
 * sacar al lector del sitio sin más.
 */
function renderInline(text: string) {
  return parseInline(text).map((part, i) => {
    if (part.kind === "strong") return <strong key={i}>{part.text}</strong>;
    if (part.kind === "link") {
      return (
        <Link key={i} href={part.href} className="link-sweep hover:text-accent">
          {part.text}
        </Link>
      );
    }
    return <span key={i}>{part.text}</span>;
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
  const toc = postToc(post.content, ids);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPostJsonLd(post, author, landing)) }}
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

              {/* Firma. Sin fecha visible (decisión del cliente). */}
              {author && (
                <p className="mt-10 text-sm text-muted">
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
