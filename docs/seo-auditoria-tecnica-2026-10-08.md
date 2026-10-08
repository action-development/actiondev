# Auditoría SEO técnica — actiondev.es — 8 de octubre de 2026

**Alcance:** producción (`https://actiondev.es`), solo lectura, y arreglos técnicos en código. El contenido y el copy los lleva otro agente: lo que le toca está en la sección 5.
**Relación con la auditoría anterior:** sigue a `docs/seo-auditoria-2026-10.md` (2 oct). En la sección 4 está el estado de su lista de on-page y código (§6).

**Método:**
- **Rastreo:** las 61 URLs de `sitemap.xml` más los enlaces internos que aparecen en ellas (68 URLs en total), con cuatro perfiles:
  - Googlebot Smartphone;
  - Googlebot escritorio;
  - iPhone (Safari 18.5) sin cookie;
  - iPhone con la cookie de vista previa `mv2=1`.
- **Por URL:** estado y redirecciones, title, description, canonical, robots, H1 y orden de titulares, JSON-LD (parseado), `lang`, imágenes, enlaces internos, texto en el HTML del servidor, OG/Twitter e iconos.
- **Rendimiento:**
  - La API de PageSpeed Insights sin clave devuelve **429 (cuota diaria 0)**, así que **no hay datos de campo de CrUX**.
  - Las cifras son de **Lighthouse 12.8.2 en local contra producción**, en una pasada por página:
    - móvil = Moto G Power simulado, 4× CPU, 4G lento;
    - escritorio = `--preset=desktop`.
  - Son de laboratorio y orientativas.
- **Paridad de la web móvil v2:** HTML del escritorio frente al del iPhone con `mv2=1` en las landings, el blog y los legales.

---

## 1. Resumen

1. **La base técnica está bien.**
   - Las 61 URLs del sitemap dan 200, son indexables y tienen un canonical propio, absoluto y dentro del `<head>`, con los cuatro perfiles.
   - No hay títulos ni descripciones duplicados, ni la marca dos veces en un título.
   - Hay un solo H1 por página, `lang="es"`, ningún enlace interno roto, ningún `nofollow` interno y ningún enlace sin texto.
   - El JSON-LD se parsea sin errores en todas.
2. **Lo más flojo era el enlazado interno del blog.**
   - 11 de los 15 artículos recibían solo 1 o 2 enlaces internos (el del índice y, como mucho, otro post).
   - Ninguna landing enlazaba al blog.
   - **Arreglado:** las landings pintan «Guías relacionadas» y los artículos, «Sigue leyendo».
3. **El JSON-LD era correcto pero plano.**
   - El `WebSite` se llamaba «Action», que es la cadena de tiendas.
   - `/projects` listaba fichas en `noindex`, con imagen de relleno y el tipo en inglés.
   - `/blog`, `/contact` y `/resenas` no tenían nodo de página.
   - Las fichas apuntaban a un `Service` suelto en vez de al de su landing.
   - **Arreglado:** el grafo queda enlazado por `@id`.
4. **La paridad de la web móvil v2 es completa en la fase 2.**
   - En las 10 landings, el blog y los legales, el móvil (`mv2=1`) emite el mismo title, description, canonical, JSON-LD, H1 y enlaces que escritorio.
   - Desde el punto de vista SEO, **están listas para publicarse**.
   - En la fase 1 (ya pública) falta un enlace: `/blog` no está en el menú ni en el pie del móvil (ver 4.2).
5. **Rendimiento de laboratorio: bueno en móvil y flojo en las escenas 3D de escritorio.**
   - Móvil: 93-99.
   - Escritorio: `/projects` 68 (TBT 1,2 s) y la home 83, por las escenas 3D.
   - Sin CrUX no se puede hablar de Core Web Vitals reales.
6. **El hueco grande sigue siendo de contenido, no técnico** (sección 5):
   - el H1 de la home móvil (la que indexa Google) no lleva ni «Vigo» ni la palabra clave;
   - 8 títulos de post son largos;
   - 5 descripciones de post y 3 de proyecto pasan de 155 caracteres;
   - 2 artículos no tienen landing de destino;
   - 3 landings no tienen ninguna guía.

---

