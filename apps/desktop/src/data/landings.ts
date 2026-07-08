/**
 * Landing pages SEO locales — data-driven.
 *
 * Cada entrada genera una ruta indexable en /[slug] con metadata propia,
 * JSON-LD (Service + FAQPage + BreadcrumbList) y contenido único en español.
 * Estas páginas NO están enlazadas desde la navegación principal a propósito:
 * se descubren vía sitemap.xml, /servicios y el enlazado interno entre ellas.
 *
 * Regla de calidad: el copy de cada landing es único (sin plantillas repetidas)
 * para evitar que Google las trate como doorway pages.
 */

export interface LandingFaq {
  q: string;
  a: string;
}

export interface LandingBlock {
  title: string;
  text: string;
}

export interface Landing {
  slug: string;
  /** Nombre del servicio para el schema Service. */
  serviceName: string;
  /** Ciudades / áreas para areaServed del schema. */
  areaServed: string[];
  title: string;
  metaDescription: string;
  h1: string;
  intro: string[];
  offersTitle: string;
  offers: LandingBlock[];
  process?: LandingBlock[];
  proof: string;
  faqs: LandingFaq[];
  related: { slug: string; label: string }[];
}

export const landings: Landing[] = [
  {
    slug: "desarrollo-de-aplicaciones-vigo",
    serviceName: "Desarrollo de aplicaciones en Vigo",
    areaServed: ["Vigo", "Pontevedra", "Galicia"],
    title: "Desarrollo de Aplicaciones en Vigo | Apps iOS y Android",
    metaDescription:
      "Empresa de desarrollo de aplicaciones en Vigo. Apps nativas iOS y Android, multiplataforma y web apps. Equipo senior en Rúa Colón 20, ★ 5,0 en Google. Presupuesto en 24h.",
    h1: "Desarrollo de aplicaciones en Vigo",
    intro: [
      "Somos Action, una agencia de desarrollo de aplicaciones con oficina en pleno centro de Vigo (Rúa Colón, 20). Diseñamos, desarrollamos y publicamos apps para iOS y Android — nativas y multiplataforma — para empresas que necesitan un producto digital serio, no un experimento.",
      "A diferencia de la mayoría de estudios de la zona, cubrimos todo el ciclo con el mismo equipo senior: definición de producto, diseño de interfaz, desarrollo, backend, publicación en App Store y Google Play, y mantenimiento posterior. Sin subcontratas y sin intermediarios.",
    ],
    offersTitle: "Qué desarrollamos",
    offers: [
      {
        title: "Apps nativas iOS y Android",
        text: "Swift y SwiftUI para iPhone; Kotlin y Jetpack Compose para Android. Máximo rendimiento y acceso completo al hardware cuando el proyecto lo exige.",
      },
      {
        title: "Apps multiplataforma",
        text: "React Native y Flutter: una sola base de código para las dos tiendas, con costes y plazos más ajustados. Te asesoramos honestamente sobre cuándo compensa y cuándo no.",
      },
      {
        title: "Aplicaciones web y PWA",
        text: "Web apps con React y Next.js que funcionan como una app instalable, sin pasar por las tiendas: paneles internos, portales de cliente y SaaS.",
      },
      {
        title: "Backend, APIs y middleware",
        text: "La app es la punta del iceberg. Construimos el servidor, las APIs, las integraciones (ERP, CRM, pasarelas de pago) y los sincronizadores de datos que la hacen funcionar.",
      },
      {
        title: "Publicación y mantenimiento",
        text: "Gestionamos el alta y la revisión en App Store y Google Play, y después mantenemos la app: actualizaciones de sistema, nuevas funcionalidades y soporte.",
      },
    ],
    process: [
      {
        title: "1. Definición",
        text: "Reunión (presencial en Vigo o por videollamada) para entender el negocio, los usuarios y el alcance real. Salimos con un documento de producto y un presupuesto cerrado.",
      },
      {
        title: "2. Diseño",
        text: "Prototipo navegable de la app antes de escribir una línea de código. Validas el flujo completo con tu equipo.",
      },
      {
        title: "3. Desarrollo",
        text: "Sprints con entregas visibles. Puedes probar la app en tu propio móvil desde las primeras semanas (TestFlight / testing interno de Play).",
      },
      {
        title: "4. Publicación y soporte",
        text: "Subimos la app a las tiendas, monitorizamos los primeros días y quedamos como equipo de mantenimiento y evolución.",
      },
    ],
    proof:
      "Trabajamos con negocios de Vigo y su área: salud (Fisionorte), formación (Autoescuela GTI), hostelería y ocio (Musa, Samoa Café, Cervecería Equs), industria (PBB, O Porriño) y decenas de proyectos más. Nuestra ficha de Google tiene 20 reseñas con 5,0 de valoración media.",
    faqs: [
      {
        q: "¿Cuánto cuesta desarrollar una aplicación en Vigo?",
        a: "Depende del alcance: no cuesta lo mismo una app de catálogo que una plataforma con pagos, usuarios y backend a medida. Por eso no damos tarifas genéricas: analizamos tu caso y te enviamos un presupuesto cerrado y detallado en 24 horas, sin compromiso.",
      },
      {
        q: "¿Cuánto se tarda en desarrollar una app?",
        a: "Una app bien definida suele estar en tiendas entre 2 y 4 meses. Proyectos con backend complejo o integraciones con sistemas existentes pueden llevar más. En la fase de definición te damos un calendario realista con hitos verificables.",
      },
      {
        q: "¿App nativa o multiplataforma? ¿Qué me conviene?",
        a: "Si tu app necesita máximo rendimiento, hardware específico o una experiencia iOS/Android impecable, nativa. Si el presupuesto es ajustado y la app es de negocio estándar, React Native o Flutter permiten lanzar en ambas tiendas con una sola base de código. Te lo evaluamos gratis en la primera reunión — y si no necesitas una app, también te lo diremos.",
      },
      {
        q: "¿Os encargáis de subir la app a App Store y Google Play?",
        a: "Sí. Gestionamos las cuentas de desarrollador, las fichas de tienda, el proceso de revisión de Apple y Google, y las publicaciones posteriores de cada actualización.",
      },
      {
        q: "¿Puedo reunirme con vosotros en persona?",
        a: "Claro. Estamos en Rúa Colón 20, en el centro de Vigo. Trabajamos presencialmente con clientes de Vigo y su área metropolitana, y en remoto con el resto de Galicia y España.",
      },
    ],
    related: [
      { slug: "desarrollo-web-vigo", label: "Desarrollo web en Vigo" },
      { slug: "diseno-web-vigo", label: "Diseño web en Vigo" },
      {
        slug: "desarrollo-de-aplicaciones-pontevedra",
        label: "Desarrollo de aplicaciones en Pontevedra",
      },
      {
        slug: "desarrollo-de-aplicaciones-galicia",
        label: "Desarrollo de aplicaciones en Galicia",
      },
    ],
  },
  {
    slug: "desarrollo-web-vigo",
    serviceName: "Desarrollo web en Vigo",
    areaServed: ["Vigo", "Pontevedra", "Galicia"],
    title: "Desarrollo Web en Vigo | Páginas y Aplicaciones Web a Medida",
    metaDescription:
      "Desarrollo web en Vigo: webs corporativas, e-commerce y aplicaciones web a medida con React y Next.js. Rápidas, seguras y preparadas para SEO. ★ 5,0 en Google.",
    h1: "Desarrollo web en Vigo",
    intro: [
      "Desarrollamos páginas y aplicaciones web a medida desde nuestra oficina de Vigo. Nada de plantillas: código propio con React y Next.js, la misma tecnología que usan Netflix, Nike o TikTok para sus webs.",
      "Una web lenta o genérica te cuesta clientes todos los días. Las nuestras cargan en menos de un segundo, puntúan +90 en las métricas de Google y salen de fábrica con el SEO técnico resuelto: datos estructurados, sitemap, metadatos y accesibilidad.",
    ],
    offersTitle: "Qué construimos",
    offers: [
      {
        title: "Webs corporativas",
        text: "La web de tu empresa como herramienta comercial: mensaje claro, diseño premium y formularios que convierten visitas en contactos.",
      },
      {
        title: "Tiendas online",
        text: "E-commerce a medida o sobre Shopify, con integraciones de pago (Redsys, Stripe), logística y conexión con tu ERP si lo necesitas.",
      },
      {
        title: "Aplicaciones web y SaaS",
        text: "Paneles de administración, portales de cliente, plataformas de reservas y productos SaaS completos — frontend, backend y base de datos.",
      },
      {
        title: "Migraciones y rescates",
        text: "¿Tu web actual se ha quedado pequeña o es imposible de mantener? Migramos plataformas legacy a infraestructura moderna sin perder datos ni posicionamiento.",
      },
    ],
    proof:
      "Hemos construido webs y plataformas para hostelería, salud, formación, industria y ocio en Vigo y su área — de Samoa Café a Fisionorte pasando por Autoescuela GTI o la sala Musa. 20 reseñas de 5 estrellas en Google nos avalan.",
    faqs: [
      {
        q: "¿Cuánto cuesta una página web en Vigo?",
        a: "Una web corporativa a medida y un e-commerce con integraciones no juegan en la misma liga, así que huimos de los precios cerrados de catálogo. Cuéntanos qué necesitas y en 24 horas tienes un presupuesto detallado y sin compromiso.",
      },
      {
        q: "¿Usáis WordPress?",
        a: "No para proyectos nuevos. Desarrollamos con React y Next.js: webs más rápidas, más seguras (sin plugins vulnerables) y sin costes ocultos de mantenimiento. Si ya tienes WordPress y quieres migrar, nos encargamos de la transición completa.",
      },
      {
        q: "¿La web saldrá bien posicionada en Google?",
        a: "El SEO técnico va incluido de serie: rendimiento +90 en Core Web Vitals, datos estructurados schema.org, metadatos, sitemap y accesibilidad WCAG. El posicionamiento además depende de contenido y autoridad — te asesoramos sobre la estrategia completa.",
      },
      {
        q: "¿Cuánto tarda el desarrollo de una web?",
        a: "Una web corporativa suele estar online en 3-6 semanas. Un e-commerce o una aplicación web, entre 1 y 3 meses según integraciones. Siempre con calendario y entregas parciales visibles.",
      },
    ],
    related: [
      { slug: "diseno-web-vigo", label: "Diseño web en Vigo" },
      {
        slug: "desarrollo-de-aplicaciones-vigo",
        label: "Desarrollo de aplicaciones en Vigo",
      },
      { slug: "desarrollo-web-pontevedra", label: "Desarrollo web en Pontevedra" },
    ],
  },
  {
    slug: "diseno-web-vigo",
    serviceName: "Diseño web en Vigo",
    areaServed: ["Vigo", "Pontevedra", "Galicia"],
    title: "Diseño Web en Vigo | Webs Premium que Venden",
    metaDescription:
      "Estudio de diseño web en Vigo. Webs premium con identidad propia, animaciones y experiencias 3D. Diseño orientado a conversión para empresas de Galicia. ★ 5,0 en Google.",
    h1: "Diseño web en Vigo",
    intro: [
      "El diseño de tu web decide en tres segundos si un cliente se queda o se va. En Action diseñamos webs con identidad propia — tipografía cuidada, movimiento fluido, experiencias 3D — que hacen que tu marca parezca exactamente lo que es: profesional.",
      "No usamos plantillas ni bibliotecas de componentes genéricos. Cada proyecto parte de tu marca, tu sector y tus clientes, y se diseña para un objetivo medible: que te contacten, que reserven, que compren.",
    ],
    offersTitle: "Cómo trabajamos el diseño",
    offers: [
      {
        title: "Dirección de arte digital",
        text: "Sistema visual completo para tu presencia digital: tipografía, color, retícula y tono. Coherente con tu marca o construyéndola desde cero.",
      },
      {
        title: "Diseño UX orientado a conversión",
        text: "Arquitectura de la información y flujos pensados para que el usuario llegue sin fricción a donde tú quieres: el formulario, la reserva, la compra.",
      },
      {
        title: "Animación y experiencias 3D",
        text: "Motion design con GSAP y escenas 3D interactivas con Three.js — el tipo de detalle que hace que una web se recuerde y se comparta.",
      },
      {
        title: "Diseño + desarrollo bajo el mismo techo",
        text: "El equipo que diseña es el que programa. Lo que apruebas en el prototipo es exactamente lo que se publica, sin pérdidas por el camino.",
      },
    ],
    proof:
      "Nuestro porfolio en Vigo abarca desde marcas personales (Patricia Avendaño, Almudena Muhle) hasta ocio nocturno (Musa), hostelería (Samoa Café, Cervecería Equs) y empresas industriales. Diseño premium con resultados verificables: 5,0 de media en 20 reseñas de Google.",
    faqs: [
      {
        q: "¿Qué diferencia hay entre diseño web y desarrollo web?",
        a: "El diseño define cómo se ve y cómo se usa la web (interfaz, marca, experiencia); el desarrollo la construye en código. En Action hacemos ambas cosas con el mismo equipo, así que no hay traducción perdida entre el diseñador y el programador.",
      },
      {
        q: "Ya tengo web. ¿Podéis rediseñarla?",
        a: "Sí, es de lo que más hacemos. Auditamos la web actual (diseño, rendimiento, SEO), conservamos lo que funciona — URLs, posicionamiento, contenido — y rediseñamos lo que te está frenando.",
      },
      {
        q: "¿El diseño incluye versión móvil?",
        a: "Siempre. Más del 60% de tus visitas llegarán desde el móvil, así que diseñamos primero la experiencia móvil y la escalamos a escritorio, no al revés.",
      },
      {
        q: "¿Podéis hacer una web con 3D como la vuestra?",
        a: "Sí. Las experiencias 3D interactivas (Three.js / WebGL) son una de nuestras especialidades, y las optimizamos para que carguen rápido incluso en móviles modestos.",
      },
    ],
    related: [
      { slug: "desarrollo-web-vigo", label: "Desarrollo web en Vigo" },
      {
        slug: "desarrollo-de-aplicaciones-vigo",
        label: "Desarrollo de aplicaciones en Vigo",
      },
      { slug: "desarrollo-web-pontevedra", label: "Desarrollo web en Pontevedra" },
    ],
  },
  {
    slug: "desarrollo-de-aplicaciones-pontevedra",
    serviceName: "Desarrollo de aplicaciones en Pontevedra",
    areaServed: ["Pontevedra", "Vigo", "Galicia"],
    title: "Desarrollo de Aplicaciones en Pontevedra | Apps iOS y Android",
    metaDescription:
      "Desarrollo de aplicaciones móviles para empresas de Pontevedra y las Rías Baixas. Apps iOS, Android y web apps con equipo senior propio en Galicia. Presupuesto en 24h.",
    h1: "Desarrollo de aplicaciones en Pontevedra",
    intro: [
      "Desarrollamos aplicaciones móviles y web para empresas de toda la provincia de Pontevedra: la capital, Vilagarcía de Arousa, Marín, Sanxenxo, O Porriño, Ponteareas, Lalín o cualquier punto de las Rías Baixas.",
      "Nuestra base está en Vigo (Rúa Colón, 20), a media hora de casi cualquier ayuntamiento de la provincia, lo que nos permite combinar reuniones presenciales cuando hacen falta con un flujo de trabajo remoto ágil el resto del tiempo. El resultado: apps de nivel nacional sin depender de agencias de Madrid o Barcelona.",
    ],
    offersTitle: "Servicios para empresas de la provincia",
    offers: [
      {
        title: "Apps para negocio local",
        text: "Reservas para hostelería y turismo, carta digital, fidelización, citas para clínicas y servicios — apps que resuelven el día a día de tu negocio en la provincia.",
      },
      {
        title: "Apps industriales y de gestión",
        text: "Digitalización de procesos para el tejido industrial de la provincia: partes de trabajo, control de flotas, inventario y conexión con tu ERP.",
      },
      {
        title: "Apps iOS y Android completas",
        text: "Desarrollo nativo (Swift, Kotlin) o multiplataforma (React Native, Flutter) con backend incluido y publicación en App Store y Google Play.",
      },
      {
        title: "Productos digitales desde cero",
        text: "¿Tienes una idea de app y buscas un socio técnico en Galicia? Te acompañamos desde la definición del producto hasta el lanzamiento y las primeras métricas.",
      },
    ],
    proof:
      "Ya trabajamos con empresas de la provincia — como PBB en O Porriño — y con decenas de negocios del área de Vigo. Somos uno de los pocos estudios de Galicia que desarrolla apps nativas, multiplataforma y web con el mismo equipo interno, y nuestra ficha de Google luce un 5,0 con 20 reseñas.",
    faqs: [
      {
        q: "¿Trabajáis con empresas de Pontevedra capital?",
        a: "Sí, y de toda la provincia. Nos desplazamos para las reuniones clave (kickoff, entregas) y el resto del proyecto avanza en remoto con demos semanales, así no pagas desplazamientos innecesarios.",
      },
      {
        q: "¿Por qué elegir un estudio gallego en vez de una agencia grande?",
        a: "Cercanía real (estamos a menos de una hora), interlocución directa con quien programa tu app — no con un gestor de cuentas — y costes sin el sobreprecio de las grandes capitales. Con la misma tecnología y calidad de ingeniería.",
      },
      {
        q: "¿Qué necesito tener claro antes de encargar una app?",
        a: "Solo el problema que quieres resolver y para quién. El resto — plataformas, tecnología, alcance de la primera versión — lo definimos juntos en la fase de producto, que es precisamente donde más valor aportamos.",
      },
      {
        q: "¿Hacéis también la web de la empresa?",
        a: "Sí. Muchos clientes nos encargan el ecosistema completo: app + web corporativa + panel de gestión, todo integrado y con una sola empresa como responsable.",
      },
    ],
    related: [
      {
        slug: "desarrollo-de-aplicaciones-vigo",
        label: "Desarrollo de aplicaciones en Vigo",
      },
      { slug: "desarrollo-web-pontevedra", label: "Desarrollo web en Pontevedra" },
      {
        slug: "desarrollo-de-aplicaciones-galicia",
        label: "Desarrollo de aplicaciones en Galicia",
      },
    ],
  },
  {
    slug: "desarrollo-web-pontevedra",
    serviceName: "Desarrollo web en Pontevedra",
    areaServed: ["Pontevedra", "Vigo", "Galicia"],
    title: "Desarrollo Web en Pontevedra | Webs a Medida para tu Negocio",
    metaDescription:
      "Páginas web a medida para empresas de Pontevedra y las Rías Baixas: hostelería, turismo, industria y comercio. Webs rápidas y preparadas para Google. ★ 5,0.",
    h1: "Desarrollo web en Pontevedra",
    intro: [
      "Creamos páginas web a medida para empresas de la provincia de Pontevedra. Si tu negocio vive del turismo de las Rías Baixas, de la industria del área de Vigo-O Porriño o del comercio local, tu web es tu primer comercial — y merece más que una plantilla.",
      "Somos un estudio de Vigo con clientes en toda la provincia. Desarrollamos con tecnología moderna (React, Next.js), entregamos webs que cargan al instante y dejamos el SEO técnico configurado para que Google te encuentre desde el primer día.",
    ],
    offersTitle: "Webs para cada tipo de negocio",
    offers: [
      {
        title: "Hostelería y turismo",
        text: "Webs con reservas online para restaurantes, hoteles y experiencias en las Rías Baixas. Fotografía cuidada, carta actualizable y reservas sin comisiones de terceros.",
      },
      {
        title: "Industria y servicios B2B",
        text: "Webs corporativas que generan confianza y captan leads cualificados: catálogo técnico, casos de éxito y formularios conectados a tu CRM.",
      },
      {
        title: "Comercio y e-commerce",
        text: "Tiendas online para vender fuera de tu zona: pasarela de pago española (Redsys, Bizum), envíos y stock sincronizado con tu sistema de gestión.",
      },
      {
        title: "Renovación de webs anticuadas",
        text: "Si tu web tiene más de 4 años, probablemente esté perdiendo clientes. La renovamos conservando tu dominio y tu posicionamiento actual.",
      },
    ],
    proof:
      "Trabajamos con negocios de toda la provincia — hostelería, salud, formación, ocio e industria — desde nuestra oficina de Vigo. La media de nuestras 20 reseñas en Google es un 5,0, y cada web que entregamos supera el 90 en las métricas de rendimiento de Google.",
    faqs: [
      {
        q: "¿Atendéis presencialmente en Pontevedra?",
        a: "Sí. Nuestra oficina está en Vigo (Rúa Colón, 20), a 25 minutos de Pontevedra capital, y nos desplazamos a cualquier punto de la provincia para las reuniones importantes del proyecto.",
      },
      {
        q: "Mi negocio es pequeño. ¿Una web a medida no es demasiado?",
        a: "Al contrario: una web a medida bien enfocada suele ser más rentable que una plantilla, porque está diseñada para convertir visitas en clientes de TU negocio concreto. Dimensionamos el proyecto a tu tamaño real — sin venderte funcionalidades que no necesitas.",
      },
      {
        q: "¿Incluís el mantenimiento de la web?",
        a: "Ofrecemos planes de mantenimiento con actualizaciones, copias de seguridad, cambios de contenido y soporte directo por WhatsApp o email. Sin permanencias.",
      },
      {
        q: "¿Podéis llevar también el posicionamiento en Google?",
        a: "El SEO técnico va incluido en todos los proyectos. Para posicionamiento continuado (contenidos, ficha de Google Business, autoridad local) ofrecemos acompañamiento mensual.",
      },
    ],
    related: [
      { slug: "desarrollo-web-vigo", label: "Desarrollo web en Vigo" },
      {
        slug: "desarrollo-de-aplicaciones-pontevedra",
        label: "Desarrollo de aplicaciones en Pontevedra",
      },
      { slug: "diseno-web-vigo", label: "Diseño web en Vigo" },
    ],
  },
  {
    slug: "desarrollo-de-aplicaciones-galicia",
    serviceName: "Desarrollo de aplicaciones en Galicia",
    areaServed: ["Galicia", "Vigo", "Pontevedra", "A Coruña", "Santiago de Compostela"],
    title: "Desarrollo de Aplicaciones en Galicia | Estudio Full-Stack",
    metaDescription:
      "Estudio gallego de desarrollo de aplicaciones: iOS, Android, web y backend con un único equipo senior. Clientes en Vigo, Pontevedra, A Coruña y Santiago. ★ 5,0 en Google.",
    h1: "Desarrollo de aplicaciones en Galicia",
    intro: [
      "Action es un estudio de desarrollo con sede en Vigo que trabaja para empresas de toda Galicia: Vigo, Pontevedra, A Coruña, Santiago de Compostela, Ourense y Lugo. Nuestra especialidad es poco común en la comunidad: cubrir el producto completo — app móvil, web y backend — con un único equipo senior interno.",
      "La mayoría de estudios gallegos hacen apps o hacen webs, y subcontratan lo demás. Nosotros desarrollamos nativo iOS (Swift), nativo Android (Kotlin), multiplataforma (React Native, Flutter), web (Next.js, React) y middleware de integración con la misma plantilla de ingenieros. Un solo interlocutor, una sola visión de producto.",
    ],
    offersTitle: "Un socio técnico para toda Galicia",
    offers: [
      {
        title: "Producto digital completo",
        text: "App para tus clientes, panel web para tu equipo y backend que lo conecta todo. Un solo proyecto, un solo responsable, cero fricción entre proveedores.",
      },
      {
        title: "Integraciones con tus sistemas",
        text: "Sincronizadores y middleware entre tu app y lo que ya usas: ERP, Salesforce, Shopify, sistemas propios. Especialistas en migraciones sin pérdida de datos.",
      },
      {
        title: "Ingeniería senior, trato directo",
        text: "Sin juniors en código de producción y sin gestores de cuenta intermediarios: hablas directamente con quien diseña la arquitectura de tu producto.",
      },
      {
        title: "Un proyecto grande al mes",
        text: "Limitamos deliberadamente la carga de clientes. Tu proyecto recibe atención de nivel fundador de principio a fin, no un hueco en una cola de producción.",
      },
    ],
    proof:
      "Nuestro porfolio gallego cruza sectores: salud, formación, hostelería, ocio nocturno, industria y marcas personales, de Vigo a O Porriño. 20 reseñas de 5 estrellas en Google y proyectos publicados en App Store y Google Play avalan el método.",
    faqs: [
      {
        q: "¿Trabajáis con empresas de A Coruña y Santiago?",
        a: "Sí. El grueso del trabajo se desarrolla en remoto con demos semanales, y nos desplazamos para las sesiones clave. La distancia Vigo–A Coruña nunca ha sido un problema: la mayoría de nuestros clientes gallegos nos eligen precisamente por tener al equipo en la misma comunidad y franja horaria.",
      },
      {
        q: "¿Qué tipo de empresa gallega os encaja mejor?",
        a: "Empresas que se juegan algo con su producto digital: una app que es parte del negocio, una plataforma interna crítica o un e-commerce serio. Si buscas la opción más barata posible, no somos nosotros; si buscas la que funciona y escala, hablemos.",
      },
      {
        q: "¿Podéis rescatar una app que otro proveedor dejó a medias?",
        a: "Sí, lo hacemos a menudo. Auditamos el código existente, te damos un diagnóstico honesto (a veces compensa continuar, a veces reescribir) y un plan con costes cerrados para llevarla a producción.",
      },
      {
        q: "¿Desarrolláis para startups gallegas?",
        a: "Sí. Ayudamos a definir el MVP con criterio — qué entra en la primera versión y qué no — y construimos una base técnica que aguante la escala si el producto despega, evitando la reescritura a los dos años.",
      },
    ],
    related: [
      {
        slug: "desarrollo-de-aplicaciones-vigo",
        label: "Desarrollo de aplicaciones en Vigo",
      },
      {
        slug: "desarrollo-de-aplicaciones-pontevedra",
        label: "Desarrollo de aplicaciones en Pontevedra",
      },
      { slug: "desarrollo-web-vigo", label: "Desarrollo web en Vigo" },
    ],
  },
];

export function getLanding(slug: string): Landing | undefined {
  return landings.find((l) => l.slug === slug);
}
