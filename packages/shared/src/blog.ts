export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string };

/** Pregunta frecuente de un post: se pinta visible y se emite como FAQPage. */
export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  category: string;
  /** ISO yyyy-mm-dd */
  date: string;
  /** Minutos de lectura estimados. */
  readingTime: number;
  h1: string;
  excerpt: string;
  content: BlogContentBlock[];
  status: "draft" | "published";
  /** ISO yyyy-mm-dd de la última revisión real del contenido. Sin él, vale `date`. */
  updatedAt?: string;
  /** Id del registro de autores (`authors.ts`), p. ej. "pablo-cabaleiro". */
  author?: string;
  /** Slug de la landing de servicio a la que empuja el post (p. ej. "desarrollo-de-aplicaciones-vigo"). */
  targetLanding?: string;
  /** Preguntas frecuentes visibles al final del post (y FAQPage en JSON-LD). */
  faqs?: BlogFaq[];
  /** Keyword principal. Uso interno del panel: NO se renderiza. */
  keyword?: string;
  /** Imagen destacada (URL absoluta o ruta `/…`). Sin ella se usa la OG dinámica. */
  image?: string;
}
