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

function renderBlock(block: BlogContentBlock, index: number) {
  switch (block.type) {
    case "heading":
      return <h2 key={index}>{block.text}</h2>;
    case "paragraph":
      return <p key={index}>{block.text}</p>;
    case "list":
      return (
        <ul key={index}>
          {block.items.map((item) => (
            <li key={item.slice(0, 24)}>{item}</li>
          ))}
        </ul>
      );
    case "quote":
      return <blockquote key={index}>{block.text}</blockquote>;
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

      <main id="main-content" className="pb-32">
        <article className="container-editorial">
          {/* Columna centrada en la página — ver nota igual en `/blog`. */}
          <div className="mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <nav aria-label="Migas de pan" className="pt-14">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <li>
                  <Link href="/" className="hover:text-foreground">
                    Inicio
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/blog" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
              </ol>
            </nav>

            {/* Hero */}
            <div className="pt-10 md:pt-14">
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
