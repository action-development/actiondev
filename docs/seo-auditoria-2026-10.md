# Auditoría SEO + AEO — actiondev.es — 2 de octubre de 2026

**Alcance:** web en producción, código (`main` + árbol de trabajo), palabras clave y SERPs, competencia, y visibilidad en buscadores de IA y directorios.
**Foco acordado con negocio (2 oct):** las **apps móviles** son el servicio prioritario y el ámbito es **Vigo, su área y la provincia de Pontevedra**. Fuera de la web no se ha hecho nada todavía: ni Search Console, ni Bing, ni la ficha de Google optimizada, ni directorios.
**Relación con los documentos anteriores:** este informe sustituye al "Resumen de estado" de `docs/seo-playbook.md`, que está desfasado (habla de 9 landings y posts pendientes; hoy hay 10 landings y 9 posts). `docs/seo-kit-offpage.md` sigue siendo el manual de ejecución de lo que hay fuera de la web; aquí se prioriza a partir de datos.

**Límites del método (léelos antes de citar una cifra):**
- **Sin Search Console ni Bing Webmaster Tools** no hay datos reales de impresiones ni de indexación. Todo lo relativo a índices es una aproximación desde fuera.
- **Google bloquea las consultas automáticas** con captcha. Las posiciones salen de Bing, DuckDuckGo (que tira de Bing), Brave y la herramienta WebSearch. Son de un único día, aproximadas y marcadas como **B#n** (Bing), **D#n** (DuckDuckGo) o **W#n** (WebSearch). Google Maps sí se pudo ver, desde Vigo, así que lleva sesgo de ubicación.
- **No hay ni una cifra de volumen inventada.** La demanda es **relativa** y sale de ~2.200 consultas de autocompletado a Google y otras tantas a Bing (barridos a–z y prefijos), más Google Trends.
- **Rendimiento:** la API de PageSpeed sin clave tiene cuota 0, así que no hay datos de campo de CrUX. Lo que hay es Lighthouse de laboratorio, en local contra producción, en una sola pasada.

---

## Estado: arreglos de código aplicados el 2 oct (sin desplegar)

| Punto | Estado |
|---|---|
| §2.2 Metadatos de la home móvil en el `<body>` | ✅ `htmlLimitedBots: /.*/` en `apps/mobile/next.config.ts`. Verificado con build local y UA de Googlebot: title, description, canonical y robots dentro del `<head>` |
| §2.5 Instagram del schema y `socials.ts` | ✅ `@actiondev.es`. LinkedIn normalizado. `socials.ts` ya no compone URLs dobles |
| §2.6 Enlaces legales y política de privacidad | ✅ `LegalLinks` en todos los pies y `LegalDock` en las pantallas 3D; enlaces legales y «Preferencias» también en la home móvil. Privacidad y cookies reescritas (ver el aviso de abajo); `LEGAL_UPDATED` = 2026-10-02. **Que lo revise quien lleve lo legal** |
| §6 A2 Fichas en `noindex` | ✅ 13 casos enlazados desde las landings, ya indexables (24/31). Los 7 restantes siguen en `noindex` a propósito (contenido fino) |
| §6 A3 Enlaces de la home móvil | ✅ Proyectos, reseñas, blog, contacto y legales en el nav indexable; iconos sociales con URL real; `<a>` en vez de `next/link` hacia la zona desktop |
| §6 M3 Sitemap | ✅ `revalidate = 3600` + `revalidatePath("/sitemap.xml")` en el webhook; `lastmod` del blog = su post más reciente |
| §6 M10 / M11 Twitter heredado y OG de `/contact` | ✅ |
| §3.4 Titles de apps, diseño, tienda y software; `areaServed` de Pontevedra sin Redondela | ✅ |
| §5.2 "Action Digital Agency" (mobile, `pablo.actiondev.es`, `displayName`) | ✅ Unificado en "Action Development" / Alcasi Systems, S.L. |
| §5.4 `llms.txt` | ✅ Corregido; con las 11 guías (dos posts nuevos publicados hoy: mantener una app y publicarla en las tiendas) |
| Resto de §2 (Search Console, `clientes.actiondev.es`, horario de la ficha, repo privado, deploy) | ⏳ Pendiente de negocio o de acceso. Para el repo hace falta un admin de la org: `rubendlt` solo tiene permiso de escritura |

**Hallazgo nuevo (RGPD):** la base de datos de Firestore (`action-dev-1a531`) está en **`nam5` (EE. UU.)**, así que los teléfonos del «llámame tú» se guardan fuera de la UE. La política de privacidad ya lo declara como transferencia internacional, amparada en el Marco de Privacidad de Datos UE-EE. UU. y las cláusulas contractuales tipo de Google. Firestore no permite mover una base de datos de región; para tener los datos en la UE habría que crear una base nueva en `eur3` y migrar `posts` y `leads`. **Decisión de negocio.**

---

## 0. Resumen

**La web está bien hecha y casi nadie la ve.**

1. **Técnica y on-page: notable.**
   - Las 40 URLs del sitemap responden 200, son indexables y tienen canonical correcto.
   - El JSON-LD es válido y el NAP es idéntico en todas.
   - Las landings tienen entre 1.150 y 1.550 palabras y no hay contenido duplicado entre ellas.
   - Ningún bot está bloqueado: Googlebot, Bingbot, GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot y Applebot reciben 200.
2. **Visibilidad: casi nula.**
   - Bing tiene unas 13 URLs, todas con `www.` y algunas del sitio antiguo. Brave tiene 2.
   - actiondev.es no aparece en el top 10 de ninguna búsqueda comercial que se haya podido medir.
   - Ninguna de las 15 respuestas de IA revisadas la cita (Brave Ask, DuckDuckGo Assist y WebSearch, con 5 preguntas cada uno).
3. **La gran baza es la ficha de Google.** Con 5,0 y 23 reseñas sale **1.ª en Maps** para "desarrollo de aplicaciones Vigo" y "…Pontevedra" (vista desde Vigo).
4. **La entidad está confusa.** Hay seis señales que se contradicen (§5.2):
   - un subdominio antiguo indexado que dice ser la misma organización;
   - `pablo.actiondev.es` compitiendo por la keyword núcleo;
   - un Instagram en el schema que no existe;
   - "Action Digital Agency" en `llms.txt` y en la app móvil;
   - Alcasi Systems registrada como instaladora eléctrica;
   - y "Action" a secas, que es la cadena de bazares que abre tienda en Vigo.
