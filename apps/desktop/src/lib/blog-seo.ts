import type { Metadata } from "next";
import {
  ORGANIZATION_ID,
  WEBSITE_ID,
  getAuthor,
  type Author,
  type BlogContentBlock,
  type BlogPost,
} from "@actiondev/shared";
import type { Landing } from "@/data/landings";
import { OG_IMAGE, SITE_URL, absoluteUrl, metaDescription, ogImage } from "@/lib/seo";

/**
 * Blog (`/blog` y `/blog/[slug]`): metadatos, JSON-LD y utilidades del cuerpo
 * (anclas de los subtítulos, enlaces en línea). Fuente ÚNICA de las páginas de
 * escritorio (`app/(site)/blog`) y de la web móvil v2 (`app/(m)/m/blog`):
 * paridad SEO por construcción. Extraído sin cambios de las páginas de
 * escritorio.
 */

/* ── Índice ─────────────────────────────────────────────────────────────── */

/** Meta description del índice; la web móvil la pinta además como entradilla. */
export const BLOG_DESCRIPTION =
  "Guías y artículos de Action sobre desarrollo de aplicaciones, desarrollo web y diseño digital para empresas de Vigo, Pontevedra y Galicia.";

export const BLOG_METADATA: Metadata = {
  // Plan de contenidos 2026-10-08, §5.2. El H1 visual («Nuestro Blog») es del cliente.
  title: "Guías sobre apps, software y webs",
  description: BLOG_DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/blog"),
    siteName: "Action",
    title: "Guías sobre apps, software y webs — Action",
    description:
      "Guías y artículos sobre desarrollo de aplicaciones, desarrollo web y diseño digital.",
    images: [ogImage("Blog — Action")],
  },
};

/**
 * JSON-LD del índice: `CollectionPage` cuyo `mainEntity` es la lista de
 * artículos (`ItemList` de `BlogPosting` con URL, titular y fechas, en el
 * mismo orden que el tablero y la lista móvil) + `BreadcrumbList`. Recibe los
 * posts ya ordenados (`sortPostsByDate`).
 */
export function buildBlogJsonLd(posts: BlogPost[]) {
  const url = absoluteUrl("/blog");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: "Blog de Action",
        description: BLOG_DESCRIPTION,
        inLanguage: "es",
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORGANIZATION_ID },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        mainEntity: { "@id": `${url}#posts` },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#posts`,
        numberOfItems: posts.length,
        itemListElement: posts.map((post, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "BlogPosting",
            "@id": `${postUrl(post)}#article`,
            url: postUrl(post),
            headline: post.h1,
            datePublished: post.date,
            dateModified: post.updatedAt ?? post.date,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: url },
        ],
      },
    ],
  };
}

/**
 * Llamadas a la acción del blog, con el MISMO texto en escritorio (tarjeta del
 * corcho y cierre del artículo) y en la web móvil v2.
 */
export const BLOG_INDEX_CTA = {
  title: "¿Hablamos de tu proyecto?",
  text: "Respuesta en 24 horas laborables, presupuesto cerrado y trato directo con el equipo que desarrolla.",
} as const;

export const BLOG_POST_CTA = {
  title: "Cuéntanos tu proyecto",
  text: "Escríbenos y te respondemos en 24 horas laborables. Sin compromiso y sin letra pequeña.",
} as const;