## 2. Core Web Vitals y rendimiento (antes de los cambios)

Lighthouse de laboratorio, producción, 8 oct. **No hay datos de campo.** PageSpeed sin clave da 429 y la API de CrUX pide clave. Para tenerlos hace falta una clave de API de Google o esperar a los informes de Search Console.

| Página | Estrategia | Rend. | FCP | LCP | TBT | CLS | Peso | Elemento LCP |
|---|---|---|---|---|---|---|---|---|
| `/` | móvil (v2) | 96 | 1,0 s | 2,5 s | 120 ms | 0 | 543 KiB | `<h1 id="m-home-title">` |
| `/` | escritorio | 83 | 0,4 s | 1,5 s | 240 ms | 0 | 1.598 KiB | texto de la pantalla de carga (escena 3D «La Grúa») |
| `/servicios` | móvil (v2) | 97 | 1,0 s | 2,5 s | 0 ms | 0 | 383 KiB | entradilla `<p class="text-lead">` |
| `/servicios` | escritorio | 100 | 0,3 s | 0,5 s | 0 ms | 0 | 273 KiB | H1 |
| `/desarrollo-de-aplicaciones-vigo` | móvil (escritorio responsive) | 99 | 1,0 s | 2,2 s | 50 ms | 0 | 397 KiB | primer párrafo |
| `/desarrollo-de-aplicaciones-vigo` | móvil v2 (`mv2=1`) | 96 | 1,1 s | 2,7 s | 70 ms | 0 | 385 KiB | primer párrafo |
| `/desarrollo-de-aplicaciones-vigo` | escritorio | 100 | 0,3 s | 0,5 s | 0 ms | 0 | 293 KiB | H1 |
| `/projects` | móvil (v2) | 93 | 1,0 s | 2,7 s | 210 ms | 0 | 522 KiB | mockup de Autoescuela GTI (precargado) |
| `/projects` | escritorio | **68** | 0,4 s | 0,6 s | **1.180 ms** | 0 | 2.144 KiB | texto del HUD (sala recreativa 3D) |
| `/projects/autoescuela-gti` | móvil (v2) | 96 | 1,0 s | 2,7 s | 10 ms | 0 | 422 KiB | mockup (precargado) |
| `/projects/autoescuela-gti` | escritorio | 100 | 0,4 s | 0,6 s | 0 ms | 0 | 398 KiB | imagen de portada |
| `/blog` | móvil (escritorio responsive) | 98 | 1,0 s | 2,2 s | 10 ms | 0 | 428 KiB | entradilla de un pósit |
| `/blog` | móvil v2 (`mv2=1`) | 95 | 1,1 s | 2,7 s | 110 ms | 0 | 336 KiB | entradilla del post destacado |
| `/blog` | escritorio | 100 | 0,3 s | 0,5 s | 0 ms | 0 | 500 KiB | H1 |
| `/blog/cuanto-cuesta-desarrollar-una-app` | móvil (escritorio responsive) | 98 | 1,0 s | 2,1 s | 30 ms | 0 | 420 KiB | entradilla |
| `/blog/cuanto-cuesta-desarrollar-una-app` | móvil v2 (`mv2=1`) | 95 | 1,2 s | 2,6 s | 150 ms | 0 | 341 KiB | entradilla |
| `/blog/cuanto-cuesta-desarrollar-una-app` | escritorio | 100 | 0,4 s | 0,5 s | 0 ms | 0 | 395 KiB | H1 |
| `/legal/aviso-legal` | móvil v2 (`mv2=1`) | 97 | 1,1 s | 2,5 s | 60 ms | 0 | 336 KiB | párrafo |

Accesibilidad, buenas prácticas y SEO de Lighthouse salen a 100 en todas.

**Lectura:**
- **CLS 0 en todo.** Las imágenes `fill` van en contenedores con proporción fija y no hay saltos.
- **El LCP móvil, en torno a 2,5 s, es casi todo «render delay»** (un 70 %), no carga de imagen. Hay tres causas:
  - el CSS bloqueante;
  - **nueve tipografías precargadas en cada página de la web móvil v2**: ocho archivos de Saira (dos familias por cuatro pesos) y **Space Grotesk, que el árbol móvil no usa**;
  - un TTFB simulado de unos 700 ms.

  Hipótesis sin confirmar: Space Grotesk entra porque `app/global-not-found.tsx` importa el layout de escritorio. Ver 4.2.