5. **La demanda de apps en Vigo y Pontevedra es pequeña, así que el #1 es alcanzable.** Se gana con autoridad y citaciones, no con más texto. El volumen grande está en "diseño web vigo" y en las preguntas de precio a nivel nacional ("cuánto cuesta una app"), que son las que citan las IAs. **Ninguna agencia con sede en Vigo publica precios de apps en su web.**
6. **Hay un fallo técnico nuevo y serio:** la home móvil, que es la que indexa Google, entrega title, description y canonical dentro del `<body>` (§2, punto 2).

---

## 1. Estado por área

Las notas son una valoración propia para ordenar prioridades, no una métrica.

| Área | Nota | En una línea |
|---|---|---|
| Técnica (rastreo, indexabilidad, redirecciones) | 8/10 | Todo correcto salvo los metadatos de la home móvil y el `Vary` |
| On-page de las landings | 8/10 | Buen contenido; hay que ajustar variantes de keyword, canibalizaciones y enlazado |
| Contenido (blog y casos) | 5/10 | 9 posts sin una sola cifra; 20 de los 31 casos en `noindex`; fichas de 37 a 77 palabras |
| SEO local (ficha de Google) | 6/10 | 5,0 con 23 reseñas y 1.ª en Maps; sin optimizar, horario dudoso y la última reseña visible es de hace unos 4 meses |
| Autoridad y enlaces | 1/10 | 0 enlaces de clientes, 0 en prensa, 0 directorios reclamados |
| Entidad y marca | 3/10 | Señales contradictorias (§5.2) |
| AEO (buscadores de IA) | 2/10 | Técnicamente lista; no está en las fuentes que citan las IAs |
| Medición | 0/10 | Sin Search Console ni Bing Webmaster Tools; los eventos de conversión (commit `7235846`) aún no están desplegados |

---

## 2. Esta semana: bloqueantes

| # | Qué | Quién | Detalle |
|---|---|---|---|
| 1 | **Alta en Google Search Console y Bing Webmaster Tools** | Negocio (15 min) | Verificar por DNS y enviar `https://actiondev.es/sitemap.xml`. En "Inspección de URLs", pedir indexación de la home, `/desarrollo-de-aplicaciones-vigo`, `/desarrollo-de-aplicaciones-pontevedra` y `/servicios`. En Bing, importar desde Search Console y enviar el sitemap **sin `www`** (Bing tiene indexadas las URLs con `www.`). Después, `pnpm seo:indexnow`. Sin esto no se puede medir nada de lo que sigue |
| 2 | **Metadatos de la home móvil fuera del `<head>`** | Código (1 línea) | **Verificado.** Con UA de Googlebot Smartphone, `</head>` acaba en el carácter 1.670 y `<title>`, `description`, `robots` y `canonical` llegan en el 12.387–13.323, dentro del `<body>`. Tras ejecutar el JS (Chromium headless con UA de Googlebot), el `<head>` sigue sin title, description ni canonical. Google ignora un `rel=canonical` fuera del `<head>`. **Causa:** `apps/mobile` usa Next 15.5.19, que envía los metadatos en streaming a todo UA que no esté en `htmlLimitedBots` (Googlebot no está), y la página es dinámica. **Arreglo:** `htmlLimitedBots: /.*/` en `apps/mobile/next.config.ts` (confirmar la opción en la doc de Next 15.5) y comprobar de nuevo con `curl -A "<UA Googlebot Smartphone>"`. Además, `actiondev-mobile.vercel.app` sirve esa misma home: con el canonical ignorado, el duplicado de host deja de estar cubierto |
| 3 | **Retirar `clientes.actiondev.es`** | Dev | **Verificado.** Es el sitio antiguo ("action.dev \| Consultoría Tecnológica…"), indexable e indexado en Bing. Su JSON-LD usa el mismo `@id` que la web (`https://actiondev.es/#organization`) pero con otros servicios (SEO y SEM, redes sociales), otro email (`info@`) y otros plazos ("app móvil 8-16 semanas"), y tiene su propio `llms.txt`. miagenciaseo.es ya copia ese texto y presenta a Action como "agencia SEO en Pontevedra". **Orden:** (1) `X-Robots-Tag: noindex` en todas sus respuestas y quitar JSON-LD, `llms.txt` y sitemap; (2) pedir la retirada en Search Console y Bing; (3) solo entonces `Disallow: /`, porque antes impediría que los bots vean el `noindex` |
| 4 | **Horario de la ficha de Google** | Negocio | Mejores de Vigo, que copia datos de la ficha, muestra **solo "Jueves 10:00–14:00"**. Si la ficha dice eso, el negocio aparece cerrado 6 de cada 7 días en las búsquedas de "abierto ahora". Revisarlo y corregirlo |
| 5 | **Instagram del schema** | Código | **Verificado.** `packages/shared/src/seo.ts:48` apunta a `instagram.com/action.dev`, que no existe. El perfil real es `@actiondev.es` (667 seguidores). Trampa latente: `apps/desktop/src/data/socials.ts:23` construye `https://www.instagram.com/${SOCIAL.instagram}` con una URL completa, lo que da `https://www.instagram.com/https://instagram.com/action.dev`. Con LinkedIn (`:18`) pasa lo mismo. Hoy no se ve porque solo lo usa `Footer`, que no se monta, pero se romperá en cuanto se vuelva a montar (punto 6) |
| 6 | **Páginas legales sin enlace y política de privacidad desfasada** | Código + legal | **Verificado.** `Footer.tsx`, el único sitio con enlaces legales y "Preferencias de cookies", solo lo monta `SectionPage`, y **ninguna ruta usa `SectionPage`**. Las páginas legales solo se alcanzan desde el banner de cookies mientras no se ha decidido. La LSSI (art. 10) exige acceso permanente; el RGPD exige que retirar el consentimiento sea tan fácil como darlo; y `/legal/cookies` promete un enlace en el pie que no existe. Además, `legal/privacy/page.tsx:114-133` describe un formulario de WhatsApp que "no envía esos datos a ningún servidor nuestro", pero `CallbackForm` guarda teléfonos en Firestore (`leads`). No es SEO, pero es lo más urgente en lo legal |
| 7 | **El repo de GitHub es público** | Negocio | **Verificado.** En `github.com/action-development/actiondev` se pueden leer `CLAUDE.md`, la estrategia SEO de `docs/` y `firestore.rules`. Es el primer resultado de Brave para "Action Development Vigo". Según la revisión no hay `.env` subido, pero conviene hacerlo privado |
| 8 | **Desplegar `7235846`** (consent mode v2 y eventos de conversión) | Dev | Ninguno de los 14 chunks de `/contact` en producción contiene `generate_lead`, `click_whatsapp` ni `ad_user_data`. Sin este deploy, las conversiones no se miden |

