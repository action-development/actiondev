/**
 * Publica (upsert por `slug`) los posts SEO del blog en Firestore y completa
 * los 3 posts originales con los campos SEO nuevos de `BlogPost`
 * (`author`, `targetLanding`, `faqs`, `updatedAt`, `keyword`) y 1-3 enlaces
 * internos a landings.
 *
 * Mismo patrón de credenciales que `scripts/seed-blog-posts.ts`: Admin SDK con
 * `applicationDefault()` (tras `firebase login` / `gcloud auth
 * application-default login`) o, si están, las env vars de una cuenta de
 * servicio. Solo local, nunca en runtime de ninguna app.
 *
 * Uso:
 *   FIREBASE_PROJECT_ID=action-dev-1a531 npx tsx scripts/publish-seo-posts.ts            # todo
 *   FIREBASE_PROJECT_ID=action-dev-1a531 npx tsx scripts/publish-seo-posts.ts <slug> ...  # solo esos
 *   npx tsx scripts/publish-seo-posts.ts --dry-run                                        # sin escribir
 *
 * Idempotente: un post nuevo que ya existe conserva su `date` original; el
 * párrafo de enlaces de los posts originales no se duplica al re-ejecutar.
 * Escribir en Firestore NO revalida la web: después, POST a
 * `https://actiondev.es/api/revalidate` con `{ secret, slug }` por post (o
 * esperar al `revalidate = 3600` de `/blog`).
 */
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { BlogContentBlock, BlogFaq, BlogPost } from "../packages/shared/src/blog";

type PostInput = Omit<BlogPost, "id">;

const AUTHOR = "pablo-cabaleiro";
const TODAY = new Date().toISOString().slice(0, 10);

const p = (text: string): BlogContentBlock => ({ type: "paragraph", text });
const h = (text: string): BlogContentBlock => ({ type: "heading", text });
const list = (...items: string[]): BlogContentBlock => ({ type: "list", items });
const quote = (text: string): BlogContentBlock => ({ type: "quote", text });

function blockText(block: BlogContentBlock): string {
  return block.type === "list" ? block.items.join(" ") : block.text;
}

