import type { Metadata } from "next";
import { AUTHORS, ORGANIZATION_ID, WEBSITE_ID, projects, type Project } from "@actiondev/shared";
import { formatLegalDate } from "@/components/legal/legal-entity";
import type { LandingCase } from "@/data/landings";
import { reviewSummary } from "@/lib/ads-landing";
import { GENERIC_WHATSAPP_TEXT, whatsappHref } from "@/lib/leads/whatsapp";
import {
  BUSINESS,
  LEGAL_ENTITY,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  ogImage,
} from "@/lib/seo";

/**
 * `/sobre-nosotros` — la página de la ENTIDAD (plan AEO, §4.2): qué es Action
 * Development, quién está detrás, dónde está, qué hace y con qué, y las
 * preguntas de marca que hoy los motores de IA contestan con directorios
 * desfasados o con la cadena de tiendas Action.
 *
 * Fuente ÚNICA de metadatos, JSON-LD y TODO el texto para la página de
 * escritorio (`app/(site)/sobre-nosotros`) y la de la web móvil v2
 * (`app/(m)/m/sobre-nosotros`): paridad SEO por construcción. Cada árbol
 * pinta los mismos textos y los mismos enlaces con su propio sistema.
 *
 * Veracidad: solo datos del repo (`BUSINESS`, `LEGAL_ENTITY`, `projects.ts`,
 * `testimonials.ts`, `landings.ts`, `llms.txt`; las tecnologías, solo las de
 * `projects.ts` comprobadas en vivo y las de esta web). Lo que el plan marca
 * «CONFIRMAR» (año de la marca, tamaño del equipo, cargo, horario, gallego,
 * Flutter) NO sale. Cifras calculadas, nunca escritas a mano: la valoración
 * con `reviewSummary()`, los proyectos con `projects.length` y las
 * localidades de los clientes con `Project.location`.
 */

export const ABOUT_PATH = "/sobre-nosotros";
export const ABOUT_URL = absoluteUrl(ABOUT_PATH);

/** Sin marca: la plantilla del layout raíz añade « — Action» (59 caracteres en total). */
export const ABOUT_TITLE = "Sobre nosotros: estudio de apps y software en Vigo";
/** El de Open Graph SÍ lleva el nombre largo: ahí no se aplica la plantilla. */
const ABOUT_OG_TITLE = "Sobre Action Development: estudio de apps y software en Vigo";
export const ABOUT_DESCRIPTION =
  "Action Development es un estudio de Vigo (Rúa Colón, 20) que diseña y programa apps iOS y Android, software a medida y webs. Datos, proyectos y preguntas.";

export const ABOUT_H1 = "Action Development, estudio de desarrollo de apps y software en Vigo";
/** Rótulo de la miga y del enlace del pie. */
export const ABOUT_CRUMB = "Sobre nosotros";

export const ABOUT_METADATA: Metadata = {
  title: ABOUT_TITLE,
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: ABOUT_PATH },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: ABOUT_URL,
    siteName: SITE_NAME,
    title: ABOUT_OG_TITLE,
    description: ABOUT_DESCRIPTION,
    images: [ogImage(ABOUT_OG_TITLE, ABOUT_H1)],
  },
};

// ─── Texto enriquecido mínimo ────────────────────────────────────────────

/**
 * Un valor o una respuesta con enlaces: texto suelto y enlaces en orden. Cada
 * árbol lo pinta con su componente de enlace (escritorio `Link`/`<a>`, móvil
 * `MLink`), así los dos sirven EXACTAMENTE los mismos nodos de texto.
 */
export type Segment = string | { text: string; href: string };

/** El texto plano de unos segmentos (para el JSON-LD). */
export function segmentsText(segments: readonly Segment[]): string {
  return segments.map((s) => (typeof s === "string" ? s : s.text)).join("");
}

export function isExternal(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href);
}

// ─── Cifras y datos derivados ───────────────────────────────────────────

const { rating: RATING, count: REVIEW_COUNT, checkedAt: RATING_CHECKED } = reviewSummary();
/** «consultado el 9 de octubre de 2026»: la fecha de `GOOGLE_RATING`. */
const RATING_DATE = `consultado el ${formatLegalDate(RATING_CHECKED)}`;
const PROJECT_COUNT = projects.length;
/**
 * Pablo Cabaleiro con el cargo que ya publican su web y la firma del blog
 * (`AUTHORS`). NO «fundador»: está pendiente de confirmar (plan AEO, §4.2).
 */
const TEAM_MEMBER = AUTHORS["pablo-cabaleiro"];
const TEAM_MEMBER_ROLE = TEAM_MEMBER.role.toLowerCase();
const WHATSAPP_HREF = whatsappHref(GENERIC_WHATSAPP_TEXT);

