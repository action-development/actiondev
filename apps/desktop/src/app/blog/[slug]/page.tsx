import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { BlogContentBlock } from "@actiondev/shared";
import { getPost, getPosts } from "@/lib/blog";
import { BUSINESS, OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";
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

  const ogUrl = `${OG_IMAGE.url}?title=${encodeURIComponent(post.h1)}`;

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
      images: [{ url: ogUrl, width: OG_IMAGE.width, height: OG_IMAGE.height }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
      images: [ogUrl],
    },
  };
}

function buildJsonLd(post: NonNullable<Awaited<ReturnType<typeof getPost>>>) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": absoluteUrl(`/blog/${post.slug}`),
        url: absoluteUrl(`/blog/${post.slug}`),
        headline: post.h1,
        description: post.metaDescription,
        datePublished: post.date,
        dateModified: post.date,
        inLanguage: "es",
        author: { "@id": absoluteUrl("#organization") },
        publisher: { "@id": absoluteUrl("#organization") },
        isPartOf: { "@id": absoluteUrl("#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
          {
            "@type": "ListItem",
            position: 3,
            name: post.h1,
            item: absoluteUrl(`/blog/${post.slug}`),
          },
        ],
      },
    ],
  };
}

/** `**texto**` → `<strong>` — el único énfasis inline que soporta el editor del admin. */
function renderInline(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
}

function renderBlock(block: BlogContentBlock, index: number) {
  switch (block.type) {
    case "heading":
      return <h2 key={index}>{block.text}</h2>;
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(post)) }}
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
            </div>

            {/* Cuerpo */}
            <div className="post-prose mt-20 border-t border-border pt-16">
              {post.content.map((block, index) => renderBlock(block, index))}
            </div>

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
