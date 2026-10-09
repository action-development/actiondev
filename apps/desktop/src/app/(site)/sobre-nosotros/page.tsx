import Link from "next/link";
import { HoloBar } from "@/components/layout/HoloBar";
import { LegalLinks } from "@/components/layout/LegalLinks";
import { HoloButton } from "@/components/ui/HoloButton";
import {
  ABOUT_ALL_PROJECTS,
  ABOUT_CASES,
  ABOUT_CRUMB,
  ABOUT_CTA,
  ABOUT_FACTS,
  ABOUT_FAQS,
  ABOUT_H1,
  ABOUT_INTRO,
  ABOUT_JSON_LD,
  ABOUT_METADATA,
  ABOUT_NOT_DONE,
  ABOUT_STATS,
  ABOUT_STEPS,
  isExternal,
  type Segment,
} from "@/lib/about-seo";
import { BUSINESS } from "@/lib/seo";

/**
 * /sobre-nosotros — la página de la entidad (plan AEO, §4.2): qué es Action
 * Development, sus datos, casos, cómo trabaja, qué no hace y las preguntas de
 * marca. Server component estático, en el lenguaje holográfico de las
 * páginas de lectura (`HoloBar`, `container-editorial`, superficies con
 * corchetes) como `/servicios` y las landings.
 *
 * Texto, metadatos y JSON-LD (AboutPage → `#organization`, FAQPage, migas)
 * salen de `lib/about-seo.ts`, la MISMA fuente que la versión móvil
 * (`app/(m)/m/sobre-nosotros`). Todo visible: sin acordeones ni pestañas, es
 * la página que tienen que poder citar los motores.
 */

export const metadata = ABOUT_METADATA;

/** Enlace dentro de un texto: lima, con el filete de `.link-sweep` al apuntar. */
const INLINE_LINK = "link-sweep text-accent hover:text-foreground";

