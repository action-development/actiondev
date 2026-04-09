"use client";

import { useRef, useState, useEffect } from "react";

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  color: string;
  screenshot?: string;
}

const PROJECTS: Project[] = [
  {
    id: "timetracker",
    title: "Timetracker",
    category: "SaaS Industrial",
    description: "Software a medida para una PYME que buscaba la gestión completamente digital de las horas de sus empleados.",
    tags: ["React", "Node.js", "Mobile App"],
    color: "#0a0a0a",
  },
  {
    id: "xaulabs",
    title: "XauLabs",
    category: "Fintech & Gamification",
    description: "Aplicación multiplataforma para iOS y Android que busca gamificar el proceso de aprendizaje en el mundo del trader.",
    tags: ["React Native", "iOS", "Android"],
    color: "#111827",
  },
  {
    id: "cliche",
    title: "Cliché",
    category: "E-commerce Custom",
    description: "Desarrollo frontend para e-commerce utilizando el motor de Shopify.",
    tags: ["Shopify", "Liquid", "Custom UI"],
    color: "#1a1a2e",
    screenshot: "/screenshots/cliche.webp",
  },
  {
    id: "musa",
    title: "Musa",
    category: "Hospitality & Ticketing",
    description: "Aplicación Web para una sala de ocio nocturno que decidió prescindir de comisiones y condiciones de ticketeras externas.",
    tags: ["Web App", "Redsys", "Ticketing"],
    color: "#0f172a",
    screenshot: "/screenshots/musa.webp",
  },
  {
    id: "true-trading",
    title: "True Trading",
    category: "Fintech & Trading",
    description: "Plataforma integral de trading con herramientas avanzadas de análisis y ejecución en tiempo real.",
    tags: ["React Native", "Trading", "Real-time"],
    color: "#18181b",
  },
  {
    id: "fang-tours",
    title: "Fang Tours",
    category: "Travel & Tourism",
    description: "Sitio web experiencial para agencia de viajes especializada en destinos exóticos y personalizados.",
    tags: ["Next.js", "Animation", "Booking"],
    color: "#1c1917",
    screenshot: "/screenshots/fang-tours.webp",
  },
  {
    id: "fase-service",
    title: "Fase Service",
    category: "Industrial Services",
    description: "Portal corporativo para empresa de servicios industriales con catálogo y área de clientes.",
    tags: ["Corporate", "Catalog", "B2B"],
    color: "#0c0a09",
    screenshot: "/screenshots/fase-service.webp",
  },
  {
    id: "patricia-avendano",
    title: "Patricia Avendaño",
    category: "Fashion & E-commerce",
    description: "Boutique online elegante y minimalista para diseñadora de moda.",
    tags: ["Shopify", "Fashion", "Minimalist"],
    color: "#171717",
    screenshot: "/screenshots/patricia-avendano.webp",
  },
  {
    id: "samoa",
    title: "Samoa",
    category: "Hospitality",
    description: "Web corporativa y de reservas para grupo de restauración, integrando menús digitales y reservas.",
    tags: ["Hospitality", "Reservations", "Menu"],
    color: "#1a1a2e",
    screenshot: "/screenshots/samoa.webp",
  },
  {
    id: "almudena-muhle",
    title: "Almudena Muhle",
    category: "Interior Design",
    description: "Portfolio digital minimalista para estudio de diseño de interiores.",
    tags: ["Design", "Portfolio", "Minimalist"],
    color: "#111827",
    screenshot: "/screenshots/almudena-muhle.webp",
  },
  {
    id: "koopey",
    title: "Koopey",
    category: "Social Platform",
    description: "Plataforma social que conecta comunidades locales permitiendo el intercambio de servicios y productos.",
    tags: ["Social", "Community", "Marketplace"],
    color: "#0a0a0a",
    screenshot: "/screenshots/koopey.webp",
  },
  {
    id: "lift",
    title: "Lift",
    category: "Fitness & Health",
    description: "Aplicación web progresiva para seguimiento de entrenamientos y nutrición.",
    tags: ["Fitness", "PWA", "Health"],
    color: "#18181b",
    screenshot: "/screenshots/lift.webp",
  },
  {
    id: "marisa",
    title: "Marisa",
    category: "Personal Branding",
    description: "Web personal y blog para experta en consultoría.",
    tags: ["Branding", "Blog", "Consulting"],
    color: "#0f172a",
    screenshot: "/screenshots/marisa.webp",
  },
  {
    id: "ratsquad",
    title: "RatSquad",
    category: "Gaming & Community",
    description: "Portal para comunidad de gaming con noticias, torneos y perfiles de jugadores.",
    tags: ["Gaming", "Community", "Esports"],
    color: "#1c1917",
  },
  {
    id: "san-jose",
    title: "San Jose",
    category: "Institutional & Educational",
    description: "App móvil de comunicación y gestión para centro educativo.",
    tags: ["Education", "Communication", "App"],
    color: "#0c0a09",
  },
];

function ProjectCard({ project, index, total }: { project: Project; index: number; total: number }) {
  return (
    <div
      className="relative flex h-dvh w-full snap-start flex-col justify-end"
      style={{ backgroundColor: project.color }}
    >
      {/* Screenshot background */}
      {project.screenshot && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={project.screenshot}
            alt={project.title}
            className="h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        </div>
      )}

      {/* Project number + category */}
      <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-1">
        <span className="text-sm font-bold tracking-wider text-white/30">
          {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <span className="text-xs font-medium tracking-wider text-white/20 uppercase">
          {project.category}
        </span>
      </div>

      {/* Content overlay at bottom */}
      <div className="relative z-10 flex flex-col gap-4 p-8 pb-12">
        <h2 className="text-4xl font-bold text-white">{project.title}</h2>
        <p className="text-base leading-relaxed text-white/60">{project.description}</p>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/50"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll hint on first card */}
      {index === 0 && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function WorkFeed({ onBack }: { onBack: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const scrollTop = container.scrollTop;
      const cardHeight = container.clientHeight;
      const index = Math.round(scrollTop / cardHeight);
      setCurrentIndex(Math.min(index, PROJECTS.length - 1));
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative h-dvh w-full">
      {/* Scrollable feed */}
      <div
        ref={containerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto"
      >
        {PROJECTS.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={i}
            total={PROJECTS.length}
          />
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 transition-colors active:bg-white/10"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Progress dots */}
      <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
        {PROJECTS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? "scale-150 bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
