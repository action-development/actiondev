import type { LeadNeed } from "@actiondev/shared";

/**
 * Landings de campaña (`/hablemos/[oferta]`) — Google Ads y Meta Ads.
 *
 * Misma forma que `landings.ts` (data-driven, una entrada por ruta), pero con
 * otro propósito: una sola decisión (dejar el proyecto en el formulario) y nada
 * que distraiga. `noindex`, fuera del sitemap y sin salidas al juego.
 *
 * VERACIDAD (misma regla que `landings.ts`): casos → `slug` de
 * `packages/shared/src/projects.ts`; reseñas → `id` de `testimonials.ts`.
 * Cada `note` es literal o fiel al `brief`/`result` del proyecto y a la nota
 * que ya usa `landings.ts` para el mismo caso. Nada de cifras, plazos ni
 * precios que no estén ahí. El proceso sigue el de `landings.ts`.
 */

export interface AdsCase {
  slug: string;
  note: string;
}

export interface AdsStep {
  title: string;
  text: string;
}

export interface AdsFaq {
  q: string;
  a: string;
}

export interface AdsLanding {
  /** Segmento de ruta: `/hablemos/{slug}`. También es el `offer` del formulario. */
  slug: "app" | "software";
  /** Sin marca: el `title.template` del layout raíz añade « — Action». */
  title: string;
  /** ≤ 155 caracteres. */
  metaDescription: string;
  h1: string;
  subtitle: string;
  /** Necesidad preseleccionada en el paso 1 del formulario. */
  defaultNeed: LeadNeed;
  bullets: [string, string, string];
  casesTitle: string;
  cases: AdsCase[];
  /** Ids de `testimonials.ts`. Cada reseña se cita en UNA sola landing. */
  testimonials: string[];
  /**
   * Reseña del hero de escritorio, junto al formulario: `id` de
   * `testimonials.ts` y, si hace falta, un recorte LITERAL de su texto con «…»
   * en el extremo cortado. Si el recorte no está en la reseña, se pinta
   * entera. En móvil no va en el hero: abre la sección de reseñas, entera. No
   * se repite en la página.
   */
  heroReview: { id: string; excerpt?: string };
  /** Mensaje precargado de los enlaces de WhatsApp de la landing (barra, barra fija y formulario). */
  whatsappText: string;
  steps: AdsStep[];
  faqs: AdsFaq[];
  cta: { title: string; text: string };
}

