import { PostList } from "@/components/m/blog/PostList";
import { FinalCta } from "@/components/m/FinalCta";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { StickyCta } from "@/components/m/StickyCta";
import { getPosts } from "@/lib/blog";
import { BLOG_DESCRIPTION, BLOG_INDEX_CTA, BLOG_JSON_LD, BLOG_METADATA, sortPostsByDate } from "@/lib/blog-seo";

/**
 * /blog en la web móvil v2: el corcho de escritorio pasa a una lista de
 * lectura (el más reciente destacado en tinta). Title, description,
 * canonical, Open Graph y JSON-LD (CollectionPage + BreadcrumbList) salen de
 * `lib/blog-seo.ts`, los MISMOS que escritorio; los posts, de Firestore
 * (`getPosts`), igual que allí. Todo lo indexable del corcho está aquí,
 * visible: el H1 «Nuestro Blog», cada pósit (categoría, título en `<h2>`,
 * entradilla, minutos), la tarjeta «¿Hablamos de tu proyecto?» con WhatsApp
 * y email, y la tarjeta de visita (en `MobileFooter`).
 *
 * `revalidate` como escritorio; el webhook `/api/revalidate` también
 * revalida `/m/blog` (la ruta interna de esta página).
 */
export const revalidate = 3600;

export const metadata = BLOG_METADATA;

const HERO_ID = "blog-hero";
const CTA_ID = "blog-cta";

export default async function MobileBlogPage() {
  const posts = sortPostsByDate(await getPosts());

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BLOG_JSON_LD) }} />
      <MobileHeader />
      <main id="main-content">
        <section id={HERO_ID} aria-labelledby="m-blog-h1" className="grid gap-[18px] border-b-2 border-ink px-4 pt-[26px] pb-7">
          <h1 id="m-blog-h1" data-testid="m-blog-h1" className="font-display text-hero uppercase">
            Nuestro Blog
          </h1>
          <p className="max-w-[34ch] text-lead">{BLOG_DESCRIPTION}</p>
        </section>

        <PostList posts={posts} />

        <FinalCta
          id={CTA_ID}
          title={BLOG_INDEX_CTA.title}
          text={BLOG_INDEX_CTA.text}
          whatsappText="Hola, vengo del blog de vuestra web y quiero contaros mi proyecto"
          email
          testIdPrefix="m-blog-cta"
          data-testid="m-blog-cta"
        />
      </main>
      <MobileFooter />
      <StickyCta heroId={HERO_ID} formId={CTA_ID} />
    </>
  );
}
