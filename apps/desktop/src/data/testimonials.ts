export interface Testimonial {
  id: string;
  name: string;
  project: string;
  quote: string;
  quoteEs?: string;
  avatar: string;
  idea: string;
  ideaEs?: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "carlos",
    name: "Carlos P.",
    project: "Timetracker",
    quote: "Action transformed our legacy infrastructure into a world-class fintech ecosystem. The speed and security they achieved is unmatched.",
    quoteEs: "Action transformó nuestra infraestructura legacy en un ecosistema fintech de primer nivel. La velocidad y seguridad que lograron no tienen rival.",
    avatar: "/avatars/carlos.webp",
    idea: "I needed a system for my team to track work hours without friction. Something simple but that gave me real data for billing.",
    ideaEs: "Necesitaba un sistema para que mi equipo registrara horas de trabajo sin fricciones. Algo simple pero que me diera datos reales para facturar.",
  },
  {
    id: "marta",
    name: "Marta R.",
    project: "Cliché",
    quote: "Our conversion rates doubled after launch. They understood that digital luxury isn't just aesthetics — it's performance.",
    quoteEs: "Nuestras tasas de conversión se duplicaron tras el lanzamiento. Entendieron que el lujo digital no es solo estética, es rendimiento.",
    avatar: "/avatars/marta.webp",
    idea: "I wanted an online store that conveyed the same luxury as our garments. Buying should be an experience, not a chore.",
    ideaEs: "Quería una tienda online que transmitiera el mismo lujo que nuestras prendas. Comprar debe ser una experiencia, no una tarea.",
  },
  {
    id: "javier",
    name: "Javier G.",
    project: "True Trading",
    quote: "The trading platform they built redefined how our users operate. The real-time experience is simply magical.",
    quoteEs: "La plataforma de trading que construyeron redefinió cómo operan nuestros usuarios. La experiencia en tiempo real es simplemente mágica.",
    avatar: "/avatars/javier.webp",
    idea: "My users needed to see real-time market data with zero latency. A platform to compete with the big players, but more agile.",
    ideaEs: "Mis usuarios necesitaban ver datos de mercado en tiempo real con cero latencia. Una plataforma para competir con los grandes, pero más ágil.",
  },
  {
    id: "laura",
    name: "Laura M.",
    project: "Musa",
    quote: "They captured the essence of our brand perfectly. The booking system is intuitive and visually stunning.",
    quoteEs: "Capturaron la esencia de nuestra marca a la perfección. El sistema de reservas es intuitivo y visualmente impresionante.",
    avatar: "/avatars/laura.webp",
    idea: "I had a restaurant with soul but no digital presence. I wanted the website to feel like walking through our door.",
    ideaEs: "Tenía un restaurante con alma pero sin presencia digital. Quería que la web se sintiera como entrar por nuestra puerta.",
  },
  {
    id: "ana",
    name: "Ana B.",
    project: "XauLabs",
    quote: "Visualising complex data was never this simple. Their dashboard empowered our team to make better decisions.",
    quoteEs: "Visualizar datos complejos nunca fue tan sencillo. Su dashboard empoderó a nuestro equipo para tomar mejores decisiones.",
    avatar: "/avatars/ana.webp",
    idea: "We managed tons of data in spreadsheets. I needed a dashboard that turned that chaos into clear decisions.",
    ideaEs: "Gestionábamos toneladas de datos en hojas de cálculo. Necesitaba un dashboard que convirtiera ese caos en decisiones claras.",
  },
];
