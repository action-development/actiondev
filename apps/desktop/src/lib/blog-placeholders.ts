import type { BlogPost } from "@actiondev/shared";

/**
 * ⚠️ PLACEHOLDER TEMPORAL — BORRAR AL CONECTAR FIREBASE ⚠️
 *
 * Mientras `NEXT_PUBLIC_FIREBASE_PROJECT_ID` no esté configurado, `/blog` y
 * `/blog/[slug]` usan estos posts de ejemplo en vez de romper contra
 * Firestore. En cuanto haya un proyecto Firebase real (con la colección
 * `posts` poblada — ver `scripts/seed-blog-posts.ts`), este archivo deja de
 * usarse solo: `lib/blog.ts` detecta el env var y cambia a leer de
 * Firestore automáticamente. Se puede borrar entonces.
 */
export const PLACEHOLDER_POSTS: BlogPost[] = [
  {
    id: "placeholder-1",
    slug: "apps-nativas-o-multiplataforma",
    title: "Apps nativas o multiplataforma: cómo decidir sin equivocarte",
    metaDescription:
      "Nativas vs. multiplataforma para tu próxima app: rendimiento, coste, tiempos y cuándo cada opción es la correcta. Guía de Action, agencia de desarrollo en Vigo.",
    category: "Desarrollo de apps",
    date: "2026-09-08",
    readingTime: 6,
    h1: "Apps nativas o multiplataforma: cómo decidir sin equivocarte",
    excerpt:
      "La pregunta no es cuál es \"mejor\", sino qué necesita tu producto. Estas son las tres variables que de verdad deciden la respuesta.",
    status: "published",
    content: [
      {
        type: "paragraph",
        text: "Cada cliente que llega a Action con una idea de app nos hace la misma pregunta antes de hablar de presupuesto: ¿nativa o multiplataforma? La respuesta corta es que depende, pero la respuesta útil pasa por mirar tres cosas: el rendimiento que exige el producto, el presupuesto disponible y el tiempo que tienes hasta lanzar.",
      },
      { type: "heading", text: "Cuándo la nativa gana sin discusión" },
      {
        type: "paragraph",
        text: "Si tu app depende de cámara, sensores, mapas en tiempo real o animaciones exigentes — pensemos en una app de fitness con tracking en vivo o un juego — el acceso directo al hardware que dan Swift/SwiftUI en iOS y Kotlin/Jetpack Compose en Android marca la diferencia entre una experiencia fluida y una que se nota \"de segunda\".",
      },
      {
        type: "list",
        items: [
          "Rendimiento máximo y animaciones a 60/120 fps sin capas intermedias",
          "Acceso completo y estable a APIs nuevas de cada sistema operativo",
          "Mejor integración con widgets, notificaciones y funciones nativas",
        ],
      },
      { type: "heading", text: "Cuándo la multiplataforma es la decisión inteligente" },
      {
        type: "paragraph",
        text: "Para la mayoría de apps de negocio — un catálogo, una gestión de citas, un panel para clientes — la lógica es idéntica en iOS y Android. Mantener dos bases de código completas para la misma pantalla no añade valor, añade coste.",
      },
      {
        type: "quote",
        text: "La pregunta correcta no es qué tecnología es superior, sino qué parte de tu app justifica pagar el extra de dos bases de código nativas.",
      },
      {
        type: "paragraph",
        text: "En Action evaluamos esto en la primera reunión, antes de escribir una sola línea: qué exige el producto, no qué nos resulta más cómodo desarrollar.",
      },
    ],
  },
  {
    id: "placeholder-2",
    slug: "senales-web-pierde-clientes",
    title: "Cinco señales de que tu web está perdiendo clientes sin que lo sepas",
    metaDescription:
      "Velocidad, mobile, CTAs, SEO local y confianza: las cinco señales técnicas que indican que tu web está perdiendo clientes en Google. Guía de Action, Vigo.",
    category: "SEO y diseño web",
    date: "2026-08-22",
    readingTime: 5,
    h1: "Cinco señales de que tu web está perdiendo clientes sin que lo sepas",
    excerpt:
      "Una web puede estar online, cargando y \"funcionando\" — y aun así estar perdiendo clientes todos los días. Estas cinco señales lo delatan.",
    status: "published",
    content: [
      {
        type: "paragraph",
        text: "La mayoría de webs que auditamos en Action no están \"rotas\": cargan, se ven bien en un ordenador y nadie se ha quejado. El problema es que nadie se queja porque simplemente se va.",
      },
      { type: "heading", text: "1. Tarda más de tres segundos en cargar en móvil" },
      {
        type: "paragraph",
        text: "Más de la mitad del tráfico llega desde el móvil, muchas veces con conexión de datos, no wifi. Cada segundo de más por encima de tres segundos dispara el abandono.",
      },
      { type: "heading", text: "2. No es la versión que Google indexa" },
      {
        type: "paragraph",
        text: "Google indexa la versión móvil de tu web, no la de escritorio. Si el equipo que la construyó optimizó solo para pantalla grande, el buscador está evaluando la peor versión de tu negocio.",
      },
      {
        type: "list",
        items: [
          "CTA visible en la primera pantalla, no solo al final de la página",
          "Un único canal de contacto priorizado — no cinco compitiendo por la atención",
          "Texto del botón que dice lo que pasa al pulsarlo, no \"Enviar\"",
        ],
      },
      {
        type: "quote",
        text: "El SEO local no es una casilla que se marca una vez: es contenido real, escrito para la persona que busca en tu zona, mantenido en el tiempo.",
      },
    ],
  },
  {
    id: "placeholder-3",
    slug: "que-mirar-antes-de-contratar-agencia-vigo",
    title: "Qué mirar antes de contratar una agencia de desarrollo en Vigo",
    metaDescription:
      "Preguntas clave antes de contratar una agencia de desarrollo web o de apps en Vigo: equipo real, subcontratas, presupuesto cerrado y mantenimiento. Guía de Action.",
    category: "Guías",
    date: "2026-07-30",
    readingTime: 4,
    h1: "Qué mirar antes de contratar una agencia de desarrollo en Vigo",
    excerpt:
      "El presupuesto más barato casi nunca es el más barato al final. Esto es lo que preguntamos que nos pregunten antes de empezar un proyecto.",
    status: "published",
    content: [
      {
        type: "paragraph",
        text: "En Vigo hay oferta de sobra para desarrollar una web o una app. La diferencia entre un proyecto que sale bien y uno que se alarga seis meses casi nunca está en el precio por hora, sino en cuatro preguntas que muy pocos clientes hacen antes de firmar.",
      },
      { type: "heading", text: "¿Quién va a desarrollar realmente el proyecto?" },
      {
        type: "paragraph",
        text: "Es habitual que la reunión comercial la lleve una persona y el desarrollo lo ejecute un equipo subcontratado, sin contacto directo con el cliente. Pregunta explícitamente quién escribe el código.",
      },
      {
        type: "list",
        items: [
          "Alcance y funcionalidades por escrito, no solo un número",
          "Plazos de entrega con hitos intermedios, no una fecha única al final",
          "Qué pasa después del lanzamiento: ¿hay mantenimiento incluido?",
        ],
      },
      {
        type: "quote",
        text: "Un equipo que no piensa en el mantenimiento desde el primer día está diseñando un problema para dentro de seis meses, no un producto.",
      },
      {
        type: "paragraph",
        text: "En Action trabajamos con el mismo equipo senior de principio a fin, sin subcontratas, y con presupuesto cerrado antes de empezar.",
      },
    ],
  },
];
