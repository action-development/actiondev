export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  descriptionEs?: string;
  category: string;
  categoryEs?: string;
  image: string;
  video?: string;
  url: string;
  year: number;
  technologies: string[];
}

export const projects: Project[] = [
  {
    id: "almudena-muhle",
    slug: "almudena-muhle",
    title: "Almudena Muhle",
    description: "Elegant website for an interior design studio, showcasing projects as immersive stories.",
    descriptionEs: "Web elegante para un estudio de diseño de interiores que presenta proyectos como historias inmersivas.",
    category: "Website",
    categoryEs: "Web",
    image: "/projects/almudena-muhle.webp",
    video: "/projects_video/almudena-muhle.webm",
    url: "#",
    year: 2025,
    technologies: ["Next.js", "GSAP", "Tailwind"],
  },
  {
    id: "fang-tours",
    slug: "fang-tours",
    title: "Fang Tours",
    description: "Booking platform with interactive calendar, payment gateway, and real-time tour management.",
    descriptionEs: "Plataforma de reservas con calendario interactivo, pasarela de pago y gestión de tours en tiempo real.",
    category: "Web Application",
    categoryEs: "Aplicación Web",
    image: "/projects/fang-tours.webp",
    video: "/projects_video/fang-tours.webm",
    url: "#",
    year: 2024,
    technologies: ["Next.js", "Supabase", "Stripe"],
  },
  {
    id: "koopey",
    slug: "koopey",
    title: "Koopey",
    description: "MVP for a peer-to-peer service exchange platform with profiles, matching, and chat.",
    descriptionEs: "MVP para una plataforma de intercambio de servicios entre particulares con perfiles, matching y chat.",
    category: "Platform",
    categoryEs: "Plataforma",
    image: "/projects/koopey.webp",
    video: "/projects_video/koopey.webm",
    url: "#",
    year: 2024,
    technologies: ["React", "Node.js", "WebSocket"],
  },
  {
    id: "musa",
    slug: "musa",
    title: "Musa",
    description: "Sensory restaurant website with integrated booking, interactive menu, and local SEO. Online reservations up 40%.",
    descriptionEs: "Web sensorial para restaurante con reservas integradas, menú interactivo y SEO local. Reservas online +40%.",
    category: "Website",
    categoryEs: "Web",
    image: "/projects/musa.webp",
    video: "/projects_video/musa-pot.webm",
    url: "#",
    year: 2024,
    technologies: ["Next.js", "GSAP", "Three.js"],
  },
  {
    id: "patricia-avendano",
    slug: "patricia-avendano",
    title: "Patricia Avendaño",
    description: "Bilingual fashion designer website with interactive lookbook, fullscreen runway videos, and press section.",
    descriptionEs: "Web bilingüe para diseñadora de moda con lookbook interactivo, vídeos de pasarela a pantalla completa y sección de prensa.",
    category: "Website",
    categoryEs: "Web",
    image: "/projects/patricia-avendano.webp",
    video: "/projects_video/patricia-avendano.webm",
    url: "#",
    year: 2024,
    technologies: ["Next.js", "Framer Motion", "i18n"],
  },
  {
    id: "samoa",
    slug: "samoa",
    title: "Samoa",
    description: "Full brand identity from scratch: naming, logo, menu design, website with reservations, and social launch strategy.",
    descriptionEs: "Identidad de marca completa desde cero: naming, logo, diseño de carta, web con reservas y estrategia de lanzamiento en redes.",
    category: "Branding",
    categoryEs: "Branding",
    image: "/projects/samoa.webp",
    video: "/projects_video/samoa.webm",
    url: "#",
    year: 2024,
    technologies: ["Next.js", "Tailwind", "Figma"],
  },
  {
    id: "uvigo-motorsport",
    slug: "uvigo-motorsport",
    title: "UVigo Motorsport",
    description: "Corporate website for a Formula Student team with sponsor section, gallery, and competition timeline.",
    descriptionEs: "Web corporativa para un equipo de Formula Student con sección de patrocinadores, galería y timeline de competición.",
    category: "Website",
    categoryEs: "Web",
    image: "/projects/UVigo-motorsport.webp",
    video: "/projects_video/uvigo-motorsport.webm",
    url: "#",
    year: 2024,
    technologies: ["Next.js", "Tailwind", "CMS"],
  },
  {
    id: "pbb-porrino",
    slug: "pbb-porrino",
    title: "PBB Porriño",
    description: "Full digital presence for a local business: website, booking system, and local SEO strategy driving consistent organic traffic.",
    descriptionEs: "Presencia digital completa para negocio local: web, sistema de reservas y estrategia SEO local que genera tráfico orgánico constante.",
    category: "Website",
    categoryEs: "Web",
    image: "/projects/pbb-porrino.webp",
    video: "/projects_video/pbb-porrino.webm",
    url: "#",
    year: 2025,
    technologies: ["Next.js", "Tailwind", "SEO"],
  },
];
