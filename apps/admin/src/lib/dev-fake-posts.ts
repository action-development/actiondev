import type { BlogPost } from "@actiondev/shared";
import type { PostWriteInput } from "@/lib/posts";

/**
 * ⚠️ BYPASS TEMPORAL — BORRAR ANTES DE DESPLEGAR A PRODUCCIÓN ⚠️
 *
 * Almacén en memoria para poder testear el flujo completo (listar, crear,
 * editar, eliminar, publicar) sin Supabase conectado. Vive en el proceso
 * del dev server: sobrevive entre requests, se resetea al reiniciar
 * `pnpm dev` o al hacer hot-reload de este archivo. NO es persistencia
 * real — en cuanto haya un proyecto Supabase, este archivo y sus usos en
 * `posts/actions.ts` y las páginas de `posts/` se quitan.
 */

let posts: BlogPost[] = [
  {
    id: "dev-1",
    slug: "apps-nativas-o-multiplataforma",
    title: "Apps nativas o multiplataforma: cómo decidir sin equivocarte",
    metaDescription:
      "Nativas vs. multiplataforma para tu próxima app: rendimiento, coste, tiempos y cuándo cada opción es la correcta.",
    category: "Desarrollo de apps",
    date: "2026-09-08",
    readingTime: 6,
    h1: "Apps nativas o multiplataforma: cómo decidir sin equivocarte",
    excerpt:
      "La pregunta no es cuál es \"mejor\", sino qué necesita tu producto. Estas son las tres variables que de verdad deciden la respuesta.",
    status: "published",
    content: [
      { type: "paragraph", text: "Cada cliente que llega a Action con una idea de app nos hace la misma pregunta antes de hablar de presupuesto: ¿nativa o multiplataforma?" },
      { type: "heading", text: "Cuándo la nativa gana sin discusión" },
      { type: "list", items: ["Rendimiento máximo", "Acceso completo a APIs nuevas", "Mejor integración con widgets y notificaciones"] },
      { type: "quote", text: "La pregunta correcta no es qué tecnología es superior, sino qué parte de tu app justifica el extra." },
    ],
  },
  {
    id: "dev-2",
    slug: "senales-web-pierde-clientes",
    title: "Cinco señales de que tu web está perdiendo clientes sin que lo sepas",
    metaDescription:
      "Velocidad, mobile, CTAs, SEO local y confianza: las cinco señales técnicas que indican que tu web está perdiendo clientes.",
    category: "SEO y diseño web",
    date: "2026-08-22",
    readingTime: 5,
    h1: "Cinco señales de que tu web está perdiendo clientes sin que lo sepas",
    excerpt: "Una web puede estar online y aun así estar perdiendo clientes todos los días.",
    status: "draft",
    content: [
      { type: "paragraph", text: "La mayoría de webs que auditamos en Action no están rotas: cargan, se ven bien y nadie se ha quejado." },
      { type: "heading", text: "1. Tarda más de tres segundos en cargar en móvil" },
    ],
  },
];

let nextId = 3;

export function fakeListPosts(): BlogPost[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export function fakeGetPost(id: string): BlogPost | undefined {
  return posts.find((p) => p.id === id);
}

export function fakeCreatePost(input: PostWriteInput): BlogPost {
  const post: BlogPost = { id: `dev-${nextId++}`, ...input };
  posts = [...posts, post];
  return post;
}

export function fakeUpdatePost(id: string, input: PostWriteInput): void {
  posts = posts.map((p) => (p.id === id ? { id, ...input } : p));
}

export function fakeDeletePost(id: string): void {
  posts = posts.filter((p) => p.id !== id);
}
