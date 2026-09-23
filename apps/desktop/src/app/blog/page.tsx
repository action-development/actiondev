import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/blog";
import { Header } from "@/components/layout/Header";
import { BUSINESS, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * Índice del blog — server component, data-driven desde Firestore
 * (colección `posts`, gestionada desde `apps/admin`). Lleva el mismo `Header` que el
 * resto del sitio (nav unificada); el cuerpo sigue deliberadamente al
 * margen del lenguaje holográfico — ver `.post-prose` (globals.css).
 *
 * `revalidate` es la red de seguridad: la publicación real la dispara el
 * webhook `/api/revalidate` que llama `apps/admin` al guardar un post.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guías y artículos de Action sobre desarrollo de aplicaciones, desarrollo web y diseño digital para empresas de Vigo, Pontevedra y Galicia.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/blog"),
    siteName: "Action",
    title: "Blog — Action",
    description:
      "Guías y artículos sobre desarrollo de aplicaciones, desarrollo web y diseño digital.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": absoluteUrl("/blog"),
      url: absoluteUrl("/blog"),
      name: "Blog de Action",
      inLanguage: "es",
      isPartOf: { "@id": absoluteUrl("#website") },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
      ],
    },
  ],
};

export default async function BlogPage() {
  const posts = await getPosts();
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main id="main-content" className="pb-32">
        {/* Cabecera de borde a borde (fuera de `container-editorial`, mismo
            patrón que el footer y `ProjectsIndex`): marca jerarquía frente a
            la columna de lectura de abajo y frente a `/blog/[slug]`, que usa
            `max-w-3xl` en toda la página. */}
        <div className="px-6 pt-24 text-center md:px-12 md:pt-36">
          <h1 className="mx-auto max-w-[26ch] text-5xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-7xl">
            Nuestro Blog
          </h1>
        </div>

        {/* Columna de lectura: `container-editorial` + mismo `max-w-3xl` que
            `/blog/[slug]`, para que el ancho de la cabecera se lea como
            jerarquía y no como desajuste. Este `mx-auto` SÍ gana porque no
            compite con ninguna regla sin `@layer` (a diferencia de
            `.container-editorial`, que sería su propio `max-width` fuera de
            capa). */}
        <div className="container-editorial">
          <div className="mx-auto max-w-3xl">
            <ul className="mt-28 divide-y divide-border border-t border-border">
              {sorted.map((post) => (
                <li key={post.slug} className="py-14">
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <p className="text-sm text-muted">
                      {post.category} · {post.readingTime} min de lectura
                    </p>
                    <h2 className="mt-4 text-2xl font-semibold leading-snug text-foreground underline decoration-border decoration-2 underline-offset-4 transition-colors group-hover:decoration-foreground">
                      {post.title}
                    </h2>
                    <p className="mt-4 text-[1.05rem] leading-relaxed text-muted">
                      {post.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            <section className="mt-28 border-t border-border pt-16">
              <h2 className="text-2xl font-semibold text-foreground">
                ¿Hablamos de tu proyecto?
              </h2>
              <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-muted">
                Respuesta en menos de 24 horas, presupuesto cerrado y trato directo
                con el equipo que desarrolla.
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
          </div>
        </div>
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
