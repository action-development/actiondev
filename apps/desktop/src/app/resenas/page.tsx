import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/StructuredData";
import { BRAND, OG_IMAGE, absoluteUrl } from "@/lib/seo";
import { PlazaPage } from "./PlazaPage";

/**
 * /resenas — plaza 3D de reseñas ("sala de personajes" estilo Wii).
 *
 * Server component: solo metadata + JSON-LD. Todo lo interactivo vive en
 * PlazaPage.tsx (client). La home mantiene su sección #reviews y su
 * redirect /reviews intactos — esta es una experiencia nueva e
 * independiente, no un reemplazo.
 */
export const metadata: Metadata = {
  title: "Reseñas de clientes — Action",
  description:
    "Lo que opinan nuestros clientes de Action, agencia de desarrollo web y de aplicaciones en Vigo. Reseñas reales, en una plaza 3D interactiva.",
  alternates: { canonical: "/resenas" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/resenas"),
    siteName: BRAND.name,
    title: "Reseñas de clientes — Action",
    description: "Lo que opinan nuestros clientes de Action, en una plaza 3D interactiva.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

export default function ResenasPage() {
  return (
    <>
      {/* Reutiliza el mismo schema "reviews" que la home (StructuredData.tsx).
          Emite @id absoluto "#organization", igual que el organization schema
          global del layout raíz — es intencional: ambos anotan la MISMA
          entidad Organization, fusionando aggregateRating/review sobre ella.
          No es un duplicado erróneo; ya ocurre hoy en la home (layout +
          página emiten el mismo @id). Ver informe para el detalle. */}
      <StructuredData kind="reviews" />
      <PlazaPage />
    </>
  );
}
