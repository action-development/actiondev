/**
 * Landing pages SEO locales — data-driven.
 *
 * Cada entrada genera una ruta indexable en /[slug] con metadata propia,
 * JSON-LD (Service + FAQPage + BreadcrumbList) y contenido único en español.
 * Estas páginas NO están enlazadas desde la navegación principal a propósito:
 * se descubren vía sitemap.xml, /servicios, llms.txt, el nav sr-only de la
 * home y el enlazado interno entre ellas.
 *
 * Reglas de contenido (auditoría SEO de 2026-09-30):
 * - Copy único por landing: `localContext`, `cases`, `sections` y `faqs` no se
 *   reutilizan entre páginas (evita que Google las trate como doorway pages).
 * - VERACIDAD: solo datos comprobables en el repo. Casos → `slug` de
 *   `packages/shared/src/projects.ts` (se enlazan a `/projects/{slug}`);
 *   citas → `id` de `src/data/testimonials.ts`. Nada de cifras, plazos,
 *   precios, tecnologías o clientes que no estén ahí. Una ubicación de
 *   cliente solo se afirma si sale de su dominio/slug/descripción o de su
 *   web publicada (Samoa, La Fábrica y Canelita → Redondela; PBB → O Porriño;
 *   Musa y Patricia Avendaño → Vigo; FASE → Vigo y el puerto de Marín;
 *   París de Noia, Fisionorte y Equs → Noia; Almudena Muhle → Mallorca).
 * - Sin precios publicados (pendiente de decisión del cliente): se explica
 *   de qué depende el presupuesto, cada landing con un enfoque distinto.
 * - Cada testimonio se cita en UNA sola landing.
 */

import { LEAD_NEEDS_CAMPAIGN, LEAD_NEEDS_WEB, type LeadNeed } from "@actiondev/shared";

export interface LandingFaq {
  q: string;
  a: string;
}

export interface LandingBlock {
  title: string;
  text: string;
}

export interface LandingSection {
  title: string;
  paragraphs: string[];
}

/** Caso real del porfolio: `slug` de `projects.ts`, enlazado a su ficha. */
export interface LandingCase {
  slug: string;
  note: string;
}

export interface LandingArea {
  name: string;
  type: "City" | "AdministrativeArea" | "Place";
}

export interface Landing {
  slug: string;
  /** Bloque de /servicios en el que se lista. */
  group: "servicio" | "zona";
  /** Nombre del servicio para el schema Service. */
  serviceName: string;
  /** `serviceType` del schema Service. */
  serviceType: string;
  /** `areaServed` del schema Service, coherente con la landing. */
  areaServed: LandingArea[];
  /** ≤ 60 caracteres. */
  title: string;
  /** ≤ 155 caracteres. */
  metaDescription: string;
  h1: string;
  intro: string[];
  /** Contexto del mercado local — el bloque que no se puede reutilizar. */
  localContext: LandingSection;
  offersTitle: string;
  offers: LandingBlock[];
  casesTitle: string;
  cases: LandingCase[];
  /** Secciones largas propias de la landing. */
  sections: LandingSection[];
  processTitle: string;
  process: LandingBlock[];
  /** Texto de entrada + ids de `testimonials.ts` que se citan. */
  proof: { text: string; testimonials: string[] };
  faqs: LandingFaq[];
  cta: { title: string; text: string };
  /** Necesidad preseleccionada en el formulario del final (`#proyecto`). */
  leadNeed: LeadNeed;
  /** Las 4 opciones del paso 1: `LEAD_NEEDS_WEB` en las de web, `LEAD_NEEDS_CAMPAIGN` en las de app y software. */
  leadNeeds: readonly LeadNeed[];
  /** 2-4 landings relacionadas, con anclas descriptivas y distintas. */
  related: { slug: string; label: string }[];
  /** Descripción propia para la tarjeta de /servicios. */
  hubSummary: string;
}

