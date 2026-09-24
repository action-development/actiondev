# SEO Playbook — Action (actiondev.es)

**Objetivo:** #1 en Google y en buscadores de IA para "desarrollo de aplicaciones Vigo" (núcleo) + desarrollo web / diseño web en Vigo, Pontevedra y Galicia.

**Última revisión:** 24 sep 2026 (estado contrastado con el código).

**Leyenda:** `[x]` hecho y verificado en el repo · `[ ]` pendiente · `[?]` acción externa al repo: **no verificable desde el código**, confirmar a mano y marcar.

## Resumen de estado

| Bloque | Estado |
|---|---|
| On-page (código) | ✅ **Completo**: 9 landings locales + hub `/servicios`, JSON-LD (Organization, ProfessionalService con NAP+geo, Service, FAQPage, BreadcrumbList), español por defecto, canonical, sitemap dinámico (landings, blog, proyectos), `robots.ts` con crawlers de IA, `llms.txt`, OG por landing |
| Home indexable | ✅ `<h1>` + texto + enlaces a las landings, ocultos (visibles solo con foco de teclado), en **desktop y mobile** (sep 2026) |
| Contenido | 🟡 Blog técnico montado (Firebase + panel admin, `revalidate`), pero sin posts SEO propios; fichas `/projects/[slug]` con brief/resultado en los 31 proyectos, pero 20 con descripción "próximamente" |
| Señales locales (GBP, reseñas, citaciones, backlinks) | ❓ **Sin verificar** — fuera del repo, es donde se gana ~50% del SEO local |
| Deuda técnica | 🟡 Ver tabla al final |

> **El SEO local se gana ~50% fuera de la web.** Lo que queda en el código es poco; lo que queda de verdad es §1-§4.

**Cambios de código de septiembre 2026** (fuera del plan original): landings `tienda-online-vigo` y `agencia-desarrollo-web-galicia` (intención distinta de las existentes, para no canibalizar la núcleo); títulos de diseño web con «Diseño de Páginas Web»; bloque indexable en la home de desktop y de mobile. Ver el aviso de validación en §5.

---

## 1. Acciones inmediatas (semana 1) — bloqueantes

### 1.1 Google Search Console
- [?] Dar de alta la propiedad `actiondev.es` (verificación por DNS) en https://search.google.com/search-console
- [?] Enviar `https://actiondev.es/sitemap.xml` (el sitemap ya incluye home, `/servicios`, las 9 landings, blog, proyectos y legales)
- [?] Solicitar indexación manual de las 10 URLs nuevas (`/servicios` + 9 landings, incl. `/tienda-online-vigo` y `/agencia-desarrollo-web-galicia`) en "Inspección de URLs"
- [?] Revisar en 1-2 semanas: Cobertura → que las landings figuren como "Indexada"

### 1.2 Bing Webmaster Tools ⚠️ (crítico para IA)
ChatGPT Search y Copilot beben del índice de Bing. Sin esto, no existes en ChatGPT.
- [?] Alta en https://www.bing.com/webmasters (se puede importar desde Search Console en 1 clic)
- [?] Enviar el mismo sitemap

### 1.3 Google Business Profile (ya verificada — optimizar)
- [?] **Categoría principal**: "Empresa de software" (la taxonomía de GBP es cerrada — usar siempre la sugerencia del autocompletado). Secundarias: "Diseñador de sitios web", "Consultora informática", "Servicio de marketing en Internet". Evitar categorías dispersas ("Agencia de marketing") — coherencia > cantidad
- [x] **Coincidencia EXACTA del NAP**: unificado al formato de la ficha — `Rúa Colón, 20, 36201 Vigo, Pontevedra` y `+34 614 02 74 10`. Si algún día cambia la ficha, ajustar `packages/shared/src/seo.ts`
- [ ] **Verificar el pin del mapa** (⚠️ el código lo sigue teniendo aproximado): las coordenadas del schema son aproximadas (42.2372, -8.7203) — copiar las exactas de la ficha a `packages/shared/src/seo.ts`
- [?] Añadir la web `https://actiondev.es` como sitio y `https://actiondev.es/desarrollo-de-aplicaciones-vigo` como enlace de cita/servicios si la categoría lo permite
- [?] **Servicios**: crear la lista completa en la ficha (Desarrollo de aplicaciones, Desarrollo web, Diseño web, Apps iOS, Apps Android, Tiendas online…) con descripciones
- [?] **Fotos**: mínimo 10 — oficina de Rúa Colón, equipo, pantallas con proyectos. Las fichas con fotos reciben 42% más peticiones de cómo llegar
- [?] **Horario** completo y actualizado

