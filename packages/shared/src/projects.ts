export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  descriptionEs?: string;
  category: string;
  categoryEs?: string;
  /** Sector del cliente (hostelería, moda, trading…), no el tipo de producto. Opcional: no todos los proyectos lo tienen todavía. */
  niche?: string;
  nicheEs?: string;
  image: string;
  video?: string;
  url: string;
  year: number;
  technologies: string[];
  featured?: boolean;
  color?: string;
  /**
   * Ficha de caso de estudio (`/projects/[slug]`). Opcional: sin contenido
   * real todavía cae en el placeholder genérico de la página. `brief` es una
   * lista de objetivos (lo que pidió el cliente, uno por línea); `result` es
   * un párrafo narrativo (lo que se consiguió).
   */
  brief?: string[];
  briefEs?: string[];
  result?: string;
  resultEs?: string;
  /**
   * Localidad del cliente, en su forma oficial ("O Porriño", "Redondela").
   * Solo cuando se puede comprobar desde el propio proyecto (dominio del
   * cliente, nombre o slug) — nunca a ojo. La usan el `<title>` de la ficha y
   * el `locationCreated` de su JSON-LD.
   */
  location?: string;
  /**
   * Mockup (dispositivo en contexto) para la web móvil. Aditivo: desktop lo
   * ignora y sigue usando `image`. Ruta bajo `/projects/`, sufijo `-mockup`.
   */
  mockup?: string;
  /** Orientación de `mockup`: `landscape` = 3:2, `portrait` = 4:5 en la web móvil. */
  mockupOrientation?: "landscape" | "portrait";
  /**
   * Mockup vertical 4:5 (1440×1800) para donde la web móvil luce mejor en
   * vertical: la tira de casos de la home y el hero de la ficha. Sufijo
   * `-mockup-vertical`. Desktop lo ignora.
   */
  mockupVertical?: string;
  /** «Antes» del caso en una frase, solo con lo respaldado por este fichero. */
  beforeEs?: string;
  /** «Ahora» del caso en una frase, solo con lo respaldado por este fichero. */
  afterEs?: string;
  /**
   * Cifra de la banda «Resultado» de la web móvil («×10»), SOLO si sale de
   * `resultEs`. Va siempre con `resultFigureLabelEs` (qué mide). Desktop la
   * ignora. No repetirla en `afterEs`: las tarjetas pintan las dos cosas.
   */
  resultFigureEs?: string;
  /** Lo que mide `resultFigureEs`, en minúscula y con punto final. */
  resultFigureLabelEs?: string;
  /**
   * Slug de la landing SEO de su servicio cuando la que toca por `category`
   * no es la buena (un ERP es software a medida aunque sea «Web Application»).
   * La usa `relatedService()` de `apps/desktop/src/lib/project-case.ts`.
   */
  relatedLanding?: string;
}

export const PLACEHOLDER_IMAGE = "/projects/placeholder.webp";
const TBD_DESC_EN = "Case study coming soon.";
const TBD_DESC_ES = "Case study próximamente.";