---

## 3. Palabras clave

### 3.1 Qué dice la demanda

- **"desarrollo apps vigo" / "desarrollo de apps en vigo"** es la variante comercial que Google autocompleta. **"desarrollo de aplicaciones vigo"** solo se autocompleta con sugerencias de FP (DAM/DAW): intención mezclada. En Trends para España, "desarrollo app" (15,6) > "desarrollo apps" (3) > "desarrollo de apps" (2) > "desarrollo de aplicaciones móviles" (0,4). Son valores relativos y nacionales.
- "aplicaciones móviles vigo" y "crear app vigo" son **residuales**: ningún motor los autocompleta. Apps en Pontevedra, también residual.
- **La mayor demanda local es "diseño web vigo"** (en Trends Galicia, 57 frente a 100 de "diseño web coruña"), seguida de **"páginas web vigo"**, que hoy no está en ningún title.
- **"tienda online vigo" tiene intención de compra**: devuelve tiendas, no agencias. Las agencias compiten en "crear tienda online vigo" y "ecommerce/shopify vigo".
- **Preguntas nacionales de precio:** "cuánto cuesta una app" (crear/hacer/desarrollar), "cuánto cuesta mantener una app", "cuánto cuesta publicar una app", "react native o flutter 2026", "agencia o freelance", "cuánto cuesta un MVP". Son las que alimentan las respuestas de IA, y la SERP está llena de rangos en €.
- **Kit Digital:** el programa cerró el 31-10-2025, no se persigue. **IGAPE IG300C:** estacional (la convocatoria de 2026 fue del 11 de junio al 10 de julio); encaja con software a medida.
- **Gallego** ("deseño web", "desenvolvemento", "páxinas web"): cero autocompletado en Google y Bing. No compensa.
- **Marca:** en Bing, "Action Development Vigo" devuelve una SERP ocupada por action.com, la cadena de tiendas.

### 3.2 Mapa prioritario

El mapa completo (45 filas) está resumido aquí; los datos crudos no se guardan en el repo.

| Keyword | Intención | Demanda (confianza) | Dificultad | URL de Action | actiondev.es hoy |
|---|---|---|---|---|---|
| desarrollo apps vigo / desarrollo de apps en vigo | Transaccional | Baja, la mayor de apps en local (media) | Media | `/desarrollo-de-aplicaciones-vigo` | B#3, pero sale **la home**, no la landing; en WebSearch, pablo.actiondev.es #4 |
| desarrollo de aplicaciones vigo | Transaccional + FP | Baja (media) | Media | `/desarrollo-de-aplicaciones-vigo` | Fuera del top 10 (Bing y WebSearch); D#1/#5 en una pasada y fuera del top 30 en otra |
| empresas desarrollo apps vigo | Comercial | Muy baja (media) | Media-alta (listicles) | Landing + directorios | Fuera |
| desarrollo de aplicaciones / apps pontevedra | Transaccional | Residual (media) | Baja-media | `/desarrollo-de-aplicaciones-pontevedra` | Fuera, y **Bing no la tiene indexada** |
| cuánto cuesta una app / crear / hacer una app | Info-comercial (nacional) | Media (media) | Alta | Post `cuanto-cuesta-desarrollar-una-app` | No aparece |
| cuánto cuesta mantener una app | Informacional | Baja-media | Media | **Nuevo** post o sección | — |
| cuánto cuesta publicar una app (App Store / Play) | Informacional | Media | Media | **Nuevo** post corto | — |
| react native o flutter (2026) | Info técnica | Media | Media-alta | Ampliar `apps-nativas-o-multiplataforma` | No aparece |
| agencia o freelance para una app / cuánto cobra un desarrollador | Comercial | Baja-media | Media (Malt) | **Nuevo** post | — |
| cuánto cuesta un MVP | Comercial | Baja | Media | **Nuevo** post (startups) | — |
| **diseño web vigo** | Transaccional | **Media, la mayor del universo local** | Alta-media | `/diseno-web-vigo` | Fuera |
| páginas web vigo / diseño páginas web vigo | Transaccional | Media-baja | Alta-media | `/diseno-web-vigo` | Fuera |
| desarrollo web vigo | Transaccional | Baja | Media | `/desarrollo-web-vigo` | B#4 (home) y B#6 (landing): canibalización |
| crear tienda online vigo / ecommerce / shopify vigo | Transaccional | Baja | Media | `/tienda-online-vigo` | Fuera |
| empresa de software vigo / desarrollo software vigo | Comercial | Baja | Media-alta (9 de 10 son directorios en Bing) | `/software-a-medida-vigo` | Fuera |
| software a medida vigo | Transaccional | Residual | Media | `/software-a-medida-vigo` | Fuera (lo gana Rowan) |
| diseño / desarrollo web pontevedra | Transaccional | Baja | Media | `/desarrollo-web-pontevedra` | B#5 |
| agencia desarrollo web galicia | Comercial | Muy baja | Media | `/agencia-desarrollo-web-galicia` | **B#1**, el único #1 observado |
| ayudas IGAPE / IG300C software | Info-comercial, estacional | Baja-media en Galicia | Media | **Nuevo** post | — |

