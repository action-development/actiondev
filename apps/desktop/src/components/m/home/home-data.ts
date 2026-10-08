import { BUSINESS, projects, type Project } from "@actiondev/shared";
import { testimonials, type Testimonial } from "@/data/testimonials";
import { projectCategoryLabel } from "@/lib/project-case";
import type { ServiceNeed } from "../Shape";

/**
 * Contenido de la home móvil v2 (`app/(m)/m/page.tsx`). Copy de la maqueta
 * aprobada `docs/mobile-v2/home.html`; los DATOS salen siempre del repo
 * (`projects.ts`, `testimonials.ts`, `BUSINESS`), nunca escritos a mano.
 */

/** Mensaje precargado de WhatsApp en toda la home (cabecera, hero, barra, CTA final y pie). Sin emojis ni datos personales. */
export const HOME_WHATSAPP_TEXT = "Hola, he visto vuestra web y quiero contaros mi proyecto";

/** Id del CTA lima del hero: lo observa `StickyCta` para aparecer al salir de pantalla. */
export const HOME_HERO_CTA_ID = "hero-cta";

/**
 * Id del CTA final (lima, con sus dos botones): `StickyCta` lo recibe como
 * `formId` para esconderse mientras está a la vista. Si no, «Contar mi
 * proyecto» salía dos veces seguidas y dos bloques lima en la misma pantalla.
 */
export const HOME_FINAL_CTA_ID = "cta-final";

/* ── Reseñas (cifras: `REVIEW_AVERAGE`/`REVIEW_COUNT` de `../Rating`) ──────── */

/** Reseñas de la home, por `id` y en este orden (las de la maqueta). Citas literales. */
const HOME_REVIEW_IDS = ["adrian-rodriguez", "carlos-alonso", "samuel-flores"] as const;

export const HOME_REVIEWS: Testimonial[] = HOME_REVIEW_IDS.map((id) => testimonials.find((t) => t.id === id)).filter(
  (t): t is Testimonial => Boolean(t),
);

/* ── Casos ───────────────────────────────────────────────────────────────── */

/**
 * Casos de la home («Trabajo real»), SOLO proyectos con mockup en
 * `projects.ts`:
 * - Tarjeta grande (mockup horizontal 3:2): estos tres y en este orden, los
 *   de la maqueta aprobada — app + programa con la cifra ×10, una web con
 *   Antes/Ahora y una web de moda.
 * - Tira (mockup vertical 4:5): el resto de los que tienen `mockupVertical`.
 * Los demás con mockup (webs y tiendas) van a `/projects` con «Ver todos»: 15
 * casos en la home eran demasiados. Imágenes vía `projectMedia()`: cambiar un
 * mockup es cambiar el dato, no este archivo.
 */
const FEATURED_SLUGS = ["autoescuela-gti", "ticketera-la-fabrica", "patricia-avendano"] as const;

export const FEATURED_CASES: Project[] = FEATURED_SLUGS.map((slug) =>
  projects.find((p) => p.slug === slug && p.mockup),
).filter((p): p is Project => Boolean(p));

export const STRIP_CASES: Project[] = projects.filter((p) => p.mockupVertical && !FEATURED_CASES.includes(p));

/** Nombre corto: «Patricia Avendaño | Diseñadora» → «Patricia Avendaño». */
export const caseName = (p: Project) => p.title.split(" | ")[0];

/** Sector y localidad verificados («Ocio y eventos, Redondela»), o nada. */
export function caseSector(p: Project): string | undefined {
  return [p.nicheEs, p.location].filter(Boolean).join(", ") || undefined;
}

/** Tipo + sector para la tira: «Página web, corporativo». */
export function caseKind(p: Project): string {
  const kind = projectCategoryLabel(p);
  const niche = p.nicheEs && p.nicheEs.toLowerCase() !== kind.toLowerCase() ? p.nicheEs.toLowerCase() : undefined;
  return niche ? `${kind}, ${niche}` : kind;
}

/* ── Servicios, proceso y dudas (copy de la maqueta) ─────────────────────── */

/**
 * Los cuatro servicios. Cada fila enlaza a su landing SEO (sin árbol móvil:
 * `MLink` pinta `<a>`). «Conectar programas» va a la de software a medida,
 * que cubre ERP e integraciones.
 */
export const HOME_SERVICES: { need: ServiceNeed; text: string; href: string }[] = [
  {
    need: "app",
    text: "Tu propia app para iPhone y Android, publicada en App Store y Google Play.",
    href: "/desarrollo-de-aplicaciones-vigo",
  },
  {
    need: "software",
    text: "Un programa hecho a la medida de cómo trabajáis, para dejar atrás el Excel y el papel.",
    href: "/software-a-medida-vigo",
  },
  {
    need: "integration",
    text: "Que tu web, tu ERP y el resto de herramientas se pasen los datos solos.",
    href: "/software-a-medida-vigo",
  },
  {
    need: "web",
    text: "Que se entiendan a la primera, se vean bien en el móvil y puedas actualizarlas tú.",
    href: "/desarrollo-web-vigo",
  },
];

/** Los cuatro pasos. El 01 va en lima: es el gratuito. */
export const HOME_STEPS = [
  {
    title: "Primera reunión",
    text: "Gratis y sin compromiso, en Rúa Colón o por videollamada. Salimos con lo que necesitas y por dónde empezar.",
  },
  {
    title: "Presupuesto cerrado",
    text: "Te lo enviamos por escrito: qué entra en la primera versión y qué puede esperar.",
  },
  {
    title: "Desarrollo con entregas",
    text: "Ves avances desde el principio: un prototipo antes de programar y versiones de prueba mientras avanzamos.",
  },
  {
    title: "Lanzamiento y mantenimiento",
    text: "Lo ponemos en marcha, te acompañamos los primeros días y, si quieres, lo mantenemos después.",
  },
] as const;

export const HOME_FAQS = [
  {
    q: "¿Cuánto cuesta?",
    a: "Depende de lo que haya que construir. Tras la primera reunión te enviamos un presupuesto cerrado y por escrito, con lo que incluye y lo que no.",
  },
  {
    q: "¿Se puede empezar por algo pequeño?",
    a: "Sí, y casi siempre lo recomendamos. Empezamos por lo que más te duele y crecemos desde ahí.",
  },
  {
    q: "¿Lo conectáis con el programa que ya uso?",
    a: "Normalmente sí. Depende de cómo saque los datos tu programa, y lo revisamos al principio para decirte qué es viable.",
  },
  {
    q: "¿Quién lo mantiene después?",
    a: "Nosotros, si quieres. El mantenimiento va en el presupuesto para que no sea una sorpresa.",
  },
  {
    q: "¿Podemos vernos en persona?",
    a: `Sí, en nuestra oficina de ${BUSINESS.address.street}, en ${BUSINESS.address.locality}.`,
  },
] as const;