- **El LCP de imagen móvil (`/projects` y fichas) ya va precargado** (`priority`). No hay nada que arreglar ahí.
- **Escritorio `/projects` (TBT 1,2 s, 2,1 MB) y la home (TBT 240 ms, 1,6 MB) son las escenas 3D.**
  - Son decisión de diseño y ya llevan `dynamic`, precarga de escenas y calentamiento de shaders.
  - No se han tocado: cualquier arreglo seguro ahí es de arquitectura de la escena, no de SEO.
  - El LCP de escritorio es bueno igualmente (0,6 s y 1,5 s).
- La v2 de la fase 2 da 95-97, un poco por debajo de la versión responsive de escritorio (98-99), por las tipografías. Aun así, está dentro del objetivo (≥ 85).

---

## 3. Hallazgos y estado

Severidad: **Alta** (afecta a indexación o a cómo entiende Google la página), **Media** (señal o enlazado mejorable), **Baja** (higiene).

### 3.1 Arreglados en código (en `main`, sin desplegar)

| URL / ámbito | Problema | Sev. | Estado |
|---|---|---|---|
| 11 de 15 artículos | Solo 1-2 enlaces internos (el índice y, como mucho, otro post). Ninguna landing enlazaba al blog (§6 M4 de la auditoría del 2 oct) | Alta | ✅ `79ab738` + `63f6d7f`. «Guías relacionadas» en las landings: TODOS los posts publicados con `targetLanding` = esa landing, sin tope, y nada si no hay ninguno. «Sigue leyendo» en los artículos: 3, por misma landing → misma categoría → recientes. En los dos árboles, en HTML del servidor y con `<a>` reales. Las landings revalidan cada hora y `/api/revalidate` las refresca todas en cada guardado del panel: el admin solo manda `slug`, y así entra también el cambio de landing de un post. Cada artículo ya enlazaba a su landing con la tarjeta «Servicio relacionado», visible y rastreable en los dos árboles |
| Todo el sitio | `WebSite.name` = «Action», el nombre de la cadena de tiendas (§5.2 de la auditoría). El `Organization` ya era «Action Development» | Media | ✅ `912a3c3`. `websiteSchema()` en shared: `name` «Action Development», `alternateName` «Action», en escritorio y en la zona mobile |
| Todo el sitio | `areaServed` con `{"@type":"Country","name":"ES"}` (§6 M6) | Baja | ✅ `912a3c3`. Ahora `"España"` |
| `/projects` | `ItemList` con las 33 fichas, incluidas las 7 en `noindex`. 11 con `placeholder.webp` de imagen y el tipo en inglés («Web Application») | Media | ✅ `912a3c3`. `CollectionPage` → `ItemList` solo de las 26 indexables (las del sitemap) + `BreadcrumbList` |
| `/servicios` | `CollectionPage` sin lista de servicios | Baja | ✅ `912a3c3`. `ItemList` con el `Service` de cada landing, por el mismo `@id` que emite la landing |
| `/contact` | Sin JSON-LD de página | Baja | ✅ `912a3c3`. `ContactPage` (sobre la organización) + migas |
| `/resenas` | Sin JSON-LD de página | Baja | ✅ `912a3c3`. `WebPage` + migas, sin `Review` ni `aggregateRating`. En escritorio va desde `resenas/layout.tsx` para no tocar su `page.tsx` |
| 26 fichas | `about` era un `Service` suelto en cada ficha. `@id` = URL de la página. Miga «Trabajo» mientras la visible dice «Proyectos» | Media | ✅ `912a3c3`. `CreativeWork` `#project` con `about` = el `Service` de su landing por `@id`, y miga «Proyectos» |
| 10 landings | `FAQPage` y `BreadcrumbList` sin `@id`; `WebPage` sin `breadcrumb` | Baja | ✅ `912a3c3` |
| `/blog` | `CollectionPage` sin la lista de artículos | Media | ✅ `f11f096`. `ItemList` de `BlogPosting` (URL, titular y fechas) |
| 15 artículos | `BlogPosting` sin `wordCount` ni `timeRequired`, imagen sin medidas, `mentions` = `about` duplicado | Baja | ✅ `f11f096` |
| 8 artículos | Title > 60 caracteres con « — Action» (61-77): Google lo cortaba y la marca no se veía (§6 M1) | Media | ✅ `f11f096`. `postTitle`: si no cabe, va sin la marca. Acortarlos en el panel sigue siendo lo mejor (sección 5) |
| 5 artículos y 3 fichas | Meta description > 155 (160-234) | Media | ✅ `f11f096` / `912a3c3`. `metaDescription()` corta en palabra entera con «…». Es una red: reescribirlas sigue pendiente (sección 5) |
| 60 de 61 URLs | Sin `og:image:alt` (solo la home lo tenía) | Baja | ✅ `c0de8dc` + `912a3c3` + `f11f096`. `ogImage(alt, title?)` en todas menos `/resenas` (ver 3.2) |
| Blog, sitemap, landings | Un fallo de Firestore devolvía `[]`/`undefined`: en una revalidación ISR se cacheaba un blog vacío, artículos en 404 y un sitemap sin posts (§6 M9) | Media | ✅ `964c8d7`. `getPosts`/`getPost` lanzan; Next sigue sirviendo la versión buena |
| `/no-existe` (404 global) | Title de la home, `canonical` a la home, `index, follow` junto al `noindex` de Next; sin `<h1>` ni `<main>` | Baja | ✅ `0699f02`. «Página no encontrada — Action», `noindex, follow`, sin canonical, `<main id="main-content">` y `<h1>` (mismas clases, mismo aspecto) |
| `/apple-touch-icon.png` | 404 | Baja | ✅ `0699f02`. 180×180, el globo sobre blanco, declarado en `icons.apple` |
| `sitemap.xml` | `lastmod` del 2 oct en todo menos blog y legales, aunque el 8 oct se publicó la web móvil v2 (lo que indexa Googlebot Smartphone) y cambiaron proyectos y landings | Baja | ✅ `0699f02`. `CONTENT_UPDATED` = 2026-10-08 |

