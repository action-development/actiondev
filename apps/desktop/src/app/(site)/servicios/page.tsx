import type { Metadata } from "next";
import Link from "next/link";
import { getLandingsByGroup, type Landing } from "@/data/landings";
import { HoloButton } from "@/components/ui/HoloButton";
import { HoloBar } from "@/components/layout/HoloBar";
import { BUSINESS, OG_IMAGE, absoluteUrl } from "@/lib/seo";
import { LegalLinks } from "@/components/layout/LegalLinks";

/**
 * Hub de servicios — página índice que enlaza todas las landings SEO locales.
 * Da estructura de enlazado interno (home ← hub ← landings) sin tocar la
 * navegación del diseño original. Dos bloques: por servicio y por zona
 * (`Landing.group`); cada tarjeta usa `hubSummary`, NO la meta description.
 */

const GROUPS: { id: Landing["group"]; title: string; text: string }[] = [
  {
    id: "servicio",
    title: "Por servicio",
    text: "Lo que hacemos, explicado con casos reales. Todas estas páginas parten de nuestra oficina de Vigo, que es donde más clientes tenemos.",
  },
  {
    id: "zona",
    title: "Por zona",
    text: "Cómo trabajamos fuera de Vigo: la provincia de Pontevedra, Redondela y el resto de Galicia, con los clientes que tenemos en cada sitio.",
  },
];

export const metadata: Metadata = {
  title: "Servicios: Apps, Software a Medida y Webs",
  description:
    "Apps, software a medida, webs y tiendas online desde Vigo para empresas de Pontevedra, Redondela y toda Galicia. Casos reales enlazados en cada servicio.",
  alternates: { canonical: "/servicios" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/servicios"),
    siteName: "Action",
    title: "Servicios: Apps, Software a Medida y Webs — Action",
    description:
      "Desarrollo de aplicaciones, software a medida, desarrollo y diseño web y tiendas online para empresas de Vigo, Pontevedra y Galicia.",
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

      <HoloBar phone={BUSINESS.phoneDisplay} phoneHref={BUSINESS.whatsappUrl} />

      <main id="main-content" className="container-editorial pb-24">
        <div className="pt-12 md:pt-16">
          <p className="micro-label">
            Vigo · Pontevedra · Redondela · Galicia
          </p>
          <h1 className="display-l mt-4 text-foreground">
            Servicios de desarrollo y diseño digital
          </h1>
          <p className="lede mt-8">
            Somos Action, un estudio de desarrollo con oficina en la Rúa Colón,
            20, en el centro de Vigo. Hacemos aplicaciones móviles, software a
            medida, páginas web y tiendas online, y lo hacemos con el mismo
            equipo de principio a fin: quien diseña y programa tu proyecto es
            quien lo mantiene después.
          </p>
          <div className="mt-6 space-y-5">
            <p className="prose-body">
              Esta página reúne todo lo que hacemos, ordenado de dos maneras. Si
              ya sabes qué necesitas — una app, un ERP, una web que venda o una
              tienda online —, empieza por el bloque de servicios: cada página
              explica cómo trabajamos ese tipo de proyecto, de qué depende el
              presupuesto y qué casos reales puedes visitar. Si lo que te
              importa es la cercanía, el bloque por zonas cuenta cómo trabajamos
              con empresas de la provincia de Pontevedra, de Redondela y del
              resto de Galicia, y con qué clientes de cada sitio.
            </p>
            <p className="prose-body">
              No publicamos tarifas cerradas, porque dos proyectos con el mismo
              nombre pueden no parecerse en nada. Sí te explicamos en cada
              servicio qué mueve el precio, para que llegues a la primera
              conversación sabiendo qué preguntar. Y en todas las páginas
              encontrarás clientes con nombre y apellidos — Autoescuela GTI,
              Musa, PBB, Samoa Café, La Fábrica, Canelita, París de Noia — y
              reseñas reales de Google, no promesas genéricas.
            </p>
            <p className="prose-body">
              Trabajamos en persona con empresas de Vigo y su área, y en remoto
              con el resto de Galicia y de España. Si no encuentras aquí lo que
              buscas, escríbenos igualmente: muchas veces el proyecto correcto
              es una combinación de dos de estos servicios, o algo más pequeño
              de lo que imaginabas.
            </p>
          </div>
        </div>

        {GROUPS.map((group) => (
          <nav
            key={group.id}
            aria-labelledby={`grupo-${group.id}`}
            className="mt-20"
          >
            <h2 id={`grupo-${group.id}`} className="display-m text-foreground">
              {group.title}
            </h2>
            <p className="prose-body mt-4">{group.text}</p>
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {getLandingsByGroup(group.id).map((landing) => (
                <li key={landing.slug}>
                  <Link
                    href={`/${landing.slug}`}
                    className="holo-surface holo-corners holo-link group h-full p-8"
                  >
                    <h3 className="text-xl font-semibold text-foreground transition-colors group-hover:text-accent">
                      {landing.h1}
                    </h3>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
                      {landing.hubSummary}
                    </p>
                    <span className="micro-label micro-label-accent mt-5 inline-block">
                      Ver servicio
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <section
          aria-label="Contacto"
          className="holo-surface holo-corners mt-20 p-8 text-center md:p-14"
        >
          <h2 className="display-m text-foreground">¿Hablamos de tu proyecto?</h2>
          <p className="lede mx-auto mt-4">
            Respuesta en menos de 24 horas, presupuesto cerrado y trato directo
            con el equipo que desarrolla.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <HoloButton href={BUSINESS.whatsappUrl} variant="solid">
              Hablar por WhatsApp
            </HoloButton>
            <HoloButton href={`mailto:${BUSINESS.email}`} data>
              {BUSINESS.email}
            </HoloButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container-editorial flex flex-col gap-3 pt-10 pb-5 font-mono text-xs uppercase tracking-widest text-muted md:flex-row md:items-center md:justify-between">
          <p>
            Action — {BUSINESS.address.street}, {BUSINESS.address.postalCode}{" "}
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
