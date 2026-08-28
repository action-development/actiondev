/** Selección de trabajos. Cada entrada apunta a un mockup en
 *  `public/projects`: esta app se despliega como proyecto Vercel propio y
 *  no comparte el `public/` de desktop. Al añadir un proyecto, copiar
 *  también el .webp.
 *
 *  `orientation` decide el aspect ratio del bloque en `Work.tsx`: los
 *  mockups horizontales van a sangre en 16/9 y los verticales en 4/5,
 *  para no recortar el encuadre del original.
 *
 *  ORDEN DELIBERADO: las dos apps móviles ABREN la lista. Quien llega
 *  buscando "una app" tiene que ver una app en el primer bloque, no en
 *  el séptimo. Después, las webs sostienen la afirmación de que el
 *  equipo cubre el producto entero.
 *
 *  Cada `body` sigue el mismo patrón: qué problema tenía el cliente →
 *  qué se construyó → qué cambió. Sin adjetivos de agencia. */
export const work = [
  {
    id: "trading-app",
    title: "Trading App",
    kind: "App móvil iOS + Android · Señales de mercado",
    year: 2026,
    image: "/projects/trading-app.webp",
    orientation: "landscape",
    body:
      "Su comunidad vivía en un grupo de mensajería y las señales se perdían entre mensajes. Ahora tienen app propia: velas en tiempo real, histórico de operaciones, rachas diarias y formación dentro. El aviso llega al móvil en el segundo en que se abre la señal.",
    stack: ["React Native", "TradingView", "Supabase"],
  },
  {
    id: "autoescuela",
    title: "Autoescuela",
    kind: "App móvil iOS + Android · Gestión de alumnos",
    year: 2026,
    image: "/projects/autoescuela.webp",
    orientation: "landscape",
    body:
      "Cada alumno llamaba para preguntar lo mismo: cuándo es mi clase, qué debo, cuándo me examino. Una sola pantalla lo responde todo —próxima clase, pagos, tasas, progreso de teórica y prácticas— y el teléfono de la oficina dejó de sonar.",
    stack: ["React Native", "Expo", "Supabase"],
  },
  {
    id: "fase",
    title: "Fasepower",
    kind: "Web corporativa · Industria naval",
    year: 2026,
    image: "/projects/fase.webp",
    orientation: "landscape",
    body:
      "Ingeniería de instalaciones eléctricas marinas que competía por contratos internacionales con una web de 2012. Web bilingüe, hero a pantalla completa sobre astillero y una ficha técnica por servicio, pensada para que el comprador la lea en inglés sin traducir nada.",
    stack: ["Next.js", "GSAP", "i18n"],
  },
  {
    id: "la-fabrica",
    title: "La Fábrica",
    kind: "Web de eventos · Sala de conciertos",
    year: 2026,
    image: "/projects/la-fabrica.webp",
    orientation: "landscape",
    body:
      "La agenda vivía en carteles de redes que caducaban en un día. Cuenta atrás al próximo concierto, agenda por fechas y venta de entradas en el mismo sitio. Tipografía condensada y rojo sobre negro: la sala, no una plantilla.",
    stack: ["Next.js", "GSAP", "Ticketing"],
  },
  {
    id: "cliche",
    title: "Cliché",
    kind: "E-commerce · Moda",
    year: 2026,
    image: "/projects/cliche.webp",
    orientation: "landscape",
    body:
      "Marca de calle que vendía por mensaje directo. Tienda online con portada en vídeo, catálogo por colecciones y checkout propio. El producto se enseña en la calle, no en estudio, porque ahí es donde su cliente lo reconoce.",
    stack: ["Next.js", "Shopify", "Framer Motion"],
  },
  {
    id: "biyoga",
    title: "Biyoga",
    kind: "Web + reservas · Estudio de yoga",
    year: 2026,
    image: "/projects/biyoga.webp",
    orientation: "landscape",
    body:
      "Reservas por WhatsApp y horarios en un PDF. Web editorial en modo oscuro con reserva de clases y artículos propios, con una portada de gran formato que respira al ritmo de la práctica que vende.",
    stack: ["Next.js", "Tailwind", "CMS"],
  },
  {
    id: "patricia-avendano",
    title: "Patricia Avendaño",
    kind: "Web bilingüe · Vestidos de novia y fiesta",
    year: 2024,
    image: "/projects/patricia-avendano.webp",
    orientation: "portrait",
    body:
      "Dos clientas muy distintas entrando por la misma puerta. Novia y fiesta se separan en dos recorridos, con lookbook interactivo, vídeos de pasarela a pantalla completa y sección de prensa para el comprador internacional.",
    stack: ["Next.js", "Framer Motion", "i18n"],
  },
  {
    id: "true-trading",
    title: "TrueTrading",
    kind: "App móvil · Señales de mercado",
    year: 2026,
    image: "/projects/true-trading.webp",
    orientation: "portrait",
    body:
      "Mismo terreno que el proyecto 01: señales de mercado en el móvil. Aquí se ve la pantalla de carga —monograma serif sobre negro, sin logo de librería—, que es lo primero que ve el usuario cada vez que abre la app y lo último que se suele cuidar.",
    stack: ["React Native", "Expo"],
  },
] as const;