### 3.2 Abiertos

| URL / ámbito | Problema | Sev. | Por qué sigue abierto |
|---|---|---|---|
| Web móvil v2 (fase 1, pública): `/projects`, `/resenas` y las 33 fichas | No enlazan a `/blog`, y el escritorio sí (Header). Rompe la regla de oro de enlaces. En móvil, `/blog` solo recibe enlaces de la home y de los propios artículos | Media | El menú (5 entradas) y el pie (rejilla 2 × 2) son de la maqueta aprobada (DESIGN.md §7). Propuesta: pie 2 × 3 con «Blog» y «Reseñas». **Decisión de diseño** |
| `/`, `/projects`, `/resenas` | H1 distinto en escritorio (`sr-only`) y en móvil. En `/` y `/projects` el móvil, que es el que indexa Google, es el más flojo | Media | Es copy: ver sección 5 |
| `/resenas` | Sin `og:image:alt`. El metadata de escritorio sigue duplicado en `lib/resenas-seo.ts` | Baja | `app/(site)/resenas/page.tsx` tiene un cambio sin commitear del dueño y no se toca. Unificar cuando se commitee |
| 404 dentro de un árbol (`/blog/x`, `/projects/x`) | Heredan title, canonical a la home e `index, follow` del layout (con el `noindex` de Next) | Baja | `not-found.tsx` no admite `metadata`. Arreglarlo exige quitar el canonical `/` de `ROOT_METADATA` y darle a la home de escritorio (client component) un layout propio. Google ignora el canonical de un 404 |
| `http://www.actiondev.es/` | Dos saltos: `http://www` → `https://www` → apex | Baja | Configuración de dominios de Vercel, no código |
| Rutas con árbol móvil | `Vary: User-Agent` no llega en Vercel | Baja | Conocido (CLAUDE.md `[DEPLOY]`). La separación de cachés es correcta por el rewrite |
| Web móvil v2, todas | 9 tipografías precargadas, una de ellas Space Grotesk, que no se usa. Render delay de LCP de 1,2-1,8 s (laboratorio) | Media | Hay que confirmar el origen (hipótesis: `global-not-found` importa el layout de escritorio) y decidir si bajar pesos de Saira o pasar a la variable. Puede cambiar el render del texto: no es «seguro» sin revisión visual |
| `/projects` y `/` en escritorio | TBT de 1,2 s y 240 ms, 2,1 y 1,6 MB | Media | Escenas 3D por diseño. Margen: diferir más la escena, o servir el HUD antes |
| Fichas en escritorio | Sin enlaces a otros proyectos. Las de móvil sí los tienen (anterior/siguiente); en escritorio, Óscar Soto y Tratum solo reciben 1 enlace | Baja | Es un bloque nuevo en la ficha de escritorio. Propuesta: «Más proyectos» con los mismos vecinos que el móvil |
| Manifest | Sin icono `maskable` | Baja | Ya estaba pendiente en CLAUDE.md |
| Medición | Sin CrUX ni datos de campo | Media | Hace falta una clave de API de PageSpeed/CrUX o Search Console con datos |
| `og:site_name` | «Action» en todas, y el `WebSite` ahora es «Action Development» | Baja | Va con la decisión de negocio n.º 6 de la auditoría del 2 oct (sufijo « — Action Development») |

