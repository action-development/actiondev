export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  url: string;
  year: number;
  technologies: string[];
}

export const projects: Project[] = [
  {
    id: "project-1",
    title: "Lumina Studio",
    description: "Branding & e-commerce platform for a luxury lighting brand.",
    category: "E-commerce",
    image: "/projects/lumina.jpg",
    url: "#",
    year: 2025,
    technologies: ["Next.js", "Three.js", "Shopify"],
  },
  {
    id: "project-2",
    title: "Vertex Architecture",
    description: "Portfolio & 3D showcase for an architecture firm.",
    category: "Portfolio",
    image: "/projects/vertex.jpg",
    url: "#",
    year: 2025,
    technologies: ["React", "GSAP", "WebGL"],
  },
  {
    id: "project-3",
    title: "Neon Health",
    description: "Health-tech platform with real-time patient dashboards.",
    category: "SaaS",
    image: "/projects/neon.jpg",
    url: "#",
    year: 2024,
    technologies: ["Next.js", "Supabase", "Tailwind"],
  },
  {
    id: "project-4",
    title: "Drift Audio",
    description: "Immersive product experience for a headphone brand.",
    category: "Product",
    image: "/projects/drift.jpg",
    url: "#",
    year: 2024,
    technologies: ["React", "Three.js", "GSAP"],
  },
];
