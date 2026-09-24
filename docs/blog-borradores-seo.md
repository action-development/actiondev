# Borradores de blog SEO — Action

**Estado:** borradores para revisar. **No están publicados**: publicar es escribir en Firestore (colección `posts`) desde `apps/admin`, y es contenido público. Nada de esto se ha subido.

**Cómo usarlos:** cada post sigue el esquema `BlogPost` de `packages/shared/src/blog.ts`. En el panel, `title`, `metaDescription`, `category`, `h1` y `excerpt` van en sus campos, y el cuerpo se compone con bloques: `##` = `heading`, párrafo = `paragraph`, listas = `list`, cita = `quote`. `status` empieza en `draft`.

**Reglas que he seguido** (para que revises con el mismo criterio):
- Ningún precio ni cifra inventada. Los únicos plazos son los que ya publican las landings (app: 2-4 meses; web corporativa: 3-6 semanas; ecommerce o app web: 1-3 meses). **Si quieres poner rangos de precio, tienen que salir de vuestra experiencia real: yo no los sé.**
- Tono de las landings: directo, sin exagerar, admitiendo cuándo algo no compensa.
- Cada post enlaza a la landing comercial que corresponde (enlazado interno que hoy falta) — marcado con `→ enlace`.
- Palabra clave principal en `title`, `h1` y primer párrafo; una pregunta real que la gente hace.
- **Fecha:** dejar la del día de publicación. No tocar `CONTENT_UPDATED` de `sitemap.ts` por esto: los posts entran solos en el sitemap con su `date`.

---

## Post 1 — Coste de una app

- **slug:** `cuanto-cuesta-desarrollar-una-app`
- **title:** ¿Cuánto cuesta desarrollar una app? Qué decide el precio
- **metaDescription:** Qué hace que una app cueste más o menos: alcance, plataformas, backend e integraciones. Guía para empresas de Vigo y Galicia antes de pedir presupuesto.
- **category:** Aplicaciones
- **readingTime:** 5
- **h1:** ¿Cuánto cuesta desarrollar una app?
- **excerpt:** No hay una tarifa universal: el precio depende de cinco decisiones que puedes tomar antes de hablar con nadie. Te explicamos cuáles son.

**Contenido**

La pregunta más habitual que recibimos es cuánto cuesta una app. La respuesta honesta es que depende, y que una tarifa cerrada de catálogo casi siempre esconde algo: o se ha dejado fuera parte del trabajo, o se está cobrando por lo que no necesitas. Lo útil es saber qué mueve el precio, para que puedas comparar presupuestos con criterio.

## 1. El alcance de la primera versión

Es el factor que más pesa. Una app de catálogo con contenido que se actualiza poco no se parece a una plataforma con usuarios, pagos y roles. Antes de hablar de dinero, conviene decidir qué entra en la primera versión y qué puede esperar. Una versión 1 bien recortada sale antes al mercado y te da datos reales para decidir qué construir después.

## 2. Una plataforma o dos

Una app nativa para iPhone y otra para Android son dos desarrollos. Con una tecnología multiplataforma como React Native o Flutter se comparte gran parte del código y los costes y plazos se ajustan, a cambio de algunas limitaciones cuando se necesita acceso profundo al hardware. Lo explicamos con detalle en nuestra guía de app nativa frente a multiplataforma.

## 3. El backend

La app es la parte visible, pero casi siempre hay un servidor detrás: cuentas de usuario, base de datos, notificaciones, panel de administración. Es fácil no verlo al pedir presupuesto y suele ser una parte importante del trabajo.

## 4. Las integraciones

Conectar la app con un ERP, un CRM, una pasarela de pago o cualquier sistema que ya uses añade trabajo, sobre todo cuando no existe un conector oficial y hay que construir un sincronizador.

## 5. Diseño y mantenimiento

Un prototipo navegable antes de programar evita rehacer trabajo. Y después del lanzamiento, una app necesita actualizaciones de sistema, mejoras y soporte: conviene contarlo desde el principio.

## Cuánto se tarda

Una app bien definida suele estar en las tiendas entre 2 y 4 meses. Si hay un backend complejo o integraciones con sistemas existentes, puede llevar más. Un calendario realista con hitos verificables debería salir de la fase de definición.

