import type { BlogPost } from "@actiondev/shared";
import { Pinned } from "./Pinned";
import { PostIt } from "./PostIt";
import styles from "./CorkBoard.module.css";

/**
 * Los pósits del índice del blog, en rejilla sobre el corcho (`CorkBoard`).
 * Espera los posts ya ordenados: el primero es el más reciente y va en lima.
 */
export function PinBoard({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return (
      <Pinned paper="#efe9d8" tilt={-1.5} className={styles.empty} sheetClassName={styles.note}>
        <p className={styles.title}>Todavía no hay artículos publicados.</p>
      </Pinned>
    );
  }

  return (
    <ul className={styles.grid}>
      {posts.map((post, i) => (
        <PostIt key={post.slug} post={post} latest={i === 0} />
      ))}
    </ul>
  );
}