**No crear** páginas por municipio (O Porriño, Cangas, Moaña, Nigrán, Baiona) ni versiones en gallego: la demanda es residual y las páginas por municipio arriesgan pasar por páginas puerta. Redondela ya está bien cubierta porque tiene casos reales.

### 3.3 Canibalizaciones

1. **`pablo.actiondev.es` frente a `/desarrollo-de-aplicaciones-vigo`.** El title y el H1 del subdominio son "Desarrollo de aplicaciones móviles en Vigo — Pablo Cabaleiro", y solo enlaza a la home de actiondev.es. Sale en WebSearch para "desarrollo de apps en Vigo", donde la landing no aparece.
2. **La home frente a las landings.** Bing elige la home: B#3 en "desarrollo apps vigo" y B#4 en "desarrollo web vigo" (la landing, B#6). La home apunta a la misma keyword en title, H1 y descripción (`app/layout.tsx:30`, `lib/seo.ts:39`).
3. **`/diseno-web-vigo` frente a `/desarrollo-web-vigo`.** Sus SERPs comparten competidores: para Google son la misma intención.
4. **Apps en Vigo, Pontevedra y Galicia:** el mismo servicio en tres geografías. Además, la de Galicia promete Coruña, Santiago, Ourense y Lugo, fuera del ámbito acordado.
5. **`/desarrollo-web-pontevedra` frente a `/desarrollo-web-redondela`.** Mismo `serviceType`, Pontevedra incluye Redondela en `areaServed` y en la meta (`landings.ts:967-976`), y comparten 2 de sus 3 casos.
6. **`/agencia-desarrollo-web-galicia` frente a los posts `como-elegir-agencia-desarrollo-web-galicia` y `que-mirar-antes-de-contratar-agencia-vigo`.** El H2 de la landing es casi el title del primer post, y los dos posts cubren la misma intención.

### 3.4 Cambios por página

| Página | Cambio propuesto | Por qué |
|---|---|---|
| `/desarrollo-de-aplicaciones-vigo` | Title → **"Desarrollo de Apps en Vigo \| Aplicaciones iOS y Android"** (55 car.). Un H2 con "empresa de desarrollo de apps en Vigo". FAQ de precio, plazo, mantenimiento, propiedad del código y publicación en tiendas. Enlaces a App Store y Google Play en cada caso. Bloques por sector solo donde haya casos reales. Objetivo orientativo: 2.000-2.500 palabras | Usa la variante que se busca. ASD y Docastix rankean con 2.780 y 3.114 palabras y con precios |
| `/desarrollo-de-aplicaciones-pontevedra` | Mantener. Casos solo de la provincia (PBB O Porriño, Nautirent, Fang Tours…) | Es el ámbito prioritario y Bing ni la tiene indexada: es cuestión de descubrimiento |
| `/desarrollo-de-aplicaciones-galicia` | **Propuesta: 301 → `/desarrollo-de-aplicaciones-vigo`**, llevando allí sus casos (XauLabs, Kairos, PRO Lift) | Está fuera de ámbito, en Google su SERP es de FP, no rankea, y así se concentra la autoridad. Toca `landings.ts`, `SERVICE_LANDINGS`, `llms.txt`, `sitemap`, los `related` y `redirects()` |
| `/agencia-desarrollo-web-galicia` | Mantener la URL. Quitar Coruña, Santiago, Ourense y Lugo de `areaServed` y del texto. Enfocar a "agencia de diseño web en Galicia con sede en Vigo" | Es el único #1 visto (Bing) |
| `/diseno-web-vigo` | Title → **"Diseño de Páginas Web en Vigo \| Webs con Identidad Propia"** (57). Poner "Vigo" en el primer párrafo. Separarla de desarrollo web: aquí marca y estética | "Páginas web" es la mayor demanda local y hoy no está en ningún title |
| `/desarrollo-web-vigo` | Inclinarla hacia aplicaciones web a medida: reservas, pagos, paneles, integraciones | Separar la intención de la de diseño |
| `/tienda-online-vigo` | Title y H1 → **"Diseño de Tiendas Online en Vigo \| Ecommerce y Shopify"** (55) | "tienda online vigo" busca tiendas |
| `/software-a-medida-vigo` | Title → **"Empresa de Software a Medida en Vigo \| ERP e Integraciones"** (59). Un H2 de ERP | "empresa de software vigo" tiene más demanda que "software a medida" |
| `/desarrollo-web-pontevedra` | Quitar Redondela de `areaServed` y de la meta. Casos propios | Canibalización con Redondela |
| `pablo.actiondev.es` | Title de marca personal (p. ej. "Pablo Cabaleiro — Desarrollador de apps iOS y Android") y un enlace contextual a `/desarrollo-de-aplicaciones-vigo` con un anchor descriptivo ("desarrollo de apps en Vigo") | Deja de competir y le pasa relevancia a la landing |
| Home | **No tocar el title** hasta tener 4-6 semanas de datos de Search Console. Reforzar los enlaces de la home a las landings | Hoy es la URL que Bing elige; decidir con datos |

---

## 4. Competencia (apps · Vigo y Pontevedra)

### 4.1 Panorama

- **Las SERPs de apps en Vigo las ocupan empresas de fuera** con páginas por ciudad hechas en serie: ForgeNEX (Sevilla; 225 páginas de Vigo en un sitemap de 37.315 URLs), Coco Solution (Las Palmas), Evoluziona (Zaragoza; la misma plantilla para Pontevedra), ITSICAP (Madrid) y Charlesson Tech. Ganan por volumen y por dar el precio en la primera línea. **No copiar esto**: plantillas por ciudad, schema inflado o reseñas propias marcadas son terreno de spam.
- **Solo hay tres especialistas en apps con sede en Vigo:**
  - **Multiapps:** desde 2016-2018. Su web es pobre (sin H1, sin meta description, 422 palabras) y aun así sale **B#2 en 4 búsquedas de apps**. Prueba de que a Action le falta **autoridad y antigüedad**, no texto.
  - **Teconsite:** desde 2003, 4,4 con 20 reseñas.
  - **OnlyDevs:** no tiene página de apps.