## Cómo pedir un presupuesto útil

- Explica el problema que quieres resolver y para quién, antes de proponer soluciones.
- Pide que el presupuesto detalle alcance, plataformas, backend e integraciones por separado.
- Pregunta qué incluye el mantenimiento y qué no.
- Desconfía de cualquier cifra que llegue sin haber hablado antes de tu caso.

En Action analizamos cada caso y enviamos un presupuesto cerrado y detallado en 24 horas, sin compromiso. Si quieres saber cómo trabajamos, tienes toda la información en [desarrollo de aplicaciones en Vigo](/desarrollo-de-aplicaciones-vigo). `→ enlace`

---

## Post 2 — Nativa vs multiplataforma

- **slug:** `app-nativa-o-multiplataforma`
- **title:** App nativa o multiplataforma: cuál te conviene
- **metaDescription:** Swift y Kotlin frente a React Native y Flutter: cuándo compensa cada opción, qué se gana y qué se pierde. Criterios claros antes de decidir.
- **category:** Aplicaciones
- **readingTime:** 4
- **h1:** App nativa o multiplataforma: cuál te conviene
- **excerpt:** Elegir mal cuesta tiempo y dinero. Estos son los criterios que usamos para decidir con cada cliente.

**Contenido**

Es la decisión técnica que más afecta a presupuesto y plazos, y casi siempre se toma demasiado pronto. Ni una opción es mejor en general ni la otra es "la barata": encajan en casos distintos.

## Qué es cada cosa

Una app **nativa** se desarrolla por separado para cada sistema, con las herramientas de cada uno: Swift y SwiftUI en iPhone, Kotlin y Jetpack Compose en Android. Una app **multiplataforma** comparte una base de código entre las dos tiendas, con tecnologías como React Native o Flutter.

## Cuándo elegir nativa

- La app necesita **máximo rendimiento** (gráficos exigentes, procesamiento en tiempo real).
- Depende de **hardware específico** o de funciones muy recientes del sistema.
- La experiencia debe sentirse **impecable e idéntica a la del sistema** en cada plataforma.

## Cuándo elegir multiplataforma

- El **presupuesto es ajustado** y quieres estar en las dos tiendas.
- Es una **app de negocio estándar**: formularios, listados, cuentas de usuario, notificaciones.
- Quieres **un solo equipo y una sola base de código** que mantener.

## Y si no necesitas una app

A veces la respuesta es una **aplicación web instalable** (PWA): un panel interno o un portal de cliente que funciona en cualquier dispositivo sin pasar por las tiendas. Si es tu caso, te lo diremos.

## Cómo decidirlo

- ¿Tu app necesita hardware o rendimiento fuera de lo común? → nativa.
- ¿Es una app de negocio estándar con presupuesto acotado? → multiplataforma.
- ¿Solo la van a usar tus empleados o clientes desde un navegador? → aplicación web.

Es una evaluación que hacemos gratis en la primera reunión. Puedes ver cómo trabajamos en [desarrollo de aplicaciones en Vigo](/desarrollo-de-aplicaciones-vigo). `→ enlace`

---

## Post 3 — Cómo elegir agencia

- **slug:** `como-elegir-agencia-desarrollo-web-galicia`
- **title:** Cómo elegir una agencia de desarrollo web en Galicia
- **metaDescription:** Cinco criterios para elegir agencia de desarrollo web en Galicia: trabajo verificable, trato directo, presupuesto cerrado, propiedad del código y mantenimiento.
- **category:** Desarrollo web
- **readingTime:** 4
- **h1:** Cómo elegir una agencia de desarrollo web en Galicia
- **excerpt:** Cinco cosas que comprobar antes de firmar, con independencia de a quién acabes contratando.

**Contenido**

Elegir agencia web es elegir con quién vas a hablar los próximos años. Estos cinco criterios te sirven para evaluar a cualquier agencia, también a nosotros.

## 1. Trabajo real que puedas verificar

Pide ver webs en producción y comprueba que existen y funcionan. Las reseñas de Google de clientes reales dicen más que cualquier porfolio con capturas.

## 2. Con quién hablas

