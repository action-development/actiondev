# SEO Playbook — Action (actiondev.es)

**Objetivo:** #1 en Google y en buscadores de IA para "desarrollo de aplicaciones Vigo" (núcleo) + desarrollo web / diseño web en Vigo, Pontevedra y Galicia.

**Estado del código (julio 2026):** on-page completo — landings locales, LocalBusiness schema con NAP+geo, español por defecto, SEO mobile, llms.txt AEO. Lo que queda depende de acciones fuera del repositorio. **El SEO local se gana ~50% fuera de la web.**

---

## 1. Acciones inmediatas (semana 1) — bloqueantes

### 1.1 Google Search Console
- [ ] Dar de alta la propiedad `actiondev.es` (verificación por DNS) en https://search.google.com/search-console
- [ ] Enviar `https://actiondev.es/sitemap.xml`
- [ ] Solicitar indexación manual de las 7 URLs nuevas (`/servicios` + 6 landings) en "Inspección de URLs"
- [ ] Revisar en 1-2 semanas: Cobertura → que las landings figuren como "Indexada"

### 1.2 Bing Webmaster Tools ⚠️ (crítico para IA)
ChatGPT Search y Copilot beben del índice de Bing. Sin esto, no existes en ChatGPT.
- [ ] Alta en https://www.bing.com/webmasters (se puede importar desde Search Console en 1 clic)
- [ ] Enviar el mismo sitemap

### 1.3 Google Business Profile (ya verificada — optimizar)
- [ ] **Categoría principal**: "Empresa de software" (la taxonomía de GBP es cerrada — usar siempre la sugerencia del autocompletado). Secundarias: "Diseñador de sitios web", "Consultora informática", "Servicio de marketing en Internet". Evitar categorías dispersas ("Agencia de marketing") — coherencia > cantidad
- [x] **Coincidencia EXACTA del NAP**: unificado al formato de la ficha — `Rúa Colón, 20, 36201 Vigo, Pontevedra` y `+34 614 02 74 10`. Si algún día cambia la ficha, ajustar `packages/shared/src/seo.ts`
- [ ] **Verificar el pin del mapa**: las coordenadas del schema son aproximadas (42.2372, -8.7203) — copiar las exactas de la ficha a `packages/shared/src/seo.ts`
- [ ] Añadir la web `https://actiondev.es` como sitio y `https://actiondev.es/desarrollo-de-aplicaciones-vigo` como enlace de cita/servicios si la categoría lo permite
- [ ] **Servicios**: crear la lista completa en la ficha (Desarrollo de aplicaciones, Desarrollo web, Diseño web, Apps iOS, Apps Android, Tiendas online…) con descripciones
- [ ] **Fotos**: mínimo 10 — oficina de Rúa Colón, equipo, pantallas con proyectos. Las fichas con fotos reciben 42% más peticiones de cómo llegar
- [ ] **Horario** completo y actualizado

---

## 2. Reseñas (el factor #1 del local pack)

Tenéis 20 reseñas × 5,0 — buena base, pero la VELOCIDAD de reseñas nuevas pesa tanto como el total.

- [ ] Ritmo objetivo: 2-4 reseñas nuevas/mes, constante (mejor que 20 de golpe)
- [ ] Pedirlas al cerrar cada proyecto con enlace directo: `https://search.google.com/local/writereview?placeid=<PLACE_ID>` (sacar el Place ID de la ficha)
- [ ] Pedir a los clientes que **mencionen el servicio y la ciudad** en el texto ("desarrollaron nuestra app en Vigo…") — Google indexa el texto de las reseñas
- [ ] **Responder TODAS las reseñas** (las respuestas también posicionan; mencionar el servicio en la respuesta: "gracias por confiarnos el desarrollo de vuestra aplicación…")

---

## 3. Citaciones y directorios (mes 1)

NAP idéntico en todos (copiar/pegar de `packages/shared/src/seo.ts`):

- [ ] Páginas Amarillas, QDQ, Cylex, Hotfrog, Yelp España
- [ ] Directorios tech: Clutch.co, GoodFirms, Sortlist (perfiles con reseñas de clientes — Clutch aparece MUCHO en respuestas de IA a "best app developers in…")
- [ ] Cámara de Comercio de Vigo / directorio del Círculo de Empresarios de Galicia
- [ ] Perfil completo de LinkedIn Company con dirección y servicios
- [ ] GitHub org pública (aunque sea con repos demo) — señal de autoridad técnica