- **Los que ganan con contenido:**
  - **Docastix** (Ourense): página de Vigo de 3.114 palabras, precios por tramos, calculadora y un post de precio de 5.843 palabras.
  - **ASD Solutions** (Madrid): 2.780 palabras, escalera de precios que empieza en una auditoría de 190 € y 47 posts en 2026.
  - **Rowan** (Vigo): 57 posts en 2026, MVP desde 8.000 €; gana "software a medida vigo".
- **Ninguna agencia con sede en Vigo publica precios de apps en su web.** Teconsite y Webvigo los ponen solo en Sortlist.

### 4.2 Matriz resumida

| Competidor (sede) | Dónde sale | Contenido de apps | Precio publicado | Reseñas en Google |
|---|---|---|---|---|
| Multiapps (Vigo) | B#2 en 4 búsquedas de apps | 422 palabras, sin H1 ni meta | No | Sin ficha en Maps |
| Teconsite (Vigo) | B#7 apps, B#4 tienda online | 1.250 palabras, 9 posts | Sortlist: app desde 5.000 € | 4,4 (20) |
| OnlyDevs (Vigo) | B#2 desarrollo web, B#5 apps | Sin página de apps; 12 posts | No | 5,0 (7) |
| Rowan (Vigo, 3 dominios) | B#2 y #5 software a medida | 983 palabras + FAQ; 57 posts en 2026; `llms.txt` | MVP desde 8.000 €; ERP 25.000-60.000 € | 5,0 (10) |
| Webvigo (Vigo) | B#1 diseño de páginas web, B#8 apps | 777 palabras; blog parado desde 2021 | Sortlist: desde 1.000 € | 5,0 (5) |
| Hacce (Vigo) | B#1 diseño web | ~513 palabras; no hace apps | No | 4,1 (7) |
| Docastix (Ourense) | W#3 crear app, B#6 cuánto cuesta app vigo | 3.114 palabras, 8 FAQ, calculadora, 28 posts | **MVP 8.000-25.000 €**, discovery 2.000 € | Sortlist 5/5 (1) |
| ASD Solutions (Madrid) | B#2 y #4 en apps y software Vigo | 2.780 palabras, 6 FAQ, 47 posts | **Desde auditoría 190 €**; MVP 5.000-12.000 € | — |
| ForgeNEX / Coco / Evoluziona / ITSICAP / Charlesson | W#1 y B#3-#6 por volumen | Páginas por ciudad casi vacías | Charlesson: **B#1 "cuánto cuesta una app vigo"** con "desde 3.000 €" | — |
| **Action** | **1.ª en Maps**; B#1 agencia web Galicia; fuera del top 10 de Bing en apps | 1.548 palabras, 5 FAQ, 4 casos, 9 posts | **Sin cifras** (`landings.ts:169`: "No publicamos tarifas") | **5,0 (23)** |

### 4.3 Qué hacen mejor que Action

1. **Precio y oferta de entrada** (Docastix, ASD, Charlesson, Rowan). Responden en la primera pantalla lo que todos preguntan, con un primer paso barato y concreto: auditoría, discovery, "desde X €".
2. **Prueba tangible:** apps descargables, nombres de la industria local (Stellantis, CTAG, Zona Franca) y "demo cada viernes".
3. **Constancia publicando:** 28-57 posts en 2026, con varios dedicados al precio. Action tiene 9, todos subidos el mismo día.
4. **Presencia en los directorios que rankean:** Sortlist, Páxinas Galegas (módulo de pago) y Mejores de Vigo.

### 4.4 Huecos que nadie cubre bien

1. **El precio de una app explicado por una agencia de Vigo.** Hoy "cuánto cuesta una app vigo" lo gana una empresa sin sede declarada.
2. **Un estimador de coste interactivo.** Solo lo tiene Docastix, y encaja con la marca interactiva de Action.
3. **Casos de Vigo y Pontevedra con la app publicada en las tiendas.** Multiapps, Webvigo y OnlyDevs no enseñan ninguno.
4. **Coste de mantener una app y propiedad del código.** Solo lo tratan ASD y Docastix.
5. **Directorios casi vacíos:** la lista de apps de Mejores de Vigo tiene **una sola empresa** (Pumpún), y Sortlist Vigo casi no tiene empresas locales con reseñas.

---

## 5. AEO (buscadores de IA) y entidad

### 5.1 Visibilidad por motor

| Motor de respuesta (índice que usa) | URLs indexadas | Búsqueda de marca | 5 preguntas genéricas |
|---|---|---|---|
| ChatGPT Search / Copilot (Bing; medido vía DuckDuckGo) | ~13, todas con `www.`. Faltan apps Pontevedra, software a medida, Redondela, `/projects`, `/resenas` y 8 de los 9 posts. Incluye basura: `clientes.actiondev.es` y `/diseno-web-pontevedra`, que ya redirige | "Action agencia Vigo" #1; "Action Vigo" #7, detrás de la cadena de tiendas | 0/5 en el top 10 |
| Claude (Brave) | 2: la home con el title antiguo "action.dev \| Consultoría…" y pablo.actiondev.es | Para "Action Development" Vigo solo salen el repo de GitHub y una ONG sudafricana | 0/5 |
| Gemini / AI Overviews (Google) | **No verificable sin Search Console.** El indicio, vía Startpage, es muy bajo | Salen Páxinas Galegas, LinkedIn e Instagram, no la web | — |
| Perplexity, ChatGPT, Gemini directos | No comprobado (piden login) | — | — |

**Las causas no son técnicas.** Con los 15 UA de bots probados, `/desarrollo-de-aplicaciones-vigo` devuelve el mismo HTML (200), con FAQ, NAP y JSON-LD en texto plano sin JS. Lo que falta es **descubrimiento** (Search Console, Bing, IndexNow) y **autoridad de entidad** (directorios, enlaces, coherencia).

### 5.2 Entidad: problemas y arreglos