Pregunta quién va a diseñar y quién va a programar tu web. Si entre tú y el equipo hay una persona que solo traduce, cada cambio pierde matices y tiempo. Lo ideal es hablar directamente con quien construye.

## 3. Presupuesto cerrado y detallado

Un presupuesto útil separa alcance, diseño, desarrollo, integraciones y mantenimiento. Desconfía de las cifras que llegan sin haber hablado de tu caso, y de los precios que no explican qué incluyen.

## 4. Qué te llevas al terminar

Aclara desde el principio a quién pertenece el código y el dominio, y si puedes llevarte la web a otro proveedor. Es una pregunta que incomoda menos al principio que al final.

## 5. Mantenimiento

Una web necesita actualizaciones, copias de seguridad y cambios de contenido. Pregunta qué planes hay, qué incluyen y, sobre todo, si tienen permanencia.

## ¿Agencia o freelance?

Un equipo cubre diseño, desarrollo, backend y mantenimiento sin depender de una sola persona, y el proyecto no se detiene si alguien falta. Un freelance puede encajar en webs muy pequeñas; para algo que sea parte del negocio, un equipo da más continuidad.

## Cercanía

Trabajar con una agencia de tu comunidad y en tu misma franja horaria hace las reuniones más ágiles y permite verse en persona cuando importa. Nosotros estamos en Vigo y trabajamos con empresas de toda Galicia: puedes ver cómo en [agencia de desarrollo web en Galicia](/agencia-desarrollo-web-galicia). `→ enlace`

---

## Post 4 — Tienda online

- **slug:** `shopify-o-tienda-online-a-medida`
- **title:** Shopify o tienda online a medida: cómo decidir
- **metaDescription:** Cuándo compensa Shopify y cuándo un ecommerce a medida: catálogo, integraciones con el ERP, pagos y plazos. Guía para negocios de Vigo y Galicia.
- **category:** Desarrollo web
- **readingTime:** 4
- **h1:** Shopify o tienda online a medida: cómo decidir
- **excerpt:** Las dos opciones son buenas; lo que cambia es el caso. Así lo evaluamos.

**Contenido**

Antes de montar una tienda online hay que elegir plataforma, y esa decisión condiciona plazos, costes y lo que podrás hacer dentro de dos años.

## Cuándo compensa Shopify

Cuando el catálogo y el proceso de venta son estándar. Sales antes y con menos coste, y muchas tareas (pagos, envíos, facturas) ya vienen resueltas.

## Cuándo compensa una tienda a medida

- Necesitas **reglas de precios propias** que la plataforma no permite.
- Tienes que **integrarte a fondo con tu ERP** o con tu sistema de gestión.
- Quieres una **experiencia de compra diferencial** que una plantilla no da.

## Pagos

Da igual la plataforma: usa pasarelas que tus clientes conozcan. En España, Redsys, Bizum y Stripe cubren la mayoría de los casos, y un proceso de compra corto y pensado para móvil convierte más que uno con muchos pasos.

## Integración con tu sistema de gestión

Lo que más se subestima. Si el stock, los pedidos y las facturas viven en un sistema aparte, sincronizarlos evita duplicar datos a mano y vender lo que ya no tienes. Cuando no existe conector, se desarrolla.

## Plazos

Un ecommerce suele estar en producción entre 1 y 3 meses, según catálogo e integraciones.

## Si ya tienes tienda

Es posible migrar catálogo, clientes y pedidos conservando las URLs y el posicionamiento, para que el cambio no te cueste ventas.

Si Shopify basta para tu caso, te lo diremos. Más información en [tiendas online en Vigo](/tienda-online-vigo). `→ enlace`

---

## Antes de publicar

- [ ] Revisar que los plazos coinciden con lo que quiere prometer el negocio.
- [ ] Decidir si se añaden rangos de precio reales (solo con datos propios).
- [x] Enlaces internos: el renderer del blog (`app/blog/[slug]/page.tsx`) ya interpreta `[texto](/ruta)` y `**negrita**` en párrafos y listas. Solo enlaces que empiecen por una única `/`; cualquier otro destino se muestra como texto. Pegar el texto tal cual, con la sintaxis de los borradores, y quitar la marca `→ enlace`.
- [ ] Publicar de uno en uno, 1-2 al mes según el playbook, no todos a la vez.