export const projects: Project[] = [
  {
    id: "autoescuela-gti",
    slug: "autoescuela-gti",
    title: "Autoescuela GTI",
    description:
      "Custom ERP for a driving school covering enrolments, lessons, exam results and the training fleet, plus a mobile app where students follow their classes.",
    descriptionEs:
      "ERP a medida para una autoescuela: matrículas, prácticas, exámenes y flota de coches, con una app móvil para que los alumnos sigan sus clases.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Driving School",
    nicheEs: "Autoescuela",
    image: "/projects/autoescuelagti.webp",
    mockup: "/projects/autoescuela-gti-mockup.webp",
    mockupOrientation: "landscape",
    beforeEs: "Alumnos y profesores resolvían sus trámites pasando por secretaría.",
    afterEs: "Una app para el alumno y un ERP para la oficina.",
    // De `resultEs`: «multiplicando por 10 los trámites que alumnos y profesores resuelven sin pasar por secretaría».
    resultFigureEs: "×10",
    resultFigureLabelEs: "trámites que alumnos y profesores resuelven sin pasar por secretaría.",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#0a0a0a",
    relatedLanding: "software-a-medida-vigo",
    brief: [
      "An ERP for office staff to manage enrollments and administration",
      "Instructors log practice sessions and exam results straight into the system",
      "A companion mobile app where students check upcoming lessons, past sessions and exam results",
      "Full management of the driving school's fleet of practice vehicles",
    ],
    briefEs: [
      "Un ERP para que las secretarias gestionen matrículas y administración",
      "Los profesores registran prácticas y resultados de examen desde el propio sistema",
      "Una app móvil donde los alumnos consultan sus próximas prácticas, clases pasadas y exámenes",
      "Gestión completa de la flota de coches de prácticas",
    ],
    result:
      "The ERP-plus-mobile-app ecosystem digitized the school's operations end to end, multiplying by 10 the number of tasks students and instructors resolve without going through the front desk.",
    resultEs:
      "El ecosistema ERP + app móvil digitalizó de punta a punta la gestión de la autoescuela, multiplicando por 10 los trámites que alumnos y profesores resuelven sin pasar por secretaría.",
  },
  {
    id: "lift",
    slug: "lift",
    title: "Lift",
    description:
      "Dedicated app for the Lift trading community, previously spread across Telegram groups: chats, profiles and real-time links to trading platforms.",
    descriptionEs:
      "App propia para la comunidad de traders de Lift, antes repartida en grupos de Telegram: chats, perfiles y conexión en tiempo real con plataformas.",
    category: "Mobile App",
    categoryEs: "Aplicación Móvil",
    niche: "Trading",
    nicheEs: "Trading",
    image: PLACEHOLDER_IMAGE,
    mockup: "/projects/lift-mockup.webp",
    mockupVertical: "/projects/lift-mockup-vertical.webp",
    mockupOrientation: "landscape",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#18181b",
    brief: [
      "Bring an entire trading community together in one app instead of scattered Telegram groups",
      "Internal chats, groups and member profiles for the community",
      "Real-time connection with external trading platforms",
    ],
    briefEs: [
      "Reunir a toda una comunidad de traders en una sola app en lugar de varios grupos de Telegram",
      "Chats internos, grupos y perfiles propios para la comunidad",
      "Conexión en tiempo real con plataformas de trading externas",
    ],
    result:
      "Moving the community off Telegram and into their own app gave the client full ownership of it, with all activity centralized and synced in real time.",
    resultEs:
      "Trasladar la comunidad de Telegram a una app propia le dio al cliente el control total sobre ella, con toda la actividad centralizada y sincronizada en tiempo real.",
  },
  {
    id: "pbb-porrino",
    slug: "pbb-porrino",
    location: "O Porriño",
    title: "PBB",
    description:
      "Website for PBB, the youth basketball club in O Porriño: online sign-up and payment of dues and registration fee, with accounts for families and players.",
    descriptionEs:
      "Web del club PBB de O Porriño: inscripción y pago de cuota y matrícula online, con cuentas para familias y deportistas. Adiós al papeleo en ventanilla.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Sports Club",
    nicheEs: "Club deportivo",
    image: "/projects/pbb-porrino.webp",
    mockup: "/projects/pbb-porrino-mockup.webp",
    mockupOrientation: "landscape",
    video: "/projects_video/pbb-porrino.webm",
    url: "https://www.porrinobaloncestobase.com/",
    year: 2025,
    technologies: ["Next.js", "Tailwind", "SEO"],
    featured: true,
    color: "#0a0a0a",
    brief: [
      "Sign-up and full payment (registration fee plus dues) directly from the website",
      "Separate account system for parents and for athletes",
      "Parents can manage their children's accounts from their own profile",
    ],
    briefEs: [
      "Inscripción y pago completo (cuota + matrícula) directamente desde la web",
      "Sistema de cuentas diferenciado para padres y deportistas",
      "Los padres pueden gestionar las cuentas de sus hijos desde su propio perfil",
    ],
    result:
      "Moving sign-ups and payments online ended the paperwork at the front desk, multiplying the number of registrations handled without any administrative back-and-forth.",
    resultEs:
      "Pasar la inscripción y el cobro a la web acabó con el papeleo en ventanilla, multiplicando las altas gestionadas sin intervención administrativa.",
  },
  {
    id: "true-trading-app",
    slug: "true-trading-app",
    title: "True Trading App",
    description:
      "Mobile app for a trading team: in-house chats, groups and profiles, connected in real time to external trading platforms to move off Telegram.",
    descriptionEs:
      "App móvil para un equipo de trading: chats, grupos y perfiles propios, conectada en tiempo real a plataformas externas para dejar atrás Telegram.",
    category: "Mobile App",
    categoryEs: "Aplicación Móvil",
    niche: "Trading",
    nicheEs: "Trading",
    image: "/projects/truetrading.webp",
    mockup: "/projects/true-trading-app-mockup.webp",
    mockupVertical: "/projects/true-trading-app-mockup-vertical.webp",
    mockupOrientation: "landscape",
    beforeEs: "El trabajo estaba repartido entre Telegram y otras herramientas.",
    afterEs: "Una sola app con chats, grupos y perfiles, conectada en tiempo real a plataformas de trading.",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#18181b",
    brief: [
      "Bring together in a single app everything that used to be scattered across Telegram and other tools",
      "Internal chats, direct messages, groups and member profiles",
      "Real-time connection with several external trading platforms",
    ],
    briefEs: [
      "Centralizar en una sola app todo el trabajo repartido antes entre Telegram y otras herramientas",
      "Chats internos, mensajes directos, grupos y perfiles propios",
      "Conexión en tiempo real con varias plataformas de trading externas",
    ],
    result:
      "Centralizing operations in one app removed the scatter across Telegram and other software: the team no longer has to leave the app to work, with all trading activity synced in real time.",
    resultEs:
      "Centralizar la operativa en una sola app eliminó la dispersión entre Telegram y otras herramientas: el equipo dejó de salir de la app para trabajar, con toda la actividad sincronizada en tiempo real.",
  },
  {
    id: "oscar-soto",
    slug: "oscar-soto",
    title: "Óscar Soto",
    description:
      "Training app for Óscar Soto's clients: book classes, train and follow their progress with weekly load, weight and streaks.",
    descriptionEs:
      "App de entrenamiento para los clientes de Óscar Soto: reservar clases, entrenar y seguir su progreso con la carga semanal, el peso y la racha.",
    category: "Mobile App",
    categoryEs: "Aplicación Móvil",
    niche: "Fitness",
    nicheEs: "Entrenamiento",
    image: PLACEHOLDER_IMAGE,
    mockup: "/projects/oscar-soto-mockup.webp",
    mockupVertical: "/projects/oscar-soto-mockup-vertical.webp",
    mockupOrientation: "landscape",
    url: "#",
    year: 2026,
    technologies: ["React Native", "Expo"],
    color: "#c62828",
    brief: [
      "Let clients book their classes from their phone",
      "Log workouts and see progress week by week",
      "Keep the habit going with streaks and weekly class goals",
    ],
    briefEs: [
      "Que los clientes reserven sus clases desde el móvil",
      "Registrar los entrenamientos y ver el progreso semana a semana",
      "Mantener el hábito con rachas y un objetivo de clases por semana",
    ],
    result:
      "One app brings together class bookings, training and tracking: weekly load, classes completed in the week, weight and the active streak, all on the home screen.",
    resultEs:
      "Una sola app reúne la reserva de clases, el entrenamiento y el seguimiento: carga semanal, clases hechas en la semana, peso y racha activa, todo en la pantalla de inicio.",
  },
  {
    id: "tratum",
    slug: "tratum",
    title: "Tratum",
    description:
      "Real estate platform only between private individuals: an iOS and Android app where buyers and tenants talk directly to the owner, with verified identities.",
    descriptionEs:
      "Plataforma inmobiliaria solo entre particulares: app para iOS y Android donde se habla con la persona propietaria, con la identidad verificada.",
    category: "Mobile App",
    categoryEs: "Aplicación Móvil",
    niche: "Real estate",
    nicheEs: "Inmobiliaria",
    image: PLACEHOLDER_IMAGE,
    mockup: "/projects/tratum-mockup.webp",
    mockupVertical: "/projects/tratum-mockup-vertical.webp",
    mockupOrientation: "landscape",
    url: "#",
    year: 2026,
    technologies: ["React Native", "Expo"],
    color: "#1e1b4b",
    brief: [
      "Buy, sell and rent homes without intermediaries, only between private individuals",
      "Verify the identity of every user",
      "Native iOS and Android app with its own admin panel",
    ],
    briefEs: [
      "Comprar, vender y alquilar vivienda sin intermediarios, solo entre particulares",
      "Verificar la identidad de cada persona usuaria",
      "App nativa para iOS y Android con su propio panel de administración",
    ],
    result:
      "In development: a native iOS and Android app with direct chat with the owner from the first message and identity verification, plus its own admin panel.",
    resultEs:
      "En desarrollo: app nativa para iOS y Android con chat directo con la persona propietaria desde el primer mensaje y verificación de identidad, más su propio panel de administración.",
  },
  {
    id: "nautirent",
    slug: "nautirent",
    title: "Nautirent",
    description:
      "Boat rental website connected to the fleet management software, with real-time availability and online bookings that need no phone calls.",
    descriptionEs:
      "Web de alquiler de embarcaciones conectada al software de gestión de la flota: disponibilidad en tiempo real y reservas online sin llamadas.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Boating",
    nicheEs: "Náutica",
    image: PLACEHOLDER_IMAGE,
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#0f172a",
    brief: [
      "Connect the website to the company's internal fleet management software",
      "Allow customers to book boats directly from the website, with no calls or intermediaries",
      "Show real-time availability for every boat in the fleet",
    ],
    briefEs: [
      "Conectar la web con el software de gestión interno de la flota",
      "Permitir reservas directamente desde la web, sin llamadas ni intermediarios",
      "Mostrar la disponibilidad de las embarcaciones en tiempo real",
    ],
    result:
      "Syncing the booking flow with the internal management system removed the stale-availability gaps that used to cost bookings, and pushed the volume of reservations closed online well past what the phone line ever handled.",
    resultEs:
      "El sistema de reservas conectado a la gestión interna eliminó los huecos de disponibilidad desactualizada y multiplicó el volumen de reservas cerradas online sin intervención del equipo comercial.",
  },
  {
    id: "ticketera-la-fabrica",
    slug: "ticketera-la-fabrica",
    location: "Redondela",
    title: "Ticketera La Fábrica",
    description:
      "Online ticketing for La Fábrica, a nightclub in Redondela, with customer profiles, purchase history and real-time capacity management.",
    descriptionEs:
      "Venta de entradas online para La Fábrica, discoteca de Redondela: perfil con historial de compras y aforo gestionado en tiempo real.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Nightlife",
    nicheEs: "Ocio nocturno",
    image: PLACEHOLDER_IMAGE,
    mockup: "/projects/ticketera-la-fabrica-mockup.webp",
    mockupOrientation: "landscape",
    beforeEs: "Las entradas se vendían en la taquilla física.",
    afterEs: "Venta de entradas online, con perfil de compras y aforo en tiempo real, sin colas.",
    url: "https://www.lafabricaredondela.es/",
    year: 2024,
    technologies: ["TBD"],
    color: "#0a0a0a",
    relatedLanding: "desarrollo-web-redondela",
    brief: [
      "Sell tickets online for every event at the club",
      "A profile system with a history of purchased tickets",
      "Real-time capacity and event management",
    ],
    briefEs: [
      "Vender entradas online para los eventos de la discoteca",
      "Sistema de perfil con historial de entradas compradas",
      "Gestión de aforo y eventos en tiempo real",
    ],
    result:
      "Online ticket sales replaced the box office as the main channel, multiplying the volume of tickets sold with no queues and no manual handling.",
    resultEs:
      "La venta de entradas online sustituyó a la taquilla física como canal principal, multiplicando las entradas vendidas sin colas ni gestión manual.",
  },
  {
    id: "musa",
    slug: "musa",
    location: "Vigo",
    title: "Musa | Night Club",
    description:
      "Website for Musa, a nightclub in Vigo: tickets sold on its own site, with no third-party ticketing platform, and a customer profile. Online reservations up 40%.",
    descriptionEs:
      "Web para Musa, discoteca de Vigo: venta de entradas en su propia web, sin ticketera externa, con perfil de cliente. Reservas online: +40 %.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Hospitality & Nightlife",
    nicheEs: "Hostelería y ocio nocturno",
    image: "/projects/musa.webp",
    mockup: "/projects/musa-mockup.webp",
    mockupOrientation: "landscape",
    video: "/projects_video/musa-pot.webm",
    url: "https://www.musavigo.es/",
    year: 2024,
    // Comprobado en vivo (2026-10-09): SPA de React con Vite, sin WebGL.
    technologies: ["React", "Vite"],
    featured: true,
    color: "#0f172a",
    brief: [
      "Sell tickets directly from the website, without a third-party ticketing platform",
      "A profile system where customers keep their purchased tickets",
      "Local SEO to bring in nearby clubbers searching online",
    ],
    briefEs: [
      "Vender entradas directamente desde la web, sin depender de una ticketera externa",
      "Sistema de perfil donde el cliente guarda sus entradas compradas",
      "SEO local para captar público de la zona que busca ocio nocturno",
    ],
    result:
      "Ticket sales with a personal profile pushed online reservations up 40%, cutting the club's reliance on the door and on WhatsApp to manage entry.",
    resultEs:
      "La venta de entradas con perfil de usuario elevó las reservas online un 40%, reduciendo la dependencia de la taquilla y de WhatsApp para gestionar el acceso.",
  },
  {
    id: "xaulabs",
    slug: "xaulabs",
    title: "XauLabs",
    description:
      "Cross-platform iOS and Android app gamifying the trader learning journey.",
    descriptionEs:
      "Aplicación multiplataforma para iOS y Android que busca gamificar el proceso de aprendizaje en el mundo del trader.",
    category: "Mobile App",
    categoryEs: "Aplicación Móvil",
    niche: "Trading",
    nicheEs: "Trading",
    image: PLACEHOLDER_IMAGE,
    url: "#",
    year: 2023,
    technologies: ["React Native", "iOS", "Android"],
    color: "#111827",
    brief: [
      "A cross-platform app (iOS and Android) to learn trading",
      "Gamify the learning journey with levels and visible progress",
      "Training content accessible straight from the phone",
    ],
    briefEs: [
      "App multiplataforma (iOS y Android) para aprender trading",
      "Gamificar el proceso de aprendizaje con niveles y progreso visible",
      "Contenido formativo accesible desde el móvil",
    ],
    result:
      "Gamifying the learning path multiplied user engagement with the training content, turning a traditionally dry process into one with visible, rewarding progress.",
    resultEs:
      "La gamificación del aprendizaje multiplicó el compromiso de los usuarios con el contenido formativo, convirtiendo un proceso tradicionalmente árido en uno con progreso visible.",
  },
  {
    id: "kairos-futures",
    slug: "kairos-futures",
    title: "Kairos Futures",
    description:
      "Trading education platform with a full course catalogue, per-student progress tracking and a built-in AI assistant that answers questions.",
    descriptionEs:
      "Plataforma de formación en trading con catálogo de cursos, progreso de cada alumno y un asistente de IA integrado que resuelve sus dudas.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Trading",
    nicheEs: "Trading",
    image: "/projects/kairos.webp",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#111827",
    brief: [
      "A platform with a full catalog of trading courses",
      "An AI assistant built into the app itself to answer student questions",
      "Centralize each student's access and progress in a single place",
    ],
    briefEs: [
      "Plataforma con un catálogo completo de cursos de trading",
      "Un asistente de IA integrado en la propia app para resolver dudas",
      "Centralizar el acceso y el progreso de cada alumno en un solo lugar",
    ],
    result:
      "The built-in AI assistant cut down on repetitive questions to the support team and multiplied the pace at which students completed their courses.",
    resultEs:
      "El asistente de IA integrado redujo las consultas repetitivas al equipo y multiplicó el ritmo al que los alumnos completaban los cursos.",
  },
  {
    id: "timetracker",
    slug: "timetracker",
    title: "Timetracker",
    description:
      "Custom SaaS for an industrial SME to fully digitize employee time tracking.",
    descriptionEs:
      "Software a medida para una PYME que buscaba la gestión completamente digital de las horas de sus empleados.",
    category: "Mobile App",
    categoryEs: "Aplicación Móvil",
    niche: "Industrial",
    nicheEs: "Industrial",
    image: PLACEHOLDER_IMAGE,
    url: "#",
    year: 2023,
    technologies: ["React", "Node.js", "Mobile App"],
    color: "#0a0a0a",
    relatedLanding: "software-a-medida-vigo",
    brief: [
      "Fully digitize employee clock-in and time tracking",
      "A management dashboard with real-time data for the company",
      "Replace paper-based logs with one centralized system",
    ],
    briefEs: [
      "Digitalizar por completo el fichaje y control horario de los empleados",
      "Panel de gestión con datos en tiempo real para la empresa",
      "Sustituir el registro en papel por un sistema centralizado",
    ],
    result:
      "Digitizing time tracking eliminated paper logs and manual clock-in errors, giving management real-time visibility over the entire workforce's hours.",
    resultEs:
      "La digitalización del control horario eliminó el papel y los errores de fichaje manual, dando a la dirección visibilidad en tiempo real sobre la jornada de toda la plantilla.",
  },
  {
    id: "fang-tours",
    slug: "fang-tours",
    title: "Fang Tours",
    // Comprobado en vivo (fangtours.com, 2026-10-09): rutas, preguntas
    // frecuentes y solicitud de plaza por formulario o WhatsApp. Sin calendario,
    // pago online ni panel: no afirmarlos.
    description:
      "Website for Fang Tours, 4x4 expeditions: routes, FAQs on vehicles, insurance and payments, and seat requests through a form or WhatsApp.",
    descriptionEs:
      "Web de Fang Tours, expediciones en 4x4: rutas, preguntas frecuentes sobre vehículos, seguros y pagos, y solicitud de plaza por formulario o WhatsApp.",
    category: "Landing Page",
    categoryEs: "Landing Page",
    niche: "Tourism",
    nicheEs: "Turismo",
    image: "/projects/fang-tours.webp",
    video: "/projects_video/fang-tours.webm",
    url: "#",
    year: 2024,
    technologies: ["React", "Vite"],
    featured: true,
    color: "#1c1917",
    brief: [
      "A website presenting the 4x4 expeditions and each route",
      "Answer the usual questions before booking: vehicles, insurance, requirements and payments",
      "Let travellers request a seat through a form or WhatsApp",
    ],
    briefEs: [
      "Una web que presente las expediciones en 4x4 y cada una de sus rutas",
      "Resolver antes de reservar las dudas habituales: vehículos, seguros, requisitos y pagos",
      "Que el viajero pueda pedir plaza por formulario o por WhatsApp",
    ],
    result:
      "The website brings the routes, the travel conditions and the seat request together in one place.",
    resultEs:
      "La web reúne en un solo sitio las rutas, las condiciones de cada viaje y la solicitud de plaza.",
  },
  {
    id: "pro-lift-formacion",
    slug: "pro-lift-formacion",
    title: "Formación PRO Lift",
    description:
      "Desktop app to sell in-house training courses, with access limited to paying students and screen recording and screenshots blocked.",
    descriptionEs:
      "App de escritorio para vender cursos de formación propios: acceso solo para alumnos que han pagado y bloqueo de grabación y capturas de pantalla.",
    category: "Desktop App",
    categoryEs: "App de Escritorio",
    niche: "Training",
    nicheEs: "Formación",
    image: PLACEHOLDER_IMAGE,
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#0f172a",
    brief: [
      "A desktop app to deliver their own paid training courses",
      "Block screen recording and screenshots to protect the course content",
      "Restrict access exclusively to students who have paid",
    ],
    briefEs: [
      "App de escritorio para impartir sus propios cursos de formación",
      "Bloqueo de grabación de pantalla y capturas para proteger el contenido",
      "Acceso restringido únicamente a quien ha pagado el curso",
    ],
    result:
      "Locking down recording and screenshots let the client sell high-value training with confidence, giving them a fully controlled channel to monetize their course content.",
    resultEs:
      "Bloquear la grabación y las capturas permitió vender formación de alto valor sin miedo a la piratería, dando al cliente un canal de venta de cursos totalmente controlado.",
  },
  {
    id: "licentia",
    slug: "licentia",
    title: "Licentia Marketplace",
    description:
      "Software licence marketplace with automatic delivery after checkout and a catalogue organised by product type, with no manual order handling.",
    descriptionEs:
      "Marketplace de licencias de software con entrega automática tras la compra y catálogo por tipo de producto, sin gestionar cada pedido a mano.",
    category: "Website",
    categoryEs: "Web",
    niche: "Retail",
    nicheEs: "Tienda online",
    image: "/projects/licentia.webp",
    url: "https://www.licentia.pro/",
    year: 2024,
    technologies: ["TBD"],
    color: "#0c0a09",
    brief: [
      "A marketplace to sell software licenses online",
      "Automated license delivery right after purchase",
      "A catalog organized by product type",
    ],
    briefEs: [
      "Marketplace para la venta de licencias de software",
      "Entrega automática de la licencia tras la compra",
      "Catálogo organizado por tipo de producto",
    ],
    result:
      "Automating license delivery after checkout removed the manual work behind every order, multiplying the volume of sales the team handles without lifting a finger.",
    resultEs:
      "La automatización de la entrega de licencias tras la compra eliminó la gestión manual de cada pedido, multiplicando el volumen de ventas sin intervención del equipo.",
  },
  {
    id: "samoa",
    slug: "samoa",
    location: "Redondela",
    title: "Samoa Café",
    description:
      "Samoa Café, in Redondela: a brand identity built from scratch (naming, logo and menu) and a website with an editable menu that switches between day and night.",
    descriptionEs:
      "Samoa Café, en Redondela: identidad de marca desde cero (naming, logo y carta) y una web con carta editable que cambia sola entre día y noche.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Hospitality",
    nicheEs: "Hostelería",
    image: "/projects/samoa.webp",
    mockup: "/projects/samoa-mockup.webp",
    mockupOrientation: "landscape",
    video: "/projects_video/samoa.webm",
    url: "https://www.samoaredondela.com/",
    year: 2024,
    // Comprobado en vivo (2026-10-09): SPA de React con Vite.
    technologies: ["React", "Vite"],
    featured: true,
    color: "#1a1a2e",
    relatedLanding: "desarrollo-web-redondela",
    brief: [
      "A full brand identity built from scratch: naming, logo and menu design",
      "A menu the restaurant can update themselves, straight from the website",
      "A menu that automatically switches between day and night versions on schedule",
    ],
    briefEs: [
      "Identidad de marca completa desde cero: naming, logo y diseño de carta",
      "Una carta que el propio restaurante pudiera actualizar desde la web",
      "Una carta que cambiase automáticamente entre versión de día y de noche",
    ],
    result:
      "The live, schedule-aware menu put an end to outdated printed cards, giving a brand-new venue a far more polished first impression than its size would suggest.",
    resultEs:
      "La carta en tiempo real —editable al instante y sincronizada con el horario— acabó con las cartas impresas desactualizadas y elevó la percepción de marca de un negocio recién lanzado.",
  },
  {
    id: "true-trading-landing",
    slug: "true-trading-landing",
    title: "TT Landing",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "Landing Page",
    categoryEs: "Landing Page",
    niche: "Trading",
    nicheEs: "Trading",
    image: "/projects/truetrading.webp",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#18181b",
    brief: [
      "A landing page to capture new sign-ups for the True Trading app",
      "Convey the value of centralizing an entire trading workflow in one place",
      "A clear call to action driving straight to registration",
    ],
    briefEs: [
      "Landing para captar nuevos registros para la app True Trading",
      "Transmitir el valor de centralizar toda la operativa de trading en un solo lugar",
      "Llamada a la acción clara hacia el registro",
    ],
    result:
      "The landing page became the main entry point for new users into the app, multiplying sign-ups compared to relying on organic social reach alone.",
    resultEs:
      "La landing se convirtió en la puerta de entrada principal de nuevos usuarios a la app, multiplicando los registros captados frente a la difusión exclusiva por redes.",
  },
  {
    id: "fase",
    slug: "fase",
    title: "Fase Service Partner",
    description:
      "Multilingual corporate website for FASE, naval and industrial electrical installations from Vigo and Marín, with clear content for each service line.",
    descriptionEs:
      "Web corporativa multilingüe para FASE, instalaciones eléctricas navales e industriales en Vigo y Marín, con contenidos claros por línea de servicio.",
    category: "Website",
    categoryEs: "Web",
    niche: "Corporate",
    nicheEs: "Corporativo",
    image: "/projects/fase.webp",
    mockup: "/projects/fase-mockup.webp",
    mockupOrientation: "landscape",
    afterEs: "Web corporativa con contenidos claros por línea de servicio, pensada para clientes de todo el mundo.",
    url: "https://www.fasepower.com/",
    year: 2024,
    technologies: ["TBD"],
    color: "#0c0a09",
    brief: [
      "A corporate website built for worldwide reach, not just the local market",
      "Convey solidity and professionalism to clients in different countries",
      "Clear content structure organized by service line",
    ],
    briefEs: [
      "Web corporativa pensada para alcance mundial, no solo local",
      "Transmitir solidez y profesionalismo ante clientes de distintos países",
      "Estructura de contenidos clara por línea de servicio",
    ],
    result:
      "The new corporate site gave the brand a consistent, professional image in front of international markets, reinforcing trust from the very first contact.",
    resultEs:
      "La nueva web corporativa dotó a la marca de una imagen homogénea y profesional de cara a mercados internacionales, reforzando la confianza desde el primer contacto.",
  },
  {
    id: "patricia-avendano",
    slug: "patricia-avendano",
    title: "Patricia Avendaño | Diseñadora",
    description:
      "Bilingual website for Patricia Avendaño, a Vigo-born bridal and evening wear designer: full-screen collections, her story and atelier appointments.",
    descriptionEs:
      "Web bilingüe para Patricia Avendaño, diseñadora de novia y fiesta nacida en Vigo: colecciones a pantalla completa, su historia y cita en el atelier.",
    category: "Website",
    categoryEs: "Web",
    niche: "Fashion",
    nicheEs: "Moda",
    image: "/projects/patricia-avendano.webp",
    mockup: "/projects/patricia-avendano-mockup.webp",
    mockupOrientation: "landscape",
    afterEs: "Web bilingüe con sus colecciones de novia y de fiesta, su historia y la cita en el atelier.",
    video: "/projects_video/patricia-avendano.webm",
    url: "https://www.patricia-avendano.com/",
    year: 2024,
    // Comprobado en vivo (2026-10-09): SPA de React con Vite, español e inglés.
    technologies: ["React", "Vite", "i18n"],
    featured: true,
    color: "#171717",
    brief: [
      "A bilingual website that conveyed her international presence, with points of sale in Europe, the Middle East and the Americas",
      "Bridal and evening collections presented full screen",
      "Her story and an atelier appointment, straight from the website",
    ],
    briefEs: [
      "Web bilingüe que transmitiera su presencia internacional, con puntos de venta en Europa, Oriente Medio y América",
      "Colecciones de novia y de fiesta presentadas a pantalla completa",
      "Su historia y la cita en el atelier, desde la propia web",
    ],
    result:
      "The site positioned her as an established name in the industry, pairing years of trajectory with an editorial-grade bilingual presentation.",
    resultEs:
      "La web posicionó a la diseñadora como una figura consolidada del sector, combinando su trayectoria con una presentación bilingüe de nivel editorial.",
  },
  {
    id: "koopey",
    slug: "koopey",
    title: "Koopey",
    description:
      "Online store for Koopey, the menswear and womenswear brand that went viral at launch, with coverage in Modaes and El Español.",
    descriptionEs:
      "Tienda online para Koopey, la marca de moda para hombre y mujer que se volvió viral en su lanzamiento, con cobertura en Modaes y El Español.",
    category: "E-commerce",
    categoryEs: "E-commerce",
    niche: "Fashion Retail",
    nicheEs: "Moda",
    image: "/projects/koopey.webp",
    mockup: "/projects/koopey-mockup.webp",
    mockupOrientation: "landscape",
    video: "/projects_video/koopey.webm",
    url: "https://koopeyclub.com/",
    year: 2024,
    technologies: ["React", "Node.js", "WebSocket"],
    featured: true,
    color: "#0a0a0a",
    brief: [
      "An online store to sell the clothing brand's collections",
      "A product catalog with a polished, fashion-forward presentation",
      "A fast, low-friction checkout",
    ],
    briefEs: [
      "Tienda online para vender las colecciones de la marca de ropa",
      "Catálogo de producto con una presentación cuidada y a la altura de la marca",
      "Checkout rápido y sin fricción",
    ],
    result:
      "The new store gave the clothing brand a direct sales channel of its own, multiplying the volume of orders placed online compared to selling through social media alone.",
    resultEs:
      "La nueva tienda le dio a la marca de ropa un canal de venta directo propio, multiplicando el volumen de pedidos online frente a vender exclusivamente por redes sociales.",
  },
  {
    id: "paris-de-noia",
    slug: "paris-de-noia",
    location: "Noia",
    title: "París de Noia",
    description:
      "Website for París de Noia, one of the most in-demand and best-known orchestras on the Galician verbena circuit, founded in 1957.",
    descriptionEs:
      "Web para París de Noia, una de las orquestas más solicitadas y reconocidas del circuito de verbenas gallego, fundada en 1957.",
    category: "Website",
    categoryEs: "Web",
    niche: "Live Music Band",
    nicheEs: "Orquesta",
    image: "/projects/parisdenoia.webp",
    mockup: "/projects/paris-de-noia-mockup.webp",
    mockupVertical: "/projects/paris-de-noia-mockup-vertical.webp",
    mockupOrientation: "landscape",
    url: "https://www.parisdenoia.es/",
    year: 2024,
    technologies: ["TBD"],
    color: "#0c0a09",
    brief: [
      "A presentation website that reflected the orchestra's decades-long trajectory in Galicia",
      "An always up-to-date calendar of upcoming concerts",
      "Convey the band's trajectory and repertoire",
    ],
    briefEs: [
      "Web de presentación que reflejara la trayectoria de décadas de la orquesta en Galicia",
      "Calendario de próximos conciertos siempre actualizado",
      "Transmitir la trayectoria y el repertorio del grupo",
    ],
    result:
      "The built-in concert calendar became the audience's go-to reference for upcoming dates, replacing scattered announcements across social media.",
    resultEs:
      "El calendario de conciertos integrado en la web se convirtió en la referencia del público para seguir la agenda, sustituyendo el aviso disperso por redes sociales.",
  },
  {
    id: "almudena-muhle",
    slug: "almudena-muhle",
    title: "Almudena Muhle",
    description:
      "Elegant website for an interior design studio, showcasing projects as immersive stories.",
    descriptionEs:
      "Web elegante para un estudio de diseño de interiores que presenta proyectos como historias inmersivas.",
    category: "Website",
    categoryEs: "Web",
    niche: "Interior Design",
    nicheEs: "Interiorismo",
    image: "/projects/almudena-muhle.webp",
    video: "/projects_video/almudena-muhle.webm",
    url: "https://www.almudenamuhle.com/",
    year: 2025,
    // Comprobado en vivo (2026-10-09): SPA de React con Vite.
    technologies: ["React", "Vite"],
    featured: true,
    color: "#111827",
    brief: [
      "An elegant website presenting each project as an immersive story",
      "Convey the studio's level to a higher-end clientele",
      "Fluid navigation between projects",
    ],
    briefEs: [
      "Web elegante que presentara cada proyecto como una historia inmersiva",
      "Transmitir el nivel del estudio a un cliente de mayor poder adquisitivo",
      "Navegación fluida entre proyectos",
    ],
    result:
      "The immersive project storytelling elevated the studio's brand perception, drawing inquiries from a higher tier of clients than social media alone used to bring in.",
    resultEs:
      "La narrativa inmersiva de cada proyecto elevó la percepción de marca del estudio, generando consultas de clientes de mayor nivel que las captadas antes solo por redes.",
  },
  {
    id: "cliche",
    slug: "cliche",
    title: "C L I C H É",
    description:
      "Tailored Shopify store for the C L I C H É brand: fast, frictionless checkout, a catalogue built to scale and a consistent visual identity.",
    descriptionEs:
      "Tienda Shopify a medida para la marca C L I C H É: checkout rápido y sin fricción, catálogo preparado para crecer e identidad visual coherente.",
    category: "E-commerce",
    categoryEs: "E-commerce",
    niche: "Retail",
    nicheEs: "Tienda online",
    image: "/projects/cliche.webp",
    mockup: "/projects/cliche-mockup.webp",
    mockupOrientation: "landscape",
    afterEs: "Tienda Shopify a medida con checkout rápido y un catálogo preparado para crecer.",
    url: "https://www.clichespain.com/",
    year: 2024,
    technologies: ["TBD"],
    color: "#1a1a2e",
    brief: [
      "A Shopify store with a fast, frictionless checkout",
      "A catalog and product pages ready to scale with the brand",
      "A visual identity consistent across every product page",
    ],
    briefEs: [
      "Tienda sobre Shopify con un checkout rápido y sin fricción",
      "Catálogo y fichas de producto preparados para escalar",
      "Identidad visual coherente en toda la tienda",
    ],
    result:
      "Moving to a tailored Shopify storefront organized the catalog end to end and multiplied the volume of orders processed without manual intervention.",
    resultEs:
      "El paso a una tienda Shopify a medida ordenó el catálogo y multiplicó el volumen de pedidos gestionados sin intervención manual.",
  },
  {
    id: "canelita",
    slug: "canelita",
    location: "Redondela",
    title: "Canelita",
    description:
      "Shopify store for Canelita, a shop in Redondela: product catalogue, optimised checkout and a direct sales channel alongside the physical store.",
    descriptionEs:
      "Tienda online en Shopify para Canelita, comercio de Redondela: catálogo, checkout optimizado y un canal de venta propio además de la tienda física.",
    category: "E-commerce",
    categoryEs: "E-commerce",
    niche: "Retail",
    nicheEs: "Tienda online",
    image: "/projects/canelita.webp",
    mockup: "/projects/canelita-mockup.webp",
    mockupOrientation: "landscape",
    url: "https://canelitaredondela.es/",
    year: 2024,
    technologies: ["TBD"],
    color: "#171717",
    brief: [
      "A Shopify store built around the brand's identity",
      "An optimized product catalog and checkout",
      "Visual consistency across every product page",
    ],
    briefEs: [
      "Tienda sobre Shopify construida alrededor de la identidad de marca",
      "Catálogo de producto y checkout optimizados",
      "Coherencia visual en toda la tienda",
    ],
    result:
      "The Shopify storefront gave the brand its own direct sales channel, multiplying order volume compared to relying solely on in-person sales.",
    resultEs:
      "La tienda Shopify le dio a la marca un canal de venta propio, multiplicando los pedidos frente a la venta exclusivamente presencial.",
  },
  {
    id: "nabi",
    slug: "nabi",
    title: "Nabi Cosmética",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "E-commerce",
    categoryEs: "E-commerce",
    niche: "Cosmetics",
    nicheEs: "Cosmética",
    image: "/projects/nabi.webp",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#18181b",
    brief: [
      "A Shopify store to sell cosmetics online",
      "A carefully art-directed product catalog",
      "A simplified, low-friction checkout",
    ],
    briefEs: [
      "Tienda sobre Shopify para vender cosmética online",
      "Catálogo de producto cuidado visualmente",
      "Checkout simplificado y sin fricción",
    ],
    result:
      "The Shopify store gave the cosmetics brand a direct-to-consumer channel, multiplying the volume of orders placed online.",
    resultEs:
      "La tienda Shopify le dio a la marca de cosmética un canal de venta directo al consumidor, multiplicando el volumen de pedidos online.",
  },
  {
    id: "cachadas",
    slug: "cachadas",
    title: "Cachadas",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "E-commerce",
    categoryEs: "E-commerce",
    niche: "Retail",
    nicheEs: "Tienda online",
    image: "/projects/cachadas.webp",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#1a1a2e",
    brief: [
      "A Shopify store to launch the brand's online sales",
      "An optimized product catalog and checkout",
      "A visual identity consistent with the brand",
    ],
    briefEs: [
      "Tienda sobre Shopify para lanzar la venta online de la marca",
      "Catálogo de producto y checkout optimizados",
      "Identidad visual coherente con la marca",
    ],
    result:
      "Moving to Shopify gave the brand its own sales channel, multiplying the volume of orders processed online.",
    resultEs:
      "El paso a Shopify le dio a la marca un canal de venta propio, multiplicando el volumen de pedidos gestionados online.",
  },
  {
    id: "ertuned",
    slug: "ertuned",
    title: "ERTuned",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "Website",
    categoryEs: "Web",
    niche: "Automotive",
    nicheEs: "Automoción",
    image: "/projects/ertuned.webp",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#1a1a2e",
    brief: [
      "A landing page for the vehicle customization workshop",
      "Convey technical professionalism and passion for cars",
      "A gallery showcasing completed work",
    ],
    briefEs: [
      "Landing para el taller de personalización de vehículos",
      "Transmitir profesionalidad técnica y pasión por el motor",
      "Galería de trabajos realizados",
    ],
    result:
      "The landing page put the workshop's craftsmanship in front of new clients, driving more qualified inquiries through the contact channel.",
    resultEs:
      "La landing puso en valor el trabajo técnico del taller ante nuevos clientes, generando más consultas cualificadas a través del canal de contacto.",
  },
  {
    id: "san-jose",
    slug: "san-jose",
    title: "San José",
    description: "Simple mobile app for a real estate agency to showcase its property listings.",
    descriptionEs: "App móvil sencilla para una inmobiliaria que muestra su catálogo de propiedades.",
    category: "Mobile App",
    categoryEs: "Aplicación Móvil",
    niche: "Real Estate",
    nicheEs: "Inmobiliaria",
    image: PLACEHOLDER_IMAGE,
    url: "#",
    year: 2023,
    technologies: ["Real Estate", "Mobile App"],
    color: "#0c0a09",
    brief: [
      "A simple mobile app presenting the agency's property listings",
      "Convey trust and professionalism to prospective buyers and renters",
      "Direct contact details to reach the agency",
    ],
    briefEs: [
      "Una app móvil sencilla que presenta el catálogo de propiedades de la inmobiliaria",
      "Transmitir confianza y profesionalidad a compradores e inquilinos",
      "Datos de contacto directos para llegar a la agencia",
    ],
    result:
      "The app gave the agency a mobile-friendly showcase for its listings, making it easier for prospective clients to browse properties and reach out directly.",
    resultEs:
      "La app le dio a la inmobiliaria un escaparate de propiedades pensado para móvil, facilitando que los clientes potenciales navegaran el catálogo y contactaran directamente.",
  },
  {
    id: "cerveceria-equs",
    slug: "cerveceria-equs",
    // Su web: «Cervecería Equs | Hamburguesas, Tapas y Deportes en Noia, Galicia».
    location: "Noia",
    title: "Cervecería Equs",
    description:
      "Website for Cervecería Equs, a burger and tapas bar in Noia: menu by sections, the venue, opening hours and how to book.",
    descriptionEs:
      "Web de Cervecería Equs, hamburguesería y tapería de Noia: carta por secciones, el local, el horario y cómo reservar.",
    category: "Website",
    categoryEs: "Web",
    niche: "Hospitality",
    nicheEs: "Hostelería",
    image: "/projects/equs.webp",
    url: "https://www.cerveceriaequs.es/",
    year: 2024,
    technologies: ["TBD"],
    color: "#1c1917",
    brief: [
      "A website introducing the bar",
      "Menu, venue and opening hours in plain sight",
      "Clear contact details and location",
    ],
    briefEs: [
      "Web de presentación de la cervecería",
      "Carta, local y horario a la vista",
      "Datos de contacto y ubicación claros",
    ],
    result:
      "The website gave the bar a digital presence of its own, sharpening the first impression for customers who previously only knew it through social media.",
    resultEs:
      "La web le dio a la cervecería una presencia digital propia, mejorando la primera impresión de clientes que antes solo la conocían por redes sociales.",
  },
  {
    id: "fisioterapia-noia",
    slug: "fisioterapia-noia",
    location: "Noia",
    title: "Fisionorte",
    description:
      "Landing page for Fisionorte, a physiotherapy clinic in Noia: a warm, professional introduction with contact details and location at hand.",
    descriptionEs:
      "Landing para Fisionorte, clínica de fisioterapia en Noia: una presentación cercana y profesional, con contacto y ubicación siempre a mano.",
    category: "Website",
    categoryEs: "Web",
    niche: "Physiotherapy",
    nicheEs: "Fisioterapia",
    image: "/projects/fisionorte.webp",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#111827",
    brief: [
      "A landing page introducing the physiotherapy clinic",
      "Convey warmth and professional trust",
      "Accessible contact details and location",
    ],
    briefEs: [
      "Landing de presentación de la clínica de fisioterapia",
      "Transmitir cercanía y confianza profesional",
      "Datos de contacto y ubicación accesibles",
    ],
    result:
      "The landing page gave the clinic a professional digital presence, making it easier for new patients to find and reach out.",
    resultEs:
      "La landing le dio a la clínica una presencia digital profesional, facilitando que nuevos pacientes encontraran y contactaran con el centro.",
  },
  {
    id: "ratsquad",
    slug: "ratsquad",
    title: "Ratsquad",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "Website",
    categoryEs: "Web",
    image: PLACEHOLDER_IMAGE,
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#1c1917",
    brief: [
      "A brand-presentation landing page",
      "Convey a bold, distinctive visual identity",
      "A simple structure built to grab attention fast",
    ],
    briefEs: [
      "Landing de presentación de marca",
      "Transmitir una identidad visual atrevida y diferenciada",
      "Estructura simple orientada a captar la atención rápido",
    ],
    result:
      "The landing page gave the brand a digital presence with real personality, standing out against a crowded field of competitors.",
    resultEs:
      "La landing le dio a la marca una presencia digital con personalidad propia, reforzando su identidad frente a la competencia del sector.",
  },
  {
    id: "roots",
    slug: "roots",
    title: "Roots",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "Website",
    categoryEs: "Web",
    image: "/projects/roots.webp",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#171717",
    brief: [
      "A brand-presentation landing page",
      "Convey a clean, minimalist style true to the brand",
      "A structure focused directly on conversion",
    ],
    briefEs: [
      "Landing de presentación de marca",
      "Transmitir un estilo minimalista y cuidado",
      "Estructura enfocada directamente a la conversión",
    ],
    result:
      "The landing page gave the brand a digital image consistent with its identity, improving the first impression for visitors arriving from social media.",
    resultEs:
      "La landing le dio a la marca una imagen digital coherente con su identidad, mejorando la primera impresión de los visitantes que llegaban desde redes.",
  },
  {
    id: "marisa-gamez",
    slug: "marisa-gamez",
    title: "Marisa Gámez",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "Website",
    categoryEs: "Web",
    image: PLACEHOLDER_IMAGE,
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#0f172a",
    brief: [
      "A professional presentation landing page",
      "Convey experience and closeness with clients",
      "Accessible contact details",
    ],
    briefEs: [
      "Landing de presentación profesional",
      "Transmitir experiencia y cercanía con el cliente",
      "Datos de contacto accesibles",
    ],
    result:
      "The landing page tidied up the personal brand's digital presence, giving a professional first impression to anyone searching for her online.",
    resultEs:
      "La landing ordenó la presencia digital de la marca personal, dando una primera impresión profesional a quien la busca online.",
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

/**
 * ¿La ficha `/projects/[slug]` tiene caso redactado? Mientras la descripción
 * sea el placeholder, la ficha va `noindex` y fuera del sitemap: veinte URLs
 * con la misma meta "Case study próximamente." son contenido fino duplicado
 * que resta calidad al sitio entero. Redactar la descripción la indexa sola.
 */
export function hasCaseStudy(project: Project): boolean {
  return (
    project.descriptionEs !== TBD_DESC_ES && project.description !== TBD_DESC_EN
  );
}
