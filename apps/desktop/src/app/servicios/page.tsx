import type { Metadata } from "next";
import Link from "next/link";
import { landings } from "@/data/landings";
import { BUSINESS, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * Hub de servicios — página índice que enlaza todas las landings SEO locales.
 * Da estructura de enlazado interno (home ← hub ← landings) sin tocar la
 * navegación del diseño original.
 */

export const metadata: Metadata = {
  title: "Servicios de Desarrollo de Aplicaciones y Diseño Web",
  description:
    "Servicios de Action en Vigo, Pontevedra y Galicia: desarrollo de aplicaciones iOS y Android, desarrollo web a medida y diseño web premium. ★ 5,0 en Google.",
  alternates: { canonical: "/servicios" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/servicios"),
    siteName: "Action",
    title: "Servicios de Desarrollo de Aplicaciones y Diseño Web — Action",
    description:
      "Desarrollo de aplicaciones, desarrollo web y diseño web para empresas de Vigo, Pontevedra y Galicia.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": absoluteUrl("/servicios"),
      url: absoluteUrl("/servicios"),
      name: "Servicios de Action — Desarrollo de aplicaciones y diseño web",
      inLanguage: "es",
      isPartOf: { "@id": absoluteUrl("#website") },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "Servicios",
          item: absoluteUrl("/servicios"),
        },
      ],
    },
  ],
};

export default function ServiciosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-border">
        <div className="container-editorial flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Action
            </span>
          </Link>
          <a
            href={BUSINESS.whatsappUrl}
            className="rounded-full border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {BUSINESS.phoneDisplay}
          </a>
        </div>
      </header>

      <main className="container-editorial pb-24">
        <div className="pt-12 md:pt-16">
          <p className="micro-label">
            Vigo · Pontevedra · Galicia
          </p>
          <h1 className="display-l mt-4 text-foreground">
            Servicios de desarrollo y diseño digital
          </h1>
          <p className="lede mt-8">
            Desarrollo de aplicaciones móviles, desarrollo web y diseño web
            premium desde el centro de Vigo, para empresas de toda Galicia.
            Un equipo senior, sin subcontratas, con 5,0 de valoración media en
            Google.
          </p>
        </div>

        <div className="hairline my-16" />

        <nav aria-label="Servicios por zona">
          <ul className="grid gap-4 md:grid-cols-2">
            {landings.map((landing) => (
              <li key={landing.slug}>
                <Link
                  href={`/${landing.slug}`}
                  className="group block h-full rounded-lg border border-border bg-card p-8 transition-colors hover:border-accent"
                >
                  <h2 className="text-xl font-semibold text-foreground transition-colors group-hover:text-accent">
                    {landing.h1}
                  </h2>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
                    {landing.metaDescription}
                  </p>
                  <span className="mt-5 inline-block font-mono text-xs uppercase tracking-widest text-accent">
                    Ver servicio →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section
          aria-label="Contacto"
          className="mt-20 rounded-lg border border-border bg-card p-8 text-center md:p-14"
        >
          <h2 className="display-m text-foreground">¿Hablamos de tu proyecto?</h2>
          <p className="lede mx-auto mt-4">
            Respuesta en menos de 24 horas, presupuesto cerrado y trato directo
            con el equipo que desarrolla.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={BUSINESS.whatsappUrl}
              className="rounded-full bg-accent px-7 py-3.5 font-medium text-background transition-transform hover:scale-105"
            >
              Hablar por WhatsApp
            </a>
            <a
              href={`mailto:${BUSINESS.email}`}
              className="rounded-full border border-border px-7 py-3.5 font-medium text-foreground transition-colors hover:border-accent"
            >
              {BUSINESS.email}
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container-editorial flex flex-col gap-3 py-10 font-mono text-xs uppercase tracking-widest text-muted md:flex-row md:items-center md:justify-between">
          <p>
            Action — {BUSINESS.address.street}, {BUSINESS.address.postalCode}{" "}
            {BUSINESS.address.locality}, {BUSINESS.address.region}
          </p>
          <p>
            <a href={`mailto:${BUSINESS.email}`} className="hover:text-accent">
              {BUSINESS.email}
            </a>{" "}
            · {BUSINESS.phoneDisplay}
          </p>
        </div>
      </footer>
    </>
  );
}