export const adsLandings: AdsLanding[] = [
  {
    slug: "app",
    title: "Desarrollo de apps para empresas",
    metaDescription:
      "Desarrollo de apps para empresas: iOS y Android con panel de gestión y servidor, publicadas en App Store y Google Play. Propuesta cerrada. Rúa Colón, Vigo.",
    h1: "Desarrollo de apps para empresas, de la idea a App Store y Google Play",
    subtitle:
      "Diseñamos y programamos tu app para iOS y Android, con su panel de gestión y su servidor. Desde Rúa Colón, 20 (Vigo), con propuesta cerrada y el alcance por escrito.",
    defaultNeed: "app",
    bullets: [
      "Un solo equipo de principio a fin: quien te atiende en la primera reunión es quien conoce el código después.",
      "Prototipo navegable antes de programar y versiones de prueba en tu móvil durante el desarrollo.",
      "Publicamos en App Store y Google Play y mantenemos la app cuando Apple o Google cambian sus requisitos.",
    ],
    casesTitle: "Apps que ya están en uso",
    cases: [
      {
        slug: "autoescuela-gti",
        note: "ERP para secretaría y app para alumnos. Multiplicó por 10 los trámites que se resuelven sin pasar por secretaría.",
      },
      {
        slug: "true-trading-app",
        note: "Una sola app para una operativa que antes vivía repartida entre Telegram y otras herramientas.",
      },
    ],
    testimonials: ["rapeal-john", "dominik-saworski"],
    heroReview: { id: "rapeal-john", excerpt: "…el resultado ha sido espectacular" },
    whatsappText: "Hola, vengo de vuestra web y quiero hablar de una app a medida",
    steps: [
      {
        title: "Reunión de definición",
        text: "La primera reunión es gratis y sin compromiso. En Rúa Colón o por videollamada. Salimos con los usuarios, las pantallas clave y el alcance de la primera versión.",
      },
      {
        title: "Propuesta cerrada",
        text: "Te enviamos el alcance por escrito, con lo que entra en la primera versión y lo que puede esperar.",
      },
      {
        title: "Desarrollo con entregas",
        text: "Prototipo navegable antes de programar y versiones de prueba que instalas en tu móvil mientras avanzamos.",
      },
      {
        title: "Lanzamiento y mantenimiento",
        text: "Publicación en App Store y Google Play, seguimiento de los primeros días de uso y mantenimiento posterior.",
      },
    ],
    faqs: [
      {
        q: "¿Cuánto cuesta una app?",
        a: "Depende de las pantallas y tipos de usuario, de si se conecta con programas que ya usas y de si funciona sin conexión. Tras la reunión de definición te enviamos una propuesta cerrada.",
      },
      {
        q: "¿iOS, Android o las dos?",
        a: "Las dos, con una sola app para iPhone y Android: para la mayoría de apps de negocio es la opción que mejor equilibra coste, plazo y experiencia. Solo hacemos una versión aparte para cada sistema si la app necesita algo muy concreto del teléfono.",
      },
      {
        q: "¿Os encargáis de publicarla?",
        a: "Sí: cuentas a nombre de tu empresa, fichas de tienda y revisión de Apple y Google.",
      },
      {
        q: "¿Se puede empezar por una versión pequeña?",
        a: "Sí, y casi siempre lo recomendamos.",
      },
      {
        q: "¿Podemos vernos en persona?",
        a: "Sí. La oficina está en Rúa Colón, 20 (Vigo): con empresas de Vigo y su área, el arranque, el prototipo y la entrega los hacemos en persona. Con el resto de Galicia y España trabajamos en remoto con el mismo método, y a A Coruña, Santiago, Lugo u Ourense nos desplazamos para las sesiones clave.",
      },
    ],
    cta: {
      title: "¿Tienes una app en la cabeza?",
      text: "Cuéntanos qué problema quieres resolver y para quién. Te respondemos en 24 horas laborables con los siguientes pasos. La primera reunión es gratis y sin compromiso.",
    },
  },
  {
    slug: "software",
    title: "Software a medida e integraciones con tu ERP",
    metaDescription:
      "Software a medida e integraciones con tu ERP: paneles, control horario y portales conectados por API a lo que ya usas. Propuesta cerrada por módulo. Vigo.",
    h1: "Software a medida e integraciones con tu ERP, sin tirar lo que ya funciona",
    subtitle:
      "ERP y paneles a medida, control horario, portales y conexiones por API entre los programas que ya usas. Empezamos por el módulo que más duele, con propuesta cerrada por módulo.",
    defaultNeed: "software",
    bullets: [
      "Convive con tu ERP actual: lo conectamos por API, base de datos o exportaciones, y te decimos qué es viable antes de comprometer nada.",
      "Módulos que entran en uso por separado: nada de proyectos eternos.",
      "Migramos tus datos de Excel y probamos el sistema con quien lo va a usar.",
    ],
    casesTitle: "Software a medida en producción",
    cases: [
      {
        slug: "autoescuela-gti",
        note: "ERP para secretaría y app para alumnos. Multiplicó por 10 los trámites que se resuelven sin pasar por secretaría.",
      },
      {
        slug: "timetracker",
        note: "Fichaje y panel en tiempo real para una pyme industrial.",
      },
      {
        slug: "nautirent",
        note: "Web conectada al software de flota, con disponibilidad en tiempo real.",
      },
      {
        slug: "licentia",
        note: "Licencia enviada automáticamente tras el pago.",
      },
    ],
    testimonials: ["julio-walker", "pablo-r", "samuel-flores"],
    heroReview: { id: "julio-walker", excerpt: "Tienen solución para literalmente todo…" },
    whatsappText: "Hola, vengo de vuestra web y quiero hablar de un software de gestión a medida",
    steps: [
      {
        title: "Reunión de definición",
        text: "La primera reunión es gratis y sin compromiso. Hablamos con quienes hacen el trabajo y dibujamos el proceso actual, con sus atajos y sus Excel.",
      },
      {
        title: "Propuesta cerrada",
        text: "Priorizamos qué se construye primero y te damos una propuesta cerrada por módulo, con lo que incluye y lo que no.",
      },
      {
        title: "Desarrollo con entregas",
        text: "Entregas periódicas en un entorno de pruebas que usan las personas que luego trabajarán con el sistema.",
      },
      {
        title: "Lanzamiento y mantenimiento",
        text: "Migración de datos, formación del equipo, arranque acompañado y mantenimiento evolutivo.",
      },
    ],
    faqs: [
      {
        q: "¿Podéis conectar mi ERP con la web o una app?",
        a: "Normalmente sí. Depende de cómo exponga los datos tu ERP (una API, una base de datos accesible o exportaciones periódicas), y lo revisamos al principio para decirte qué es viable.",
      },
      {
        q: "¿Y mis datos en Excel?",
        a: "Los limpiamos y los migramos. Parte del trabajo es ordenarlos antes de cargarlos, para que el sistema nuevo no arrastre los mismos problemas.",
      },
      {
        q: "¿Cómo se presupuesta?",
        a: "Por módulos, con lo que incluye y lo que no cada uno. Así decides por dónde empezar y cuánto invertir en cada fase.",
      },
      {
        q: "¿Funciona en el móvil?",
        a: "Las pantallas de uso diario, como fichar o consultar un pedido, se diseñan para móvil. Si hace falta una app en las tiendas, también la desarrollamos.",
      },
      {
        q: "¿Quién lo mantiene?",
        a: "Nosotros, si quieres. El mantenimiento va en la propuesta para que no sea una sorpresa.",
      },
      {
        q: "¿Trabajáis solo en Vigo?",
        a: "No, pero es donde más trabajamos. En Vigo y su área nos vemos en persona sin complicaciones; con el resto de Galicia y España trabajamos en remoto con el mismo método.",
      },
    ],
    cta: {
      title: "¿Qué proceso de tu empresa sigue en Excel?",
      text: "Cuéntanoslo. Te diremos si tiene sentido un software a medida, una integración o un programa estándar bien configurado. La primera reunión es gratis y sin compromiso.",
    },
  },
];

export function getAdsLanding(slug: string): AdsLanding | undefined {
  return adsLandings.find((l) => l.slug === slug);
}