---

## 2. Reseñas (el factor #1 del local pack)

Tenéis 20 reseñas × 5,0 — buena base, pero la VELOCIDAD de reseñas nuevas pesa tanto como el total.

- [?] Ritmo objetivo: 2-4 reseñas nuevas/mes, constante (mejor que 20 de golpe)
- [?] Pedirlas al cerrar cada proyecto con enlace directo: `https://search.google.com/local/writereview?placeid=<PLACE_ID>` (sacar el Place ID de la ficha)
- [?] Pedir a los clientes que **mencionen el servicio y la ciudad** en el texto ("desarrollaron nuestra app en Vigo…") — Google indexa el texto de las reseñas
- [?] **Responder TODAS las reseñas** (las respuestas también posicionan; mencionar el servicio en la respuesta: "gracias por confiarnos el desarrollo de vuestra aplicación…")

---

## 3. Citaciones y directorios (mes 1)

NAP idéntico en todos (copiar/pegar de `packages/shared/src/seo.ts`):

- [?] Páginas Amarillas, QDQ, Cylex, Hotfrog, Yelp España
- [?] Directorios tech: Clutch.co, GoodFirms, Sortlist (perfiles con reseñas de clientes — Clutch aparece MUCHO en respuestas de IA a "best app developers in…")
- [?] Cámara de Comercio de Vigo / directorio del Círculo de Empresarios de Galicia
- [?] Perfil completo de LinkedIn Company con dirección y servicios
- [?] GitHub org pública (aunque sea con repos demo) — señal de autoridad técnica

## 4. Backlinks locales (meses 1-3)

- [?] Prensa local: Faro de Vigo / Atlántico tienen secciones de empresas tech — una nota sobre "estudio vigués que limita a un proyecto al mes" es historia publicable
- [?] Casos de éxito cruzados: pedir a clientes con web (Fisionorte, Autoescuela GTI, etc.) un enlace "Web desarrollada por Action" en su footer → backlinks locales temáticos, los más valiosos
- [?] Awwwards / CSS Design Awards / FWA: cada submission genera perfil + backlink de máxima autoridad del sector
- [?] Vigo Tech Alliance / eventos tech gallegos (charlas = enlaces desde las webs de los eventos)

## 5. Contenido (continuo — meses 2+)

Las landings cubren la intención comercial. Para dominar también la informacional:
- [x] Infraestructura del blog: `/blog` + `/blog/[slug]` (Firebase, panel `apps/admin`, webhook `/api/revalidate`, entradas en el sitemap)
- [ ] **Posts SEO propios**, 1-2/mes en español — **4 borradores listos en `docs/blog-borradores-seo.md`** (coste de una app, nativa vs multiplataforma, cómo elegir agencia, Shopify vs a medida), pendientes de revisar y publicar; el blog ya soporta enlaces internos `[texto](/ruta)`: "Cuánto cuesta desarrollar una app en 2026", "App nativa vs multiplataforma", "Cómo elegir empresa de desarrollo en Galicia", "Cuánto cuesta una tienda online"… — son las preguntas que la gente hace a ChatGPT/Perplexity, y citan a quien las responde bien. Publicar es escribir en Firestore: requiere aprobación del contenido
- [x] Case studies: `/projects/[slug]` con "qué nos pidieron / qué conseguimos" (`brief`/`result`) en los 31 proyectos
- [ ] Cerrar el resto de los case studies: **20 de 31** proyectos siguen con `description` "Case study próximamente" y `technologies: ["TBD"]`; **18 de 31** con `url: "#"` (`packages/shared/src/projects.ts`)
- [x] Landings por keyword nuevas: `tienda-online-vigo`, `agencia-desarrollo-web-galicia`
- [ ] **Validar esas dos con datos**: se crearon sin volumen de búsqueda. A las 4-6 semanas revisar en Search Console si reciben impresiones; si no, fusionar o retirar (evitar canibalizar la landing núcleo)
- [ ] Actualizar cada landing cada 3-6 meses (frescura) y subir `CONTENT_UPDATED` en `sitemap.ts` al hacerlo

