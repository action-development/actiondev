import type { BlogPost } from "@actiondev/shared";
import { postItLayout } from "@/lib/postit-layout";
import { Pinned } from "./Pinned";
import styles from "./CorkBoard.module.css";

interface PostItProps {
  post: BlogPost;
  /** El más reciente va en lima: es el único color vivo del tablero. */
  latest: boolean;
}

/**
 * Un post = un pósit clavado en el corcho. Todo el pósit es el enlace (lo
 * intercepta la persiana de `PageTransition` como cualquier `<a>` interno) y
 * el título es el `<h2>`, así que buscadores y lectores leen lo mismo que una
 * lista. Giro, desplazamiento, papel y chincheta salen de `postItLayout`
 * (determinista por slug). Sin fecha visible (decisión del cliente): el pie
 * solo lleva los minutos de lectura.
 */
export function PostIt({ post, latest }: PostItProps) {
  const { tilt, dx, dy, z, pinX, paper } = postItLayout(post.slug);

  return (
    <Pinned
      as="li"
      href={`/blog/${post.slug}`}
      paper={latest ? "var(--accent)" : paper}
      tilt={tilt}
      dx={dx}
      dy={dy}
      z={z}
      pins={[pinX]}
      sheetClassName={styles.note}
      data-testid="post-it"
    >
      <span className={styles.category}>{post.category}</span>
      <h2 className={styles.title}>{post.title}</h2>
      <p className={styles.excerpt}>{post.excerpt}</p>
      <span className={styles.meta}>{post.readingTime} min de lectura</span>
    </Pinned>
  );
}