const list = new Intl.ListFormat("es", { type: "conjunction" });

/** «Rúa Colón, 20, 36201 Vigo (Pontevedra)» (el `OFFICE_ADDRESS_LINE` compartido pone una coma antes del paréntesis). */
const OFFICE = `${BUSINESS.address.street}, ${BUSINESS.address.postalCode} ${BUSINESS.address.locality} (${BUSINESS.address.region})`;

/**
 * Localidades de los clientes con `location` verificable en `projects.ts`,
 * Vigo primero y sin repetir: hoy «Vigo, O Porriño, Redondela y Noia».
 */
const CLIENT_LOCALITIES = [...new Set(projects.flatMap((p) => (p.location ? [p.location] : [])))].sort(
  (a, b) => Number(b === BUSINESS.address.locality) - Number(a === BUSINESS.address.locality),
);
const OUTSIDE_VIGO = CLIENT_LOCALITIES.filter((l) => l !== BUSINESS.address.locality);

// ─── Contenido ───────────────────────────────────────────────────────────

/** Entradilla: quién, qué, dónde y de quién es la marca (frases citables, en tercera persona). */
export const ABOUT_INTRO = [
  `Action Development es un estudio de desarrollo de software con oficina en ${BUSINESS.address.street}, en ${BUSINESS.address.locality} (${BUSINESS.address.region}). Diseña y programa aplicaciones móviles para iOS y Android, software a medida para empresas y webs, con el mismo equipo interno desde la primera reunión hasta el mantenimiento. Es la marca comercial de ${LEGAL_ENTITY.name}`,
  `Trabaja en persona con empresas de Vigo, su área y la provincia de Pontevedra, y a distancia con el resto de Galicia y de España. Entre sus clientes hay negocios de ${list.format(CLIENT_LOCALITIES)}.`,
] as const;

/** Tres cifras de la primera pantalla. El rótulo y el valor se pintan igual en los dos árboles. */
export const ABOUT_STATS: readonly { value: string; label: string; href: string; cta: string }[] = [
  { value: RATING, label: `${REVIEW_COUNT} reseñas en Google`, href: BUSINESS.mapsUrl, cta: "Leerlas en Google" },
  // «En el portfolio» y no «publicados»: la lista incluye Tratum, aún en desarrollo.
  { value: String(PROJECT_COUNT), label: "proyectos en el portfolio", href: "/projects", cta: "Ver los proyectos" },
  { value: BUSINESS.address.street, label: `Oficina en ${BUSINESS.address.locality}`, href: BUSINESS.mapsUrl, cta: "Cómo llegar" },
];

export interface AboutFact {
  label: string;
  value: readonly Segment[];
}