## 4. Backlinks locales (meses 1-3)

- [ ] Prensa local: Faro de Vigo / Atlántico tienen secciones de empresas tech — una nota sobre "estudio vigués que limita a un proyecto al mes" es historia publicable
- [ ] Casos de éxito cruzados: pedir a clientes con web (Fisionorte, Autoescuela GTI, etc.) un enlace "Web desarrollada por Action" en su footer → backlinks locales temáticos, los más valiosos
- [ ] Awwwards / CSS Design Awards / FWA: cada submission genera perfil + backlink de máxima autoridad del sector
- [ ] Vigo Tech Alliance / eventos tech gallegos (charlas = enlaces desde las webs de los eventos)

## 5. Contenido (continuo — meses 2+)

Las landings cubren la intención comercial. Para dominar también la informacional:
- [ ] Blog técnico-comercial en español, 1-2 posts/mes: "Cuánto cuesta desarrollar una app en 2026", "App nativa vs multiplataforma", "Cómo elegir empresa de desarrollo en Galicia"… — son las preguntas que la gente hace a ChatGPT/Perplexity, y citan a quien las responde bien
- [ ] Convertir los 31 proyectos placeholder de `packages/shared/src/projects.ts` en case studies reales con URL propia (descripciones "TBD" = oportunidad desperdiciada)
- [ ] Actualizar cada landing cada 3-6 meses (frescura)

## 6. Buscadores de IA (GEO) — ya cubierto en código, mantener

Hecho: `llms.txt` con NAP y servicios, robots.ts permite GPTBot/ClaudeBot/PerplexityBot/Google-Extended, JSON-LD completo, FAQPage en landings, contenido factual con datos citables (20 reseñas 5,0, Rúa Colón 20).

- [ ] Test mensual: preguntar a ChatGPT (con búsqueda), Perplexity, Gemini y Claude "mejor empresa de desarrollo de aplicaciones en Vigo" y registrar si aparece Action y qué cita — ajustar llms.txt/landings según lo que citen
- [ ] Wikipedia/Wikidata: si algún día hay cobertura de prensa suficiente, una entrada de Wikidata mejora el knowledge graph

## 7. Vigilancia

- [ ] Google Search Console semanal: posiciones de "desarrollo de aplicaciones vigo", CTR, páginas indexadas
- [ ] Buscar `site:actiondev.es` — deben aparecer las 8 URLs
- [ ] Rich Results Test (https://search.google.com/test/rich-results) sobre la home y la landing núcleo tras el deploy
- [ ] Herramienta de local rank tracking (Local Falcon o similar) para el mapa de posiciones en el local pack de Vigo

---

## Deuda técnica SEO pendiente en el repo

| Ítem | Detalle |
|---|---|
| favicon.ico + PNGs 192/512 | El manifest usa icon.svg + webp; generar set completo de favicons |
| Proyectos con `url: "#"` | 31 proyectos sin URL real ni case study — el ItemList schema pierde valor |
| Vídeo `musa-pot.webm` 6,5MB | Recomprimir (afecta a Core Web Vitals) |
| Coordenadas geo aproximadas | Sustituir por las exactas del pin de GBP en `packages/shared/src/seo.ts` |
| Lint mobile roto | `next lint` deprecado e interactivo — migrar a ESLint CLI |
| Errores lint preexistentes desktop | 5 errores en Basket.tsx, Projects.tsx, i18n/index.tsx, e2e/fixtures.ts |

## Expectativas honestas

Con GBP verificada + 20 reseñas + estas landings, **"desarrollo de aplicaciones Vigo" es alcanzable en top 3 del local pack en 4-8 semanas** tras la indexación, y #1 orgánico en 2-4 meses si se ejecutan las secciones 2-4 (la competencia local es moderada). "Desarrollo web Vigo" y "diseño web Vigo" son más competidas — 3-6 meses. En buscadores de IA los efectos son más rápidos: Perplexity y ChatGPT recogen cambios de índice en semanas, y el llms.txt + FAQPage ya les da material citable directo.