### 3.3 Comprobado y correcto

- **Indexabilidad:**
  - Las 61 URLs del sitemap son 200 e indexables.
  - Las 7 fichas sin caso (`cachadas`, `ertuned`, `marisa-gamez`, `nabi`, `ratsquad`, `roots`, `true-trading-landing`) van en `noindex, follow` y no están en el sitemap, a propósito.
  - `/hablemos/*` va en `noindex, follow`.
- **Redirecciones:** son de un salto:
  - `/reviews` → `/resenas`;
  - `/legal` → `/legal/aviso-legal`;
  - `/diseno-web-pontevedra` → `/desarrollo-web-pontevedra`;
  - `/servicios/` → `/servicios`;
  - `/m/servicios` → `/servicios`;
  - `https://www` → apex.
- **Archivos de rastreo:**
  - `robots.txt` no bloquea `/_next/`, deja pasar `/api/og` y tiene un grupo propio para los bots de IA.
  - `llms.txt` está al día, con las 15 guías.
  - El archivo de IndexNow responde 200.
- **Favicon:** `/favicon.ico` (48 px) y `/logos/action_globe-64.png`, los dos 200. El manifest también es 200.
- **Texto en el HTML del servidor:** está en todas las páginas indexables.
  - `/resenas` de escritorio lleva las 22 reseñas en el HTML (lista plegada con `hidden`) y la móvil, visibles. La nota de CLAUDE.md que decía lo contrario estaba desfasada y ya está corregida.
  - `/projects` de escritorio lleva la lista de proyectos en el HTML (plegada).
- **Mobile-first:** Googlebot Smartphone recibe la web móvil v2 en `/`, `/servicios`, `/projects` + fichas, `/resenas` y `/contact`, y la de escritorio responsive en las landings, el blog y los legales. Title, description, canonical y JSON-LD son idénticos a escritorio en todas.
- **Imágenes:** todas tienen `alt`. Las de `fill` no llevan `width`/`height`, pero van en contenedores con proporción y CLS 0. El LCP de imagen va precargado.

---

### 3.4 Subdominios

