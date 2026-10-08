import type { Metadata } from "next";
import { getPosts } from "@/lib/blog";
import { Header } from "@/components/layout/Header";
import { CorkBoard } from "@/components/blog/CorkBoard";
import { PinBoard } from "@/components/blog/PinBoard";
import { Pinned } from "@/components/blog/Pinned";
import board from "@/components/blog/CorkBoard.module.css";
import { BLOG_INDEX_CTA, BLOG_JSON_LD, BLOG_METADATA, sortPostsByDate } from "@/lib/blog-seo";
import { BUSINESS } from "@/lib/seo";
import { LegalLinks } from "@/components/layout/LegalLinks";

/**
 * Índice del blog — server component, data-driven desde Firestore
 * (colección `posts`, gestionada desde `apps/admin`). Lleva el mismo `Header` que el
 * resto del sitio (nav unificada); el cuerpo sigue deliberadamente al
 * margen del lenguaje holográfico: la página entera es un tablero de corcho
 * en CSS 3D (`components/blog/CorkBoard.tsx`) con cada post como un pósit.
 *
 * `revalidate` es la red de seguridad: la publicación real la dispara el
 * webhook `/api/revalidate` que llama `apps/admin` al guardar un post.
 * Metadatos y JSON-LD: `lib/blog-seo.ts`, compartidos con la web móvil v2.
 */
export const revalidate = 3600;

export const metadata: Metadata = BLOG_METADATA;

export default async function BlogPage() {
  const posts = await getPosts();
  const sorted = sortPostsByDate(posts);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BLOG_JSON_LD) }}
      />

      <Header />

      {/* Toda la página es el corcho: título, pósits, CTA y pie son papeles
          clavados en él — nada de texto sobre el fondo negro. */}
      <CorkBoard>
        <main id="main-content" className={board.content}>
          <Pinned
            paper="#f2efe6"
            tilt={-1.2}
            z={3}
            flat
            pins={[12, 88]}
            className={board.titleCard}
            sheetClassName={board.titleSheet}
          >
            <h1 className={board.titleText}>Nuestro Blog</h1>
          </Pinned>

          <PinBoard posts={sorted} />

          <div className={board.cardRow}>
            <Pinned
              as="section"
              paper="#f6f4ee"
              tilt={1.4}
              dx={-6}
              z={20}
              pins={[50]}
              className={board.ctaCard}
              sheetClassName={board.indexCard}
              aria-labelledby="blog-cta"
            >
              <h2 id="blog-cta" className={board.cardHeading}>
                {BLOG_INDEX_CTA.title}
              </h2>
              <p className={board.cardText}>{BLOG_INDEX_CTA.text}</p>
              <p className={board.cardLinks}>
                <a href={BUSINESS.whatsappUrl} className={board.inkLink}>
                  Hablar por WhatsApp
                </a>
                <a href={`mailto:${BUSINESS.email}`} className={board.inkLink}>
                  {BUSINESS.email}
                </a>
              </p>
            </Pinned>
          </div>
        </main>

        <Pinned
          as="footer"
          paper="#f2efe6"
          tilt={-2.2}
          dy={-8}
          z={10}
          pins={[50]}
          className={board.businessCard}
          sheetClassName={board.businessSheet}
        >
          <p className={board.businessName}>Action</p>
          <p>
            {BUSINESS.address.street}, {BUSINESS.address.postalCode}{" "}
            {BUSINESS.address.locality}, {BUSINESS.address.region}
          </p>
          <p>
            <a href={`mailto:${BUSINESS.email}`} className={board.inkLink}>
              {BUSINESS.email}
            </a>
          </p>
          <p>
            <a href={`tel:${BUSINESS.phoneE164}`} className={board.inkLink}>
              {BUSINESS.phoneDisplay}
            </a>
          </p>
          <LegalLinks className="mt-3 text-[0.8em]" linkClassName={board.inkLink} />
        </Pinned>
      </CorkBoard>
    </>
  );
}