| Problema | Evidencia | Arreglo |
|---|---|---|
| "Action" choca con la cadena de bazares | Brave muestra el panel de *Action, cadena neerlandesa*; Faro de Vigo (10-3-2026): "La cadena low cost Action abrirá una tienda en Vigo" | Usar siempre **"Action Development"**: sufijo de los titles " — Action Development" (el template de `layout.tsx`), `WebSite.name` "Action Development" con `alternateName` "Action", y una línea de desambiguación en `llms.txt` |
| "Action Development" tampoco es único | actiondevelopment.net (constructora de EE. UU.) es el primer resultado en DDG; además, una ONG sudafricana y una "Action Dev" de Brasil | Acompañar siempre el nombre de "Vigo" y "desarrollo de software". Wikidata, cuando haya dos referencias independientes |
| Subdominio antiguo con el mismo `@id` | Ver §2, punto 3 | Ver §2, punto 3 |
| `pablo.actiondev.es` dice ser la misma Organization con otros nombres | El mismo `@id`, `name` "Action" y `legalName` "Action Digital Agency" | `name` "Action Development" y `legalName` "Alcasi Systems, S.L." |
| "Action Digital Agency" sigue apareciendo | `llms.txt:7`; `authors`/`publisher` de la home móvil (`apps/mobile/src/app/layout.tsx:36-38`) | Unificar en "Action Development" |
| La persona jurídica figura como **instaladora eléctrica** | Empresite, eInforma, Iberinform, datoscif e infonif dan para Alcasi Systems el CNAE 4321, en Marín y sin web. El JSON-LD publica `legalName` y `vatID`, así que quien cruce el CIF (p. ej. sector público) ve otra actividad | Reclamar Empresite y eInforma para añadir la web y el nombre comercial. Revisar con la gestoría el CNAE/IAE (programación, 6201) y el objeto social |
| Instagram roto | Ver §2, punto 5 | Ver §2, punto 5 |
| LinkedIn incoherente | Fundación en 2023 (la marca es de 2020 y la sociedad de 2022), sin dirección, lema "Consultora tecnológica B2B" | Alinear con la ficha NAP de `seo-kit-offpage.md` §1 |
| Coordenadas aproximadas | El schema dice 42.2372, -8.7203; el pin de la ficha está, según la revisión, en 42.2372544, -8.7206586 (unos 30 m) | Copiar las exactas de la ficha (verificar) en `packages/shared/src/seo.ts:35-36` |

### 5.3 Precios: cómo llegar a buscadores e IA sin cloaking

La pregunta de negocio fue si los precios podían no salir en la web pero sí en buscadores e IA.

**No, tal cual.** Enseñar a los bots algo que el visitante no ve es *cloaking*, y marcar en JSON-LD contenido no visible incumple las directrices. Google: *"Don't mark up content that is not visible to readers"*. Bing: *"Markup must accurately reflect visible content"*, y además avisa de que manipular a los LLM puede suponer "reduced visibility or removal" en Bing y Copilot. Los AI Overviews salen del índice de Google y ChatGPT del de Bing, así que el riesgo es el mismo. `llms.txt` tampoco sirve para eso: es un archivo público y, según lo revisado, los motores apenas lo usan.

**Las vías legítimas**, de menos a más visibles en la web:
1. **Solo fuera de la web.**
   - **Sortlist** muestra "a partir de X €" por servicio: Teconsite, app desde 5.000 €; Coco, desde 3.780 €; Docastix, desde 8.000 €.
   - **Clutch** pide proyecto mínimo y tarifa por hora; sin ellos te quedas fuera de los filtros (no verificado directamente, está tras Cloudflare).
   - **Servicios con precio** en la ficha de Google.

   Son justo las fuentes que leen las IAs para "cuánto cuesta… en Vigo".
2. **En la web, pero discreto.** Una tabla de horquillas en el post `cuanto-cuesta-desarrollar-una-app` y una pregunta frecuente plegada en las landings de apps. Está en el HTML (legítimo) y no aparece en el escaparate.

**La evidencia:** para "precio desarrollo app Vigo", las respuestas de IA citan asdsolutions.es y docastix.com, que tienen las dos una tabla en €. El post de Action no tiene ni una cifra en € y no aparece.

**Coherencia:** si se publican precios, hay que cambiar "No publicamos tarifas" (`landings.ts:169`, `:1515`) y `llms.txt:66` ("Publishing fixed price lists"). Los plazos tienen que cuadrar con lo que dice `clientes.actiondev.es`, o retirar el subdominio antes.

**Plantilla de la pregunta frecuente.** Las cifras las pone negocio, a partir de proyectos reales:
> "Una primera versión (MVP) para iOS y Android parte de [X] € y suele estar en las tiendas en [N–M] semanas; una app con panel de gestión y backend propio, entre [Y] y [Z] €. Orientativo, sin IVA, revisado en [mes año]."

### 5.4 `llms.txt`: correcciones

En `apps/desktop/public/llms.txt`:
- **Quitar:** "Action Digital Agency" (`:7`), "Portugal" (`:18`, `:50`; no lo respalda la web), el marcado `Review` que dice tener (`:70`; no existe) y "fixed price lists" (`:66`), esto último si se publican horquillas.
- **Añadir:**
  - una línea de desambiguación: *"No confundir con la cadena de tiendas Action (action.com) ni con otras empresas «Action Development» fuera de España"*;
  - la ficha de Google con su nota y fecha ("5,0 con 23 reseñas, consulta del 2-10-2026");
  - el aviso legal y los perfiles reales (Instagram `@actiondev.es`);
  - una sección **"Guías"** con los 9 posts;
  - el área de servicio acorde con el foco (Vigo y la provincia de Pontevedra en persona; resto de España a distancia).
- **Formato** según llmstxt.org: `[título](url): descripción` y una sección `## Optional`.
- Si se hace el 301 de Galicia (§3.4), quitar esa landing de aquí también.

`robots.ts` está bien: no hay que tocarlo.

### 5.5 Directorios, por orden de impacto

Todas las fichas que existen las crearon terceros copiando la ficha de Google; **ninguna está reclamada**.