| Host | Qué es y quién lo sirve | Problema | Estado |
|---|---|---|---|
| `clientes.actiondev.es` | Portal de clientes (login y panel) dentro de la web ANTIGUA. Repo `pablocs2396/action-dev`; proyecto Vercel `action-dev`, conectado a GitHub (`main` despliega a producción). El middleware reescribe el host a `/clients/*`. La raíz pinta el layout antiguo: title «action.dev \| Consultoría Tecnológica…» y JSON-LD con `@id` `https://actiondev.es/#organization`, otros servicios y FAQ | 200 indexable, sin `X-Robots-Tag`. Además, `sitemap.xml` y `llms.txt` de la web antigua. Compite con la entidad de actiondev.es (auditoría del 2 oct, §2.3) | ◐ **Commit `5cc2752` en `pablocs2396/action-dev`, SIN PUSH** (worktree `scratchpad/action-dev-wt`). Lleva: `X-Robots-Tag: noindex, nofollow` en todas las respuestas (`headers()` de `next.config.ts`), `robots: noindex` en el layout raíz, y fuera el JSON-LD, `public/sitemap.xml` y `public/llms.txt`. `robots.txt` sigue permitiendo rastrear a propósito, para que los bots vean el `noindex`. Comprobado en local (`Host: clientes.actiondev.es`): cabecera y meta en `/`, `/login` y `robots.txt`, y 404 en `sitemap.xml` y `llms.txt`. Afecta también a `action-dev.vercel.app`, que es la misma web antigua. **Desplegar = `git push origin HEAD:main` desde ese worktree** (Vercel lo publica solo). Después: retirada de URLs en Search Console y Bing, y solo entonces `Disallow: /` |
| `pablo.actiondev.es` | Web personal: `apps/pablo` de este monorepo, proyecto Vercel `actiondev-pablo` | Title «Desarrollo de aplicaciones móviles en Vigo — Pablo Cabaleiro» y H1 `sr-only` con la misma keyword: compite con `/desarrollo-de-aplicaciones-vigo` | ⏳ **No tocado** (es la web personal del dueño). Propuesta en la sección 7 |

## 4. Estado de §6 de la auditoría del 2 de octubre

| Punto | Estado hoy |
|---|---|
| A1 Metadatos de la home móvil en el `<body>` | ✅ Resuelto: la home móvil de producción es ya la v2 (Next 16), con todo en el `<head>` |
| A2 Fichas en `noindex` | ✅ 26 de 33 indexables. Las 7 restantes, en `noindex` a propósito |
| A3 Enlaces de la home móvil | ✅ La home v2 enlaza servicios, las 10 landings, proyectos, reseñas, blog, contacto y legales |
| A4 Fichas finas (37-77 palabras) | ⏳ Contenido: hoy tienen 84-160 palabras en móvil y 80-116 en escritorio |
| M1 Títulos y descripciones del blog | ◐ Red técnica en código (`postTitle`, `metaDescription`); reescribirlos en el panel sigue pendiente |
| M2 Fechas de publicación anteriores al blog | ⏳ Contenido: `que-mirar…` (30-07), `senales…` (22-08) y `apps-nativas…` (08-09) |
| M3 Sitemap | ✅ Revalida cada hora, con el webhook y `lastmod` al día |
| M4 Enlazado landings → blog | ✅ `79ab738` |
| M5 `/projects` y `/resenas` sin texto visible y con H1 genérico | ◐ En móvil (lo que indexa Google) ya hay texto visible y H1 propio; el H1 de `/projects` sigue siendo genérico («Proyectos») |
| M6 Schema de la organización | ◐ `Country` corregido. Faltan las coordenadas exactas y `openingHoursSpecification`, que dependen de la ficha de Google |
| M7 `/contact` lento en móvil | ✅ En móvil ya no es la calle 3D: es la v2, sin Three |
| M8 `Vary` en la home de escritorio | ⏳ Igual que en 3.2 |
| M9 `lib/blog.ts` se traga los errores | ✅ `964c8d7` |
| M10 / M11 | ✅ (del 2 oct) |
| Bajos: cadenas de redirección | ◐ Ya solo hay dos saltos, y solo para `http://www` |
| Bajos: 404 | ✅ El global (`0699f02`). El de dentro de un árbol, ver 3.2 |
| Bajos: `apple-touch-icon` | ✅ `0699f02` |
| Bajos: «22 reseñas» frente a 23 | ⏳ Contenido (sección 5) |
| Bajos: `ItemList` con fichas en `noindex` | ✅ `912a3c3` |
| Bajos: OG sin `alt` | ✅ (todas menos `/resenas`) |

---

## 5. Para el agente de contenido

En orden de impacto. Nada de esto se ha tocado en código. `data/landings.ts` y las descripciones de `projects.ts` son suyos.

1. **H1 de la home móvil.**
   - Es la que indexa Google en `/` y hoy dice «Apps, programas y webs para tu negocio»: ni «Vigo» ni «desarrollo de aplicaciones».
   - El title sí los lleva («Action — Desarrollo de Aplicaciones y Webs en Vigo»).
   - Proponer un H1 con la keyword y la ciudad, manteniendo el tono de la maqueta (`components/m/home/HomeHero.tsx`).