/** Posts del más reciente al más antiguo (el orden del tablero y de la lista móvil). */
export function sortPostsByDate(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

/* ── Enlazado interno ───────────────────────────────────────────────────── */

/** Cuántos artículos enlaza «Sigue leyendo» al final de un artículo. */
export const RELATED_POSTS_MAX = 3;

/**
 * Guías de una landing: TODOS los posts publicados que empujan a ella
 * (`targetLanding`), del más reciente al más antiguo. Sin tope: es el enlace
 * hub → spoke del plan de contenidos (cada guía nueva aparece sola en su
 * landing al revalidar). Es la vía para que las landings enlacen al blog
 * (auditoría SEO M4): sin ella, la mayoría de los artículos solo recibían un
 * enlace, el del índice. `getPosts` ya trae solo `status == "published"`.
 */
export function landingGuides(posts: BlogPost[], landingSlug: string): BlogPost[] {
  return sortPostsByDate(posts.filter((p) => p.targetLanding === landingSlug));
}

/**
 * «Sigue leyendo» al final de un artículo: primero los que empujan a la misma
 * landing, después los de la misma categoría y, para completar, los más
 * recientes. Determinista (mismo orden en escritorio y en móvil).
 */
export function relatedPosts(posts: BlogPost[], post: BlogPost, max = RELATED_POSTS_MAX): BlogPost[] {
  const others = sortPostsByDate(posts.filter((p) => p.slug !== post.slug));
  const rank = (p: BlogPost) =>
    post.targetLanding && p.targetLanding === post.targetLanding ? 0 : p.category === post.category ? 1 : 2;
  return [...others].sort((a, b) => rank(a) - rank(b)).slice(0, max);
}

/* ── Artículo ───────────────────────────────────────────────────────────── */

function postUrl(post: BlogPost): string {
  return absoluteUrl(`/blog/${post.slug}`);
}

/** Imagen del post: la suya si la tiene (absolutizada), si no la OG dinámica. */
export function postImage(post: BlogPost): string {
  if (post.image) return absoluteUrl(post.image);
  return `${OG_IMAGE.url}?title=${encodeURIComponent(post.h1)}`;
}

/** Sufijo que añade el `template` del layout raíz a todo `<title>`. */
const TITLE_SUFFIX = " — Action";
/** A partir de aquí Google corta el título en el resultado (≈ 580 px). */
const TITLE_MAX = 60;

/**
 * `<title>` del artículo. Los títulos del panel son largos (hasta 68
 * caracteres sin marca): con el « — Action» del template, Google los cortaba
 * y la marca no llegaba a verse. Si el título con sufijo pasa de 60, va sin
 * él (`absolute`); si cabe, con él, como el resto del sitio.
 */
export function postTitle(post: BlogPost): Metadata["title"] {
  return post.title.length + TITLE_SUFFIX.length > TITLE_MAX ? { absolute: post.title } : post.title;
}

export function postMetadata(post: BlogPost): Metadata {
  const ogUrl = postImage(post);
  const author = getAuthor(post.author);
  // ≤155: el panel deja escribir más y Google cortaba a media palabra.
  const description = metaDescription(post.metaDescription);

  return {
    title: postTitle(post),
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      locale: "es_ES",
      url: absoluteUrl(`/blog/${post.slug}`),
      siteName: "Action",
      title: post.title,
      description,
      publishedTime: post.date,
      modifiedTime: post.updatedAt ?? post.date,
      authors: author ? [author.url] : undefined,
      section: post.category,
      images: [
        post.image
          ? { url: ogUrl, alt: post.h1 }
          : { url: ogUrl, width: OG_IMAGE.width, height: OG_IMAGE.height, alt: post.h1 },
      ],
    },
    authors: author ? [{ name: author.name, url: author.url }] : undefined,
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [{ url: ogUrl, alt: post.h1 }],
    },
  };
}

/** Texto plano para el JSON-LD: quita `**` y deja solo el texto de los enlaces. */
function stripInline(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}

/** Palabras del cuerpo (subtítulos, párrafos, listas y citas): `wordCount`. */
function postWordCount(content: BlogContentBlock[]): number {
  const text = content
    .flatMap((block) => (block.type === "list" ? block.items : [block.text]))
    .map(stripInline)
    .join(" ");
  return text.split(/\s+/).filter(Boolean).length;
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

export function buildPostJsonLd(post: BlogPost, author: Author | undefined, landing: Landing | undefined) {
  const url = postUrl(post);
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
        description: metaDescription(post.metaDescription),
        image: post.image
          ? postImage(post)
          : { "@type": "ImageObject", url: postImage(post), width: OG_IMAGE.width, height: OG_IMAGE.height },
        datePublished: post.date,
        dateModified: post.updatedAt ?? post.date,
        inLanguage: "es",
        articleSection: post.category,
        wordCount: postWordCount(post.content),
        ...(post.readingTime > 0 && { timeRequired: `PT${post.readingTime}M` }),
        author: author ? personSchema(author) : { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        isPartOf: [{ "@id": WEBSITE_ID }, { "@id": absoluteUrl("/blog") }],
        ...(service ? { about: service } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
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

/** Ancla estable de un subtítulo (sin tildes, en minúsculas, con guiones). */
function headingId(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ids de los H2 por índice de bloque, sin colisiones (sufijo -2, -3…). */
export function headingIds(content: BlogContentBlock[]): Map<number, string> {
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

/** Índice del artículo (`{ id, text }` por subtítulo). Se pinta a partir de 3. */
export function postToc(content: BlogContentBlock[], ids: Map<number, string>): { id: string; text: string }[] {
  return content.flatMap((block, index) =>
    block.type === "heading" ? [{ id: ids.get(index)!, text: block.text }] : [],
  );
}

/** Slug de landing → texto legible, por si el slug ya no existe en `landings.ts`. */
export function humanizeSlug(slug: string): string {
  const text = slug.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Trozos del texto en línea del cuerpo: `**negrita**`, `[texto](/ruta)` y
 * texto. Solo los enlaces INTERNOS (`/…`) son enlaces; cualquier otro destino
 * queda como texto: el contenido lo escribe el panel y no debe poder sacar al
 * lector del sitio sin más. Cada árbol (escritorio, móvil) los pinta con sus
 * estilos.
 */
export type InlinePart =
  | { kind: "strong"; text: string }
  | { kind: "link"; text: string; href: string }
  | { kind: "text"; text: string };

export function parseInline(text: string): InlinePart[] {
  return text
    .split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(\/(?!\/)[^)\s]*\))/g)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) return { kind: "strong", text: part.slice(2, -2) };
      const link = /^\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)$/.exec(part);
      if (link) return { kind: "link", text: link[1], href: link[2] };
      return { kind: "text", text: part };
    });
}
