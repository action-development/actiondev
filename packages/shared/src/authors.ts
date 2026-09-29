import { ORGANIZATION_ID } from "./seo";

/**
 * Registro de autores del blog. `BlogPost.author` guarda el `id`; la plantilla
 * de `apps/desktop/src/app/blog/[slug]` lo resuelve aquí para pintar la firma y
 * el `Person` del JSON-LD.
 *
 * El `@id` de la persona es el MISMO que emite `apps/pablo`
 * (`https://pablo.actiondev.es/#person`): así Google une la firma del blog con
 * la web personal en una sola entidad en vez de crear dos. Si cambia allí,
 * cambia aquí. `jobTitle` calca `SITE.jobTitle` de `apps/pablo/src/lib/seo.ts`
 * (esa app no depende de este paquete a propósito, por eso va duplicado).
 */
export interface Author {
  id: string;
  name: string;
  /** Rol visible y `jobTitle` del JSON-LD. */
  role: string;
  /** Página propia del autor (enlace de la firma). */
  url: string;
  /** `@id` del nodo `Person` (compartido con la web del autor). */
  schemaId: string;
  sameAs: string[];
  /** `@id` de la organización para la que trabaja. */
  worksFor: string;
}

export const AUTHORS = {
  "pablo-cabaleiro": {
    id: "pablo-cabaleiro",
    name: "Pablo Cabaleiro",
    role: "Desarrollador de aplicaciones móviles",
    url: "https://pablo.actiondev.es",
    schemaId: "https://pablo.actiondev.es/#person",
    sameAs: ["https://pablo.actiondev.es", "https://instagram.com/pabl"],
    worksFor: ORGANIZATION_ID,
  },
} as const satisfies Record<string, Author>;

export type AuthorId = keyof typeof AUTHORS;

export const DEFAULT_AUTHOR_ID: AuthorId = "pablo-cabaleiro";

export const AUTHOR_LIST: Author[] = Object.values(AUTHORS);

export function getAuthor(id: string | undefined): Author | undefined {
  if (!id) return undefined;
  return (AUTHORS as Record<string, Author>)[id];
}