2. **H1 de `/projects` en móvil** («Proyectos») y los H1 `sr-only` de escritorio («Nuestros trabajos» en `/projects`, «La plaza de las reseñas» en `/resenas`, `lib/i18n/es.ts`).
   - Proponer «Proyectos de apps y webs en Vigo» o similar.
   - En `/resenas` el móvil ya dice «Reseñas de clientes en Vigo».
3. **Posts sin `targetLanding`** (no salen en ninguna landing ni llevan tarjeta de servicio):
   - `como-hacer-que-tu-web-tenga-visitas-y-convierta`, que podría ir a `desarrollo-web-vigo`;
   - `importancia-ux-ui-apps-moviles`, que podría ir a `desarrollo-de-aplicaciones-vigo`.

   Los dos son además los más cortos (416-426 palabras).
4. **Landings sin ninguna guía**: `diseno-web-vigo`, `desarrollo-web-pontevedra` y `desarrollo-web-redondela`.
   - `desarrollo-web-redondela` y `agencia-desarrollo-web-galicia` son además las que menos enlaces internos reciben (5 y 4).
   - Un post por cada una, con su `targetLanding`, las enlaza solo.
5. **Títulos de post largos** (sin la marca; ideal ≤ 51 para que quepa « — Action»):

   | Post | Caracteres |
   |---|---|
   | `senales-web-pierde-clientes` | 68 |
   | `importancia-ux-ui-apps-moviles` | 63 |
   | `que-mirar-antes-de-contratar-agencia-vigo` | 62 |
   | `apps-nativas-o-multiplataforma` | 60 |
   | `publicar-app-app-store-google-play` | 59 |
   | `cuanto-cuesta-mantener-una-app` | 56 |
   | `cuanto-cuesta-desarrollar-una-app` | 56 |
   | `como-elegir-agencia-desarrollo-web-galicia` | 52 |

6. **Meta descriptions > 155**:
   - En el panel:

     | Post | Caracteres |
     |---|---|
     | `shopify-o-tienda-online-a-medida` | 175 |
     | `app-o-aplicacion-web-pwa` | 169 |
     | `como-elegir-agencia-desarrollo-web-galicia` | 167 |
     | `que-mirar-antes-de-contratar-agencia-vigo` | 163 |
     | `apps-nativas-o-multiplataforma` | 160 |

   - En `projects.ts`: `patricia-avendano` (234), `koopey` (209) y `tratum` (156).
   - En `components/legal/docs/*`: cookies (220), privacidad (169) y aviso legal (160).
7. **Artículos finos**: además de los dos del punto 3, `apps-nativas-o-multiplataforma` (541 palabras), `que-mirar-antes-de-contratar-agencia-vigo` (578) y `senales-web-pierde-clientes` (652).
8. **Fechas de publicación** anteriores a que existiera el blog: `que-mirar…` (30-07), `senales…` (22-08) y `apps-nativas…` (08-09). Poner la real.
9. **Fichas de proyecto finas** (80-160 palabras).
   - 11 proyectos siguen con `placeholder.webp` de imagen principal, y por eso sin `image` en su `CreativeWork`. Entre ellos está Lift, que es indexable.
   - Capturas reales y un párrafo de caso subirían las 26 indexables.
10. **Número de reseñas.**
    - La web dice «22 reseñas» (`testimonials.length`), mientras que `llms.txt` y la ficha de Google dicen 23.
    - Añadir la reseña que falta a `data/testimonials.ts`, o dejar de contar con `length`.
11. **Organización** (negocio):
    - coordenadas exactas del pin de la ficha;
    - `openingHoursSpecification` cuando se confirme el horario;
    - el catálogo de servicios del JSON-LD («Experiencias 3D interactivas», «Interfaces de producto y SaaS», «Estrategia y diseño») no casa con el foco (apps, software y web).
12. **`CONTENT_UPDATED`** en `apps/desktop/src/app/sitemap.ts`: subirlo cuando se publique el nuevo copy de landings o de fichas.
13. **Fusiones con 301** del plan de contenidos (§5.3).
    - Además del `redirect` en `next.config.ts`, el post fusionado tiene que dejar de estar `published` en Firestore, o seguirá en el sitemap, en `/blog`, en «Guías relacionadas» y en «Sigue leyendo».
    - Quitarlo también de `llms.txt`.

