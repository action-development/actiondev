export interface Testimonial {
  id: string;
  name: string;
  project: string;
  quote: string;
  avatar: string;
  idea: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "carlos",
    name: "Carlos P.",
    project: "Timetracker",
    quote:
      "Action transformed our legacy infrastructure into a world-class fintech ecosystem. The speed and security they achieved is unmatched.",
    avatar: "/avatars/carlos.webp",
    idea: "I needed a system for my team to track work hours without friction. Something simple but that gave me real data for billing.",
  },
  {
    id: "marta",
    name: "Marta R.",
    project: "Cliché",
    quote:
      "Our conversion rates doubled after launch. They understood that digital luxury isn't just aesthetics — it's performance.",
    avatar: "/avatars/marta.webp",
    idea: "I wanted an online store that conveyed the same luxury as our garments. Buying should be an experience, not a chore.",
  },
  {
    id: "javier",
    name: "Javier G.",
    project: "True Trading",
    quote:
      "The trading platform they built redefined how our users operate. The real-time experience is simply magical.",
    avatar: "/avatars/javier.webp",
    idea: "My users needed to see real-time market data with zero latency. A platform to compete with the big players, but more agile.",
  },
  {
    id: "laura",
    name: "Laura M.",
    project: "Musa",
    quote:
      "They captured the essence of our brand perfectly. The booking system is intuitive and visually stunning.",
    avatar: "/avatars/laura.webp",
    idea: "I had a restaurant with soul but no digital presence. I wanted the website to feel like walking through our door.",
  },
  {
    id: "ana",
    name: "Ana B.",
    project: "XauLabs",
    quote:
      "Visualising complex data was never this simple. Their dashboard empowered our team to make better decisions.",
    avatar: "/avatars/ana.webp",
    idea: "We managed tons of data in spreadsheets. I needed a dashboard that turned that chaos into clear decisions.",
  },
];