## 6. Buscadores de IA (GEO) — cubierto en código, mantener

- [x] `llms.txt` con NAP, servicios y las 9 landings; `robots.ts` permite GPTBot / ClaudeBot / PerplexityBot / Google-Extended / OAI-SearchBot; JSON-LD completo; FAQPage en landings; contenido factual citable (20 reseñas 5,0, Rúa Colón 20)
- [ ] Al añadir una landing: actualizar `landings.ts`, `SERVICE_LANDINGS` (`packages/shared/src/seo.ts`) y `llms.txt`
- [?] Test mensual: preguntar a ChatGPT (con búsqueda), Perplexity, Gemini y Claude "mejor empresa de desarrollo de aplicaciones en Vigo" y registrar si aparece Action y qué cita — ajustar llms.txt/landings según lo que citen
- [ ] Wikipedia/Wikidata: si algún día hay cobertura de prensa suficiente

## 7. Vigilancia

- [?] Google Search Console semanal: posiciones de "desarrollo de aplicaciones vigo", CTR, páginas indexadas
- [?] Buscar `site:actiondev.es` — deben aparecer las 11 URLs (home + `/servicios` + 9 landings)
- [?] Rich Results Test (https://search.google.com/test/rich-results) sobre la home y la landing núcleo tras el deploy
- [?] Herramienta de local rank tracking (Local Falcon o similar) para el mapa de posiciones en el local pack de Vigo

---

## Deuda técnica SEO

**Pendiente**

| Ítem | Detalle |
|---|---|
| `mapsUrl` es una URL de búsqueda | Sustituir por la ficha real (`g.page/r/…` o `place_id`) en `packages/shared/src/seo.ts`. La usan las landings y el botón "G" de `/resenas`. También sirve para el enlace de reseñas de §2 |
| Coordenadas geo aproximadas | 42.2372, -8.7203: sustituir por las exactas del pin de GBP en `packages/shared/src/seo.ts` |
| Proyectos con datos "TBD" | 20/31 con descripción "próximamente" y `technologies: ["TBD"]`; 18/31 con `url: "#"` (el `ItemList` schema pierde valor) |

**Resuelto**

| Ítem | Cómo |
|---|---|
| `favicon.ico` y icono maskable | `public/favicon.ico` (16/32/48), `icons/icon-maskable-192/512.png` (fondo lima, glifo en zona segura) y entradas `purpose: "maskable"` en `manifest.ts`. El favicon declarado sigue siendo el PNG 64 |
| Lint mobile | `apps/mobile` usa `eslint` (config plana, mismas versiones que desktop): 0 errores. `react-hooks/refs` está apagada solo en `app/page.tsx` (lee refs en render para el Easter egg del logo) |
| Home mobile sin verificar | Comprobada en servidor real: `lang="es"`, 1 `<h1>`, 10 enlaces en el HTML, panel visible con Tab y sin cambio visual. El segundo `<h1>` (título de About) pasó a `<h2>` |
| Iconos PWA 192/512 | `public/icons/icon-192.png` y `icon-512.png`, ya en `manifest.ts` |
| Vídeo `musa-pot.webm` (era 6,5 MB) | Ahora pesa 1,5 MB |
| Errores de lint en desktop | `pnpm lint` → 0 errores (quedan 7 warnings) |
| Home sin `<h1>` ni enlaces | Añadidos en desktop y mobile (sep 2026) |
| Landings sin enlazar desde ninguna página | Enlaces ocultos desde la home; a propósito **no** en Header/Footer (decisión del cliente) |

## Expectativas honestas

Con GBP verificada + 20 reseñas + estas landings, **"desarrollo de aplicaciones Vigo" es alcanzable en top 3 del local pack en 4-8 semanas** tras la indexación, y #1 orgánico en 2-4 meses si se ejecutan las secciones 2-4 (la competencia local es moderada). "Desarrollo web Vigo" y "diseño web Vigo" son más competidas — 3-6 meses. En buscadores de IA los efectos son más rápidos: Perplexity y ChatGPT recogen cambios de índice en semanas, y el llms.txt + FAQPage ya les da material citable directo.