| # | Sitio | Estado hoy | Acción |
|---|---|---|---|
| 1 | **Bing Places** | Ausente | Importar desde la ficha de Google (alimenta ChatGPT y Copilot) |
| 2 | **Páxinas Galegas** | Ficha básica solo en "Diseño web" ("Rúa **de** Colón", "614 027 410", enlace a `www.`) | Añadirse a **"Diseño y desarrollo de software y aplicaciones" en Vigo**, que es B#1 en "software a medida vigo" y "desarrollo de aplicaciones galicia". Cambiar el enlace a `https://actiondev.es` |
| 3 | **Mejores de Vigo** | Ficha sin reclamar en **branding**, horario "solo jueves" y descripción de branding/SEO | Reclamarla (gratis) y recategorizarla en apps, software y desarrollo web. **La lista de apps tiene 1 empresa** y ordena por reseñas: con 23, Action entraría arriba |
| 4 | **Sortlist** | Ausente (perfil 404) | Perfil con "App móvil desde X €", 4-6 casos y 3-5 reseñas. Su página de apps de Vigo es **B#1 en 4 búsquedas de apps** |
| 5 | **Apple Business (Mapas)** | Ficha existente, sin reclamar ("Reclamar este sitio") | Reclamarla |
| 6 | **Empresite / eInforma** | Alcasi con CNAE 4321, sin web | Ver §5.2 |
| 7 | **LinkedIn** | Incoherente | Ver §5.2 |
| 8 | Clutch, GoodFirms, DesignRush | Ausentes o no verificables; no salen en las SERPs locales | Después, cuando haya 3 reseñas de clientes |
| 9 | Cylex, Páginas Amarillas, Hotfrog, Infobel | Sin comprobar o ausentes | Solo por coherencia del NAP; prioridad baja |

Para Galicia también citan el mapa de capacidades digitales de la Xunta (gaiastech.xunta.gal) y el del Clúster TIC: revisar los requisitos de alta.

### 5.6 Enlaces

- **Prensa, foros y Reddit: nada.** Solo hay menciones sueltas en redes (París de Noia, Regatopraia).
- **0 de los 13 clientes con URL real enlazan a actiondev.es.** París de Noia pone "Built with pride with Action Development" en el pie, sin enlace. Musa enlaza al Instagram roto.
- **Acción:** pedirles un crédito en el pie con anchor de marca ("Web: Action Development") hacia actiondev.es. 7 de esas webs son SPA con el HTML vacío: el crédito tiene que estar en el HTML estático o solo lo verá Google.
- 18 proyectos tienen `url: "#"` (Autoescuela GTI, Nautirent, Fisionorte, Timetracker…). Sin su URL real no se les puede pedir el enlace.

---

## 6. On-page y código: lista priorizada

**Alto**
- **A1. Home móvil:** metadatos en el `<body>` (§2, punto 2).
- **A2. 20 de 31 fichas en `noindex` por un solo campo.**
  - `hasCaseStudy()` (`packages/shared/src/projects.ts:1020-1024`) solo mira la `description`.
  - Esas 20 sí tienen `briefEs`/`resultEs` reales, y **13 de los 24 casos que enlazan las landings caen en ellas**: Autoescuela GTI (el caso estrella de 2 landings y de `llms.txt`), Nautirent, True Trading, PRO Lift, Canelita, Kairos…
  - Arreglo: redactar `descriptionEs` (110-155 caracteres), o que la regla dependa de `briefEs`+`resultEs` con la meta sacada de `resultEs`.
- **A3. La home móvil (la que indexa Google) no enlaza a `/projects`, `/blog`, `/resenas` ni `/contact`.**
  - Solo enlaza `/servicios` y las landings (`apps/mobile/src/components/SeoIntro.tsx:15-26`).
  - Los iconos sociales tienen `href="#"` (`apps/mobile/src/app/page.tsx:535,540`).
  - Usa `next/link` hacia rutas que sirve la app de escritorio, y en consola aparece un `ChunkLoadError`. Esos enlaces deben ser `<a>` normales.
- **A4. Fichas de proyecto finas: 37-77 palabras de cuerpo.**
  - La localidad sale en el title pero no en el texto (`projects/[slug]/page.tsx:177-253`).
  - Añadir descripción, sector, año, localidad, tecnologías (no "TBD"), la reseña del cliente si la hay y los enlaces a App Store y Google Play.
  - Las landings tienen 0 imágenes de contenido: usar las capturas reales que ya existen, con `alt`.

**Medio**
- **M1. Metadatos del blog.** 7 de 9 titles pasan de 60 caracteres (hasta 94) y 7 de 9 descripciones pasan de 155 (hasta 175). Origen: `blog/[slug]/page.tsx:57`. Ajustarlo desde el admin (titles ≤ 51, porque el template añade " — Action") o usar `title.absolute`.
- **M2. Fechas de publicación anteriores a que existiera el blog:** `que-mirar…` (30-07), `senales…` (22-08) y `apps-nativas…` (08-09), cuando el blog se montó el 23-09. Poner la fecha real: unas fechas inventadas restan confianza.
- **M3. Sitemap.**
  - `CONTENT_UPDATED` está fijo en 2026-09-23 (`sitemap.ts:13`), aunque las landings cambiaron el 24 y el 30.
  - El sitemap se genera en el build: **un post nuevo no entra hasta el siguiente deploy**, porque el webhook solo revalida `/blog`.
  - Arreglo: `revalidate` en el sitemap, `revalidatePath("/sitemap.xml")` en el webhook y una fecha por landing.
- **M4. Enlazado interno.** Las landings no enlazan a ningún post. `software-a-medida-vigo` y `desarrollo-web-redondela` no reciben enlaces de posts ni de fichas, y `agencia-desarrollo-web-galicia` solo 1 `related`. Añadir un bloque "Guías relacionadas" en las landings (posts con su `targetLanding`).
- **M5. `/projects` y `/resenas`: sin texto visible y con un H1 genérico** ("Nuestros trabajos" / "La plaza de las reseñas"). Poner un H1 con la keyword y un párrafo de introducción renderizado en servidor, que puede ir en el HUD.
- **M6. Schema de la organización:** coordenadas exactas, `openingHoursSpecification` (una vez corregido el horario de la ficha), `Country` con `name: "ES"` (`shared/seo.ts:199`) y `WebSite.name` (§5.2).
- **M7. `/contact` en móvil, Lighthouse de laboratorio con CPU 4×:** rendimiento 45, TBT 9,1 s, TTI 14,3 s. Es la página de conversión, y el INP real en un móvil medio probablemente sea malo. Valorar cargar primero el HUD y la escena después (en idle). Medir con CrUX cuando haya datos.
- **M8. `Vary: User-Agent` no se aplica en la home de escritorio.** Se sirve el prerender desde la caché de Vercel, y el arreglo de `d66aacc` en `next.config.ts` no tiene efecto. Solo la rama móvil lo lleva.
- **M9. `lib/blog.ts:30-32` y `:51-53` se tragan los errores de Firestore.** Si Firestore falla, ISR puede cachear un blog vacío o un 404. En producción hay que lanzar el error para que se siga sirviendo la versión anterior.
- **M10. Metadatos de Twitter heredados de la home en 9 URLs** (`layout.tsx:59-65`).
- **M11. La OG de `/contact` dice "Sin formularios"** (`contact/page.tsx:21`). Es falso desde que existe `CallbackForm`.