/** «Action Development en datos»: la ficha de la entidad, en un `<dl>`. */
export const ABOUT_FACTS: readonly AboutFact[] = [
  { label: "Nombre comercial", value: [`${BUSINESS.alternateName} (forma corta: ${BUSINESS.name})`] },
  {
    label: "Titular",
    value: [
      `${LEGAL_ENTITY.name} · CIF ${LEGAL_ENTITY.taxId} · ${LEGAL_ENTITY.registry.office}, hoja ${LEGAL_ENTITY.registry.sheet} · sociedad constituida el ${formatLegalDate(LEGAL_ENTITY.incorporationDate)}`,
    ],
  },
  {
    label: "Oficina",
    value: [
      `${OFFICE}. Domicilio social en ${LEGAL_ENTITY.registeredAddress.locality} (${LEGAL_ENTITY.registeredAddress.region})`,
    ],
  },
  {
    label: "Equipo",
    value: [
      "Diseño, desarrollo móvil y web, backend y mantenimiento con el mismo equipo interno, sin subcontratas. En él está ",
      { text: TEAM_MEMBER.name, href: TEAM_MEMBER.url },
      `, ${TEAM_MEMBER_ROLE}`,
    ],
  },
  {
    label: "Qué hace",
    value: [
      { text: "Aplicaciones móviles para iOS y Android", href: "/desarrollo-de-aplicaciones-vigo" },
      " con su panel de gestión y su backend; ",
      { text: "software a medida", href: "/software-a-medida-vigo" },
      " (ERP, control horario, paneles internos e integraciones); ",
      { text: "desarrollo web a medida", href: "/desarrollo-web-vigo" },
      "; ",
      { text: "tiendas online", href: "/tienda-online-vigo" },
      " en Shopify o a medida, y ",
      { text: "diseño web", href: "/diseno-web-vigo" },
      " con experiencias 3D",
    ],
  },
  {
    label: "Tecnología",
    value: [
      "React Native y Expo en las apps; React con Next.js o Vite en la web; Node.js en el backend; Shopify en las tiendas y Three.js en el 3D, como el puerto jugable de esta web. Cuando una app depende a fondo del hardware del teléfono, se valora el desarrollo nativo",
    ],
  },
  {
    label: "Proyectos",
    value: [
      { text: `${PROJECT_COUNT} proyectos en el portfolio`, href: "/projects" },
      `, con clientes en ${list.format(CLIENT_LOCALITIES)}, entre otros`,
    ],
  },
  {
    label: "Valoración en Google",
    value: [
      `${RATING} sobre 5 con ${REVIEW_COUNT} reseñas (${RATING_DATE}) · `,
      { text: "ficha de Google", href: BUSINESS.mapsUrl },
      " · ",
      { text: "reseñas en esta web", href: "/resenas" },
    ],
  },
  {
    label: "Dónde trabaja",
    value: ["En persona en Vigo, su área y la provincia de Pontevedra; a distancia, con el resto de Galicia y de España"],
  },
  { label: "Idiomas", value: ["Español e inglés"] },
  {
    label: "Contacto",
    value: [
      { text: `WhatsApp ${BUSINESS.phoneDisplay}`, href: WHATSAPP_HREF },
      " · ",
      { text: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
      " · respuesta en 24 horas laborables",
    ],
  },
];

/**
 * Casos que explican el estudio (plan AEO, §4.2): ERP + app, app multiplataforma,
 * cuotas online, venta de entradas y reservas conectadas a un software. Notas
 * propias de esta página, sacadas de la descripción de cada proyecto.
 */
const CASES: readonly LandingCase[] = [
  {
    slug: "autoescuela-gti",
    note: "ERP a medida para la oficina y app móvil para los alumnos: matrículas, prácticas, exámenes y flota de coches en un solo sistema.",
  },
  {
    slug: "xaulabs",
    note: "App de formación en trading para iOS y Android, hecha con React Native, que convierte el aprendizaje en un recorrido por niveles.",
  },
  {
    slug: "pbb-porrino",
    note: "Web del club deportivo de O Porriño con inscripción y pago de cuotas online, y cuentas para familias y deportistas.",
  },
  {
    slug: "ticketera-la-fabrica",
    note: "Venta de entradas online para La Fábrica, discoteca de Redondela, con el aforo gestionado en tiempo real.",
  },
  {
    slug: "nautirent",
    note: "Web de alquiler de embarcaciones conectada al software de gestión de la flota: disponibilidad en tiempo real y reservas sin llamadas.",
  },
];

export type ResolvedAboutCase = LandingCase & { project: Project };

/** Un slug que ya no exista se cae en silencio (como en las landings). */
export const ABOUT_CASES: readonly ResolvedAboutCase[] = CASES.flatMap((c) => {
  const project = projects.find((p) => p.slug === c.slug);
  return project ? [{ ...c, project }] : [];
});

export const ABOUT_ALL_PROJECTS = { href: "/projects", label: `Ver los ${PROJECT_COUNT} proyectos` } as const;

/** «Cómo trabaja»: cuatro pasos reales (los de las landings, en tercera persona). */
export const ABOUT_STEPS: readonly { title: string; text: string }[] = [
  {
    title: "Reunión de definición",
    text: "En Rúa Colón o por videollamada. La primera reunión es gratis y sin compromiso.",
  },
  {
    title: "Propuesta cerrada",
    text: "Con el alcance de la primera versión por escrito, antes de programar nada.",
  },
  {
    title: "Desarrollo por entregas",
    text: "Versiones de prueba que el cliente usa en su propio móvil u ordenador: avances reales, no informes.",
  },
  {
    title: "Publicación y mantenimiento",
    text: "En App Store, Google Play o la web, y después el mantenimiento, con el mismo equipo.",
  },
];

/** «Lo que no hace» (`llms.txt`, «What we don't do»). */
export const ABOUT_NOT_DONE: readonly string[] = [
  "Webs montadas sobre plantillas de WordPress",
  "Contenido en serie para buscadores, sin estrategia",
  "«MVP» sin una definición de producto detrás",
  "Subcontratar el desarrollo móvil o las partes críticas",
  "Listas de precios: cada proyecto lleva su propuesta cerrada y por escrito",
];

export interface AboutFaq {
  q: string;
  a: readonly Segment[];
}

/**
 * Preguntas de marca (plan AEO, §4.2 y §4.5): la primera frase responde en
 * menos de 30 palabras; después, el detalle. Todas visibles en las dos
 * versiones (sin acordeón) y en el `FAQPage` del JSON-LD.
 */
export const ABOUT_FAQS: readonly AboutFaq[] = [
  {
    q: "¿Qué es Action Development?",
    a: [
      `Un estudio de desarrollo de software de Vigo que diseña y programa apps para iOS y Android, software a medida y webs para empresas. Es la marca comercial de ${LEGAL_ENTITY.name} y tiene su oficina en ${BUSINESS.address.street}.`,
    ],
  },
  {
    q: "¿Action Development es la misma empresa que la cadena de tiendas Action?",
    a: [
      "No. Action Development es un estudio de desarrollo de software de Vigo (actiondev.es) y no tiene relación con la cadena de tiendas de descuento Action ni con otras empresas llamadas «Action Development» fuera de España.",
    ],
  },
  {
    q: "¿Dónde está Action Development?",
    a: [
      `En ${OFFICE}, en el centro de la ciudad. La sociedad titular, ${LEGAL_ENTITY.name}, tiene su domicilio social en ${LEGAL_ENTITY.registeredAddress.locality} (${LEGAL_ENTITY.registeredAddress.region}).`,
    ],
  },
  {
    q: "¿Qué tipo de proyectos hace?",
    a: [
      "Apps para iOS y Android con su panel de gestión y su backend, software a medida (ERP, control horario, integraciones), webs y aplicaciones web a medida y tiendas online. Entre sus casos están Autoescuela GTI, XauLabs, PBB, La Fábrica y Nautirent: ",
      { text: "todos los proyectos", href: "/projects" },
      ".",
    ],
  },
  {
    q: "¿Con qué tecnologías trabaja?",
    a: [
      "Las apps, con React Native y Expo, que publican en iOS y Android con una sola base de código; cuando una app depende a fondo del hardware del teléfono, se valora el desarrollo nativo. Las webs, con React y Next.js o Vite, y el backend, con Node.js. Las tiendas, con Shopify o desarrollo propio, y el 3D, con Three.js, como el de esta misma web.",
    ],
  },
  {
    q: "¿Trabaja fuera de Vigo?",
    a: [
      `Sí. En persona con empresas de Vigo, su área y la provincia de Pontevedra, y a distancia con el resto de Galicia y de España. Tiene clientes en ${list.format(OUTSIDE_VIGO)}, entre otros.`,
    ],
  },
  {
    q: "¿Quién está detrás de Action Development?",
    a: [
      `${LEGAL_ENTITY.name} (CIF ${LEGAL_ENTITY.taxId}), sociedad inscrita en el ${LEGAL_ENTITY.registry.office}. En su equipo está `,
      { text: TEAM_MEMBER.name, href: TEAM_MEMBER.url },
      `, ${TEAM_MEMBER_ROLE}.`,
    ],
  },
  {
    q: "¿Qué opinan sus clientes?",
    a: [
      `En Google tiene una valoración de ${RATING} sobre 5 con ${REVIEW_COUNT} reseñas (${RATING_DATE}). Se pueden leer en su `,
      { text: "ficha de Google", href: BUSINESS.mapsUrl },
      " y en la ",
      { text: "página de reseñas", href: "/resenas" },
      " de esta web.",
    ],
  },
  {
    q: "¿Subcontrata el desarrollo?",
    a: [
      "No. El diseño, el desarrollo de la app y de la web, el backend y el mantenimiento los hace el mismo equipo interno.",
    ],
  },
];

/** Cierre de la página: el mismo en los dos árboles. */
export const ABOUT_CTA = {
  title: "¿Hablamos de tu proyecto?",
  text: "La primera reunión es gratis y sin compromiso. Te respondemos en 24 horas laborables.",
} as const;

// ─── JSON-LD ─────────────────────────────────────────────────────────────

/**
 * `AboutPage` cuyo `mainEntity` es la organización (el nodo completo lo emite
 * el layout raíz con `organizationSchema()`, por su `@id`), `FAQPage` con las
 * preguntas visibles y migas. Sin `aggregateRating` ni `Review` (CLAUDE.md
 * `[SEO]`): la valoración va en el texto, no marcada.
 */
export const ABOUT_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": ABOUT_URL,
      url: ABOUT_URL,
      name: ABOUT_H1,
      description: ABOUT_DESCRIPTION,
      inLanguage: "es",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      mainEntity: { "@id": ORGANIZATION_ID },
      breadcrumb: { "@id": `${ABOUT_URL}#breadcrumb` },
    },
    {
      "@type": "FAQPage",
      "@id": `${ABOUT_URL}#faq`,
      isPartOf: { "@id": ABOUT_URL },
      mainEntity: ABOUT_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: segmentsText(faq.a) },
      })),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${ABOUT_URL}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: ABOUT_CRUMB, item: ABOUT_URL },
      ],
    },
  ],
};