function Segments({ segments }: { segments: readonly Segment[] }) {
  return segments.map((segment, i) => {
    if (typeof segment === "string") return segment;
    const key = `${segment.href}-${i}`;
    return isExternal(segment.href) ? (
      <a
        key={key}
        href={segment.href}
        className={INLINE_LINK}
        {...(segment.href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
      >
        {segment.text}
      </a>
    ) : (
      <Link key={key} href={segment.href} className={INLINE_LINK}>
        {segment.text}
      </Link>
    );
  });
}

export default function SobreNosotrosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_JSON_LD) }} />

      <HoloBar phone={BUSINESS.phoneDisplay} phoneHref={BUSINESS.whatsappUrl} />

      <main id="main-content" className="pb-24">
        <article className="container-editorial">
          <nav aria-label="Migas de pan" className="pt-10">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
              <li>
                <Link href="/" className="link-sweep hover:text-accent">
                  Inicio
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-foreground" aria-current="page">
                {ABOUT_CRUMB}
              </li>
            </ol>
          </nav>

          {/* Quién, qué y dónde + tres cifras comprobables */}
          <header className="pt-12 md:pt-16">
            <p className="micro-label">
              {BUSINESS.address.street} · {BUSINESS.address.locality} · {BUSINESS.address.region}
            </p>
            <h1 className="display-l mt-4 max-w-[16em] text-foreground">{ABOUT_H1}</h1>
            <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
              <div className="space-y-5 lg:col-span-7">
                {ABOUT_INTRO.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)} className="prose-body text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>

              <ul
                aria-label="Action Development en cifras"
                className="holo-surface holo-corners divide-y divide-border lg:col-span-5"
                data-testid="about-stats"
              >
                {ABOUT_STATS.map((stat, i) => (
                  <li key={stat.label} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-3 px-7 py-6">
                    <span className={`display-m col-span-full ${i === 0 ? "holo-tint" : "text-foreground"}`}>
                      {i === 0 && (
                        <span aria-hidden className="mr-2 text-[0.7em]">
                          ★
                        </span>
                      )}
                      {stat.value}
                    </span>
                    <span className="micro-label">{stat.label}</span>
                    {isExternal(stat.href) ? (
                      <a
                        href={stat.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-sweep micro-label micro-label-accent hover:text-foreground"
                      >
                        {stat.cta} ↗
                      </a>
                    ) : (
                      <Link href={stat.href} className="link-sweep micro-label micro-label-accent hover:text-foreground">
                        {stat.cta} →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </header>

          {/* Ficha de la entidad: un <dl> de verdad, copiable y legible por máquinas */}
          <section aria-labelledby="datos" className="mt-24">
            <h2 id="datos" className="display-m text-foreground">
              Action Development en datos
            </h2>
            <dl className="holo-surface holo-corners mt-10 px-7 md:px-10" data-testid="about-facts">
              {ABOUT_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="grid gap-2 border-b border-border py-5 last:border-b-0 md:grid-cols-[13rem_1fr] md:gap-10"
                >
                  <dt className="micro-label pt-1">{fact.label}</dt>
                  <dd className="text-[0.975rem] leading-relaxed text-foreground">
                    <Segments segments={fact.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Casos reales → ficha /projects/{slug} */}
          <section aria-labelledby="proyectos" className="mt-24">
            <h2 id="proyectos" className="display-m text-foreground">
              Proyectos que lo explican
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ABOUT_CASES.map(({ slug, note, project }) => (
                <li key={slug}>
                  <Link
                    href={`/projects/${slug}`}
                    className="holo-surface holo-corners holo-link group flex h-full flex-col p-7"
                  >
                    <p className="micro-label">{project.nicheEs ?? project.categoryEs ?? project.category}</p>
                    <h3 className="mt-3 text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
                      {project.title}
                    </h3>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{note}</p>
                    <span className="micro-label micro-label-accent mt-auto inline-block pt-5">Ver el caso</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={ABOUT_ALL_PROJECTS.href}
                  className="holo-surface holo-corners holo-link group flex h-full min-h-48 flex-col justify-between p-7"
                  data-testid="about-all-projects"
                >
                  <span className="micro-label">Todos los proyectos</span>
                  <span className="display-m text-foreground transition-colors group-hover:text-accent">
                    {ABOUT_ALL_PROJECTS.label} <span aria-hidden>→</span>
                  </span>
                </Link>
              </li>
            </ul>
          </section>

          {/* Proceso: secuencia real, por eso numerada */}
          <section aria-labelledby="como-trabaja" className="mt-24">
            <h2 id="como-trabaja" className="display-m text-foreground">
              Cómo trabaja
            </h2>
            <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {ABOUT_STEPS.map((step, i) => (
                <li key={step.title} className="holo-surface holo-corners p-6">
                  <span aria-hidden className="display-m holo-tint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Qué no hace: lo que separa un estudio de una agencia de todo */}
          <section aria-labelledby="no-hace" className="mt-24 grid gap-10 lg:grid-cols-12">
            <h2 id="no-hace" className="display-m text-foreground lg:col-span-4">
              Lo que no hace
            </h2>
            <ul className="lg:col-span-8">
              {ABOUT_NOT_DONE.map((item) => (
                <li
                  key={item}
                  className="flex items-baseline gap-5 border-t border-border py-4 text-foreground last:border-b"
                >
                  <span aria-hidden className="font-mono text-sm text-accent">
                    ×
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Preguntas de marca, visibles y en el FAQPage del JSON-LD */}
          <section aria-labelledby="preguntas" className="mt-24" data-testid="about-faq">
            <h2 id="preguntas" className="display-m text-foreground">
              Preguntas sobre Action Development
            </h2>
            <div className="mt-10">
              {ABOUT_FAQS.map((faq) => (
                <div
                  key={faq.q}
                  className="grid gap-3 border-t border-border py-7 last:border-b lg:grid-cols-12 lg:gap-10"
                >
                  <h3 className="text-lg font-semibold leading-snug text-foreground lg:col-span-5">{faq.q}</h3>
                  <p className="prose-body leading-relaxed lg:col-span-7">
                    <Segments segments={faq.a} />
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="contacto"
            className="holo-surface holo-corners mt-24 p-8 text-center md:p-14"
          >
            <h2 id="contacto" className="display-m text-foreground">
              {ABOUT_CTA.title}
            </h2>
            <p className="lede mx-auto mt-4">{ABOUT_CTA.text}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <HoloButton href={BUSINESS.whatsappUrl} variant="solid">
                Hablar por WhatsApp
              </HoloButton>
              <HoloButton href={`mailto:${BUSINESS.email}`} data>
                {BUSINESS.email}
              </HoloButton>
            </div>
          </section>
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="container-editorial flex flex-col gap-3 pt-10 pb-5 font-mono text-xs uppercase tracking-widest text-muted md:flex-row md:items-center md:justify-between">
          <p>
            {BUSINESS.alternateName} — {BUSINESS.address.street}, {BUSINESS.address.postalCode}{" "}
            {BUSINESS.address.locality}, {BUSINESS.address.region}
          </p>
          <p>
            <a href={`mailto:${BUSINESS.email}`} className="link-sweep hover:text-accent">
              {BUSINESS.email}
            </a>{" "}
            · {BUSINESS.phoneDisplay}
          </p>
        </div>
        <LegalLinks
          className="container-editorial pb-10 font-mono text-xs uppercase tracking-widest text-muted"
          linkClassName="link-sweep uppercase tracking-widest hover:text-accent"
        />
      </footer>
    </>
  );
}