---

## 6. Antes de abrir al público la fase 2 de la web móvil

- **Paridad:** comprobada en producción con `mv2=1` en las 10 landings, `/blog`, los 15 artículos y los 4 legales. Coinciden title, description, canonical, JSON-LD, H1 y enlaces internos; ningún texto indexable oculto.
- **Rendimiento:** 95-97 en laboratorio (tabla de la sección 2).
- **Pendiente antes de abrir:**
  - desplegar estos commits, para que los bloques de guías estén en los dos árboles;
  - repetir `curl -A "<UA Googlebot Smartphone>" -b mv2=1` sobre una landing y un artículo;
  - después, `MOBILE_V2_ROUTES` con las rutas de la fase 2 (CLAUDE.md `[DEPLOY]`).

---

## 7. Propuesta para `pablo.actiondev.es` (decide el dueño)

Hoy `apps/pablo/src/app/layout.tsx` pone de title, OG y Twitter «Desarrollo de aplicaciones móviles en Vigo — Pablo Cabaleiro». El H1 `sr-only` es «Pablo Cabaleiro — desarrollo de aplicaciones móviles en Vigo». Resultado: dos URLs del mismo dominio raíz compiten por la keyword núcleo, y la personal no convierte para la agencia.

Propuesta, sin cambiar la marca personal ni el diseño:
1. **Title:** «Pablo Cabaleiro — Desarrollador de apps y fundador de Action Development» (o «Pablo Cabaleiro · Apps y producto digital en Vigo»). Que empiece por la persona, no por la keyword.
2. **Description:** sobre él (trayectoria, qué construye, dónde trabaja), con «Action Development» como empresa, no como servicio.
3. **H1 `sr-only`:** «Pablo Cabaleiro, desarrollador de apps en Vigo», sin «desarrollo de aplicaciones móviles» como frase exacta.
4. **Enlace contextual** a `https://actiondev.es/desarrollo-de-aplicaciones-vigo` con un ancla descriptiva («desarrollo de aplicaciones en Vigo con Action Development») en el hero o en el pie. Hoy solo enlaza a la home de actiondev.es.
5. **Mantener** el `Person` con `@id` `https://pablo.actiondev.es/#person` y `worksFor` → `https://actiondev.es/#organization`: es el autor de los posts del blog y refuerza la entidad.


---

## 8. Validación de los cambios (local, sin build)

- `tsc --noEmit` sin errores en desktop y en mobile. ESLint sin errores en los archivos tocados.
- **e2e, proyecto `mobile`:** 124 de 124. Incluye la paridad de title, description, canonical, JSON-LD, H1, enlaces y textos en landings, blog y legales.
- **e2e, proyecto `chromium`:** pasan todos los que no dependen de escenas 3D: landings, blog, legales, 404, servicios, formularios y campaña.
  - Los de escenas 3D (hero de la home, plaza, recreativa y calle) salen inestables en esta máquina con `chrome-headless-shell` 1248: la escena tarda en estar lista y vencen los timeouts.
  - Los que siguen fallando también fallan en `origin/main` sin estos cambios: `home.spec` 4, 32 y 80, `resenas.spec` 89, 146 y 186, `smoke.spec` 181, 210 y 226, y `visual.spec` (instantánea de entorno, ya documentada en CLAUDE.md).
  - Los de `/contact` (`navigation.spec` 14 y `smoke.spec` 275) fallaron con el servidor recién arrancado y pasan con el servidor caliente.
- **`curl` con el UA de Googlebot Smartphone contra el servidor local:**
  - title, description, canonical y robots van en el `<head>`;
  - el JSON-LD nuevo es idéntico en los dos árboles;
  - `og:image:alt` y `apple-touch-icon` están presentes;
  - el 404 global sale con su título y `noindex, follow`.
- **«Guías relacionadas»:** en local no hay Firestore, así que se probaron marcando dos posts de relleno con `targetLanding`, sin commitear. Salen en escritorio y en móvil con los mismos enlaces. Con datos reales, se verán al desplegar.
