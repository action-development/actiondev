import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthor } from "@actiondev/shared";
import { Breadcrumbs } from "@/components/m/Breadcrumbs";
import { PostBody, PostToc, renderInline } from "@/components/m/blog/PostBody";
import { Label } from "@/components/m/Cell";
import { Faq } from "@/components/m/Faq";
import { FinalCta } from "@/components/m/FinalCta";
import { Icon } from "@/components/m/Icon";
import { MLink } from "@/components/m/MLink";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { MoreRow } from "@/components/m/MoreRow";
import { Section } from "@/components/m/Section";
import { StickyCta } from "@/components/m/StickyCta";
import { getLanding } from "@/data/landings";
import { getPost, getPosts } from "@/lib/blog";
import { BLOG_POST_CTA, buildPostJsonLd, headingIds, humanizeSlug, postMetadata, postToc } from "@/lib/blog-seo";

/**
 * Artículo del blog en la web móvil v2 (/blog/[slug]): página de LECTURA.
 * Metadatos (title, description, canonical, Open Graph `article`, autor) y
 * JSON-LD (BlogPosting + BreadcrumbList + FAQPage) salen de `lib/blog-seo.ts`,
 * los MISMOS que escritorio, igual que las anclas del índice y el troceado de
 * los enlaces en línea. Todo lo que pinta escritorio está aquí, visible:
 * categoría y minutos, H1, entradilla, firma del autor (`rel="author"`),
 * índice (3+ subtítulos), cuerpo, FAQ, servicio relacionado, CTA y vuelta al
 * blog. Sin fecha visible (decisión del cliente): solo en el JSON-LD y en OG.
 *
 * Lectura: Semi Condensed de 18 px / 1,6 en una columna de ~50 caracteres
 * (`.m-prose` de mobile.css), subtítulos en Condensed caja alta, sin nada que
 * desborde (el contenido solo admite párrafos, subtítulos, listas y citas).
 */
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return post ? postMetadata(post) : {};
}

const CTA_ID = "post-cta";

export default async function MobileBlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const author = getAuthor(post.author);
  const landing = post.targetLanding ? getLanding(post.targetLanding) : undefined;
  const ids = headingIds(post.content);
  const toc = postToc(post.content, ids);
  const whatsappText = `Hola, he leído vuestro artículo «${post.title}» y quiero contaros mi proyecto`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPostJsonLd(post, author, landing)) }}
      />
      <MobileHeader whatsappText={whatsappText} />
      <main id="main-content">
        <article aria-labelledby="m-post-h1">
          <Breadcrumbs
            items={[
              { href: "/", label: "Inicio" },
              { href: "/blog", label: "Blog" },
            ]}
            data-testid="m-post-crumbs"
          />
          <header className="grid gap-4 border-b-2 border-ink px-4 pt-6 pb-7">
            <p>
              <Label>
                {post.category} · {post.readingTime} min de lectura
              </Label>
            </p>
            <h1 id="m-post-h1" data-testid="m-post-h1" className="font-display text-h1-long uppercase">
              {post.h1}
            </h1>
            <p className="text-lead">{post.excerpt}</p>
            {author && (
              <p data-testid="m-post-author" className="text-[15px] leading-[1.5] text-muted">
                Por{" "}
                <a
                  href={author.url}
                  rel="author"
                  className="font-semibold text-ink underline decoration-2 underline-offset-4 active:bg-lime"
                >
                  {author.name}
                </a>
                <span> · {author.role} en Action</span>
              </p>
            )}
          </header>

          {toc.length >= 3 && <PostToc items={toc} />}

          <PostBody content={post.content} ids={ids} />

          {post.faqs && post.faqs.length > 0 && (
            <Section id="post-faq" title="Preguntas frecuentes" data-testid="m-post-faq">
              <Faq
                items={post.faqs.map((faq) => ({ q: faq.question, a: renderInline(faq.answer) }))}
                questionAs="h3"
              />
            </Section>
          )}

          {post.targetLanding && (
            <section aria-label="Servicio relacionado" className="border-b-2 border-ink">
              <MLink
                href={`/${post.targetLanding}`}
                data-testid="m-post-service"
                className="group grid grid-cols-[1fr_64px] bg-paper text-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
              >
                <span className="grid min-w-0 gap-2 px-4 pt-[18px] pb-5">
                  <Label className="group-hover:text-muted-dark group-active:text-muted-dark">Servicio relacionado</Label>
                  <span className="font-display text-h4 uppercase">{landing?.h1 ?? humanizeSlug(post.targetLanding)}</span>
                  {landing && <span className="text-base leading-[1.42]">{landing.metaDescription}</span>}
                </span>
                <span
                  aria-hidden="true"
                  className="on-ink flex items-center justify-center border-l border-ink bg-ink text-paper group-hover:bg-lime group-hover:text-ink group-active:bg-lime group-active:text-ink"
                >
                  <Icon name="arrow_outward" size={30} />
                </span>
              </MLink>
            </section>
          )}

          <FinalCta
            id={CTA_ID}
            title={BLOG_POST_CTA.title}
            text={BLOG_POST_CTA.text}
            whatsappText={whatsappText}
            email
            testIdPrefix="m-post-cta"
            data-testid="m-post-cta"
          />

          <MoreRow href="/blog" label="Blog" data-testid="m-post-back">
            Todos los artículos
          </MoreRow>
        </article>
      </main>
      <MobileFooter whatsappText={whatsappText} />
      <StickyCta formId={CTA_ID} whatsappText={whatsappText} />
    </>
  );
}
