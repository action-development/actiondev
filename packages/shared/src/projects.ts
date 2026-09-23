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
}

export const PLACEHOLDER_IMAGE = "/projects/placeholder.webp";
const TBD_DESC_EN = "Case study coming soon.";
const TBD_DESC_ES = "Case study próximamente.";

export const projects: Project[] = [
  {
    id: "autoescuela-gti",
    slug: "autoescuela-gti",
    title: "Autoescuela GTI",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Driving School",
    nicheEs: "Autoescuela",
    image: "/projects/autoescuelagti.webp",
    url: "#",
    year: 2024,
    technologies: ["TBD"],
    color: "#0a0a0a",
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
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "Mobile App",
    categoryEs: "Aplicación Móvil",
    niche: "Trading",
    nicheEs: "Trading",
    image: PLACEHOLDER_IMAGE,
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
    title: "PBB",
    description:
      "Full digital presence for a local business: website, booking system, and local SEO strategy driving consistent organic traffic.",
    descriptionEs:
      "Presencia digital completa para negocio local: web, sistema de reservas y estrategia SEO local que genera tráfico orgánico constante.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Sports Club",
    nicheEs: "Club deportivo",
    image: "/projects/pbb-porrino.webp",
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
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "Mobile App",
    categoryEs: "Aplicación Móvil",
    niche: "Trading",
    nicheEs: "Trading",
    image: "/projects/truetrading.webp",
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
    id: "nautirent",
    slug: "nautirent",
    title: "Nautirent",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
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
    title: "Ticketera La Fábrica",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Entertainment & Events",
    nicheEs: "Ocio y eventos",
    image: PLACEHOLDER_IMAGE,
    url: "https://www.lafabricaredondela.es/",
    year: 2024,
    technologies: ["TBD"],
    color: "#0a0a0a",
    brief: [
      "Sell tickets online for every event at the venue",
      "A profile system with a history of purchased tickets",
      "Real-time capacity and event management",
    ],
    briefEs: [
      "Vender entradas online para los eventos del recinto",
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
    title: "Musa | Night Club",
    description:
      "Sensory restaurant website with integrated booking, interactive menu, and local SEO. Online reservations up 40%.",
    descriptionEs:
      "Web sensorial para restaurante con reservas integradas, menú interactivo y SEO local. Reservas online +40%.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Hospitality & Nightlife",
    nicheEs: "Hostelería y ocio nocturno",
    image: "/projects/musa.webp",
    video: "/projects_video/musa-pot.webm",
    url: "https://www.musavigo.es/",
    year: 2024,
    technologies: ["Next.js", "GSAP", "Three.js"],
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
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
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
    description:
      "Booking platform with interactive calendar, payment gateway, and real-time tour management.",
    descriptionEs:
      "Plataforma de reservas con calendario interactivo, pasarela de pago y gestión de tours en tiempo real.",
    category: "Landing Page",
    categoryEs: "Landing Page",
    niche: "Tourism",
    nicheEs: "Turismo",
    image: "/projects/fang-tours.webp",
    video: "/projects_video/fang-tours.webm",
    url: "#",
    year: 2024,
    technologies: ["Next.js", "Supabase", "Stripe"],
    featured: true,
    color: "#1c1917",
    brief: [
      "A landing page with a booking calendar and integrated payment gateway",
      "Convey closeness and trust, so booking a tour felt as easy as messaging a friend",
      "Manage tour availability and slots in real time from an internal panel",
    ],
    briefEs: [
      "Landing con calendario de disponibilidad y pasarela de pago integrada",
      "Transmitir cercanía y confianza para reservar una excursión sin tener que llamar",
      "Gestionar los tours y su disponibilidad en tiempo real desde un panel propio",
    ],
    result:
      "Online booking replaced the phone as the main sales channel, multiplying the flow of tours booked without a single call handled manually.",
    resultEs:
      "La reserva online sustituyó casi por completo al teléfono como canal de contratación, multiplicando el flujo de tours reservados sin intervención manual.",
  },
  {
    id: "pro-lift-formacion",
    slug: "pro-lift-formacion",
    title: "Formación PRO Lift",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
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
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
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
    title: "Samoa Café",
    description:
      "Full brand identity from scratch: naming, logo, menu design, website with reservations, and social launch strategy.",
    descriptionEs:
      "Identidad de marca completa desde cero: naming, logo, diseño de carta, web con reservas y estrategia de lanzamiento en redes.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    niche: "Hospitality",
    nicheEs: "Hostelería",
    image: "/projects/samoa.webp",
    video: "/projects_video/samoa.webm",
    url: "https://www.samoaredondela.com/",
    year: 2024,
    technologies: ["Next.js", "Tailwind", "Figma"],
    featured: true,
    color: "#1a1a2e",
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
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "Website",
    categoryEs: "Web",
    niche: "Corporate",
    nicheEs: "Corporativo",
    image: "/projects/fase.webp",
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
      "Bilingual website for an internationally established bridal-wear designer — 100+ stores across Spain and reach in Mexico, Japan and Europe — with interactive lookbook, fullscreen runway videos, and press section.",
    descriptionEs:
      "Web bilingüe para una diseñadora de moda nupcial consolidada internacionalmente —más de 100 tiendas en España y presencia en México, Japón y Europa— con lookbook interactivo, vídeos de pasarela a pantalla completa y sección de prensa.",
    category: "Website",
    categoryEs: "Web",
    niche: "Fashion",
    nicheEs: "Moda",
    image: "/projects/patricia-avendano.webp",
    video: "/projects_video/patricia-avendano.webm",
    url: "https://www.patricia-avendano.com/",
    year: 2024,
    technologies: ["Next.js", "Framer Motion", "i18n"],
    featured: true,
    color: "#171717",
    brief: [
      "A bilingual website that conveyed her international trajectory — 100+ stores across Spain and expansion into Mexico, Japan and Europe",
      "An interactive lookbook and fullscreen runway videos",
      "A press section to reinforce her professional trajectory",
    ],
    briefEs: [
      "Web bilingüe que transmitiera su trayectoria internacional —más de 100 tiendas en España y expansión a México, Japón y Europa",
      "Lookbook interactivo y vídeos de pasarela a pantalla completa",
      "Sección de prensa que respaldara su recorrido profesional",
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
      "Online store with a real-time layer (React, Node.js, WebSocket) for Koopey, the menswear-and-womenswear brand that went viral nationally at launch, with coverage in Modaes and El Español.",
    descriptionEs:
      "Tienda online con capa en tiempo real (React, Node.js, WebSocket) para Koopey, la marca de moda para hombre y mujer que se volvió viral a nivel nacional en su lanzamiento, con cobertura en Modaes y El Español.",
    category: "E-commerce",
    categoryEs: "E-commerce",
    niche: "Fashion Retail",
    nicheEs: "Moda",
    image: "/projects/koopey.webp",
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
    technologies: ["Next.js", "GSAP", "Tailwind"],
    featured: true,
    color: "#111827",
    brief: [
      "An elegant website presenting each project as an immersive story",
      "Convey the studio's level to a higher-end clientele",
      "Fluid navigation between projects with video and motion",
    ],
    briefEs: [
      "Web elegante que presentara cada proyecto como una historia inmersiva",
      "Transmitir el nivel del estudio a un cliente de mayor poder adquisitivo",
      "Navegación fluida entre proyectos con vídeo y motion",
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
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "E-commerce",
    categoryEs: "E-commerce",
    niche: "Retail",
    nicheEs: "Tienda online",
    image: "/projects/cliche.webp",
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
    title: "Canelita",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
    category: "E-commerce",
    categoryEs: "E-commerce",
    niche: "Retail",
    nicheEs: "Tienda online",
    image: "/projects/canelita.webp",
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
    category: "Landing Page",
    categoryEs: "Landing Page",
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
    title: "Cervecería Equs",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
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
      "A landing page introducing the brewery",
      "Convey the craft, hand-made character of the beer",
      "Clear contact details and location",
    ],
    briefEs: [
      "Landing de presentación de la cervecería",
      "Transmitir el carácter artesanal de la cerveza",
      "Datos de contacto y ubicación claros",
    ],
    result:
      "The landing page gave the brewery a digital presence of its own, sharpening the first impression for customers who previously only knew it through social media.",
    resultEs:
      "La landing le dio a la cervecería una presencia digital propia, mejorando la primera impresión de clientes que antes solo la conocían por redes sociales.",
  },
  {
    id: "fisioterapia-noia",
    slug: "fisioterapia-noia",
    title: "Fisionorte",
    description: TBD_DESC_EN,
    descriptionEs: TBD_DESC_ES,
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
