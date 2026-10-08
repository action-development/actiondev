import type { Metadata } from "next";
import { NotFoundView } from "@/components/ui/NotFoundView";
import { NOT_FOUND_METADATA } from "@/lib/site-metadata";

/**
 * 404 de los `notFound()` del árbol de escritorio (`/blog/no-existe`,
 * `/projects/no-existe`…). Server component para poder exportar `metadata`:
 * título propio y `noindex`, sin el title ni el canonical de la home.
 */
export const metadata: Metadata = NOT_FOUND_METADATA;

export default function NotFound() {
  return <NotFoundView />;
}
