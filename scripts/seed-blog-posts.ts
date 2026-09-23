/**
 * Seed one-off: inserta los 3 posts placeholder (antes en
 * apps/desktop/src/data/posts.ts, ya eliminado) en la tabla `posts` de
 * Supabase con status "published". Usa la service_role key — solo aquí,
 * nunca en runtime de ninguna app — porque RLS bloquea la escritura a
 * cualquier cliente que no sea el usuario autenticado del admin.
 *
 * Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-blog-posts.ts
 */
import { createClient } from "@supabase/supabase-js";
import type { BlogPost } from "../packages/shared/src/blog";

const posts: Omit<BlogPost, "id">[] = [
  {
    slug: "apps-nativas-o-multiplataforma",
    title: "Apps nativas o multiplataforma: cómo decidir sin equivocarte",
    metaDescription:
      "Nativas vs. multiplataforma para tu próxima app: rendimiento, coste, tiempos y cuándo cada opción es la correcta. Guía de Action, agencia de desarrollo en Vigo.",
    category: "Desarrollo de apps",
    date: "2026-09-08",
    readingTime: 6,
    h1: "Apps nativas o multiplataforma: cómo decidir sin equivocarte",
    excerpt:
      'La pregunta no es cuál es "mejor", sino qué necesita tu producto. Estas son las tres variables que de verdad deciden la respuesta.',
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
        text: "Para la mayoría de apps de negocio — un catálogo, una gestión de citas, un panel para clientes — la lógica es idéntica en iOS y Android. Mantener dos bases de código completas para la misma pantalla no añade valor, añade coste. Ahí un único equipo trabajando sobre una base compartida llega antes al mercado y cuesta menos mantener.",
      },
      {
        type: "quote",
        text: "La pregunta correcta no es qué tecnología es superior, sino qué parte de tu app justifica pagar el extra de dos bases de código nativas.",
      },
      {
        type: "paragraph",
        text: "En Action evaluamos esto en la primera reunión, antes de escribir una sola línea: qué exige el producto, no qué nos resulta más cómodo desarrollar. Y lo hacemos con el mismo equipo senior de principio a fin, sin subcontratas de por medio.",
      },
    ],
  },
  {
    slug: "senales-web-pierde-clientes",
    title: "Cinco señales de que tu web está perdiendo clientes sin que lo sepas",
    metaDescription:
      "Velocidad, mobile, CTAs, SEO local y confianza: las cinco señales técnicas que indican que tu web está perdiendo clientes en Google. Guía de Action, Vigo.",
    category: "SEO y diseño web",
    date: "2026-08-22",
    readingTime: 5,
    h1: "Cinco señales de que tu web está perdiendo clientes sin que lo sepas",
    excerpt:
      'Una web puede estar online, cargando y "funcionando" — y aun así estar perdiendo clientes todos los días. Estas cinco señales lo delatan.',
    status: "published",
    content: [
      {
        type: "paragraph",
        text: 'La mayoría de webs que auditamos en Action no están "rotas": cargan, se ven bien en un ordenador y nadie se ha quejado. El problema es que nadie se queja porque simplemente se va — y eso no deja rastro visible si no sabes dónde mirar.',
      },
      { type: "heading", text: "1. Tarda más de tres segundos en cargar en móvil" },
      {
        type: "paragraph",
        text: "Más de la mitad del tráfico llega desde el móvil, muchas veces con conexión de datos, no wifi. Cada segundo de más por encima de tres segundos dispara el abandono antes de que el visitante haya leído una sola palabra.",
      },
      { type: "heading", text: "2. No es la versión que Google indexa" },
      {
        type: "paragraph",
        text: "Google indexa la versión móvil de tu web, no la de escritorio. Si el equipo que la construyó optimizó solo para pantalla grande, el buscador está evaluando (y posicionando) la peor versión de tu negocio.",
      },
      { type: "heading", text: "3. El botón de contacto no es evidente en cinco segundos" },
      {
        type: "paragraph",
        text: "Si un visitante tiene que buscar cómo contactarte, ya perdiste la mitad de la intención de compra que traía. WhatsApp, teléfono o email deben verse sin hacer scroll, en cualquier pantalla.",
      },
      {
        type: "list",
        items: [
          "CTA visible en la primera pantalla, no solo al final de la página",
          "Un único canal de contacto priorizado — no cinco compitiendo por la atención",
          'Texto del botón que dice lo que pasa al pulsarlo, no "Enviar"',
        ],
      },
      { type: "heading", text: "4. No aparece en búsquedas locales" },
      {
        type: "paragraph",
        text: "Si vendes en Vigo, Pontevedra o Galicia y tu web no menciona esas zonas en el contenido real (no solo en el pie de página), estás compitiendo a ciegas contra negocios que sí lo han hecho.",
      },
      {
        type: "quote",
        text: "El SEO local no es una casilla que se marca una vez: es contenido real, escrito para la persona que busca en tu zona, mantenido en el tiempo.",
      },
      { type: "heading", text: "5. No transmite quién hay detrás" },
      {
        type: "paragraph",
        text: "Sin reseñas visibles, sin dirección real, sin un equipo identificable, una web da la misma confianza que un perfil anónimo. Y la confianza es lo primero que se evalúa antes de escribir.",
      },
    ],
  },
  {
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
        text: "En Vigo hay oferta de sobra para desarrollar una web o una app. La diferencia entre un proyecto que sale bien y uno que se alarga seis meses y triplica el presupuesto casi nunca está en el precio por hora, sino en cuatro preguntas que muy pocos clientes hacen antes de firmar.",
      },
      { type: "heading", text: "¿Quién va a desarrollar realmente el proyecto?" },
      {
        type: "paragraph",
        text: "Es habitual que la reunión comercial la lleve una persona y el desarrollo lo ejecute un equipo subcontratado, a veces fuera de España, sin contacto directo con el cliente. Pregunta explícitamente quién escribe el código y si vas a poder hablar con esa persona durante el proyecto.",
      },
      { type: "heading", text: '¿El presupuesto es cerrado o "orientativo"?' },
      {
        type: "paragraph",
        text: "Un presupuesto que cambia a mitad de proyecto no es un imprevisto, es un problema de planificación previa. Pide que el alcance quede por escrito antes de empezar, con qué está incluido y qué no.",
      },
      {
        type: "list",
        items: [
          "Alcance y funcionalidades por escrito, no solo un número",
          "Plazos de entrega con hitos intermedios, no una fecha única al final",
          "Qué pasa después del lanzamiento: ¿hay mantenimiento incluido?",
        ],
      },
      { type: "heading", text: "¿Qué pasa el día después de publicar?" },
      {
        type: "paragraph",
        text: "Una web o una app no termina el día que se publica. Necesita actualizaciones, corrección de errores y, en el caso de apps, cumplir con los requisitos que Apple y Google cambian con cada versión de sus sistemas operativos.",
      },
      {
        type: "quote",
        text: "Un equipo que no piensa en el mantenimiento desde el primer día está diseñando un problema para dentro de seis meses, no un producto.",
      },
      {
        type: "paragraph",
        text: "En Action trabajamos con el mismo equipo senior de principio a fin, desde nuestra oficina en Rúa Colón, 20 — sin subcontratas — y con presupuesto cerrado antes de empezar. Es la forma más simple que conocemos de evitar sorpresas.",
      },
    ],
  },
];

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  for (const post of posts) {
    const { error } = await supabase.from("posts").insert({
      slug: post.slug,
      title: post.title,
      meta_description: post.metaDescription,
      category: post.category,
      date: post.date,
      reading_time: post.readingTime,
      h1: post.h1,
      excerpt: post.excerpt,
      content: post.content,
      status: post.status,
    });

    if (error) {
      console.error(`✗ ${post.slug}: ${error.message}`);
    } else {
      console.log(`✓ ${post.slug}`);
    }
  }
}

main();