function wordCount(content: BlogContentBlock[], faqs: BlogFaq[] = []): number {
  return [...content.map(blockText), ...faqs.flatMap((f) => [f.question, f.answer])]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Misma estimación que `apps/admin/src/lib/posts.ts` (~200 palabras/min). */
function readingTime(content: BlogContentBlock[]): number {
  return Math.max(1, Math.round(wordCount(content) / 200));
}

// ─────────────────────────────────────────────────────────────────────────
//  Posts nuevos (docs/blog-borradores-seo.md, pulidos)
// ─────────────────────────────────────────────────────────────────────────

const NEW_POSTS: Omit<PostInput, "readingTime" | "date" | "status">[] = [
  {
    slug: "cuanto-cuesta-desarrollar-una-app",
    keyword: "cuánto cuesta desarrollar una app",
    targetLanding: "desarrollo-de-aplicaciones-vigo",
    author: AUTHOR,
    title: "¿Cuánto cuesta desarrollar una app? Qué decide el precio",
    h1: "¿Cuánto cuesta desarrollar una app?",
    metaDescription:
      "Qué hace que desarrollar una app cueste más o menos: alcance, plataformas, backend, integraciones y costes de tienda. Guía para empresas de Vigo y Galicia.",
    category: "Desarrollo de apps",
    excerpt:
      "No hay una tarifa universal: el precio de una app depende de cinco decisiones que puedes tomar antes de hablar con nadie. Te explicamos cuáles son y qué costes quedan fuera del presupuesto.",
    content: [
      p(
        "**Cuánto cuesta desarrollar una app** es la pregunta que más recibimos, y casi siempre llega antes de que sepamos qué tiene que hacer esa app. La respuesta honesta es que depende, y que una tarifa cerrada de catálogo suele esconder algo: o se ha dejado fuera parte del trabajo, o se está cobrando por lo que no necesitas. Lo útil no es una cifra suelta, sino saber qué mueve el precio para poder comparar presupuestos con criterio.",
      ),
      p(
        "Un presupuesto de desarrollo es, en el fondo, horas de trabajo multiplicadas por el precio de esas horas. El precio por hora varía entre proveedores, pero lo que de verdad dispara o contiene el total son las horas, y las horas dependen de cinco decisiones.",
      ),
      h("1. El alcance de la primera versión"),
      p(
        "Es el factor que más pesa. Una app de catálogo con contenido que se actualiza poco no se parece a una plataforma con cuentas de usuario, pagos, roles y un panel de gestión. Cada pantalla, cada tipo de usuario y cada flujo (registrarse, reservar, pagar, cancelar) son horas de diseño, desarrollo y pruebas.",
      ),
      p(
        "Por eso conviene decidir qué entra en la primera versión y qué puede esperar. Una versión 1 bien recortada llega antes a las tiendas, cuesta menos y, sobre todo, te da datos reales de uso para decidir qué construir después. Lo contrario —intentar lanzar con todo— es la forma más habitual de que un proyecto se alargue y se encarezca.",
      ),
      list(
        "Imprescindible para lanzar: lo que resuelve el problema principal de tu usuario.",
        "Importante pero aplazable: lo que mejora la experiencia, pero sin lo que la app ya funciona.",
        "Deseable: ideas que conviene validar con usuarios reales antes de pagarlas.",
      ),
      h("2. Una plataforma, dos, o una base compartida"),
      p(
        "Una app nativa para iPhone (Swift y SwiftUI) y otra para Android (Kotlin y Jetpack Compose) son, a efectos prácticos, dos desarrollos. Con una tecnología multiplataforma como React Native o Flutter se comparte gran parte del código entre las dos tiendas y el coste y los plazos se ajustan, a cambio de algunas limitaciones cuando se necesita acceso profundo al hardware o funciones muy recientes del sistema.",
      ),
      p(
        "Para la mayoría de apps de negocio, la multiplataforma es la opción sensata; para productos que viven del rendimiento o del hardware, la nativa se paga sola. Lo explicamos con detalle en [apps nativas o multiplataforma: cómo decidir](/blog/apps-nativas-o-multiplataforma).",
      ),
      h("3. El backend que no se ve"),
      p(
        "La app es la parte visible, pero casi siempre hay un servidor detrás: cuentas de usuario, base de datos, notificaciones push, envío de correos, almacenamiento de imágenes y un panel de administración para que tu equipo gestione el contenido sin llamar al desarrollador. Es fácil no verlo al pedir presupuesto y suele ser una parte importante del trabajo.",
      ),
      p(
        "Hay dos caminos: servicios gestionados (bases de datos y autenticación en la nube) que aceleran el arranque, o un backend a medida cuando la lógica de negocio lo pide. Un buen presupuesto dice cuál se propone y por qué, porque la decisión afecta también a lo que pagarás cada mes después del lanzamiento.",
      ),
      h("4. Las integraciones con lo que ya usas"),
      p(
        "Conectar la app con tu ERP, tu CRM, una pasarela de pago, un sistema de reservas o cualquier herramienta que ya funcione en tu empresa añade trabajo. Si existe un conector oficial o una API documentada, el esfuerzo es acotado. Si no existe, hay que construir un sincronizador que lea y escriba datos entre los dos sistemas sin duplicarlos ni perderlos, y eso hay que presupuestarlo aparte.",
      ),
      h("5. Diseño, pruebas y publicación"),
      p(
        "Un prototipo navegable antes de programar cuesta horas, pero ahorra muchas más: es mucho más barato mover una pantalla en un prototipo que en código. Después vienen las pruebas en dispositivos reales, la preparación de las fichas de tienda (textos, capturas, política de privacidad) y la revisión de Apple y Google, que puede pedir cambios antes de aprobar la app.",
      ),
      quote(
        "La pregunta útil no es cuánto cuesta una app, sino cuánto cuesta la primera versión que resuelve el problema de tus usuarios.",
      ),
      h("Costes que no están en el presupuesto de desarrollo"),
      p(
        "Hay gastos que no dependen del proveedor que elijas y conviene tenerlos en cuenta desde el principio:",
      ),
      list(
        "**Cuentas de desarrollador:** Apple cobra una cuota anual de 99 USD por el Apple Developer Program; Google Play, un pago único de 25 USD por registrar la cuenta.",
        "**Infraestructura:** servidor, base de datos, almacenamiento y envío de notificaciones o correos. Con poco tráfico suele ser un coste pequeño, pero crece con el uso.",
        "**Comisiones de tienda:** si vendes contenido o suscripciones digitales dentro de la app, Apple y Google se quedan con un porcentaje (por lo general, un 15 % para desarrolladores pequeños acogidos a sus programas y un 30 % en el caso general; en la Unión Europea Apple ofrece además condiciones alternativas). No aplica a bienes físicos ni a servicios que se consumen fuera de la app, como un pedido o una reserva.",
        "**Mantenimiento:** Apple y Google publican versiones nuevas de sus sistemas cada año y cambian requisitos; una app sin mantenimiento acaba dando problemas o saliendo de la tienda.",
      ),
      h("Cuánto se tarda en desarrollar una app"),
      p(
        "Una app bien definida suele estar en las tiendas entre 2 y 4 meses. Si hay un backend complejo o integraciones con sistemas existentes, puede llevar más. El calendario realista, con hitos que puedas comprobar, debería salir de la fase de definición, no de la primera llamada. Y durante el desarrollo deberías poder instalar la app en tu propio móvil desde las primeras semanas (TestFlight en iPhone, pruebas internas de Google Play en Android).",
      ),
      h("Cómo pedir un presupuesto que puedas comparar"),
      list(
        "Explica el problema que quieres resolver y para quién, antes de proponer pantallas o funcionalidades.",
        "Pide que el presupuesto separe alcance, plataformas, backend, integraciones, diseño y publicación.",
        "Pregunta qué incluye el mantenimiento, qué no, y cuánto cuesta después del lanzamiento.",
        "Aclara a quién pertenecen el código y las cuentas de las tiendas al terminar.",
        "Desconfía de cualquier cifra que llegue sin haber hablado antes de tu caso.",
      ),
      p(
        "Dos presupuestos con el mismo número pueden incluir cosas muy distintas. Compararlos partida a partida es la única forma de saber cuál es más barato de verdad.",
      ),
      p(
        "En Action analizamos cada caso y enviamos un presupuesto cerrado y detallado en 24 horas, sin compromiso. Si estás en la zona, tienes toda la información sobre cómo trabajamos en [desarrollo de aplicaciones en Vigo](/desarrollo-de-aplicaciones-vigo) y en [desarrollo de aplicaciones en Pontevedra](/desarrollo-de-aplicaciones-pontevedra).",
      ),
    ],
    faqs: [
      {
        question: "¿Por qué no hay un precio fijo para desarrollar una app?",
        answer:
          "Porque el coste son horas de trabajo, y las horas dependen del alcance, de si se desarrolla para una o dos plataformas, del backend y de las integraciones. Dos apps que parecen iguales por fuera pueden tener por detrás un trabajo muy distinto.",
      },
      {
        question: "¿Es más barato hacer la app multiplataforma?",
        answer:
          "En la mayoría de apps de negocio, sí: con React Native o Flutter se comparte gran parte del código entre iPhone y Android. Si la app depende de hardware específico o de un rendimiento muy exigente, el desarrollo nativo puede compensar.",
      },
      {
        question: "¿Qué costes tiene una app después de publicarla?",
        answer:
          "La cuota anual de Apple (99 USD), la infraestructura del servidor, las posibles comisiones de las tiendas si vendes contenido digital dentro de la app, y el mantenimiento para adaptarla a las nuevas versiones de iOS y Android.",
      },
      {
        question: "¿Cuánto tarda en estar lista una app?",
        answer:
          "Una app bien definida suele estar en las tiendas entre 2 y 4 meses. Con backend complejo o integraciones con sistemas existentes puede llevar más; el calendario realista sale de la fase de definición.",
      },
    ],
  },
  {
    slug: "app-o-aplicacion-web-pwa",
    keyword: "app o aplicación web",
    targetLanding: "desarrollo-de-aplicaciones-galicia",
    author: AUTHOR,
    title: "¿App o aplicación web? Cuándo te basta con una PWA",
    h1: "¿Necesitas una app o te basta con una aplicación web?",
    metaDescription:
      "App de tienda o aplicación web (PWA): qué puede hacer cada una hoy, cuándo compensa cada opción y cómo afecta a coste y mantenimiento. Criterios claros antes de decidir.",
    category: "Desarrollo de apps",
    excerpt:
      "No todo proyecto necesita pasar por la App Store. Te explicamos qué puede hacer hoy una aplicación web instalable, cuándo se queda corta y cómo decidir sin pagar de más.",
    content: [
      p(
        "Antes de decidir entre nativa o multiplataforma hay una pregunta previa que casi nadie hace: **¿necesitas una app o te basta con una aplicación web?** Muchas empresas llegan pidiendo \"una app\" cuando lo que necesitan es que sus clientes o sus empleados puedan hacer algo desde el móvil. Y eso, en bastantes casos, se resuelve mejor —y más barato— sin pasar por las tiendas.",
      ),
      h("Tres formas de llegar al móvil de tu cliente"),
      list(
        "**App nativa:** una por sistema, con Swift en iPhone y Kotlin en Android. Máximo rendimiento y acceso completo al hardware.",
        "**App multiplataforma:** una base de código compartida (React Native o Flutter) que se publica en las dos tiendas.",
        "**Aplicación web o PWA:** se abre desde el navegador, se puede instalar en la pantalla de inicio y funciona en cualquier dispositivo, sin App Store ni Google Play.",
      ),
      p(
        "Las dos primeras son apps de tienda; la diferencia entre ellas la explicamos en [apps nativas o multiplataforma](/blog/apps-nativas-o-multiplataforma). Aquí nos centramos en la tercera, que es la que más a menudo se descarta sin haberla valorado.",
      ),
      h("Qué es una PWA y qué puede hacer hoy"),
      p(
        "Una PWA (Progressive Web App) es una aplicación web que el usuario puede añadir a la pantalla de inicio y que se abre a pantalla completa, sin la barra del navegador, con su propio icono. Por fuera se parece mucho a una app; por dentro es una web, con una sola base de código para móvil, tableta y ordenador.",
      ),
      list(
        "**Instalación sin tienda:** se instala desde el navegador, sin esperar revisiones ni crear cuentas de desarrollador.",
        "**Funcionamiento sin conexión:** con un service worker puede guardar datos y pantallas para seguir funcionando con mala cobertura.",
        "**Notificaciones push:** en Android funcionan desde hace años; en iPhone, desde iOS 16.4, siempre que el usuario haya añadido la aplicación a su pantalla de inicio.",
        "**Actualizaciones inmediatas:** publicas un cambio y todos los usuarios lo tienen en la siguiente carga, sin pasar por revisión.",
        "**Indexable:** sus páginas públicas pueden aparecer en Google, algo que una app de tienda no consigue.",
      ),
      h("Cuándo una aplicación web es la mejor opción"),
      p(
        "Hay proyectos en los que una aplicación web no es la alternativa barata, sino directamente la correcta:",
      ),
      list(
        "**Herramientas internas:** paneles de gestión, partes de trabajo, control de pedidos o inventario que usa tu equipo desde el móvil y desde el ordenador.",
        "**Portales de cliente:** consultar pedidos, descargar facturas, pedir cita o ver el estado de un servicio. El cliente no quiere instalar nada para eso.",
        "**Productos SaaS:** se usan sobre todo en escritorio y el móvil es un complemento.",
        "**Uso esporádico:** si tus usuarios van a entrar dos veces al año, pedirles que descarguen una app es una barrera que muchos no van a saltar.",
      ),
      h("Cuándo necesitas una app de tienda"),
      p("En cambio, hay señales claras de que una aplicación web se va a quedar corta:"),
      list(
        "La app depende de **hardware** de forma intensiva: Bluetooth, NFC, sensores, cámara con procesado en tiempo real. En Safari para iPhone, por ejemplo, no está disponible la API de Web Bluetooth.",
        "Necesita trabajar **en segundo plano** de forma fiable: seguimiento de rutas, sincronizaciones largas, geolocalización continua.",
        "La **presencia en las tiendas** forma parte del producto: tus usuarios te van a buscar en App Store o Google Play.",
        "Vas a vender **suscripciones o contenido digital** y quieres usar el sistema de pagos de las tiendas.",
        "Las **notificaciones** son el núcleo del producto y no puedes depender de que el usuario instale la web en su pantalla de inicio.",
      ),
      quote(
        "Si la única razón para hacer una app es \"estar en las tiendas\", conviene preguntarse si tus clientes te van a buscar allí.",
      ),
      h("Lo que cambia en coste y mantenimiento"),
      p(
        "Una aplicación web se desarrolla una vez y funciona en todos los dispositivos. No hay cuentas de desarrollador que pagar, ni revisiones de Apple y Google que esperar, ni comisiones de tienda sobre las ventas digitales. El mantenimiento también es más simple: una sola base de código y despliegues inmediatos.",
      ),
      p(
        "Una app de tienda, a cambio, te da acceso completo al dispositivo y un canal de distribución propio, pero exige mantener compatibilidad con cada versión nueva de iOS y Android y pasar la revisión de las tiendas con cada actualización. Ninguna de las dos cosas es mala; simplemente hay que saber que existen antes de elegir. Si quieres ver qué pesa en el precio de una app de tienda, lo desglosamos en [cuánto cuesta desarrollar una app](/blog/cuanto-cuesta-desarrollar-una-app).",
      ),
      h("Una ruta intermedia: empezar por la web"),
      p(
        "No es una decisión para siempre. Un planteamiento habitual es lanzar primero una aplicación web, validar que el producto funciona y que la gente lo usa, y después dar el salto a una app de tienda si hace falta. Si el backend y las APIs se diseñan bien desde el principio, la app posterior reutiliza toda esa lógica y solo hay que construir la parte visible.",
      ),
      h("Cómo decidirlo en cinco preguntas"),
      list(
        "¿Quién la va a usar: tus empleados, tus clientes o el público general?",
        "¿Con qué frecuencia? A diario justifica una app; de vez en cuando, casi nunca.",
        "¿Necesita hardware del móvil más allá de la cámara y la ubicación básica?",
        "¿Tiene que funcionar en segundo plano o con notificaciones críticas?",
        "¿Tus usuarios te van a buscar en una tienda de apps o en Google?",
      ),
      p(
        "Si la mayoría de respuestas apuntan a uso interno, frecuencia baja y sin hardware especial, una aplicación web te va a salir mejor. Si apuntan a uso diario, hardware y presencia en tiendas, lo tuyo es una app.",
      ),
      p(
        "Es una evaluación que hacemos en la primera reunión, y si no necesitas una app, te lo decimos. Trabajamos con empresas de toda la comunidad: puedes ver cómo en [desarrollo de aplicaciones en Galicia](/desarrollo-de-aplicaciones-galicia), y si lo tuyo es una aplicación web, en [desarrollo web en Vigo](/desarrollo-web-vigo).",
      ),
    ],
    faqs: [
      {
        question: "¿Qué es una PWA?",
        answer:
          "Una aplicación web que se puede instalar en la pantalla de inicio del móvil, se abre a pantalla completa, puede funcionar sin conexión y enviar notificaciones, sin pasar por App Store ni Google Play.",
      },
      {
        question: "¿Una PWA funciona en iPhone?",
        answer:
          "Sí. Se puede añadir a la pantalla de inicio desde Safari y, desde iOS 16.4, recibir notificaciones push si el usuario la ha instalado. Algunas APIs del dispositivo, como Web Bluetooth, no están disponibles en iPhone.",
      },
      {
        question: "¿Una aplicación web es más barata que una app?",
        answer:
          "Normalmente sí, porque se desarrolla una sola vez para todos los dispositivos y no hay cuentas de desarrollador, revisiones ni comisiones de tienda. Lo que decide no es el precio, sino si cubre lo que tu producto necesita.",
      },
      {
        question: "¿Puedo empezar con una web y hacer la app después?",
        answer:
          "Sí, y es un planteamiento habitual. Si el backend y las APIs se diseñan bien desde el principio, la app posterior reutiliza esa lógica y solo hay que construir la parte visible.",
      },
    ],
  },
  {
    slug: "como-elegir-agencia-desarrollo-web-galicia",
    keyword: "agencia de desarrollo web en Galicia",
    targetLanding: "agencia-desarrollo-web-galicia",
    author: AUTHOR,
    title: "Cómo elegir una agencia de desarrollo web en Galicia",
    h1: "Cómo elegir una agencia de desarrollo web en Galicia",
    metaDescription:
      "Criterios para elegir agencia de desarrollo web en Galicia: trabajo verificable, trato directo, presupuesto cerrado, propiedad del código, rendimiento y mantenimiento.",
    category: "Desarrollo web",
    excerpt:
      "Siete cosas que comprobar antes de firmar con una agencia web, sirvan para quien acabes contratando. Incluidas las preguntas que a nadie le gusta hacer al principio.",
    content: [
      p(
        "Elegir una **agencia de desarrollo web en Galicia** es, en realidad, elegir con quién vas a hablar los próximos años: la web se lanza una vez, pero se mantiene, se cambia y se amplía durante mucho tiempo. Estos criterios te sirven para evaluar a cualquier agencia, también a nosotros, y la mayoría se pueden comprobar antes de firmar.",
      ),
      h("1. Trabajo real que puedas verificar"),
      p(
        "Un porfolio con capturas bonitas no demuestra gran cosa. Pide enlaces a webs en producción y entra en ellas: comprueba que existen, que cargan rápido en tu móvil y que funcionan los formularios. Si puedes, pregunta a alguno de esos clientes cómo fue el proyecto y cómo es el trato después del lanzamiento.",
      ),
      p(
        "Las reseñas de Google de clientes reales también dicen mucho, sobre todo las que cuentan qué pasó cuando algo salió mal. Una agencia que resuelve bien los problemas vale más que una que promete que no los habrá.",
      ),
      h("2. Con quién vas a hablar"),
      p(
        "Pregunta quién va a diseñar y quién va a programar tu web, y si vas a poder hablar con esas personas. Si entre tú y el equipo hay alguien que solo traslada mensajes, cada cambio pierde matices y tiempo. Y si el desarrollo está subcontratado, es importante saberlo antes, no descubrirlo cuando haya que arreglar algo con prisa.",
      ),
      h("3. Presupuesto cerrado y detallado"),
      p(
        "Un presupuesto útil separa alcance, diseño, desarrollo, integraciones y mantenimiento, y dice por escrito qué está incluido y qué no. Desconfía de las cifras que llegan sin haber hablado de tu caso y de los precios que no explican qué cubren: es la forma más habitual de que el coste final no se parezca al inicial.",
      ),
      list(
        "Alcance por escrito: páginas, funcionalidades e integraciones.",
        "Calendario con hitos intermedios, no solo una fecha final.",
        "Qué pasa si durante el proyecto quieres añadir algo: cómo se presupuesta.",
      ),
      h("4. Qué te llevas al terminar"),
      p(
        "Aclara desde el principio a quién pertenecen el código, el dominio, el alojamiento y las cuentas (analítica, Google Business Profile, pasarela de pago). Lo razonable es que estén a nombre de tu empresa. En España, además, conviene que el contrato recoja expresamente la cesión de los derechos de explotación del código desarrollado para ti: si no se dice nada, no hay que darlo por hecho.",
      ),
      p(
        "Es una pregunta que incomoda mucho menos al principio que el día que quieras cambiar de proveedor.",
      ),
      h("5. Rendimiento y SEO técnico, con datos"),
      p(
        "Cualquier agencia dirá que sus webs son rápidas y están optimizadas. Se puede comprobar: pasa sus proyectos por PageSpeed Insights de Google y mira las Core Web Vitals, las métricas con las que Google mide la experiencia real. Los umbrales de \"bueno\" que publica Google son un LCP de hasta 2,5 segundos, un INP de hasta 200 milisegundos y un CLS de hasta 0,1.",
      ),
      p(
        "Recuerda también que Google indexa la versión móvil de tu web. Si la agencia enseña sus proyectos en una pantalla grande, pídele que te los enseñe en un móvil.",
      ),
      h("6. Accesibilidad"),
      p(
        "Una web accesible la pueden usar personas con discapacidad visual, motora o cognitiva, y suele ser también más clara para todos. Además, desde el 28 de junio de 2025, la Ley 11/2023 —que traslada la Ley Europea de Accesibilidad— exige requisitos de accesibilidad a muchos servicios digitales, entre ellos el comercio electrónico, con excepciones para las microempresas. Pregunta a la agencia cómo lo trabaja y cómo lo verifica.",
      ),
      h("7. Mantenimiento sin letra pequeña"),
      p(
        "Una web necesita actualizaciones de seguridad, copias de seguridad y cambios de contenido. Pregunta qué planes de mantenimiento hay, qué incluyen, cuánto tardan en responder a una incidencia y, sobre todo, si tienen permanencia. Una agencia que confía en su trabajo no necesita atarte.",
      ),
      quote(
        "La mejor señal de una agencia no es lo que promete antes de firmar, sino lo fácil que te lo pone para irte si algún día no estás contento.",
      ),
      h("¿Agencia o freelance?"),
      p(
        "Un buen freelance puede encajar en webs pequeñas y con poco mantenimiento. Para una web que es parte del negocio —una tienda online, una aplicación web, una web que capta clientes todos los días—, un equipo cubre diseño, desarrollo, backend y mantenimiento sin depender de una sola persona, y el proyecto no se detiene si alguien se pone enfermo o se va de vacaciones.",
      ),
      h("Por qué importa que esté cerca"),
      p(
        "Trabajar con una agencia de tu misma comunidad y franja horaria hace las reuniones más ágiles y permite verse en persona cuando importa: el arranque del proyecto, la revisión del diseño o el lanzamiento. También ayuda que conozca tu mercado; no es lo mismo escribir para un cliente de Vigo, de Santiago o de Madrid.",
      ),
      p(
        "Si quieres profundizar en qué preguntar en la primera reunión, lo contamos en [qué mirar antes de contratar una agencia en Vigo](/blog/que-mirar-antes-de-contratar-agencia-vigo). Nosotros estamos en Vigo y trabajamos con empresas de toda Galicia: puedes ver cómo en [agencia de desarrollo web en Galicia](/agencia-desarrollo-web-galicia), [desarrollo web en Pontevedra](/desarrollo-web-pontevedra) y [diseño web en Vigo](/diseno-web-vigo).",
      ),
    ],
    faqs: [
      {
        question: "¿Qué debo pedir a una agencia antes de contratarla?",
        answer:
          "Enlaces a proyectos en producción, un presupuesto cerrado que separe alcance, diseño, desarrollo y mantenimiento, un calendario con hitos y claridad sobre a quién pertenecen el código, el dominio y las cuentas al terminar.",
      },
      {
        question: "¿Cómo compruebo si una web es rápida?",
        answer:
          "Con PageSpeed Insights de Google. Fíjate en las Core Web Vitals: Google considera buenos un LCP de hasta 2,5 segundos, un INP de hasta 200 milisegundos y un CLS de hasta 0,1, medidos en móvil.",
      },
      {
        question: "¿El código de mi web es mío?",
        answer:
          "Debería, pero no hay que darlo por hecho: conviene que el contrato recoja expresamente la cesión de los derechos de explotación del código y que dominio, alojamiento y cuentas estén a nombre de tu empresa.",
      },
      {
        question: "¿Es mejor una agencia local o una remota?",
        answer:
          "Una agencia de tu comunidad facilita reuniones presenciales en los momentos clave, comparte franja horaria y conoce tu mercado. Lo decisivo sigue siendo la calidad del trabajo y el trato directo con quien lo hace.",
      },
    ],
  },
  {
    slug: "shopify-o-tienda-online-a-medida",
    keyword: "Shopify o tienda online a medida",
    targetLanding: "tienda-online-vigo",
    author: AUTHOR,
    title: "Shopify o tienda online a medida: cómo decidir",
    h1: "Shopify o tienda online a medida: cómo decidir",
    metaDescription:
      "Cuándo compensa Shopify y cuándo un ecommerce a medida: catálogo, costes recurrentes, pagos con Redsys y Bizum, integración con el ERP y plazos. Guía para negocios de Galicia.",
    category: "Desarrollo web",
    excerpt:
      "Las dos opciones son buenas; lo que cambia es tu caso. Así evaluamos si una tienda online debe ir sobre Shopify o desarrollarse a medida, y qué costes conviene comparar.",
    content: [
      p(
        "Antes de montar una tienda online hay que elegir plataforma, y esa decisión condiciona los plazos, los costes y lo que podrás hacer dentro de dos años. La duda más habitual es **Shopify o tienda online a medida**, y la respuesta no depende de cuál es \"mejor\", sino de cómo vendes, qué vendes y con qué sistemas tiene que hablar la tienda.",
      ),
      h("Qué te da Shopify de serie"),
      p(
        "Shopify es una plataforma de comercio electrónico en la nube: pagas una suscripción mensual y a cambio tienes alojamiento, seguridad, actualizaciones, catálogo, carrito, checkout, gestión de pedidos y un ecosistema enorme de aplicaciones para ampliar funciones. No hay servidores que mantener ni parches de seguridad que aplicar.",
      ),
      p(
        "Eso tiene un valor enorme cuando lo que necesitas es vender cuanto antes: el trabajo se concentra en el diseño, el catálogo y la configuración, no en construir lo básico desde cero.",
      ),
      h("Cuándo compensa Shopify"),
      list(
        "El **catálogo y el proceso de venta son estándar**: productos con variantes, carrito, pago y envío.",
        "Quieres **salir antes y con menos inversión inicial**.",
        "Tu equipo va a **gestionar la tienda sin depender** de un desarrollador para el día a día.",
        "Las integraciones que necesitas **ya existen como aplicación** en su ecosistema.",
      ),
      h("Cuándo compensa una tienda a medida"),
      list(
        "Necesitas **reglas de precios propias** que la plataforma no permite: tarifas por cliente, precios por volumen complejos, configuradores de producto.",
        "Tienes que **integrarte a fondo con tu ERP** o con tu sistema de gestión, y no existe un conector que haga lo que necesitas.",
        "Vendes a **empresas y particulares** con condiciones distintas en la misma tienda.",
        "Quieres una **experiencia de compra diferencial** que una plantilla no da.",
      ),
      p(
        "En estos casos, forzar una plataforma estándar suele acabar en una suma de aplicaciones de pago, parches y limitaciones que cuestan más que construir lo que necesitas.",
      ),
      h("Los costes recurrentes que conviene comparar"),
      p(
        "Comparar solo el precio de desarrollo es un error frecuente. Lo que importa es el coste total a varios años:",
      ),
      list(
        "**Con Shopify:** la suscripción mensual según el plan, las aplicaciones de pago que añadas (muchas se cobran también cada mes) y las comisiones por transacción. Si no usas Shopify Payments, la plataforma cobra una comisión adicional sobre cada venta, además de la de tu pasarela.",
        "**A medida:** alojamiento, mantenimiento y actualizaciones de seguridad, y la comisión de la pasarela de pago que elijas. No pagas por cada funcionalidad, pero sí necesitas a alguien que mantenga la tienda.",
      ),
      p(
        "Ninguna es gratis. La pregunta es qué modelo encaja mejor con tu volumen de ventas y con cuánto necesitas personalizar.",
      ),
      h("Pagos: lo que usan tus clientes en España"),
      p(
        "Da igual la plataforma: usa pasarelas que tus clientes conozcan y en las que confíen. En España, el TPV virtual de tu banco (normalmente a través de Redsys), Bizum y Stripe cubren la mayoría de los casos. Bizum para comercios se contrata con tu banco, así que conviene revisarlo pronto. Y un proceso de compra corto y pensado para móvil convierte más que uno con muchos pasos, porque es desde el móvil desde donde compra la mayoría.",
      ),
      h("Integración con tu sistema de gestión"),
      p(
        "Es lo que más se subestima. Si el stock, los pedidos y las facturas viven en un sistema aparte, sincronizarlos evita duplicar datos a mano y vender lo que ya no tienes. Con Shopify hay conectores para muchos ERP; cuando no existe el que necesitas, o no hace exactamente lo que tu negocio pide, se desarrolla un sincronizador propio. Pregunta por esto antes de elegir plataforma, no después.",
      ),
      quote(
        "Una tienda online no es una web con un carrito: es un canal de venta que tiene que hablar con el resto de tu negocio.",
      ),
      h("SEO y migración si ya vendes online"),
      p(
        "Si ya tienes tienda y cambias de plataforma, el riesgo principal es perder posicionamiento. Se evita migrando catálogo, clientes y pedidos, conservando las URLs cuando se puede y creando redirecciones 301 de cada dirección antigua a la nueva cuando no. Una migración bien hecha no debería costarte ventas; una hecha deprisa puede costarte meses de tráfico.",
      ),
      h("Cuánto se tarda"),
      p(
        "Un ecommerce suele estar en producción entre 1 y 3 meses, según el tamaño del catálogo y las integraciones. Una tienda sobre Shopify con catálogo estándar se sitúa en la parte baja de esa horquilla; un desarrollo a medida conectado a un ERP, en la alta.",
      ),
      h("Cómo decidir"),
      list(
        "Si tu venta es estándar y quieres salir pronto → Shopify.",
        "Si tus reglas de negocio o tus integraciones no caben en la plataforma → a medida.",
        "Si dudas, empieza por listar qué tiene que hacer la tienda el primer año y compruébalo contra la plataforma antes de decidir.",
      ),
      p(
        "Hacemos las dos cosas y te decimos cuál te conviene: si Shopify basta para tu caso, te lo diremos. Más información en [tiendas online en Vigo](/tienda-online-vigo). Si además necesitas rehacer la web de la empresa, mira [desarrollo web en Vigo](/desarrollo-web-vigo) y [diseño web en Vigo](/diseno-web-vigo).",
      ),
    ],
    faqs: [
      {
        question: "¿Shopify es más barato que una tienda a medida?",
        answer:
          "Al principio, casi siempre: la inversión inicial es menor. A varios años depende de la suscripción, las aplicaciones de pago y las comisiones frente al mantenimiento de una tienda propia. Hay que comparar el coste total, no solo el desarrollo.",
      },
      {
        question: "¿Puedo cobrar con Bizum en mi tienda online?",
        answer:
          "Sí. Bizum para comercios se contrata con tu banco y se integra normalmente a través del TPV virtual (Redsys). Funciona tanto en tiendas a medida como en plataformas como Shopify mediante la integración correspondiente.",
      },
      {
        question: "¿Puedo conectar Shopify con mi ERP?",
        answer:
          "Para muchos ERP existen conectores. Si no hay uno para el tuyo, o no hace lo que necesitas, se desarrolla un sincronizador de stock, pedidos y facturas entre la tienda y tu sistema.",
      },
      {
        question: "¿Perderé posicionamiento si cambio de plataforma?",
        answer:
          "No tiene por qué. Migrando catálogo, clientes y pedidos, conservando URLs y configurando redirecciones 301 de las direcciones antiguas, el cambio no debería costarte tráfico ni ventas.",
      },
      {
        question: "¿Cuánto tarda en estar lista una tienda online?",
        answer:
          "Entre 1 y 3 meses según catálogo e integraciones. Una tienda sobre Shopify con catálogo estándar se sitúa en la parte baja; un desarrollo a medida conectado a un ERP, en la alta.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
//  Posts originales (scripts/seed-blog-posts.ts): solo se AÑADE, no se reescribe
// ─────────────────────────────────────────────────────────────────────────

interface Enrichment {
  slug: string;
  keyword: string;
  targetLanding: string;
  faqs: BlogFaq[];
  /** Párrafo de cierre con los enlaces internos; se añade al final una sola vez. */
  linkParagraph: string;
}

const ENRICHMENTS: Enrichment[] = [
  {
    slug: "apps-nativas-o-multiplataforma",
    keyword: "app nativa o multiplataforma",
    targetLanding: "desarrollo-de-aplicaciones-vigo",
    linkParagraph:
      "Si aún no tienes claro si necesitas una app o te basta con una aplicación web, empieza por [app o aplicación web](/blog/app-o-aplicacion-web-pwa); y si quieres saber qué pesa en el presupuesto, lo desglosamos en [cuánto cuesta desarrollar una app](/blog/cuanto-cuesta-desarrollar-una-app). Todo sobre cómo trabajamos, en [desarrollo de aplicaciones en Vigo](/desarrollo-de-aplicaciones-vigo).",
    faqs: [
      {
        question: "¿Qué diferencia hay entre una app nativa y una multiplataforma?",
        answer:
          "Una app nativa se desarrolla por separado para cada sistema (Swift en iPhone, Kotlin en Android). Una multiplataforma comparte una base de código entre los dos con tecnologías como React Native o Flutter.",
      },
      {
        question: "¿Una app multiplataforma va peor que una nativa?",
        answer:
          "Para la mayoría de apps de negocio (catálogos, reservas, paneles de cliente) la diferencia no se nota. Donde la nativa marca distancia es en animaciones exigentes, procesamiento en tiempo real y acceso profundo al hardware.",
      },
      {
        question: "¿Qué opción es más barata de mantener?",
        answer:
          "Normalmente la multiplataforma, porque hay una sola base de código que actualizar. Con dos apps nativas, cada cambio se hace dos veces.",
      },
    ],
  },
  {
    slug: "senales-web-pierde-clientes",
    keyword: "web pierde clientes",
    targetLanding: "desarrollo-web-vigo",
    linkParagraph:
      "Si reconoces varias de estas señales en tu web, no hace falta rehacerlo todo de golpe: empieza por la velocidad en móvil y por el contacto visible. Si prefieres que lo revisemos contigo, mira cómo trabajamos en [desarrollo web en Vigo](/desarrollo-web-vigo) y [diseño web en Vigo](/diseno-web-vigo).",
    faqs: [
      {
        question: "¿Cómo sé si mi web carga lento?",
        answer:
          "Pásala por PageSpeed Insights de Google y mira el resultado en móvil. Google considera bueno un LCP (lo que tarda en verse el contenido principal) de hasta 2,5 segundos.",
      },
      {
        question: "¿Por qué importa tanto la versión móvil?",
        answer:
          "Porque Google indexa la versión móvil de tu web y la usa para posicionarla. Si en móvil se ve o funciona peor, es esa peor versión la que compite en los resultados.",
      },
      {
        question: "¿Cómo aparezco en búsquedas de mi ciudad?",
        answer:
          "Con contenido real que mencione tu zona y tus servicios, una ficha de Google Business Profile completa y con reseñas, y los mismos datos de nombre, dirección y teléfono en la web y en la ficha.",
      },
    ],
  },
  {
    slug: "que-mirar-antes-de-contratar-agencia-vigo",
    keyword: "contratar agencia de desarrollo en Vigo",
    targetLanding: "desarrollo-de-aplicaciones-vigo",
    linkParagraph:
      "Si quieres una lista más completa para comparar agencias —incluidos rendimiento, accesibilidad y propiedad del código—, la tienes en [cómo elegir una agencia de desarrollo web en Galicia](/blog/como-elegir-agencia-desarrollo-web-galicia). Y si tu proyecto es una app o una web, cuéntanos en [desarrollo de aplicaciones en Vigo](/desarrollo-de-aplicaciones-vigo) o en [desarrollo web en Vigo](/desarrollo-web-vigo).",
    faqs: [
      {
        question: "¿Qué preguntar en la primera reunión con una agencia?",
        answer:
          "Quién va a desarrollar realmente el proyecto, si el presupuesto es cerrado y qué incluye, qué plazos con hitos intermedios propone y qué pasa después del lanzamiento con el mantenimiento.",
      },
      {
        question: "¿Qué es un presupuesto cerrado?",
        answer:
          "Uno con el alcance por escrito —funcionalidades, plazos y qué está incluido y qué no— que no cambia a mitad de proyecto salvo que tú decidas añadir algo nuevo.",
      },
      {
        question: "¿Por qué importa el mantenimiento desde el principio?",
        answer:
          "Porque una web o una app necesitan actualizaciones, correcciones y, en el caso de las apps, adaptarse a los requisitos que Apple y Google cambian con cada versión de sus sistemas.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
//  Ejecución
// ─────────────────────────────────────────────────────────────────────────

function initDb(): Firestore {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error("Falta FIREBASE_PROJECT_ID en el entorno.");
    process.exit(1);
  }
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const app = initializeApp({
    projectId,
    credential:
      clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault(),
  });
  return getFirestore(app);
}

async function findBySlug(db: Firestore, slug: string) {
  const snap = await db.collection("posts").where("slug", "==", slug).limit(1).get();
  return snap.docs[0];
}

async function upsertNewPost(
  db: Firestore | null,
  post: (typeof NEW_POSTS)[number],
): Promise<void> {
  const words = wordCount(post.content, post.faqs);
  const input: PostInput = {
    ...post,
    date: TODAY,
    readingTime: readingTime(post.content),
    status: "published",
  };

  if (!db) {
    console.log(`[dry-run] nuevo ${post.slug} — ${words} palabras, ${input.readingTime} min`);
    return;
  }

  const existing = await findBySlug(db, post.slug);
  if (existing) {
    const prev = existing.data() as PostInput;
    const date = prev.date ?? TODAY;
    await existing.ref.set({
      ...input,
      date,
      ...(TODAY > date ? { updatedAt: TODAY } : {}),
    });
    console.log(`✓ actualizado ${post.slug} (${existing.id})`);
  } else {
    const ref = await db.collection("posts").add(input);
    console.log(`✓ creado ${post.slug} (${ref.id})`);
  }
}

async function enrichExisting(db: Firestore | null, e: Enrichment): Promise<void> {
  if (!db) {
    console.log(`[dry-run] enriquecer ${e.slug} — ${e.faqs.length} FAQs, landing ${e.targetLanding}`);
    return;
  }

  const doc = await findBySlug(db, e.slug);
  if (!doc) {
    console.warn(`⚠ ${e.slug}: no existe en Firestore, se omite`);
    return;
  }

  const prev = doc.data() as PostInput;
  const content = prev.content ?? [];
  const hasLinks = content.some(
    (b) => b.type === "paragraph" && b.text === e.linkParagraph,
  );
  const nextContent = hasLinks ? content : [...content, p(e.linkParagraph)];

  await doc.ref.update({
    content: nextContent,
    readingTime: readingTime(nextContent),
    keyword: e.keyword,
    targetLanding: e.targetLanding,
    faqs: e.faqs,
    author: AUTHOR,
    ...(TODAY > prev.date ? { updatedAt: TODAY } : {}),
  });
  console.log(`✓ enriquecido ${e.slug} (${doc.id})${hasLinks ? " — enlaces ya presentes" : ""}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const only = new Set(args.filter((a) => !a.startsWith("--")));
  const pick = (slug: string) => only.size === 0 || only.has(slug);

  const db = dryRun ? null : initDb();
  const touched: string[] = [];

  for (const post of NEW_POSTS.filter((x) => pick(x.slug))) {
    try {
      await upsertNewPost(db, post);
      touched.push(post.slug);
    } catch (err) {
      console.error(`✗ ${post.slug}: ${(err as Error).message}`);
    }
  }

  for (const e of ENRICHMENTS.filter((x) => pick(x.slug))) {
    try {
      await enrichExisting(db, e);
      touched.push(e.slug);
    } catch (err) {
      console.error(`✗ ${e.slug}: ${(err as Error).message}`);
    }
  }

  console.log(`\nSlugs a revalidar: ${touched.join(" ")}`);
}

main();
