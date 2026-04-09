export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    name: "Sarah Chen",
    role: "CEO",
    company: "Lumina Studio",
    quote:
      "They turned our vision into a digital experience that tripled our online sales. Absolutely world-class.",
    avatar: "/avatars/sarah.jpg",
  },
  {
    id: "testimonial-2",
    name: "Marcus Webb",
    role: "Creative Director",
    company: "Vertex Architecture",
    quote:
      "The attention to detail and animation quality is unlike anything we've seen. Our portfolio finally matches our work.",
    avatar: "/avatars/marcus.jpg",
  },
  {
    id: "testimonial-3",
    name: "Elena Torres",
    role: "Founder",
    company: "Neon Health",
    quote:
      "From concept to launch in 8 weeks. The team understood our complex requirements and delivered beyond expectations.",
    avatar: "/avatars/elena.jpg",
  },
];