export const landings: Landing[] = [
  // ───────────────────────────────────────────────────────────────────
  {
    slug: "desarrollo-de-aplicaciones-vigo",
    group: "servicio",
    serviceName: "Desarrollo de aplicaciones en Vigo",
    serviceType: "Desarrollo de aplicaciones móviles",
    areaServed: [
      { name: "Vigo", type: "City" },
      { name: "Provincia de Pontevedra", type: "AdministrativeArea" },
    ],
    title: "Desarrollo de Apps en Vigo | Aplicaciones iOS y Android",
    metaDescription:
      "Desarrollo de aplicaciones en Vigo: apps iOS y Android con React Native, panel de gestión y backend propio. Oficina en Rúa Colón 20. ★ 5,0 en Google.",
    h1: "Desarrollo de aplicaciones en Vigo",
    intro: [
      "Somos Action, un estudio de desarrollo de apps y aplicaciones con oficina en el centro de Vigo, en la Rúa Colón, 20. Diseñamos y programamos apps para iOS y Android, aplicaciones web y el backend que las sostiene, para empresas que necesitan que su app resuelva un problema concreto: reservas, fichajes, pedidos, alumnos, socios o clientes.",
      "Trabajamos con el mismo equipo de principio a fin — definición, diseño, desarrollo, publicación y mantenimiento —, así que la persona con la que hablas en la primera reunión es la que conoce el código cuando, meses después, hay que añadir una función o corregir un fallo.",
      "En esta página te contamos qué tipo de apps hacemos, con qué casos reales puedes comprobarlo, cómo decidimos la tecnología y qué conviene tener claro antes de pedir presupuesto.",
    ],
    localContext: {
      title: "Apps para cómo se trabaja en Vigo",
      paragraphs: [
        "Vigo es la ciudad más poblada de Galicia y su economía no se parece a la de ninguna otra: el puerto pesquero y la industria conservera, la planta de Stellantis en Balaídos y su red de proveedores de automoción, los astilleros de la ría, la logística ligada al puerto y los polígonos que gestiona la Zona Franca. Buena parte de ese tejido son pymes industriales y de servicios que siguen resolviendo procesos críticos con hojas de cálculo, papel y grupos de WhatsApp.",
        "Ahí es donde una app a medida tiene más sentido: partes de trabajo que se rellenan en la nave y llegan al instante a la oficina, control horario de una plantilla repartida en turnos, pedidos de clientes profesionales que hoy entran por teléfono o una herramienta para los comerciales que recorren la comarca. No hace falta una app de consumo con millones de descargas; hace falta que la usen treinta personas todos los días sin quejarse.",
        "Y luego está el Vigo de calle: hostelería, academias, clínicas, clubes deportivos y comercio, que necesitan reservas, cuotas, citas o un canal directo con sus clientes. Conocemos los dos mundos porque trabajamos en medio de ellos, desde una oficina en pleno centro.",
      ],
    },
    offersTitle: "Qué apps desarrollamos para empresas de Vigo",
    offers: [
      {
        title: "Apps iOS y Android multiplataforma",
        text: "Con React Native — la tecnología de XauLabs, nuestra app de formación para iOS y Android — escribimos una sola base de código para las dos tiendas. Para la mayoría de apps de negocio es la opción que mejor equilibra coste, plazo y experiencia.",
      },
      {
        title: "Nativo, cuando de verdad hace falta",
        text: "Si tu app depende de hardware muy concreto o de funciones que solo resuelven bien los SDK de Apple y Google, lo planteamos en la fase de definición, antes de escribir código, y no a mitad del proyecto.",
      },
      {
        title: "App + panel de gestión",
        text: "La app del usuario casi nunca va sola: detrás hay un panel web donde tu equipo gestiona altas, contenidos y datos. En Autoescuela GTI, la app de alumnos y el ERP de secretaría comparten la misma información.",
      },
      {
        title: "Backend, APIs e integraciones",
        text: "Servidor, base de datos, autenticación, notificaciones y conexión con lo que ya usas. En True Trading y Lift, la app se conecta en tiempo real con plataformas externas.",
      },
      {
        title: "Publicación y mantenimiento",
        text: "Preparamos las fichas, gestionamos la revisión de App Store y Google Play y mantenemos la app cuando Apple o Google cambian sus requisitos, que ocurre cada año.",
      },
    ],
    casesTitle: "Apps que ya hemos construido",
    cases: [
      {
        slug: "autoescuela-gti",
        note: "ERP para secretaría y app móvil para alumnos: prácticas, clases y exámenes consultables desde el móvil, y gestión de la flota de coches. Multiplicó por 10 los trámites que se resuelven sin pasar por secretaría.",
      },
      {
        slug: "xaulabs",
        note: "App multiplataforma para iOS y Android, hecha con React Native, que convierte el aprendizaje de trading en un recorrido por niveles con progreso visible.",
      },
      {
        slug: "true-trading-app",
        note: "Una sola app para una operativa que antes vivía repartida entre Telegram y otras herramientas: chats, grupos, perfiles y conexión en tiempo real con plataformas de trading.",
      },
      {
        slug: "san-jose",
        note: "El caso contrario: una app sencilla para que una inmobiliaria enseñe su catálogo de propiedades en el móvil. No todas las apps tienen que ser grandes.",
      },
    ],
    sections: [
      {
        title: "Una empresa de desarrollo de apps en Vigo",
        paragraphs: [
          "Si comparas empresas de desarrollo de apps en Vigo, pregunta primero quién va a programar la tuya. En Action, quien te escucha en la primera reunión es quien diseña y programa la app: sin comerciales de por medio ni subcontratas. Trabajamos en la oficina de la Rúa Colón, 20, y con los clientes de Vigo y su área nos vemos ahí en persona.",
          "Y el equipo que la construye es el que la mantiene. Cuando Apple o Google cambian sus requisitos, cuando el uso destapa un fallo o cuando quieres añadir una función, hablas con alguien que conoce el código porque lo escribió, no con un servicio técnico que lo abre por primera vez.",
        ],
      },
      {
        title: "¿App nativa, multiplataforma o web app?",
        paragraphs: [
          "Es la primera pregunta que nos hacen, y la respuesta depende de tres cosas: quién va a usar la app, desde qué dispositivo y qué tiene que hacer con el hardware del teléfono.",
          "Si tus usuarios son clientes finales que la descargan de la tienda, una app multiplataforma con React Native cubre iPhone y Android con una sola base de código. Si los usuarios son tu propia plantilla, a menudo basta una aplicación web instalable (PWA): no pasa por la revisión de las tiendas y se actualiza al instante. Y si la app vive de la cámara, el Bluetooth o la localización en segundo plano con requisitos exigentes, conviene valorar el desarrollo nativo.",
          "Lo decidimos contigo en la fase de definición, con tu caso delante. Y si lo que necesitas no es una app sino una web bien hecha, también te lo diremos: es más barato y, para ese caso, funciona mejor.",
        ],
      },
      {
        title: "De qué depende el presupuesto de una app",
        paragraphs: [
          "No publicamos tarifas porque dos apps con el mismo nombre pueden costar cosas muy distintas. Lo que mueve el presupuesto es, sobre todo, el número de pantallas y de tipos de usuario, si hace falta backend propio o bastan servicios gestionados, las integraciones con sistemas que ya tienes (ERP, pasarela de pago, plataformas externas) y si la app tiene que funcionar sin conexión.",
          "Por eso el presupuesto sale de una reunión de definición: escuchamos, delimitamos qué entra en la primera versión y qué puede esperar, y te enviamos una propuesta cerrada con el alcance por escrito. Si el proyecto es grande, lo partimos en fases para que la primera llegue antes a tus usuarios.",
        ],
      },
    ],
    processTitle: "Cómo trabajamos una app",
    process: [
      {
        title: "1. Definición",
        text: "Reunión en Rúa Colón o por videollamada. Salimos con los usuarios, las pantallas clave y el alcance de la primera versión por escrito.",
      },
      {
        title: "2. Prototipo",
        text: "Diseño navegable de la app antes de programar. Lo pruebas con tu equipo y lo corregimos mientras cambiar cosas todavía es barato.",
      },
      {
        title: "3. Desarrollo por entregas",
        text: "Versiones de prueba que instalas en tu propio móvil (TestFlight en iPhone, pruebas internas en Android) para que veas avances reales, no informes.",
      },
      {
        title: "4. Tiendas y evolución",
        text: "Publicación en App Store y Google Play, seguimiento de los primeros días de uso y mantenimiento posterior.",
      },
    ],
    proof: {
      text: "Las reseñas que dejan nuestros clientes en Google son la mejor forma de saber cómo trabajamos. Estas dos hablan precisamente de una app hecha en Vigo y de estar disponibles:",
      testimonials: ["rapeal-john", "dominik-saworski"],
    },
    faqs: [
      {
        q: "¿Qué tipo de empresas de Vigo encargan una app?",
        a: "Sobre todo dos perfiles: pymes industriales y de servicios que quieren digitalizar un proceso interno (fichajes, partes de trabajo, pedidos, formación) y negocios de cara al público que necesitan reservas, cuotas, citas o un canal propio con sus clientes. Los dos tienen algo en común: la app sustituye algo que hoy se hace a mano.",
      },
      {
        q: "¿Cuánto se cobra por el desarrollo de una app?",
        a: "Depende del alcance: cuántas pantallas y tipos de usuario tiene, si necesita backend propio, con qué sistemas se conecta y si debe funcionar sin conexión. Por eso no damos una cifra sin conocer el proyecto: tras una reunión de definición te enviamos una propuesta cerrada con el alcance por escrito.",
      },
      {
        q: "¿Qué empresas desarrollan aplicaciones en Vigo?",
        a: "En Vigo hay agencias generalistas, estudios centrados en apps y empresas de fuera con páginas por ciudad. Para distinguirlas, pide apps publicadas que puedas descargar, pregunta quién va a programar la tuya y qué pasa con el mantenimiento. Nosotros somos un estudio con oficina en la Rúa Colón, 20, y en esta página tienes nuestros casos.",
      },
      {
        q: "¿Puedo tener una app y un panel web para mi equipo en el mismo proyecto?",
        a: "Sí, y es lo habitual. En Autoescuela GTI los alumnos usan la app mientras secretaría y profesorado trabajan en un ERP web, y ambos comparten los mismos datos. Diseñarlos juntos evita duplicar información y sincronizaciones a mano.",
      },
      {
        q: "¿Os encargáis de subir la app a App Store y Google Play?",
        a: "Sí. Te ayudamos a crear las cuentas de desarrollador a nombre de tu empresa, preparamos las fichas de tienda y gestionamos la revisión de Apple y Google en cada nueva versión.",
      },
      {
        q: "¿Se puede empezar por una versión pequeña?",
        a: "Sí, y casi siempre lo recomendamos. Una primera versión con lo imprescindible llega antes a tus usuarios, y lo que aprendes de su uso real decide mejor que cualquier reunión qué construir después.",
      },
      {
        q: "¿Puedo reunirme con vosotros en persona?",
        a: "Sí. La oficina está en Rúa Colón, 20 (36201 Vigo). Con clientes de Vigo y su área hacemos en persona las reuniones importantes — arranque, validación del prototipo y entrega — y el día a día avanza por videollamada, WhatsApp y versiones de prueba.",
      },
    ],
    cta: {
      title: "¿Tienes una app en la cabeza?",
      text: "Cuéntanos qué problema quieres resolver y para quién. Te respondemos en 24 horas laborables con los siguientes pasos y, si hace falta, quedamos en Rúa Colón.",
    },
    leadNeed: "app",
    leadNeeds: LEAD_NEEDS_CAMPAIGN,
    related: [
      { slug: "software-a-medida-vigo", label: "Software a medida y ERP para empresas de Vigo" },
      { slug: "desarrollo-web-vigo", label: "Webs y aplicaciones web a medida en Vigo" },
      {
        slug: "desarrollo-de-aplicaciones-pontevedra",
        label: "Apps para negocios de la provincia de Pontevedra",
      },
      {
        slug: "desarrollo-de-aplicaciones-galicia",
        label: "Socio técnico de apps para toda Galicia",
      },
    ],
    hubSummary:
      "Apps iOS y Android con React Native, con su panel de gestión y su backend, para empresas de Vigo. Casos: Autoescuela GTI y XauLabs.",
  },

  // ───────────────────────────────────────────────────────────────────
  {
    slug: "desarrollo-web-vigo",
    group: "servicio",
    serviceName: "Desarrollo web en Vigo",
    serviceType: "Desarrollo web a medida",
    areaServed: [
      { name: "Vigo", type: "City" },
      { name: "O Porriño", type: "City" },
      { name: "Provincia de Pontevedra", type: "AdministrativeArea" },
    ],
    title: "Desarrollo Web en Vigo | Webs y Aplicaciones a Medida",
    metaDescription:
      "Desarrollo web a medida en Vigo con Next.js: webs que venden entradas, cobran cuotas o gestionan reservas. Casos reales: Musa y PBB. Oficina en Colón 20.",
    h1: "Desarrollo web en Vigo",
    intro: [
      "Desarrollamos páginas y aplicaciones web a medida desde nuestra oficina de la Rúa Colón, en el centro de Vigo. Webs que hacen algo más que estar: venden entradas, cobran cuotas, reciben reservas o se conectan con el software con el que ya trabajas.",
      "Programamos con React y Next.js, sin plantillas ni constructores visuales. No es una cuestión de moda: el código propio nos deja decidir cómo carga cada página, cómo la lee Google y qué pasa cuando tu negocio necesita una función que ningún plugin trae.",
    ],
    localContext: {
      title: "Lo que vemos en las webs de Vigo",
      paragraphs: [
        "En Vigo hay mucha oferta de webs y buena parte se parece: la misma plantilla con otra foto de la ría. En la ciudad más poblada de Galicia, con competencia en cada barrio y en cada sector, parecerse a los demás sale caro.",
        "Cuando un negocio de Vigo nos llama, los problemas suelen ser otros que la estética: webs que no se pueden actualizar sin llamar al informático, formularios que no llegan a nadie, reservas que siguen entrando por teléfono y fichas de Google Business sin una web decente detrás. La web existe, pero no hace ningún trabajo.",
        "Por eso empezamos preguntando qué tarea debería quitarte la web: la taquilla de una sala de ocio nocturno, el papeleo de inscripciones de un club deportivo, las llamadas para consultar disponibilidad. A partir de ahí se decide la tecnología, no al revés.",
      ],
    },
    offersTitle: "Qué construimos",
    offers: [
      {
        title: "Webs corporativas",
        text: "La web de tu empresa como herramienta comercial: mensaje claro, estructura por servicios y formularios que llegan a quien tiene que responder.",
      },
      {
        title: "Venta y reservas online",
        text: "Entradas, reservas, cuotas y matrículas cobradas desde la propia web, con perfiles de usuario para que cada cliente vea lo que ha comprado.",
      },
      {
        title: "Aplicaciones web y paneles",
        text: "Portales de cliente, paneles internos y plataformas con usuarios, roles y base de datos, cuando lo que necesitas ya no es una web sino una herramienta.",
      },
      {
        title: "Conexión con tu software",
        text: "Disponibilidad, precios o pedidos leídos directamente de tu programa de gestión, sin que nadie tenga que copiar datos a mano.",
      },
      {
        title: "Rediseño y migración",
        text: "Si tu web actual no se deja mantener, la rehacemos conservando el dominio, las URLs que ya posicionan y los contenidos que funcionan.",
      },
    ],
    casesTitle: "Webs que trabajan para su negocio",
    cases: [
      {
        slug: "musa",
        note: "Sala de ocio nocturno de Vigo. Venta de entradas desde su propia web, sin ticketera externa, y perfil de cliente con sus entradas. Las reservas online subieron un 40%.",
      },
      {
        slug: "pbb-porrino",
        note: "Club de baloncesto base de O Porriño. Inscripción y pago de cuota y matrícula desde la web, con cuentas separadas para familias y deportistas.",
      },
      {
        slug: "nautirent",
        note: "Alquiler de embarcaciones. La web lee la disponibilidad de la flota desde el software interno y permite reservar sin llamadas ni intermediarios.",
      },
      {
        slug: "fang-tours",
        note: "Landing con calendario de disponibilidad, pago con Stripe y un panel propio para gestionar los tours en tiempo real.",
      },
    ],
    sections: [
      {
        title: "¿Por qué no WordPress?",
        paragraphs: [
          "WordPress sirve para muchas cosas y no tenemos nada contra él. Pero para una web que tiene que vender o conectarse con otros sistemas, depender de una cadena de plugins de terceros significa actualizaciones que rompen cosas, fallos de seguridad conocidos y una web que se vuelve más lenta con cada añadido.",
          "Con Next.js la web se genera como páginas estáticas o renderizadas en servidor, sin un panel de administración expuesto ni plugins que parchear. Cuando necesitas editar contenidos tú mismo, preparamos un editor a medida de lo que de verdad vas a cambiar — como la carta que Samoa Café actualiza desde su web — en lugar de un panel con doscientas opciones.",
          "Si ya tienes WordPress y te funciona, no te diremos que lo tires. Si se ha convertido en un problema, planificamos la migración para no perder posicionamiento por el camino.",
        ],
      },
      {
        title: "SEO técnico desde el primer día",
        paragraphs: [
          "Una web a medida no posiciona sola, pero sí puede nacer sin los errores que frenan a la mayoría: títulos y descripciones únicos por página, datos estructurados de schema.org, sitemap, URLs limpias, imágenes optimizadas y accesibilidad revisada.",
          "Lo que no depende de nosotros también cuenta, y te lo decimos claro: contenido propio, reseñas y una ficha de Google Business cuidada pesan tanto como el código. Te explicamos cómo trabajarlo para que la web y la ficha se refuercen.",
        ],
      },
    ],
    processTitle: "Cómo trabajamos una web",
    process: [
      {
        title: "1. Qué tiene que hacer",
        text: "Antes de hablar de diseño, definimos el trabajo de la web — vender, captar contactos, reservar, informar — y cómo sabrás si lo cumple.",
      },
      {
        title: "2. Arquitectura y prototipo",
        text: "Mapa de páginas y prototipo navegable. Lo que apruebas aquí es lo que se construye.",
      },
      {
        title: "3. Desarrollo e integraciones",
        text: "Construcción con entregas en un entorno de pruebas, pasarela de pago y conexión con tu software si hace falta.",
      },
      {
        title: "4. Publicación y medición",
        text: "Cambio de dominio sin cortes, redirecciones desde la web antigua y analítica configurada con consentimiento.",
      },
    ],
    proof: {
      text: "Dos reseñas de Google que resumen lo que más nos importa en un proyecto web: que funcione bien y que sigamos ahí después de publicarlo.",
      testimonials: ["carla-hermida", "ratsquad"],
    },
    faqs: [
      {
        q: "¿Cuánto cuesta una página web a medida en Vigo?",
        a: "Depende sobre todo de cuatro cosas: cuántos tipos de página distintos hay que diseñar, si la web vende o reserva (pasarela, usuarios, perfiles), si se conecta con otro software y quién escribe los contenidos. Una web de presentación y una plataforma de venta de entradas no se presupuestan igual. Tras una primera conversación te enviamos una propuesta cerrada con el alcance detallado.",
      },
      {
        q: "¿Podré cambiar yo los textos y las fotos?",
        a: "Sí, en las partes donde tiene sentido. Preparamos un editor para lo que cambias a menudo (carta, eventos, noticias, precios) y dejamos fijo lo que sostiene el diseño, para que la web no se desmonte con el uso.",
      },
      {
        q: "¿Se pueden cobrar cuotas o vender entradas desde la web?",
        a: "Sí. En Musa se venden entradas con perfil de cliente y en PBB se cobran cuota y matrícula desde la web. Integramos la pasarela y los perfiles para que cada cliente vea lo que ha pagado.",
      },
      {
        q: "¿Qué pasa con mi web actual y su posicionamiento?",
        a: "Antes de publicar la nueva, inventariamos las URLs que ya reciben visitas y configuramos redirecciones 301 hacia sus equivalentes. Así Google traslada lo ganado en lugar de empezar de cero.",
      },
      {
        q: "¿Trabajáis solo con empresas de Vigo?",
        a: "No, pero es donde más trabajamos. De Vigo a O Porriño o Redondela, donde tenemos clientes, podemos vernos en persona sin complicaciones; con el resto de Galicia y España trabajamos en remoto con el mismo método.",
      },
    ],
    cta: {
      title: "¿Qué debería hacer tu web por ti?",
      text: "Explícanos qué tarea te gustaría quitarte de encima — llamadas, papeleo, taquilla — y te proponemos cómo resolverla con una web a medida.",
    },
    leadNeed: "web",
    leadNeeds: LEAD_NEEDS_WEB,
    related: [
      { slug: "diseno-web-vigo", label: "Diseño web con identidad propia en Vigo" },
      { slug: "tienda-online-vigo", label: "Tiendas online y ecommerce en Vigo" },
      { slug: "desarrollo-web-redondela", label: "Páginas web para negocios de Redondela" },
      { slug: "desarrollo-web-pontevedra", label: "Diseño web en Pontevedra" },
    ],
    hubSummary:
      "Webs corporativas y aplicaciones web con Next.js que venden, reservan o cobran. Casos: Musa (Vigo) y PBB (O Porriño).",
  },

  // ───────────────────────────────────────────────────────────────────
  {
    slug: "diseno-web-vigo",
    group: "servicio",
    serviceName: "Diseño web en Vigo",
    serviceType: "Diseño web",
    areaServed: [
      { name: "Vigo", type: "City" },
      { name: "Provincia de Pontevedra", type: "AdministrativeArea" },
      { name: "Galicia", type: "AdministrativeArea" },
    ],
    title: "Diseño de Páginas Web en Vigo | Webs con Identidad Propia",
    metaDescription:
      "Diseño de páginas web en Vigo con dirección de arte, motion y 3D: webs que no parecen plantillas. Casos: Samoa Café y Almudena Muhle. Estudio en Vigo.",
    h1: "Diseño de páginas web en Vigo",
    intro: [
      "El diseño de una web decide en pocos segundos si alguien se queda o vuelve a Google. En Action diseñamos páginas web con identidad propia — tipografía, ritmo, movimiento y, cuando el proyecto lo pide, 3D — para marcas de Vigo que no quieren parecerse a la plantilla de su competencia.",
      "Somos un estudio de Vigo donde diseño y programación los hace el mismo equipo. Eso cambia el resultado más de lo que parece: lo que se aprueba en el prototipo es lo que se publica, y los detalles de animación no se pierden en el traspaso a un desarrollador que no estuvo en las reuniones.",
    ],
    localContext: {
      title: "Diseñar para marcas con carácter",
      paragraphs: [
        "Vigo es una ciudad de marcas con personalidad: hostelería que cambia de ambiente del día a la noche, moda, interiorismo, industria que exporta y comercio que se defiende de las grandes cadenas. Lo que tienen en común es que su producto se ve y se toca, y una web genérica lo aplana.",
        "Nuestro trabajo consiste en trasladar ese carácter a la pantalla sin sacrificar lo práctico. Una carta que cambia sola entre la versión de día y la de noche, como la de Samoa Café, en Redondela. Un lookbook de pasarela a pantalla completa, como el de la diseñadora viguesa Patricia Avendaño. Proyectos de interiorismo contados como historias, como en la web del estudio mallorquín de Almudena Muhle. El diseño tiene que servir al negocio, no al porfolio del estudio.",
        "Y lo hacemos con los pies en el suelo: un diseño que tarda en cargar en el móvil de alguien que está en la calle buscando dónde cenar no es un buen diseño, por bonito que sea en una pantalla grande.",
      ],
    },
    offersTitle: "Cómo trabajamos el diseño",
    offers: [
      {
        title: "Dirección de arte digital",
        text: "Tipografía, color, retícula y tono para tu web, coherentes con tu marca o creados desde cero si aún no existe. En Samoa Café partimos del naming y el logo.",
      },
      {
        title: "Interfaz y experiencia de uso",
        text: "Arquitectura de contenidos y recorridos pensados para que el visitante llegue a la acción que te importa: reservar, pedir presupuesto, comprar.",
      },
      {
        title: "Motion design",
        text: "Animaciones con GSAP o Framer Motion que guían la lectura y dan ritmo, respetando a quien tiene activada la reducción de movimiento en su dispositivo.",
      },
      {
        title: "Experiencias 3D",
        text: "Escenas interactivas con Three.js cuando aportan algo. Esta misma web, con su puerto de Vigo jugable, es el ejemplo más a mano.",
      },
      {
        title: "Rediseño",
        text: "Auditamos tu web actual, conservamos lo que funciona y rediseñamos lo que te frena, sin empezar de cero si no hace falta.",
      },
    ],
    casesTitle: "Diseños que puedes visitar",
    cases: [
      {
        slug: "samoa",
        note: "Identidad de marca completa desde cero — naming, logo y carta — y una web con carta editable que cambia sola entre día y noche. Hostelería en Redondela.",
      },
      {
        slug: "almudena-muhle",
        note: "Estudio de interiorismo. Cada proyecto se presenta como una historia inmersiva con vídeo y motion, pensada para un cliente de mayor poder adquisitivo.",
      },
      {
        slug: "patricia-avendano",
        note: "Diseñadora de moda nupcial con más de 100 tiendas en España. Web bilingüe con lookbook interactivo, vídeos de pasarela a pantalla completa y sección de prensa.",
      },
      {
        slug: "cerveceria-equs",
        note: "Landing de presentación para una cervecería que transmite el carácter artesanal de su producto y deja claros el contacto y la ubicación.",
      },
    ],
    sections: [
      {
        title: "Qué diferencia un diseño a medida de una plantilla",
        paragraphs: [
          "Una plantilla resuelve el caso medio: cabecera con foto, tres columnas de servicios, formulario al final. Funciona, pero no dice nada de ti. Un diseño a medida parte de preguntas concretas: qué tiene que sentir el visitante, qué necesita ver para confiar y cuál es el siguiente paso que queremos que dé.",
          "La diferencia se nota en detalles que no salen en una captura: la jerarquía tipográfica que hace que un texto largo se lea, el orden en que aparece la información en el móvil, la forma en que un botón responde al pulsarlo. Son decisiones pequeñas que, sumadas, hacen que una web se sienta cuidada.",
        ],
      },
      {
        title: "Diseño que también se mide",
        paragraphs: [
          "Un diseño premium no está reñido con la accesibilidad ni con la velocidad. Revisamos el contraste de color, el tamaño de los elementos pulsables, la navegación con teclado y los textos alternativos, y medimos el rendimiento con Lighthouse antes de publicar.",
          "Cuando el diseño incluye 3D o vídeo, lo cargamos de forma diferida para que no retrase lo importante: que el texto y la llamada a la acción aparezcan cuanto antes.",
        ],
      },
    ],
    processTitle: "Del concepto a la web publicada",
    process: [
      {
        title: "1. Descubrimiento",
        text: "Tu marca, tu cliente y tu competencia. Recopilamos referencias y definimos qué debe transmitir la web.",
      },
      {
        title: "2. Dirección de arte",
        text: "Propuesta visual con tipografía, color y piezas clave antes de maquetar todas las páginas.",
      },
      {
        title: "3. Prototipo",
        text: "Diseño completo navegable, en móvil y escritorio, con las animaciones principales definidas.",
      },
      {
        title: "4. Construcción",
        text: "El mismo equipo lo programa, así que el prototipo aprobado es lo que se publica.",
      },
    ],
    proof: {
      text: "Lo que más valoran quienes nos han confiado el diseño de su web, en sus propias palabras en Google:",
      testimonials: ["almudena-muhle", "ivan-matas"],
    },
    faqs: [
      {
        q: "¿Cómo elijo una empresa de diseño web en Vigo?",
        a: "Mira webs suyas publicadas y ábrelas en tu móvil, pregunta quién diseña y quién programa, y pide un presupuesto cerrado que diga qué incluye. En Action diseño y programación los hace el mismo equipo, en Vigo.",
      },
      {
        q: "¿Hacéis también el logo y la identidad de marca?",
        a: "Sí, cuando hace falta. En Samoa Café partimos de cero: naming, logo, diseño de carta y web. Si ya tienes identidad, la respetamos y la adaptamos al medio digital.",
      },
      {
        q: "¿Qué necesito aportar para empezar el diseño?",
        a: "Lo que tengas: logo, fotos, textos, webs que te gustan y webs que no. Si no tienes fotografía de calidad te lo diremos pronto, porque es de lo que más pesa en el resultado final.",
      },
      {
        q: "¿Podéis hacer una web con 3D como la vuestra?",
        a: "Sí. Las escenas 3D con Three.js son una de nuestras especialidades — la portada de esta web es un puerto de Vigo jugable hecho así —. Te diremos con franqueza si en tu caso aporta o si distrae de lo que quieres vender.",
      },
      {
        q: "¿El diseño se adapta al móvil?",
        a: "Diseñamos móvil y escritorio a la vez, no uno encogido del otro: en el móvil cambian el orden de lectura, el tamaño de los elementos pulsables y lo que merece aparecer primero.",
      },
      {
        q: "¿De qué depende el precio del diseño de una web?",
        a: "Del número de tipos de página distintos, de si hay que crear la identidad de marca, de la cantidad de animación o 3D y de si la fotografía y los textos ya existen. Con tu marca y tus objetivos delante te preparamos un presupuesto cerrado.",
      },
    ],
    cta: {
      title: "¿Quieres una web que se reconozca a primera vista?",
      text: "Enséñanos tu marca — o cuéntanos la que quieres construir — y te proponemos una dirección de arte.",
    },
    leadNeed: "web",
    leadNeeds: LEAD_NEEDS_WEB,
    related: [
      { slug: "desarrollo-web-vigo", label: "Desarrollo web con Next.js en Vigo" },
      { slug: "tienda-online-vigo", label: "Diseño de tiendas online en Vigo" },
      { slug: "desarrollo-web-pontevedra", label: "Diseño y desarrollo web en la provincia" },
    ],
    hubSummary:
      "Dirección de arte, motion y 3D para marcas que no quieren una plantilla. Casos: Samoa Café, Almudena Muhle y Patricia Avendaño.",
  },

  // ───────────────────────────────────────────────────────────────────
  {
    slug: "tienda-online-vigo",
    group: "servicio",
    serviceName: "Tiendas online en Vigo",
    serviceType: "Desarrollo de tiendas online",
    areaServed: [
      { name: "Vigo", type: "City" },
      { name: "Provincia de Pontevedra", type: "AdministrativeArea" },
      { name: "Galicia", type: "AdministrativeArea" },
    ],
    title: "Diseño de Tiendas Online en Vigo | Shopify y Ecommerce",
    metaDescription:
      "Creamos tiendas online en Vigo: Shopify o ecommerce a medida, pagos y catálogo cuidado. Casos reales: Canelita, en Redondela, Cliché y Koopey.",
    h1: "Diseño de tiendas online en Vigo",
    intro: [
      "Una tienda online no es una web con un carrito: es un canal de venta que tiene que cargar rápido en el móvil, cobrar sin fricción y encajar con el resto de tu negocio — stock, pedidos, envíos. Diseñamos y desarrollamos tiendas online para marcas y comercios de Vigo y su área que quieren vender más allá de su escaparate.",
      "Trabajamos con Shopify y con desarrollo propio, y te decimos cuál te conviene con tu catálogo delante. Hemos montado tiendas Shopify para Canelita, Cliché, Nabi Cosmética o Cachadas, y una tienda a medida con capa en tiempo real para Koopey.",
    ],
    localContext: {
      title: "Vender online desde Vigo",
      paragraphs: [
        "El comercio de Vigo compite en dos frentes: contra los centros comerciales y las grandes cadenas en la calle, y contra los marketplaces en internet. Una tienda online propia es la forma de que tu cliente de Vigo te compre también un domingo por la noche, y de que alguien de Ourense, Madrid o Lisboa descubra tu marca sin pasar por tu local.",
        "Galicia tiene además tradición de marcas que nacen pequeñas y venden lejos: moda, cosmética, producto gourmet, conservas. Y Vigo es un nodo logístico de primer orden, con puerto y autovías hacia Portugal y la meseta, así que enviar desde aquí no es una desventaja.",
        "Lo que suele fallar no es la tecnología sino la operativa: fichas de producto sin cuidar, gastos de envío que aparecen al final y asustan, stock que no cuadra con la tienda física. Diseñamos la tienda pensando en esos puntos antes que en los efectos.",
      ],
    },
    offersTitle: "Qué incluye una tienda online con nosotros",
    offers: [
      {
        title: "Shopify bien hecho",
        text: "Tema a medida sobre Shopify cuando el catálogo y la venta son estándar: sales antes, con una plataforma que tu equipo aprende en una tarde.",
      },
      {
        title: "Ecommerce a medida",
        text: "React y Node.js cuando necesitas algo que la plataforma no permite: reglas de precio propias, experiencias en tiempo real o un flujo de compra poco habitual, como en Koopey.",
      },
      {
        title: "Venta de productos digitales",
        text: "Entrega automática tras el pago — licencias, accesos, descargas — sin que nadie tenga que enviar nada a mano, como en Licentia.",
      },
      {
        title: "Pagos y checkout",
        text: "Pasarela de pago integrada y un proceso de compra corto, pensado para el móvil. En Fang Tours cobramos con Stripe; si tu banco te ofrece su propia pasarela, valoramos cuál te conviene.",
      },
      {
        title: "Catálogo que vende",
        text: "Fotos, textos y datos estructurados de producto para que el cliente entienda qué compra y Google entienda qué vendes.",
      },
    ],
    casesTitle: "Tiendas que ya venden",
    cases: [
      {
        slug: "canelita",
        note: "Comercio de Redondela. Tienda Shopify construida alrededor de su identidad, con catálogo y checkout optimizados, que le dio un canal de venta propio más allá del mostrador.",
      },
      {
        slug: "koopey",
        note: "Marca de moda que se hizo viral a nivel nacional en su lanzamiento, con cobertura en Modaes y El Español. Tienda a medida con React, Node.js y WebSocket.",
      },
      {
        slug: "cliche",
        note: "Tienda Shopify a medida con un checkout rápido y un catálogo preparado para crecer con la marca.",
      },
      {
        slug: "licentia",
        note: "Marketplace de licencias de software con entrega automática tras la compra: cero gestión manual por pedido.",
      },
    ],
    sections: [
      {
        title: "Shopify o tienda a medida: cómo lo decidimos",
        paragraphs: [
          "Shopify gana cuando vendes productos físicos con variantes normales (talla, color), precios fijos y envíos estándar. Pagas una cuota mensual a la plataforma, pero a cambio no mantienes servidores y tienes un ecosistema enorme de aplicaciones.",
          "El desarrollo a medida gana cuando el modelo de venta no encaja en ese molde: precios por cliente o por volumen, productos configurables, venta de accesos digitales, lanzamientos con mucha gente comprando a la vez o una experiencia de marca que la plantilla limita. Cuesta más al principio y, a cambio, no dependes de lo que la plataforma permita.",
          "Existe un punto intermedio: Shopify como motor de pedidos y pagos con un frontal propio encima. Lo valoramos cuando la marca pide más de lo que un tema permite, pero la operativa es estándar.",
        ],
      },
      {
        title: "De qué depende el precio de una tienda online",
        paragraphs: [
          "Las variables que más pesan son la plataforma (Shopify o desarrollo propio), el número de productos y variantes, si hay que migrar un catálogo existente, las integraciones con tu programa de gestión o tu operador logístico y cuánto diseño a medida necesita la marca.",
          "Ten en cuenta también los costes recurrentes, que no son nuestros pero existen: la cuota de Shopify y sus aplicaciones, las comisiones de la pasarela de pago y el alojamiento si la tienda es propia. Te los ponemos por escrito en la propuesta para que compares con datos.",
        ],
      },
    ],
    processTitle: "Cómo abrimos una tienda",
    process: [
      {
        title: "1. Catálogo y operativa",
        text: "Qué vendes, cómo lo envías y cómo gestionas el stock hoy. De ahí sale la plataforma recomendada.",
      },
      {
        title: "2. Diseño de tienda",
        text: "Home, categoría, ficha de producto y proceso de compra, prototipados y validados en el móvil.",
      },
      {
        title: "3. Montaje y carga",
        text: "Desarrollo, pasarela de pago, envíos, impuestos y carga o migración del catálogo.",
      },
      {
        title: "4. Pedidos reales",
        text: "Pruebas de compra de punta a punta antes de abrir y acompañamiento en las primeras semanas de venta.",
      },
    ],
    proof: {
      text: "La tienda es solo la mitad; la otra mitad es cómo te acompañan mientras la montas. Así lo cuentan dos clientes en Google:",
      testimonials: ["nabi-nabi", "katherine-tovar"],
    },
    faqs: [
      {
        q: "¿Cuánto cuesta una tienda online?",
        a: "Depende sobre todo del tamaño del catálogo, de si se conecta con tu programa de gestión, de los métodos de pago y de quién prepara fotos y fichas. Una tienda Shopify bien montada y un ecommerce a medida no se presupuestan igual: tras una primera conversación te enviamos una propuesta cerrada.",
      },
      {
        q: "¿Qué retrasa más la apertura de una tienda online?",
        a: "Casi nunca la parte técnica: el contenido. Fotos, descripciones, precios y variantes de cada producto. Planificamos la tienda por fases con fechas en la propuesta y trabajamos el catálogo en paralelo desde el primer día.",
      },
      {
        q: "¿Puedo vender en la tienda física y online con el mismo stock?",
        a: "Sí. Shopify tiene punto de venta propio que comparte inventario con la tienda online, y si usas otro programa de gestión estudiamos cómo sincronizarlo para no vender lo que no tienes.",
      },
      {
        q: "Ya vendo por Instagram. ¿Para qué quiero una tienda?",
        a: "Porque en redes el cliente pregunta por mensaje, espera respuesta y a menudo se enfría. Una tienda propia cobra sola a cualquier hora y te deja los datos de tus clientes. Koopey dio ese paso para no depender solo de las redes sociales.",
      },
      {
        q: "¿Podéis migrar mi tienda actual sin perder posicionamiento?",
        a: "Sí. Migramos productos, clientes y pedidos, y redirigimos cada URL antigua de producto y categoría a la nueva para que Google no pierda el rastro.",
      },
      {
        q: "¿Me enseñáis a gestionar la tienda?",
        a: "Sí. Al entregarla te enseñamos a dar de alta productos, gestionar pedidos y devoluciones y consultar las ventas, que es lo que tu equipo hará cada día.",
      },
    ],
    cta: {
      title: "¿Qué quieres vender online?",
      text: "Cuéntanos tu catálogo y cómo vendes hoy, y te diremos si te conviene Shopify o una tienda a medida, con los costes de cada opción por escrito.",
    },
    leadNeed: "web",
    leadNeeds: LEAD_NEEDS_WEB,
    related: [
      { slug: "desarrollo-web-redondela", label: "Webs y tiendas para el comercio de Redondela" },
      { slug: "diseno-web-vigo", label: "Diseño de marca y web en Vigo" },
      { slug: "software-a-medida-vigo", label: "Integraciones y software a medida en Vigo" },
    ],
    hubSummary:
      "Shopify o ecommerce a medida, con pagos y catálogo cuidado. Casos: Canelita (Redondela), Cliché, Koopey y Licentia.",
  },

  // ───────────────────────────────────────────────────────────────────
  {
    slug: "software-a-medida-vigo",
    group: "servicio",
    serviceName: "Software a medida en Vigo",
    serviceType: "Desarrollo de software a medida",
    areaServed: [
      { name: "Vigo", type: "City" },
      { name: "Provincia de Pontevedra", type: "AdministrativeArea" },
      { name: "Galicia", type: "AdministrativeArea" },
    ],
    title: "Empresa de Software a Medida en Vigo | ERP e Integraciones",
    metaDescription:
      "Empresa de desarrollo de software a medida en Vigo: ERP, control horario, paneles internos e integraciones para pymes gallegas. Caso: Autoescuela GTI.",
    h1: "Software a medida en Vigo",
    intro: [
      "Desarrollamos software a medida para empresas de Vigo y de Galicia: ERPs, paneles de gestión internos, control horario, portales para clientes y proveedores e integraciones entre los programas que ya usas. Programación a medida para procesos que ningún software estándar resuelve bien.",
      "Somos una empresa de desarrollo de software con oficina en la Rúa Colón de Vigo. No vendemos licencias ni adaptamos un producto enlatado: escribimos el software alrededor de cómo trabaja tu empresa y después lo mantenemos.",
    ],
    localContext: {
      title: "El software que necesita el tejido de Vigo",
      paragraphs: [
        "El área de Vigo concentra una parte enorme de la industria gallega: la automoción alrededor de la planta de Stellantis en Balaídos y sus proveedores, la transformación del mar y las conserveras, los astilleros, el granito de O Porriño y una red logística que gira en torno al puerto y a los polígonos de la Zona Franca. Son empresas con procesos muy específicos y, a menudo, con sistemas que no se hablan entre sí.",
        "El patrón se repite: un ERP de mercado que cubre la contabilidad y la facturación y, alrededor, un mar de hojas de Excel, partes en papel y correos para todo lo demás — turnos, fichajes, incidencias, trazabilidad, pedidos de clientes profesionales. El software a medida no sustituye necesariamente a ese ERP; muchas veces lo rodea y lo alimenta.",
        "También trabajamos con empresas de servicios — formación, náutica, clubes — que han crecido hasta el punto de que la gestión les come el día. Autoescuela GTI es un buen ejemplo: necesitaba un ERP propio porque ningún programa genérico entendía cómo se organizan sus prácticas, sus exámenes y su flota.",
      ],
    },
    offersTitle: "Qué software desarrollamos",
    offers: [
      {
        title: "ERP y software de gestión",
        text: "Módulos a medida para lo que tu negocio hace distinto: matrículas, flota, producción, pedidos, turnos. Con roles y permisos para cada perfil de la empresa.",
      },
      {
        title: "Control horario y partes de trabajo",
        text: "Fichaje digital y registro de jornada con un panel en tiempo real para dirección, en lugar de hojas en papel. Es el caso de Timetracker.",
      },
      {
        title: "Paneles internos y portales",
        text: "Paneles de administración, cuadros de mando y portales para clientes o proveedores con acceso por usuario.",
      },
      {
        title: "Integración con tu ERP y otros sistemas",
        text: "Conectamos tu web, tu tienda o tu app con el software que ya tienes para que los datos viajen solos. En Nautirent, la web lee la disponibilidad de la flota del programa interno.",
      },
      {
        title: "Automatización de procesos",
        text: "Tareas repetitivas que hoy hace una persona — enviar una licencia tras un pago, avisar a un cliente, generar un informe — convertidas en procesos automáticos, como en Licentia.",
      },
    ],
    casesTitle: "Software a medida en producción",
    cases: [
      {
        slug: "autoescuela-gti",
        note: "ERP para secretaría con registro de prácticas y exámenes por parte del profesorado, gestión de la flota de coches y app móvil para alumnos. Multiplicó por 10 los trámites resueltos sin pasar por secretaría.",
      },
      {
        slug: "timetracker",
        note: "Software a medida para una pyme industrial: fichaje y control horario digital, con panel de gestión en tiempo real y adiós al registro en papel. Hecho con React y Node.js.",
      },
      {
        slug: "nautirent",
        note: "Integración entre la web de reservas y el software interno de gestión de la flota, con disponibilidad de las embarcaciones en tiempo real.",
      },
      {
        slug: "pro-lift-formacion",
        note: "Aplicación de escritorio para vender cursos propios, con bloqueo de grabación de pantalla y capturas y acceso solo para quien ha pagado.",
      },
    ],
    sections: [
      {
        title: "Software a medida o software estándar",
        paragraphs: [
          "La pregunta honesta no es cuál es mejor, sino qué parte de tu negocio es diferente. Para contabilidad, nóminas o facturación hay programas estándar excelentes y sería absurdo reinventarlos. El software a medida compensa en la parte que te distingue o que ningún producto resuelve bien: tu forma de planificar, de producir, de atender o de medir.",
          "Por eso muchas soluciones a medida conviven con un ERP de mercado: cubren el hueco y se integran con él, en lugar de sustituirlo todo de golpe. Es más barato, más rápido de poner en marcha y menos arriesgado.",
        ],
      },
      {
        title: "Cómo evitamos los proyectos que no se acaban nunca",
        paragraphs: [
          "El riesgo clásico del software a medida es el proyecto eterno: el alcance crece, las fechas se mueven y nadie sabe qué queda. Lo evitamos dividiendo el sistema en módulos que entran en uso por separado. El primero resuelve el problema que más duele y se usa de verdad; los siguientes se diseñan con lo aprendido.",
          "Además, trabajamos con los usuarios reales, no solo con dirección. Quien ficha, quien rellena el parte o quien atiende el mostrador es quien decide si una herramienta se adopta o se abandona, así que prueban el sistema desde las primeras entregas.",
          "Y dejamos por escrito el modelo de datos, las integraciones y las decisiones técnicas importantes, para que el sistema no dependa de la memoria de nadie.",
        ],
      },
    ],
    processTitle: "Cómo desarrollamos software a medida",
    process: [
      {
        title: "1. Mapa del proceso",
        text: "Hablamos con quienes hacen el trabajo y dibujamos el proceso actual, con sus atajos y sus Excel.",
      },
      {
        title: "2. Alcance por módulos",
        text: "Priorizamos qué se construye primero y te damos una propuesta cerrada por módulo.",
      },
      {
        title: "3. Desarrollo con usuarios",
        text: "Entregas periódicas en un entorno de pruebas que usan las personas que luego trabajarán con el sistema.",
      },
      {
        title: "4. Puesta en marcha",
        text: "Migración de datos, formación del equipo, arranque acompañado y mantenimiento evolutivo.",
      },
    ],
    proof: {
      text: "Las integraciones y el software interno no se ven desde fuera, pero se notan en el día a día. Esto dicen en Google dos clientes, uno de ellos de Nautirent:",
      testimonials: ["samuel-flores", "julio-walker"],
    },
    faqs: [
      {
        q: "¿Qué diferencia hay entre software a medida y programación a medida?",
        a: "En la práctica, ninguna: los dos términos describen software escrito específicamente para tu empresa, en lugar de un producto genérico al que te adaptas tú. También es programación a medida una integración o una automatización, aunque no tenga pantallas.",
      },
      {
        q: "¿Podéis conectar mi ERP actual con la web o con una app?",
        a: "Normalmente sí. Depende de cómo exponga los datos tu ERP: una API, una base de datos accesible o exportaciones periódicas. Lo revisamos al principio y te decimos qué es viable antes de comprometer nada.",
      },
      {
        q: "¿Qué pasa con los datos que ya tengo en Excel u otro programa?",
        a: "Los migramos. Parte del trabajo es limpiar y ordenar esos datos antes de cargarlos, porque un sistema nuevo con datos viejos desordenados arrastra los mismos problemas.",
      },
      {
        q: "¿El software funciona también en el móvil?",
        a: "Sí. Las pantallas de uso diario — fichar, registrar una práctica, consultar un pedido — se diseñan para el móvil, y si hace falta una app en las tiendas la desarrollamos también, como la app de alumnos de Autoescuela GTI.",
      },
      {
        q: "¿Quién mantiene el software cuando esté terminado?",
        a: "Nosotros, si quieres. El software a medida necesita mantenimiento: actualizaciones de seguridad, cambios normativos y mejoras que salen del uso. Lo planteamos en la propuesta para que no sea una sorpresa.",
      },
      {
        q: "¿Cuánto cuesta un software a medida?",
        a: "No damos una cifra cerrada sin conocer el proceso. Lo presupuestamos por módulos: tras entenderlo, estimamos cada módulo por separado con lo que incluye y lo que no, para que decidas por dónde empezar y cuánto invertir en cada fase.",
      },
      {
        q: "¿Hay ayudas para digitalizar una pyme en Galicia?",
        a: "Sí. La línea específica del IGAPE es la IG300C, de ayudas a la transformación digital de las pymes: su convocatoria de 2026 (DOG n.º 107, de 10 de junio de 2026) incluía, entre otros, proyectos de digitalización y automatización de procesos y sistemas de gestión integral. El plazo de solicitud de 2026 ya cerró; conviene tener el proyecto definido antes de que se publique la siguiente.",
      },
    ],
    cta: {
      title: "¿Qué proceso de tu empresa sigue en Excel?",
      text: "Cuéntanoslo. Te diremos si tiene sentido un software a medida, una integración o simplemente un programa estándar bien configurado.",
    },
    leadNeed: "software",
    leadNeeds: LEAD_NEEDS_CAMPAIGN,
    related: [
      { slug: "desarrollo-de-aplicaciones-vigo", label: "Apps móviles para empresas de Vigo" },
      { slug: "tienda-online-vigo", label: "Tiendas online conectadas a tu gestión" },
      {
        slug: "desarrollo-de-aplicaciones-galicia",
        label: "Desarrollo de producto digital en Galicia",
      },
    ],
    hubSummary:
      "ERP, control horario, paneles internos e integraciones para pymes. Casos: Autoescuela GTI, Timetracker y Nautirent.",
  },

  // ───────────────────────────────────────────────────────────────────
  {
    slug: "desarrollo-de-aplicaciones-pontevedra",
    group: "zona",
    serviceName: "Desarrollo de aplicaciones en Pontevedra",
    serviceType: "Desarrollo de aplicaciones móviles",
    areaServed: [
      { name: "Pontevedra", type: "City" },
      { name: "Provincia de Pontevedra", type: "AdministrativeArea" },
      { name: "Rías Baixas", type: "Place" },
    ],
    title: "Desarrollo de Aplicaciones en Pontevedra | Apps a Medida",
    metaDescription:
      "Apps móviles y web para empresas de Pontevedra y las Rías Baixas: reservas, socios, turismo y gestión interna. Equipo en Vigo, a media hora de la capital.",
    h1: "Desarrollo de aplicaciones en Pontevedra",
    intro: [
      "Desarrollamos aplicaciones móviles y web para empresas de la provincia de Pontevedra: la capital, Marín, Sanxenxo, O Grove, Cambados, Vilagarcía de Arousa, O Porriño, Ponteareas, Lalín o cualquier punto de las Rías Baixas.",
      "Nuestra oficina está en Vigo, a una media hora de Pontevedra capital, y la sociedad que hay detrás de Action, Alcasi Systems, S.L., tiene su domicilio social en Marín. Somos de aquí, y eso se nota en algo práctico: podemos sentarnos contigo cuando el proyecto lo pide sin que el desplazamiento sea una partida del presupuesto.",
    ],
    localContext: {
      title: "Qué apps necesita la provincia",
      paragraphs: [
        "La economía de la provincia de Pontevedra tiene dos ritmos. El de la costa, marcado por el turismo de las Rías Baixas, el mar y la hostelería, donde la temporada alta concentra buena parte del año en pocos meses. Y el de la capital y el interior, con industria, servicios, comercio y un peso importante de la administración: Pontevedra es capital provincial y sede de la Diputación.",
        "Cada ritmo pide apps distintas. En la costa, reservas y disponibilidad en tiempo real para quien alquila embarcaciones, organiza excursiones o gestiona alojamientos, porque en agosto nadie tiene tiempo de contestar el teléfono. En la capital y el interior, herramientas de gestión: socios de un club, alumnos de una academia, citas de una clínica, partes de trabajo de una empresa de servicios.",
        "Tenemos casos reales en los dos lados: un club deportivo de O Porriño que gestiona inscripciones y pagos de las familias desde su plataforma, y proyectos de náutica y turismo con reservas conectadas a la disponibilidad real.",
      ],
    },
    offersTitle: "Apps para empresas de la provincia",
    offers: [
      {
        title: "Reservas y disponibilidad",
        text: "Para náutica, turismo y hostelería: calendario, pago anticipado y disponibilidad que se actualiza sola, sin comisiones de intermediarios.",
      },
      {
        title: "Gestión de socios y cuotas",
        text: "Clubes, asociaciones y academias: altas, cuotas, perfiles familiares y comunicación con los socios desde el móvil.",
      },
      {
        title: "Herramientas internas",
        text: "Apps para el equipo — partes, fichajes, inventario — conectadas al panel de la oficina y, si existe, a tu ERP.",
      },
      {
        title: "Asistentes con IA",
        text: "Cuando tiene sentido, integramos un asistente de IA que responde dudas frecuentes dentro de la propia app, como en la plataforma de Kairos Futures.",
      },
    ],
    casesTitle: "Casos con los que se puede comparar",
    cases: [
      {
        slug: "pbb-porrino",
        note: "Club de baloncesto base de O Porriño. Cuentas diferenciadas para padres y deportistas, gestión de los hijos desde el perfil familiar e inscripción con pago online.",
      },
      {
        slug: "nautirent",
        note: "Náutica: reservas de embarcaciones desde la web con la disponibilidad real de la flota, sin llamadas ni intermediarios.",
      },
      {
        slug: "fang-tours",
        note: "Turismo: calendario de disponibilidad, pago online y panel propio para gestionar las excursiones en tiempo real.",
      },
      {
        slug: "kairos-futures",
        note: "Plataforma de cursos con asistente de IA integrado para resolver las dudas de los alumnos sin saturar al equipo.",
      },
    ],
    sections: [
      {
        title: "Apps para negocios de temporada",
        paragraphs: [
          "Un negocio que factura en tres meses lo que otros en doce no puede permitirse que su sistema de reservas falle en julio. Por eso en proyectos de turismo y náutica diseñamos primero para el pico: qué pasa cuando llegan muchas reservas a la vez, cómo se evita la doble reserva y qué ve el cliente si algo no está disponible.",
          "Y pensamos también en el resto del año: una app que en invierno sirve para fidelizar, vender bonos o comunicar novedades justifica mejor su coste que una que solo se abre en agosto.",
        ],
      },
      {
        title: "Antes de encargar una app, tres preguntas",
        paragraphs: [
          "¿Quién la va a usar y cuántas veces? Una app que tu cliente abre una vez al año quizá deba ser una web. ¿Qué proceso sustituye? Si no reemplaza nada que hoy se haga a mano, es difícil que se use. ¿Quién la mantendrá viva? Una app sin contenidos ni actualizaciones se abandona en meses.",
          "Si tienes respuesta para las tres, hablemos. Si no, la primera reunión sirve precisamente para encontrarlas.",
        ],
      },
    ],
    processTitle: "Cómo trabajamos con la provincia",
    process: [
      {
        title: "1. Primera reunión",
        text: "Por videollamada o en persona, en Vigo o en tus instalaciones, para entender el negocio.",
      },
      {
        title: "2. Alcance y propuesta",
        text: "Definimos la primera versión, los usuarios y las integraciones, y te enviamos una propuesta cerrada.",
      },
      {
        title: "3. Desarrollo con demos",
        text: "Avances visibles en tu propio móvil y reuniones de seguimiento periódicas, la mayoría en remoto.",
      },
      {
        title: "4. Lanzamiento",
        text: "Publicación en tiendas o en la web, acompañamiento en los primeros usos reales y mantenimiento.",
      },
    ],
    proof: {
      text: "Dos reseñas de Google que hablan de lo que más preocupa al encargar una app: los plazos y el trato.",
      testimonials: ["pablo-r", "odiseo"],
    },
    faqs: [
      {
        q: "¿Os desplazáis a Pontevedra, Sanxenxo o Vilagarcía?",
        a: "Sí, para las reuniones que lo merecen: el arranque del proyecto, la validación del prototipo y la entrega. El resto avanza en remoto, con demos y versiones de prueba, para que no pagues desplazamientos innecesarios.",
      },
      {
        q: "¿Hacéis apps para clubes deportivos y asociaciones?",
        a: "Sí. Para PBB, el club de baloncesto base de O Porriño, la inscripción y el pago de la cuota y la matrícula se hacen desde la web, con cuentas separadas para familias y deportistas, y los padres gestionan las cuentas de sus hijos desde su propio perfil.",
      },
      {
        q: "Tengo un negocio de temporada. ¿Me compensa una app?",
        a: "Depende de cuánto trabajo te quite en temporada alta. Si hoy pierdes reservas por no contestar a tiempo o haces a mano lo que podría hacerse solo, suele compensar. Si tu cliente te encuentra una vez y no vuelve, quizá te baste una web con reservas; te lo diremos.",
      },
      {
        q: "¿La app puede estar en gallego y en otros idiomas?",
        a: "Sí. Podemos preparar la app en gallego, castellano, inglés o portugués — pensando en el visitante del norte de Portugal — desde el diseño, que es cuando menos cuesta.",
      },
      {
        q: "¿Podéis contratar con organismos públicos?",
        a: "Sí. Action es la marca comercial de Alcasi Systems, S.L. (CIF B72910664), inscrita en el Registro Mercantil de Pontevedra, y nuestras condiciones de contratación contemplan el sector público. Los datos registrales están en el aviso legal.",
      },
      {
        q: "Ya tengo una app que no funciona bien. ¿Qué hacemos?",
        a: "La auditamos: revisamos el código, la arquitectura y las opiniones de los usuarios, y te decimos con franqueza si compensa arreglarla o rehacerla, con el coste de cada opción.",
      },
    ],
    cta: {
      title: "¿Tu negocio de la provincia necesita una app?",
      text: "Cuéntanos dónde estás y qué quieres resolver. Te respondemos en 24 horas laborables y, si hace falta, nos vemos en persona.",
    },
    leadNeed: "app",
    leadNeeds: LEAD_NEEDS_CAMPAIGN,
    related: [
      { slug: "desarrollo-web-pontevedra", label: "Páginas web a medida en Pontevedra" },
      { slug: "desarrollo-de-aplicaciones-vigo", label: "Desarrollo de apps desde nuestra oficina de Vigo" },
      { slug: "software-a-medida-vigo", label: "Software de gestión a medida" },
    ],
    hubSummary:
      "Apps de reservas, socios y gestión para la capital y las Rías Baixas, con casos de náutica, turismo y el club PBB de O Porriño.",
  },

  // ───────────────────────────────────────────────────────────────────
  {
    slug: "desarrollo-web-pontevedra",
    group: "zona",
    serviceName: "Diseño y desarrollo web en Pontevedra",
    serviceType: "Diseño y desarrollo web",
    // Sin Redondela: tiene landing propia y la compartían en `areaServed`.
    areaServed: [
      { name: "Pontevedra", type: "City" },
      { name: "O Porriño", type: "City" },
      { name: "Provincia de Pontevedra", type: "AdministrativeArea" },
    ],
    // «Diseño web pontevedra» (100–1.000 al mes) por delante de «desarrollo
    // web pontevedra» (10–100): plan de contenidos de 2026-10-08, §5.1.
    title: "Diseño Web en Pontevedra | Desarrollo de Webs a Medida",
    metaDescription:
      "Diseño y desarrollo de páginas web a medida en Pontevedra y las Rías Baixas: hostelería, eventos, clubes y comercio, con casos en la provincia. ★ 5,0",
    h1: "Diseño y desarrollo web en Pontevedra",
    intro: [
      "Diseñamos y desarrollamos páginas web a medida para negocios de la provincia de Pontevedra. El mismo equipo hace las dos cosas, la dirección de arte y la programación, así que lo que apruebas en el diseño es exactamente lo que se publica.",
      "Nuestra oficina está en Vigo, y buena parte de los clientes con web publicada que puedes visitar están repartidos por la provincia: una sala de eventos en Redondela, un club de baloncesto en O Porriño y una empresa de instalaciones eléctricas navales que trabaja desde Vigo y el puerto de Marín. Conocemos el tipo de negocio que hay aquí porque trabajamos para él.",
    ],
    localContext: {
      title: "Webs para la economía de las Rías Baixas",
      paragraphs: [
        "Pontevedra capital tiene uno de los centros urbanos peatonales más conocidos de España, y eso ha hecho del comercio y la hostelería del casco histórico una parte esencial de su vida económica. Alrededor, la provincia vive del turismo de Sanxenxo, O Grove o Cambados, del vino de la D.O. Rías Baixas, del mar y de una industria que se concentra sobre todo en el área de Vigo y O Porriño.",
        "Para muchos de esos negocios la web es el primer contacto con un cliente que aún no los conoce: el turista que busca dónde cenar en Sanxenxo, la familia que busca club para sus hijos, la empresa que busca proveedor. Si la web no responde en segundos a qué haces, dónde estás y cómo reservar o contactar, ese cliente pasa a la siguiente opción del mapa.",
        "Por eso diseñamos cada web alrededor de una acción concreta — reservar, comprar una entrada, inscribirse, pedir presupuesto — y cuidamos lo que más pesa en una búsqueda local: ficha de Google coherente con la web, dirección y horario claros y páginas que carguen rápido con la cobertura móvil que haya.",
      ],
    },
    offersTitle: "Qué hacemos para negocios de la provincia",
    offers: [
      {
        title: "Diseño con identidad propia",
        text: "Tipografía, color y fotografía al servicio de tu marca, con una propuesta visual antes de maquetar. Sin plantillas compartidas con tu competencia.",
      },
      {
        title: "Webs de hostelería y ocio",
        text: "Carta editable, reservas y venta de entradas desde tu propia web, sin comisiones de plataformas intermediarias.",
      },
      {
        title: "Webs para clubes y asociaciones",
        text: "Inscripciones, cuotas y perfiles de socio integrados en la web, con cobro online.",
      },
      {
        title: "Webs corporativas y B2B",
        text: "Para industria y servicios: estructura por líneas de negocio, casos y un contacto que llega a quien debe.",
      },
      {
        title: "Rediseño conservando posicionamiento",
        text: "Si tu web tiene años, la renovamos sin perder el dominio ni las URLs que ya te traen visitas.",
      },
    ],
    casesTitle: "Clientes de la provincia",
    // Samoa se queda en Redondela y en diseño: aquí, un caso de cada tipo de
    // negocio y ningún otro de Redondela (canibalización con su landing).
    cases: [
      {
        slug: "ticketera-la-fabrica",
        note: "Recinto de ocio y eventos de Redondela. Venta de entradas online con perfil de usuario e historial, y gestión del aforo en tiempo real.",
      },
      {
        slug: "pbb-porrino",
        note: "Club de baloncesto base de O Porriño. Pasar la inscripción y el cobro de cuota y matrícula a la web acabó con el papeleo en ventanilla.",
      },
      {
        slug: "fase",
        note: "Instalaciones eléctricas navales e industriales, con equipo propio en Vigo y en el puerto de Marín. Web corporativa multilingüe, ordenada por línea de servicio.",
      },
    ],
    sections: [
      {
        title: "Diseño y desarrollo, un mismo proyecto",
        paragraphs: [
          "Cuando el diseño lo hace un estudio y la programación otro, lo que se pierde en el traspaso son los detalles: una animación que se simplifica porque no daba tiempo, un espaciado que no cuadra en el móvil, una tipografía sustituida por otra parecida. Aquí no hay traspaso.",
          "Trabajamos en tres capas que se deciden juntas: la dirección de arte (cómo se ve), la experiencia (cómo se usa y en qué orden aparece la información) y la construcción (cómo carga, cómo la lee Google y cómo la editas tú). Separarlas es la forma más rápida de acabar con una web bonita que no convierte, o con una web eficaz que nadie recuerda.",
        ],
      },
      {
        title: "Una web para el vecino y para el visitante",
        paragraphs: [
          "En la provincia, muchos negocios tienen dos públicos: el vecino, que ya los conoce, y el visitante, que los descubre en el móvil. La web tiene que servir a los dos: al primero, con información práctica siempre actualizada (horario, carta, próximos eventos); al segundo, con una primera impresión que le haga elegirte.",
          "Si recibes visitantes de fuera, valoramos preparar la web en más de un idioma desde el diseño — castellano, gallego, inglés o portugués, según tu público —, con la configuración técnica para que cada versión posicione por sí misma.",
        ],
      },
    ],
    processTitle: "Cómo trabajamos con tu negocio",
    process: [
      {
        title: "1. Visita y objetivos",
        text: "Nos cuentas el negocio — si hace falta, en tu local — y fijamos qué acción debe conseguir la web.",
      },
      {
        title: "2. Propuesta visual",
        text: "Dirección de arte y prototipo de las páginas clave, en móvil y escritorio.",
      },
      {
        title: "3. Construcción",
        text: "Desarrollo con Next.js, carga de contenidos y configuración de reservas, pagos o entradas.",
      },
      {
        title: "4. Publicación local",
        text: "Web publicada, recomendaciones para que tu ficha de Google cuadre con ella y formación para que la actualices.",
      },
    ],
    proof: {
      text: "Dos clientes que nos confiaron la imagen de su negocio lo resumen así en Google:",
      testimonials: ["eduardo-castro", "pablo-martinez-lamas"],
    },
    faqs: [
      {
        q: "¿Atendéis presencialmente en Pontevedra?",
        a: "Sí. Desde nuestra oficina de Vigo (Rúa Colón, 20) estamos a una media hora de la capital, y vamos a verte para las reuniones clave: arranque, presentación del diseño y entrega.",
      },
      {
        q: "¿Qué diferencia hay entre diseño web y desarrollo web?",
        a: "El diseño define cómo se ve y cómo se usa la web; el desarrollo la construye en código y decide cómo carga, cómo la indexa Google y cómo la editas. Nosotros hacemos las dos cosas con el mismo equipo, así que no hay matices que se pierdan entre una fase y otra.",
      },
      {
        q: "Mi negocio es pequeño. ¿Una web a medida no es demasiado?",
        a: "Una web a medida bien enfocada suele rendir más que una plantilla, porque está pensada para convertir visitas en clientes de tu negocio concreto. La dimensionamos a tu tamaño real, sin venderte funciones que no vas a usar.",
      },
      {
        q: "¿Puedo tener carta, reservas o entradas en la web sin pagar comisiones a plataformas?",
        a: "Sí. En Samoa Café la carta se edita desde la propia web y en La Fábrica las entradas se venden online con perfil de usuario. Solo pagas la comisión de la pasarela de pago, no la de un intermediario.",
      },
      {
        q: "¿Os ocupáis del posicionamiento en Google?",
        a: "Dejamos resuelto el SEO técnico — títulos, datos estructurados, sitemap, velocidad — y te orientamos en lo que depende de ti: reseñas, ficha de Google Business y contenido. Cuando el negocio vive de su zona, el SEO local entra en el propio encargo, como en la web de la discoteca Musa, en Vigo.",
      },
    ],
    cta: {
      title: "¿Renovamos la web de tu negocio?",
      text: "Cuéntanos qué haces y dónde estás. Te proponemos una dirección visual y un plan para que la web trabaje para ti.",
    },
    leadNeed: "web",
    leadNeeds: LEAD_NEEDS_WEB,
    related: [
      { slug: "desarrollo-web-redondela", label: "Diseño web para negocios de Redondela" },
      {
        slug: "desarrollo-de-aplicaciones-pontevedra",
        label: "Apps a medida en la provincia de Pontevedra",
      },
      { slug: "diseno-web-vigo", label: "Estudio de diseño web en Vigo" },
    ],
    hubSummary:
      "Diseño y desarrollo web para hostelería, eventos, clubes, comercio e industria de la provincia. Casos: La Fábrica, PBB y FASE.",
  },

  // ───────────────────────────────────────────────────────────────────
  {
    slug: "desarrollo-web-redondela",
    group: "zona",
    serviceName: "Diseño y desarrollo web en Redondela",
    serviceType: "Diseño y desarrollo web",
    areaServed: [
      { name: "Redondela", type: "City" },
      { name: "Chapela", type: "Place" },
      { name: "Cesantes", type: "Place" },
      { name: "Provincia de Pontevedra", type: "AdministrativeArea" },
    ],
    title: "Páginas Web en Redondela | Diseño y Desarrollo Web",
    metaDescription:
      "Páginas web y tiendas online para negocios de Redondela, Chapela y Cesantes, a 15 minutos de nuestra oficina de Vigo. Casos: Samoa, La Fábrica y Canelita.",
    h1: "Diseño y desarrollo web en Redondela",
    intro: [
      "Hacemos páginas web y tiendas online para negocios de Redondela. No es una página de ciudad más: Redondela es uno de los municipios donde más clientes tenemos. Samoa Café, la sala La Fábrica y la tienda Canelita tienen su web hecha por nosotros.",
      "Estamos en Vigo, en la Rúa Colón, a unos quince minutos en coche del centro de Redondela. Lo bastante cerca para pasarnos por tu local a ver cómo trabajas, que es la mejor forma de entender qué necesita tu web.",
    ],
    localContext: {
      title: "Redondela, Chapela, Cesantes",
      paragraphs: [
        "Redondela es la villa de los viaductos, el punto donde el Camino Portugués por la costa se une al camino central y un municipio que mira a la ensenada de San Simón. Tiene un centro con comercio y hostelería de toda la vida, parroquias como Chapela o Cesantes con vida propia, playa y un paso constante de peregrinos y visitantes camino de Santiago.",
        "Eso dibuja dos tipos de cliente para un negocio local: el vecino, que conoce tu local pero quiere saber el horario, la carta del día o el próximo evento; y el que está de paso — peregrino, excursionista, gente de Vigo que viene a cenar o a un concierto — que te descubre en el móvil y decide en un minuto.",
        "Una web pensada para Redondela tiene que servir a los dos: información práctica siempre al día para el primero y una primera impresión que convenza al segundo. Y tiene que aparecer cuando alguien busca en Google lo que ofreces en Redondela, que es donde se decide buena parte de las visitas.",
      ],
    },
    offersTitle: "Qué hacemos para negocios de Redondela",
    offers: [
      {
        title: "Webs para hostelería",
        text: "Carta editable desde el móvil, horarios, reservas y fotos que hacen justicia al local. Como la carta de día y de noche de Samoa Café.",
      },
      {
        title: "Venta de entradas y eventos",
        text: "Entradas online con perfil de cliente y control de aforo en tiempo real, sin depender de una ticketera externa. Lo que hicimos para La Fábrica.",
      },
      {
        title: "Tiendas online para el comercio local",
        text: "Una tienda Shopify que vende también cuando el local está cerrado, como la de Canelita.",
      },
      {
        title: "Presencia local en Google",
        text: "Web y ficha de Google Business coherentes, con dirección, horario y datos estructurados, para aparecer en las búsquedas de la zona.",
      },
    ],
    casesTitle: "Tres negocios de Redondela",
    cases: [
      {
        slug: "samoa",
        note: "Café lanzado desde cero con nosotros: naming, logo, diseño de carta y web. La carta se edita desde la propia web y cambia sola entre la versión de día y la de noche.",
      },
      {
        slug: "ticketera-la-fabrica",
        note: "La Fábrica vende las entradas de sus eventos desde su web, con historial en el perfil de cada cliente y aforo gestionado en tiempo real. La venta online sustituyó a la taquilla como canal principal.",
      },
      {
        slug: "canelita",
        note: "Comercio con tienda Shopify construida alrededor de su marca, que le dio un canal de venta propio más allá de la venta presencial.",
      },
    ],
    sections: [
      {
        title: "Por qué una web a medida para un negocio de villa",
        paragraphs: [
          "Es razonable pensar que un café, una tienda o una sala de conciertos de Redondela no necesita una web a medida. Pero los tres casos de esta página tenían problemas muy concretos que una plantilla no resolvía: una carta que cambia según la hora, entradas que se vendían en taquilla con colas, ventas que dependían de que el cliente cruzase la puerta.",
          "La web a medida no es un lujo cuando cada función que añade te ahorra trabajo todas las semanas. Y la dimensionamos al tamaño del negocio: una web de hostelería no necesita lo mismo que una ticketera, y no te vamos a vender lo que no vas a usar.",
        ],
      },
      {
        title: "Cerca de verdad",
        paragraphs: [
          "Trabajar con un estudio a quince minutos tiene ventajas prácticas: podemos reunirnos en tu local, ver cómo atiendes y detectar qué preguntas te hacen los clientes una y otra vez, que son justo las que la web debería responder.",
          "Y cuando la web ya está publicada, un cambio urgente — un evento nuevo, el horario de festivos, una carta especial — se pide con un mensaje de WhatsApp a las mismas personas que la construyeron.",
        ],
      },
    ],
    processTitle: "Cómo lo hacemos",
    process: [
      {
        title: "1. Café en tu local",
        text: "Nos pasamos por Redondela, vemos el negocio y hablamos de lo que tiene que hacer la web.",
      },
      {
        title: "2. Propuesta a tu medida",
        text: "Alcance y presupuesto cerrados, dimensionados a lo que de verdad vas a usar.",
      },
      {
        title: "3. Diseño y construcción",
        text: "Prototipo en tu móvil y, después, contenidos, carta, entradas o tienda configurados.",
      },
      {
        title: "4. Publicación",
        text: "Web online, datos coherentes con tu ficha de Google y formación para que la actualices tú.",
      },
    ],
    proof: {
      text: "La reseña que nos dejó en Google un cliente con local en Redondela, y otra más de las que tenemos en nuestra ficha:",
      testimonials: ["carlos-alonso", "nuria-balaguer"],
    },
    faqs: [
      {
        q: "¿Cuánto tardáis en venir a Redondela?",
        a: "Desde Rúa Colón, unos quince minutos en coche. Por eso, si lo prefieres, las reuniones importantes las hacemos en tu local.",
      },
      {
        q: "¿Hacéis webs también para negocios de Chapela, Cesantes o Soutomaior?",
        a: "Sí. Chapela y Cesantes son parte de Redondela, y los municipios vecinos como Soutomaior o Pazos de Borbén quedan igual de cerca de nuestra oficina.",
      },
      {
        q: "Tengo un bar o restaurante. ¿Qué debería tener mi web?",
        a: "Lo imprescindible: carta actualizada, horario, cómo llegar y cómo reservar, visibles sin buscar. Lo que marca la diferencia: fotos reales del local y un sistema para cambiar la carta tú mismo en un minuto, como en Samoa Café.",
      },
      {
        q: "¿Puedo vender entradas para mis eventos desde mi web?",
        a: "Sí. La Fábrica lo hace así: venta online con perfil de cliente, historial de entradas y control de aforo en tiempo real. No dependes de una ticketera externa y te quedas con los datos de tu público.",
      },
      {
        q: "¿Me ayudáis a aparecer en Google cuando buscan en Redondela?",
        a: "Dejamos la web preparada para búsquedas locales — datos de negocio estructurados, dirección y horario coherentes con tu ficha de Google, páginas rápidas — y te explicamos cómo conseguir reseñas y mantener la ficha al día, que es lo que más pesa en el mapa.",
      },
    ],
    cta: {
      title: "¿Tienes un negocio en Redondela?",
      text: "Escríbenos y quedamos en tu local. Te contamos qué haríamos con tu web y cuánto costaría, sin compromiso.",
    },
    leadNeed: "web",
    leadNeeds: LEAD_NEEDS_WEB,
    related: [
      {
        slug: "desarrollo-web-pontevedra",
        label: "Diseño y desarrollo web en toda la provincia de Pontevedra",
      },
      { slug: "tienda-online-vigo", label: "Tiendas online con Shopify para comercio local" },
      { slug: "desarrollo-web-vigo", label: "Aplicaciones web y reservas online en Vigo" },
    ],
    hubSummary:
      "Webs, venta de entradas y tiendas online para la hostelería y el comercio de Redondela. Casos: Samoa Café, La Fábrica y Canelita.",
  },

  // ───────────────────────────────────────────────────────────────────
  {
    slug: "desarrollo-de-aplicaciones-galicia",
    group: "zona",
    serviceName: "Desarrollo de aplicaciones en Galicia",
    serviceType: "Desarrollo de aplicaciones y producto digital",
    areaServed: [
      { name: "Galicia", type: "AdministrativeArea" },
      { name: "Vigo", type: "City" },
      { name: "A Coruña", type: "City" },
      { name: "Santiago de Compostela", type: "City" },
      { name: "Ourense", type: "City" },
      { name: "Lugo", type: "City" },
    ],
    title: "Desarrollo de Aplicaciones en Galicia | Apps y Plataformas",
    metaDescription:
      "Estudio gallego de desarrollo de aplicaciones: apps iOS y Android, plataformas de formación y apps de escritorio. Casos como XauLabs, Kairos y PRO Lift.",
    h1: "Desarrollo de aplicaciones en Galicia",
    intro: [
      "Action es un estudio de desarrollo de aplicaciones con sede en Vigo que trabaja para empresas y emprendedores de toda Galicia. Construimos producto digital completo: la app que usan tus clientes, el panel desde el que tu equipo la gestiona y el backend que conecta ambas cosas.",
      "Una parte importante de nuestro trabajo son productos digitales en sí mismos — plataformas de formación, comunidades, herramientas — donde la app no es un complemento del negocio sino el negocio. Ahí es donde más se nota trabajar con un equipo que piensa en producto y no solo en pantallas.",
    ],
    localContext: {
      title: "Producto digital hecho en Galicia",
      paragraphs: [
        "Galicia tiene un tejido empresarial repartido entre sus siete ciudades y una red densa de villas: el textil y la distribución en el área de A Coruña, la administración autonómica y la universidad en Santiago, la industria y el puerto en Vigo, el sector agroalimentario en Lugo y Ourense. Y en todas partes, cada vez más proyectos nacen digitales desde el primer día: academias online, comunidades de pago, marketplaces, servicios por suscripción.",
        "Para esos proyectos, tener al equipo técnico en la misma comunidad — mismo horario, mismo contexto, la posibilidad de verse cuando hace falta — es más útil de lo que parece. Las decisiones de producto se toman mejor en una conversación que en un hilo de correos con una agencia a mil kilómetros.",
        "Trabajamos en remoto con clientes de toda Galicia y nos desplazamos para los momentos que lo merecen. La distancia de Vigo a A Coruña o Santiago no es el problema; el problema suele ser no tener un interlocutor técnico que entienda el negocio.",
      ],
    },
    offersTitle: "Un socio técnico para tu producto",
    offers: [
      {
        title: "Apps de formación y comunidad",
        text: "Cursos, niveles, progreso, chats y grupos: plataformas donde la experiencia de aprendizaje es el producto, como XauLabs o Kairos Futures.",
      },
      {
        title: "Aplicaciones de escritorio",
        text: "Cuando el móvil no basta: apps de escritorio con control de acceso y protección de contenido, como la de Formación PRO Lift.",
      },
      {
        title: "Tiempo real e integraciones",
        text: "Chats, mensajería y conexión en tiempo real con plataformas externas, como en True Trading y Lift.",
      },
      {
        title: "IA integrada en tu producto",
        text: "Asistentes que responden dudas frecuentes con el contenido de tu plataforma, integrados en la propia app.",
      },
      {
        title: "MVP con criterio",
        text: "Definimos qué entra en la primera versión para salir antes, y construimos una base que aguante si el producto crece.",
      },
    ],
    casesTitle: "Productos que hemos construido",
    cases: [
      {
        slug: "xaulabs",
        note: "App multiplataforma para iOS y Android con React Native que gamifica el aprendizaje de trading con niveles y progreso visible.",
      },
      {
        slug: "kairos-futures",
        note: "Plataforma con catálogo de cursos, progreso centralizado por alumno y un asistente de IA integrado que redujo las consultas repetitivas al equipo.",
      },
      {
        slug: "pro-lift-formacion",
        note: "App de escritorio para impartir cursos de pago con bloqueo de grabación de pantalla y capturas: vender formación de alto valor sin miedo a la piratería.",
      },
      {
        slug: "lift",
        note: "Una comunidad que vivía en grupos de Telegram, trasladada a una app propia con chats, grupos, perfiles y conexión en tiempo real con plataformas externas.",
      },
    ],
    sections: [
      {
        title: "De la idea al MVP sin tirar dinero",
        paragraphs: [
          "Muchos productos digitales fracasan por construir demasiado antes de saber si alguien los quiere. Nuestro trabajo en la fase de definición es incómodo a propósito: preguntamos qué pasa si quitamos cada funcionalidad, hasta quedarnos con la versión más pequeña que ya resuelve algo.",
          "Eso no significa construir mal. La primera versión tiene que ser pequeña, no frágil: autenticación, datos y pagos bien resueltos desde el principio, porque son las partes más caras de rehacer después.",
        ],
      },
      {
        title: "Proteger el contenido y la comunidad",
        paragraphs: [
          "En productos de formación y comunidad, el valor está en el contenido y en quién tiene acceso. Por eso trabajamos con control de acceso por pago, perfiles y, cuando hace falta, protección frente a grabaciones y capturas, como en la app de escritorio de Formación PRO Lift.",
          "Sacar una comunidad de plataformas de terceros a una app propia, como hizo Lift al dejar Telegram, también es una decisión de control: los datos, las normas y la relación con los usuarios pasan a ser tuyos.",
        ],
      },
    ],
    processTitle: "Cómo construimos producto",
    process: [
      {
        title: "1. Descubrimiento",
        text: "Usuarios, problema, modelo de negocio y competencia. Salimos con el alcance del MVP por escrito.",
      },
      {
        title: "2. Diseño y prototipo",
        text: "Flujo completo navegable que puedes enseñar a usuarios o inversores antes de programar.",
      },
      {
        title: "3. Construcción iterativa",
        text: "Entregas frecuentes, pruebas con usuarios reales y ajustes con datos, no con intuiciones.",
      },
      {
        title: "4. Lanzamiento y crecimiento",
        text: "Publicación, métricas de uso y evolución del producto con lo aprendido.",
      },
    ],
    proof: {
      text: "Así describe en Google su experiencia el cliente de Kairos Futures, junto a otra reseña de nuestra ficha:",
      testimonials: ["yonday", "fangfamily"],
    },
    faqs: [
      {
        q: "¿Trabajáis con empresas de A Coruña, Santiago, Lugo u Ourense?",
        a: "Sí. El proyecto avanza en remoto con demos periódicas y nos desplazamos para las sesiones clave. Al estar en la misma comunidad y el mismo horario, coordinarnos es sencillo.",
      },
      {
        q: "Tengo una idea de app pero no sé por dónde empezar. ¿Me ayudáis?",
        a: "Sí, y es donde más aportamos. Solo necesitas tener claro el problema que quieres resolver y para quién; plataformas, tecnología y alcance de la primera versión los definimos juntos.",
      },
      {
        q: "¿Podéis rescatar una app que otro proveedor dejó a medias?",
        a: "Sí. Auditamos el código existente, te damos un diagnóstico honesto — a veces compensa continuar, a veces reescribir — y un plan con costes cerrados para llevarla a producción.",
      },
      {
        q: "¿Se puede integrar inteligencia artificial en mi app?",
        a: "Sí, cuando resuelve algo concreto. En Kairos Futures integramos un asistente que responde las dudas de los alumnos dentro de la plataforma. También te diremos cuándo la IA no aporta nada y solo encarece el producto.",
      },
      {
        q: "¿Hacéis apps de escritorio además de móviles?",
        a: "Sí. Formación PRO Lift es una app de escritorio para impartir cursos con acceso restringido y bloqueo de capturas. Elegimos escritorio, móvil o web según dónde se va a usar el producto.",
      },
    ],
    cta: {
      title: "¿Tienes un producto digital en mente?",
      text: "Cuéntanos la idea en dos líneas. Te respondemos con las preguntas que hay que hacerse antes de gastar un euro y con los siguientes pasos.",
    },
    leadNeed: "app",
    leadNeeds: LEAD_NEEDS_CAMPAIGN,
    related: [
      { slug: "desarrollo-de-aplicaciones-vigo", label: "Estudio de desarrollo de apps en Vigo" },
      { slug: "agencia-desarrollo-web-galicia", label: "Agencia web para empresas gallegas" },
      { slug: "software-a-medida-vigo", label: "Software a medida para pymes" },
    ],
    hubSummary:
      "Producto digital completo — app, panel y backend — para toda Galicia. Casos: XauLabs, Kairos Futures y Formación PRO Lift.",
  },

  // ───────────────────────────────────────────────────────────────────
  {
    slug: "agencia-desarrollo-web-galicia",
    group: "zona",
    serviceName: "Agencia de desarrollo web en Galicia",
    serviceType: "Desarrollo web",
    areaServed: [
      { name: "Galicia", type: "AdministrativeArea" },
      { name: "A Coruña", type: "City" },
      { name: "Santiago de Compostela", type: "City" },
      { name: "Ourense", type: "City" },
      { name: "Lugo", type: "City" },
      { name: "Noia", type: "City" },
    ],
    // «Diseño web galicia» (100–1.000) sin perder «Desarrollo Web en Galicia» ni
    // «Agencia», por lo que ya sale 1.ª en Bing: plan de contenidos, §5.1.
    title: "Diseño y Desarrollo Web en Galicia | Agencia en Vigo",
    metaDescription:
      "Agencia de diseño y desarrollo web con sede en Vigo: webs corporativas, tiendas online y aplicaciones web para empresas gallegas, en persona o en remoto.",
    h1: "Agencia de desarrollo web en Galicia",
    intro: [
      "Action es una agencia de desarrollo web con sede en Vigo que trabaja con empresas de toda Galicia. Construimos webs corporativas, tiendas online y aplicaciones web a medida para negocios de A Coruña, Santiago, Ourense, Lugo y la provincia de Pontevedra.",
      "Elegir agencia es elegir con quién vas a hablar los próximos años. Aquí hablas con quien diseña y programa tu web, y ese equipo es el mismo que la mantiene después.",
    ],
    localContext: {
      title: "Webs para empresas de toda Galicia",
      paragraphs: [
        "No todos nuestros clientes están en Vigo. En Noia, en la provincia de A Coruña, hemos hecho la web de París de Noia, una de las orquestas más conocidas del circuito de verbenas gallego, fundada en 1957, y la de la clínica de fisioterapia Fisionorte. Son buenos ejemplos de algo muy gallego: negocios con décadas de trayectoria o con una clientela muy local que necesitan una presencia digital a su altura.",
        "Galicia es una comunidad dispersa, con mucha población fuera de las grandes ciudades. Eso tiene dos consecuencias para una web: el cliente te busca desde el móvil, a menudo desde lejos, y la web tiene que resolver por sí sola lo que antes se preguntaba en persona — horarios, calendarios, cómo llegar, cómo contratar.",
        "También trabajamos con marcas que venden fuera de España. Fase Service Partner necesitaba una web corporativa pensada para clientes de distintos países; Patricia Avendaño, una web bilingüe que reflejara su presencia internacional. Una web a la altura permite competir en cualquier mercado.",
      ],
    },
    offersTitle: "Qué hace una agencia web como la nuestra",
    offers: [
      {
        title: "Webs corporativas",
        text: "Estructura por líneas de servicio, mensaje claro y un contacto que llega a la persona adecuada. Para empresas que necesitan transmitir solidez.",
      },
      {
        title: "Webs con agenda y calendario",
        text: "Calendarios de conciertos, eventos o citas siempre actualizados desde la propia web, como el de París de Noia.",
      },
      {
        title: "Tiendas online y aplicaciones web",
        text: "Ecommerce, portales de cliente y plataformas con usuarios, cuando la web tiene que hacer más que informar.",
      },
      {
        title: "Webs multilingües",
        text: "Castellano, gallego, inglés u otros idiomas, con la estructura técnica correcta para que Google muestre a cada visitante su versión.",
      },
      {
        title: "Mantenimiento y evolución",
        text: "Actualizaciones, cambios de contenido y mejoras con el mismo equipo que construyó la web.",
      },
    ],
    casesTitle: "Trabajo publicado dentro y fuera de Galicia",
    cases: [
      {
        slug: "paris-de-noia",
        note: "Orquesta de Noia fundada en 1957. Web de presentación con su trayectoria y repertorio y un calendario de conciertos que se convirtió en la referencia de su público.",
      },
      {
        slug: "fisioterapia-noia",
        note: "Clínica de fisioterapia Fisionorte, en Noia. Landing que transmite cercanía y confianza, con contacto y ubicación accesibles.",
      },
      {
        slug: "fase",
        note: "Web corporativa pensada para alcance internacional, con contenidos por línea de servicio y una imagen homogénea ante clientes de distintos países.",
      },
      {
        slug: "patricia-avendano",
        note: "Web bilingüe para una diseñadora de moda nupcial con más de 100 tiendas en España y presencia en México, Japón y Europa.",
      },
    ],
    sections: [
      {
        title: "Cómo elegir agencia de desarrollo web en Galicia",
        paragraphs: [
          "Hay tres cosas que conviene comprobar antes de firmar con cualquier agencia, también con nosotros. Primero, trabajo real y verificable: webs publicadas que puedas visitar y reseñas que no estén escritas por la propia agencia. Segundo, con quién vas a hablar: si tu interlocutor es un comercial que traslada peticiones a un equipo que no conoces, cada cambio será más lento y más caro.",
          "Tercero, qué pasa después de publicar. Una web necesita actualizaciones, cambios de contenido y mejoras; pregunta quién las hará, cómo se piden y cuánto tardan. Nuestras reseñas en Google hablan a menudo de eso: de estar disponibles antes y después de la entrega.",
        ],
      },
      {
        title: "Agencia, freelance o plataforma",
        paragraphs: [
          "Una plataforma de creación de webs es la opción más barata para empezar y la más limitada cuando creces. Un freelance puede encajar muy bien en proyectos pequeños y acotados. Un equipo cubre diseño, desarrollo, integraciones y mantenimiento sin depender de una sola persona, y el proyecto no se detiene si alguien se va de vacaciones.",
          "La elección depende de lo que la web signifique para tu negocio. Si es un folleto, no necesitas una agencia. Si vende, reserva o se conecta con tu gestión, sí necesitas a alguien que responda por todo el conjunto.",
        ],
      },
    ],
    processTitle: "Cómo trabajamos a distancia",
    process: [
      {
        title: "1. Primera llamada",
        text: "Videollamada para entender el proyecto, estés en el punto de Galicia que estés.",
      },
      {
        title: "2. Propuesta cerrada",
        text: "Alcance, fases y precio por escrito, con lo que incluye y lo que no.",
      },
      {
        title: "3. Proyecto en remoto",
        text: "Prototipo, desarrollo y revisiones con un entorno de pruebas accesible en todo momento.",
      },
      {
        title: "4. Entrega y continuidad",
        text: "Publicación, formación y mantenimiento con el mismo equipo.",
      },
    ],
    proof: {
      text: "Lo que dice en Google el cliente de París de Noia, de fuera del área de Vigo, y otra reseña de nuestra ficha:",
      testimonials: ["adrian-rodriguez", "rodri-vegas"],
    },
    faqs: [
      {
        q: "¿Hace falta reunirse en persona para hacer una web?",
        a: "No es imprescindible. Podemos llevar el proyecto entero en remoto: videollamadas, un entorno de pruebas donde ves la web avanzar y WhatsApp para el día a día. Si prefieres vernos, nos desplazamos para las reuniones clave.",
      },
      {
        q: "¿Podéis actualizar una web que ya existe en lugar de hacerla nueva?",
        a: "Sí. Con París de Noia el encargo fue precisamente actualizar su web. Antes de proponer empezar de cero valoramos qué se puede aprovechar: contenidos, URLs que posicionan, imágenes.",
      },
      {
        q: "¿Podéis hacer la web en gallego?",
        a: "Sí. Preparamos webs en gallego y castellano, y en otros idiomas si tu público lo pide, con la configuración técnica — hreflang y URLs por idioma — para que cada versión posicione por sí misma.",
      },
      {
        q: "¿Cuánto cuesta una web a medida?",
        a: "No publicamos tarifas porque el alcance cambia mucho de una web a otra. Para orientarte necesitamos tres datos: qué debe conseguir la web, cuántas secciones o tipos de página tendrá y si necesita vender, reservar o conectarse con otro sistema. Con eso preparamos una propuesta cerrada y, si no encaja en tu presupuesto, te proponemos qué dejar para una segunda fase.",
      },
      {
        q: "¿Os encargáis también del mantenimiento?",
        a: "Sí. Planteamos el mantenimiento en la propia propuesta — actualizaciones, cambios de contenido, copias de seguridad y soporte — para que sepas desde el principio quién cuidará la web y cómo.",
      },
    ],
    cta: {
      title: "¿Buscas agencia web en Galicia?",
      text: "Escríbenos desde donde estés. Te respondemos en 24 horas laborables con una propuesta de siguiente paso.",
    },
    leadNeed: "web",
    leadNeeds: LEAD_NEEDS_WEB,
    related: [
      { slug: "desarrollo-web-vigo", label: "Desarrollo web a medida en Vigo" },
      { slug: "tienda-online-vigo", label: "Crear una tienda online con Shopify o a medida" },
      {
        slug: "desarrollo-de-aplicaciones-galicia",
        label: "Apps y plataformas digitales en Galicia",
      },
    ],
    hubSummary:
      "Webs corporativas, tiendas y aplicaciones web para toda Galicia. Casos: París de Noia y Fisionorte (Noia), Fase y Patricia Avendaño.",
  },
];

export function getLanding(slug: string): Landing | undefined {
  return landings.find((l) => l.slug === slug);
}

/** Landings de un bloque de /servicios, en el orden de `landings`. */
export function getLandingsByGroup(group: Landing["group"]): Landing[] {
  return landings.filter((l) => l.group === group);
}