**Bajo**
- **Redirecciones:** cadenas de dos 308 (`http://www` → `https://www` → apex; barra final + redirect).
- **Página 404:** lleva a la vez `noindex` e `index, follow`, el title de la home y un canonical a la home. No tiene `<h1>` ni `<main id="main-content">`.
- **Restos y archivos:** `/apple-touch-icon.png` da 404 y `app/reviews/page.tsx` sobra (ya lo resuelve `redirects()`).
- **Datos que no casan:**
  - las landings dicen "22 reseñas en Google" (`testimonials.length`) y la ficha tiene 23;
  - `/contact` muestra "C/ Colón 20" en vez de "Rúa Colón, 20";
  - la ficha de Musa habla de un "restaurante… menú interactivo" cuando el proyecto es ocio nocturno con entradas;
  - San José está etiquetado como landing page pero se cita como caso de apps.
- **Schema y metadatos menores:** las imágenes OG no tienen `alt`, y el `ItemList` de `/projects` incluye las fichas en `noindex`.
- **Documentación desfasada:** `CLAUDE.md` dice 32 proyectos (son 31) y que `/resenas` no tiene texto en el HTML (ya lo tiene).

---

## 7. Plan

| Cuándo | Qué |
|---|---|
| **Semana 1** (2-9 oct) | Los 8 puntos de §2 |
| **Octubre** | Directorios 1-7 de §5.5. Ficha de Google: horario, categorías secundarias (apps, diseño web), servicios con descripción (`seo-kit-offpage.md` §2.2) y precio "desde" si se decide, fotos, una publicación a la semana y pedir reseña a los últimos 5 clientes. Código: A2-A4, M1-M3, M6, `llms.txt` y title de `pablo.actiondev.es` |
| **Noviembre** | Rehacer la landing de apps (§3.4) con FAQ de precio. Post de precio con tabla, más "cuánto cuesta mantener una app" y "publicar una app". Pedir el enlace a los 13 clientes. Decidir el 301 de Galicia |
| **Diciembre** | Con 6-8 semanas de Search Console: ver qué URL rankea para cada keyword y decidir el title de la home. Estimador de coste (si hay precios). Ritmo de 2-4 posts al mes. Clutch, si hay 3 reseñas |

**KPIs**

| Métrica | Hoy | Objetivo a 90 días (orientativo) |
|---|---|---|
| URLs indexadas (Search Console) | Desconocido | 40/40 del sitemap |
| "desarrollo apps vigo" (Bing / Search Console) | Sale la home, B#3; la landing, fuera del top 10 | La landing en el top 5 |
| Google Maps, apps Vigo y Pontevedra | 1.ª (vista local) | Mantener; medir con rejilla (Local Falcon) |
| Reseñas en Google | 23, la última visible hace unos 4 meses | +2-4 al mes |
| Directorios reclamados y coherentes | 0 | 7 |
| Enlaces de clientes | 0 | 5 |
| Citas en respuestas de IA (test mensual con 5 preguntas) | 0/15 | Aparecer en Sortlist y Mejores de Vigo, que es lo que citan |

---

## 8. Decisiones pendientes de negocio

1. **Horquillas de precio reales**, y dónde publicarlas: en la web de forma discreta más los directorios, o solo en directorios.
2. **301 de `/desarrollo-de-aplicaciones-galicia`** a la landing de Vigo.
3. **Cambiar el title de `pablo.actiondev.es`** a marca personal.
4. **Retirar `clientes.actiondev.es`.** ¿Quién gestiona ese proyecto de Vercel?
5. **Pasar el repo de GitHub a privado.**
6. **Sufijo " — Action Development"** en los titles.
7. **Horario real y acceso a la ficha de Google.**
8. **CNAE/IAE de Alcasi Systems**, a revisar con la gestoría.

---

## Anexo: método

- **Cinco investigaciones en paralelo:**
  - rastreo de producción (curl con UA de navegador, Googlebot, Bingbot y 10 bots de IA; Lighthouse 12.8.2 local);
  - código (solo lectura; Firestore en lectura para los posts);
  - palabras clave (autocompletado de Google y Bing, Trends, SERPs de Bing, DuckDuckGo y Brave);
  - competencia (SERPs, HTML, sitemaps, RDAP/Wayback, Sortlist, Google Maps);
  - AEO y entidad (índices, consultas tipo IA, directorios, enlaces).
- **Comprobado de nuevo a mano para este informe:**
  - metadatos de la home móvil en `curl` y tras renderizar con Googlebot;
  - `clientes.actiondev.es` y su `@id`;
  - el repo público;
  - los dos perfiles de Instagram;
  - la ficha de Mejores de Vigo y su lista de apps;
  - `Footer` sin montar y páginas legales sin enlaces;
  - el texto de la política de privacidad;
  - `hasCaseStudy()`;
  - `pablo.actiondev.es`;
  - que `7235846` no está desplegado.
- **No comprobado:** índice de Google de primera mano, Perplexity, ChatGPT y Gemini directos, Clutch, Páginas Amarillas, Infobel y Foursquare (bloqueados), el horario completo de la ficha y CrUX.
- Los datos crudos (SERPs, HTML, informes de Lighthouse) se quedaron en el scratchpad de la sesión y **no están en el repo**.
