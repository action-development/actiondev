export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string };

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
}
