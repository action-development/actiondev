# Plan de contenidos y mapa de keywords — actiondev.es — 8 de octubre de 2026

**Para quién es:** los redactores que escriben los artículos (esta noche) y el agente que toca el código de las páginas existentes.
**De qué parte:** la auditoría `docs/seo-auditoria-2026-10.md` (2 oct). Este documento no la repite: añade datos de volumen reales (Keyword Planner), SERPs de Google vistas desde Vigo y el estado actual del blog, y los convierte en un mapa de URLs, 13 briefs y una lista de cambios concretos.
**Foco de negocio (sin cambios):** primero apps; después Vigo y la provincia de Pontevedra; después Galicia.

---

## 0. Resumen

1. **La demanda local medible es pequeña y está en «diseño web».** En Keyword Planner, «diseño web vigo», «diseño web pontevedra» y «diseño web galicia» tienen 100–1.000 búsquedas al mes tanto en España como en Galicia. Las búsquedas de apps con ciudad («desarrollo apps vigo», «desarrollo de aplicaciones pontevedra») salen **sin datos** (menos de ~10). De las búsquedas de apps con ciudad o región que se midieron, la única que da cifra es **«desarrollo apps galicia» (10–100)**. Esto cambia la recomendación de la auditoría sobre el 301 de la landing de Galicia (§5).
2. **El volumen está en preguntas nacionales y en soluciones verticales,** y ahí Action tiene casos reales: «cuánto cuesta crear una app» (100–1.000), «carta digital restaurante» (100–1.000), «vender entradas online» (100–1.000), «sistema de reservas online» (100–1.000, puja alta de 5–14 €), «integración erp» (100–1.000, +900 % en tres meses), «plataforma de formación online» (100–1.000) y, en Galicia, **«ig300c» (100–1.000)** e «igape ayudas» (100–1.000).
3. **actiondev.es no aparece en el top 10 de Google en ninguna** de las 16 búsquedas medidas desde Vigo. En Bing sale **la home** (no la landing) en «desarrollo apps vigo» (#2) y «desarrollo web vigo» (#4): la canibalización home/landing sigue viva. Sortlist es #1 en Google en tres búsquedas de apps en Vigo y Galicia.
4. **El blog ya cubre bien el bloque «coste» de apps** (15 posts publicados: coste, mantenimiento, publicación, MVP, PWA, nativa/multiplataforma, ASO, app para empleados…). Lo que falta son **artículos de caso** que conviertan los proyectos reales en respuestas a búsquedas concretas, y arreglar títulos y metas de los posts actuales.
5. **Plan:** 13 artículos nuevos (6 de caso, 7 informativos; 7 en P1), cambios por URL en las 10 landings, las páginas hub, las fichas de proyecto y los 15 posts, un plan de enlazado hub → spokes y una lista corta de tareas fuera de la web.

---

## 1. Método y fuentes

### 1.1 Google Ads · Keyword Planner (datos reales)
- **Cuándo:** 8 de octubre de 2026, por la noche. Periodo de los datos: septiembre de 2025 – agosto de 2026. Red: Google.
- **Herramientas usadas:** «Consulta el volumen de búsquedas y las previsiones» (dos listas: 148 y 58 keywords) y «Descubre nuevas palabras clave» (dos búsquedas de 10 semillas; 1.412 y 3.082 ideas, se leyeron las 500 primeras de cada una por relevancia).
- **Ubicaciones:** España; Galicia; provincia de Pontevedra; provincia de A Coruña. Idioma: todos (volumen) y español (ideas).
- **Cómo leer las cifras:** la cuenta no tiene gasto suficiente, así que Google solo da **intervalos**: 10–100, 100–1.000, 1.000–10.000, 10.000–100.000. «Sin datos» = Google no devuelve nada (por debajo de ~10 al mes). En las provincias aparece también 0–10. **No son cifras exactas y no hay que presentarlas como tales.**
- **Qué se tocó en la cuenta:** nada fuera del Planificador. Al consultar volúmenes, el Planificador guarda automáticamente dos planes («Plan del oct 8, 2026…»); se pueden retirar desde Planificador → Planes que has creado. Ninguna campaña, facturación ni configuración se modificó.
- **Limitación:** Keyword Planner agrupa variantes cercanas (con y sin «de», con y sin tilde), así que una variante puede salir «sin datos» porque su volumen se asigna a otra.

### 1.2 Autocompletado de Google
- `suggestqueries.google.com` con `hl=es&gl=es`, 65 semillas × 28 expansiones (la semilla sola, a–z y ñ) = **1.820 consultas**, sin ningún error. Se filtró el ruido (marcas de apps de consumo, otros países).
- Semillas: preguntas de precio («cuánto cuesta una app / crear / hacer»), «crear una app», «app para…» (negocio, reservas, gimnasio, entrenador, autoescuela, clubes, restaurante, empleados, inmobiliaria, comunidad), «react native o flutter», «app nativa o…», «software a medida», «erp a medida», «cuánto cuesta una página web / una web / una tienda online», «mantenimiento web/app», «igape ayudas», «kit digital», locales (+vigo, +pontevedra, +galicia).

### 1.3 SERPs
- **Google.es** en la Chrome de la sesión, `hl=es&gl=es` y ubicación **Vigo** forzada con el parámetro `uule`. 16 búsquedas antes de que Google pidiera captcha (el resto no se forzó). Se anotaron los 10 primeros resultados, las «Otras preguntas de los usuarios» (PAA), el pack local y si había resumen de IA (AIO). La sesión estaba identificada en Google: puede haber algo de personalización.
- **Bing** (`mkt=es-ES`) para las 18 búsquedas que faltaban o para contrastar. Bing alimenta ChatGPT Search y Copilot.
- Todo es una foto de un solo día.

### 1.4 Hechos
- Repo: `packages/shared/src/projects.ts` (33 proyectos), `apps/desktop/src/data/landings.ts` (10 landings), `apps/desktop/src/data/testimonials.ts` (22 reseñas), `packages/shared/src/seo.ts`, `packages/shared/src/blog.ts`, `packages/shared/src/authors.ts`, `CLAUDE.md`.
- Blog: los 15 documentos de Firestore `posts` (los 15 están publicados; ningún borrador) y `https://actiondev.es/sitemap.xml`.
- Webs de clientes revisadas en vivo el 8-10-2026 (título, páginas, textos) y la API pública de búsqueda de App Store.
- Ayudas: Diario Oficial de Galicia y sede electrónica de la Xunta (IG300C).

---

## 2. Datos que deciden el plan

### 2.1 Volúmenes (Keyword Planner, búsquedas al mes)

**Apps**

| Keyword | España | Galicia | Prov. Pontevedra | Nota |
|---|---|---|---|---|
| desarrollo de apps / desarrollo apps / desarrollo de aplicaciones móviles | 100–1.000 c/u | 10–100 | 10–100 | Nacional, puja 3–11 € |
| empresas de desarrollo de apps / desarrolladores de apps / diseño apps | 100–1.000 c/u (ideas) | — | — | Nacional |
| desarrollo apps galicia | 10–100 | 10–100 | 10–100 | **La única de apps con ciudad o región (de las medidas) que da cifra** |
| desarrollo apps vigo / desarrollo de aplicaciones vigo / empresa desarrollo apps vigo | sin datos | sin datos | — | Autocompleta «desarrollo de apps en vigo» |
| desarrollo de aplicaciones pontevedra / desarrollo apps pontevedra | sin datos | sin datos | — | |
| cuánto cuesta crear una app | 100–1.000 | 10–100 | 10–100 | AIO en Google |
| cuánto cuesta una app / hacer / desarrollar / para mi negocio / en España | 10–100 c/u | 10–100 | 10–100 | |
| cuánto cuesta mantener una app | 10–100 | 0 | 0–10 | |
| cuánto cuesta subir una app a Play Store / publicar en App Store | 10–100 | 10–100 | 10–100 | |
| qué es una PWA | 100–1.000 | 10–100 | 10–100 | |
| app nativa o híbrida | 10–100 | 0 | 0–10 | «app nativa o multiplataforma»: sin datos |
| react native o flutter / flutter vs react native | 10–100 | 10–100 | — | «react native»: 1.000–10.000 (desarrolladores) |
| app para fichar / app control horario | 100–1.000 c/u | 10–100 | 10–100 | Puja 2,6–18 € |
| app para gimnasio | 100–1.000 | 10–100 | 10–100 | Mayoría, usuarios buscando app de rutinas |
| app para entrenador personal / app para reservar clases / app reservas gimnasio | 10–100 c/u | 10–100 | 10–100 | |
| app para clubes deportivos / página web club deportivo / inscripciones online | 10–100 c/u | 10–100 | 10–100 | |
| plataforma de formación online / plataforma de cursos online | 100–1.000 c/u | 10–100 | 10–100 | |
| vender cursos online / app para vender cursos / evitar capturas de pantalla | 10–100 c/u | 0–100 | — | |
| app de reservas | 10–100 | 10–100 | 10–100 | |
| mvp app | 10–100 | 10–100 | 10–100 | SERP mezclada con una app llamada «MVP» |

**Software**

| Keyword | España | Galicia | Nota |
|---|---|---|---|
| software a medida / desarrollo de software a medida | 100–1.000 c/u | 10–100 | Puja 3,8–9,4 € |
| software a medida vigo / empresa software vigo / desarrollo software vigo | sin datos | sin datos | |
| integración erp | 100–1.000 (+900 % a tres meses) | 10–100 | Puja 2,7–11,4 € |
| erp para pymes | 100–1.000 | 10–100 | Intención de elegir un ERP |
| erp a medida / cuánto cuesta un erp / cuánto cuesta un software a medida | 10–100 c/u | 0–100 | |
| software autoescuela / programa gestión autoescuela | 10–100 c/u | 10–100 | SERP 100 % SaaS |
| **ig300c** | 100–1.000 | **100–1.000** | Línea del IGAPE |
| igape ayudas | 100–1.000 | 100–1.000 | |
| ayudas igape digitalización / subvenciones digitalización galicia / kit digital galicia / ticket innova | 10–100 c/u | 10–100 | |
| kit digital | 10.000–100.000 | 1.000–10.000 | Programa cerrado: no es objetivo |

**Web y ecommerce**

| Keyword | España | Galicia | Prov. Pontevedra | Nota |
|---|---|---|---|---|
| **diseño web vigo** | 100–1.000 | 100–1.000 | 100–1.000 | La mayor demanda local |
| **diseño web pontevedra** | 100–1.000 | 100–1.000 | 100–1.000 | Sin landing con ese título |
| **diseño web galicia** | 100–1.000 | 100–1.000 | 10–100 | |
| desarrollo web vigo / páginas web vigo / diseño páginas web vigo | 10–100 c/u | 10–100 | 10–100 | |
| desarrollo web pontevedra / páginas web pontevedra | 10–100 | 0–100 | 10–100 | |
| agencia desarrollo web galicia / agencia web galicia / agencia web vigo | sin datos | sin datos | — | |
| páginas web redondela / diseño web redondela | sin datos | sin datos | — | |
| cuánto cuesta hacer / crear una página web | 100–1.000 c/u | 10–100 | — | |
| cuánto cuesta una página web / una web / precio página web / presupuesto página web | 100–1.000 c/u | 10–100 | 10–100 | SERP con tablas en € |
| mantenimiento página web / mantenimiento web / mantenimiento web precio | 100–1.000 c/u | 10–100 | 10–100 | |
| carta digital restaurante | 100–1.000 | 10–100 | — | «menú digital restaurante», «carta qr restaurante»: 10–100 |
| vender entradas online | 100–1.000 | 10–100 | — | «venta de entradas» y «ticketera»: 1.000–10.000, intención de comprador |
| sistema de reservas / sistema de reservas online | 100–1.000 c/u | 10–100 | — | Puja 5,2–14,3 € |
| web 3d | 100–1.000 | 10–100 | — | Intención mezclada (herramientas de modelado) |
| crear tienda online / montar tienda online / agencia ecommerce | 100–1.000 c/u | 10–100 | 10–100 | |
| tienda online vigo | 10–100 | 10–100 | 10–100 | En Bing devuelve tiendas, no agencias |
| cuánto cuesta una tienda online | 10–100 | 10–100 | 10–100 | |
| posicionamiento web vigo / seo vigo | 100–1.000 / 10–100 | 10–100 | 10–100 | No es un servicio de Action: no se persigue |

### 2.2 SERPs de Google desde Vigo (8-10-2026)

| Búsqueda | Top 5 orgánico | PAA | ¿actiondev.es? |
|---|---|---|---|
| desarrollo apps vigo | sortlist.es, consiga.es, cocosolution.com, itsicap.com, databay.solutions (luego asdsolutions, docastix, kevsalazar, q2bstudio, intecoingenieria) | ¿Cuánto se cobra por el desarrollo de una app? · ¿Cuánto cobra un desarrollador de apps? | No (top 10). Pack local: Anubía, Solvos, Rodapro, Innatial |
| desarrollo de aplicaciones vigo | itsicap, sortlist, asdsolutions, databay, docastix (+2 resultados de FP) | ¿Qué empresas desarrollan aplicaciones? | No. Pack: Rodapro, SICOM, OnlyDevs, Innatial |
| empresas desarrollo apps vigo | sortlist, databay, asdsolutions, q2bstudio (listado «30 mejores»), itsicap | ¿Cuánto cobra un creador de apps? | No |
| desarrollo aplicaciones pontevedra | grupounifema, cocosolution, **paxinasgalegas.es**, q2bstudio, noatica | ¿Cuáles son 5 empresas que desarrollan software? | No |
| desarrollo apps galicia (AIO) | sortlist, galvintec, docastix, cocosolution, visualpublinet (… **mapatic.clusterticgalicia.com** #9) | ¿Cuánto cuesta desarrollar una app en España? · ¿Cuánto gana una app con 1000 descargas? | No |
| cuánto cuesta una app (AIO) | cuantocuestamiapp.com, docastix (blog), cuantocuestaunaapp.com, reddit, adrianpozo.es | ¿Cuánto dinero se necesita para hacer una app? · ¿Cuánto cuesta tener una app en Play Store / App Store? | No |
| cuánto cuesta crear una app (AIO) | cuantocuestamiapp, isvisoft, adrianpozo, yeeply, reddit | ¿Cuánto se cobra por hacer una app? | No |
| cuánto cuesta una app para mi negocio (AIO) | isvisoft, adrianpozo, dribba, aulacm, reddit | ¿Cómo hacer una app para mi negocio gratis? | No |
| cuánto cuesta mantener una app (AIO) | gooapps, dribba, alicantedevelopers, reddit, yeeply | ¿Cuánto vale poner una app en Play Store? · ¿Cuánto dura una app en mantenimiento? | No |
| react native o flutter | baturamobile, innowise, mitsoftware, dribba, reddit | Is Flutter better than React Native? · Is Flutter still relevant in 2026? · Is Flutter really native? | No |
| app nativa o multiplataforma (AIO) | dempo, innowise, app2u, anubbe, arangoya | ¿Qué significa que una app sea nativa? · ¿Qué es una app multiplataforma? | No |
| mvp app (AIO) | dos fichas de una app llamada «MVP», techbarcelona, adjust, gunkastudios | ¿Qué es MVP en app? | No |
| software a medida vigo | bytesoft.eu, forgenex, galvintec, docastix, growzy | ¿Cuánto cuesta un software a medida? · ¿Qué es el software a medida? | No |
| empresa software vigo | sortlist, caisoft, asdsolutions, q2bstudio, proveedores.com | ¿Cuáles son las empresas más importantes de Vigo? | No |
| erp a medida (AIO) | lotura, zucchetti, softwaredoit, ticportal, onegolive | ¿Qué ERP es bueno y barato? · ¿Cuánto cuesta un software a medida? | No |
| cuánto cuesta un software a medida (AIO) | naimitech, deru, dediez, fundy, adrianpozo | ¿Cuánto se cobra por hacer un software? | No |

**Bing (es-ES), 8-10-2026, lo relevante:** «desarrollo apps vigo»: multiapps.es #1, **actiondev.es (home) #2**, hostino, sortlist, asdsolutions. «desarrollo web vigo»: mejoresdevigo.es #1, onlydevs, malditoinvierno, **actiondev.es (home) #4**. «diseño web vigo»: croquetastudio, vigoindesign, websgalicia, hacce. «software autoescuela»: 9 de 9 son SaaS (sgautoescuelas, autogest, aptoa…). «app para clubes deportivos»: 6 de 6 SaaS (sportmember, sporteasy, 4club…). «vender entradas online sin comisiones»: reservaok, talonarium. «igape ayudas digitalización»: igape.gal, sede.xunta.gal (IG300C), consultoras. «tienda online vigo»: tiendas, ninguna agencia.

### 2.3 Lo que se deduce
- **Para Google, las búsquedas comerciales locales de apps se ganan con directorios y autoridad, no con más páginas.** Sortlist es #1 en tres SERPs y Páxinas Galegas y el mapa del Clúster TIC salen en otras dos (§7).
- **Las búsquedas verticales («software autoescuela», «app para clubes deportivos», «app para entrenador personal») tienen SERPs llenas de SaaS.** La intención es comparar: «programa estándar o a medida». Ahí un artículo de caso real de una agencia tiene hueco y no compite con ninguna landing.
- **Las búsquedas de precio tienen AIO y tablas en €.** Sin cifras, Action compite en desventaja: se mantiene la decisión pendiente de la auditoría (§5.3 y §8.1) y se marca en cada brief.
- **«Diseño web pontevedra» (100–1.000) no tiene una landing con ese título;** la que lo cubre se titula «Desarrollo y Diseño Web en Pontevedra».

---

## 3. Mapa de keywords → URL

Una URL por cluster. Los artículos nuevos atacan intención informativa o de comparación y enlazan a su landing (`targetLanding`); nunca la sustituyen.

| # | Cluster | Keyword principal | Vol. ES / Galicia | Intención | URL objetivo | Competencia que rankea hoy (Google Vigo salvo «B» = Bing) |
|---|---|---|---|---|---|---|
| 1 | Apps · Vigo | desarrollo de apps en Vigo (+ desarrollo de aplicaciones vigo, empresa desarrollo apps vigo) | sin datos / sin datos | Transaccional local | `/desarrollo-de-aplicaciones-vigo` | sortlist, itsicap, asdsolutions, cocosolution, databay; B: multiapps, **home de actiondev.es** |
| 2 | Apps · nacional | desarrollo de apps / empresas de desarrollo de apps | 100–1.000 / 10–100 | Comercial | `/desarrollo-de-aplicaciones-vigo` (secundaria: H2 «empresa de desarrollo de apps») | — |
| 3 | Apps · provincia | desarrollo de aplicaciones Pontevedra | sin datos | Transaccional local | `/desarrollo-de-aplicaciones-pontevedra` | grupounifema, cocosolution, paxinasgalegas |
| 4 | Apps · Galicia | desarrollo apps galicia | 10–100 / 10–100 | Transaccional | `/desarrollo-de-aplicaciones-galicia` (decisión pendiente, §5) | sortlist, galvintec, docastix, cocosolution |
| 5 | Coste app | cuánto cuesta crear una app (+ una app, hacer, desarrollar, para mi negocio) | 100–1.000 / 10–100 | Informativa-comercial | `/blog/cuanto-cuesta-desarrollar-una-app` (retitular, §5) | cuantocuestamiapp, docastix, isvisoft, adrianpozo |
| 6 | Mantener app | cuánto cuesta mantener una app | 10–100 | Informativa | `/blog/cuanto-cuesta-mantener-una-app` | gooapps, dribba, yeeply |
| 7 | Publicar app | cuánto cuesta subir/publicar una app | 10–100 | Informativa | `/blog/publicar-app-app-store-google-play` | — |
| 8 | MVP | mvp app | 10–100 | Informativa | `/blog/mvp-de-una-app` | techbarcelona, adjust, gunkastudios |
| 9 | PWA | qué es una PWA / app o web | 100–1.000 | Informativa | `/blog/app-o-aplicacion-web-pwa` | — |
| 10 | Nativa | app nativa o híbrida / multiplataforma | 10–100 | Comparación | `/blog/apps-nativas-o-multiplataforma` | dempo, innowise, app2u |
| 11 | Frameworks | react native o flutter | 10–100 | Comparación | **NUEVO** `/blog/react-native-o-flutter` (I4) | baturamobile, dribba, mitsoftware |
| 12 | ASO | aso app store | 10–100 | Informativa | `/blog/como-posicionar-una-app-aso` | — |
| 13 | Diseño de apps | diseño apps | 100–1.000 (ideas) | Informativa-comercial | `/blog/importancia-ux-ui-apps-moviles` (reorientar, §5) | — |
| 14 | Fichaje | app para fichar / app control horario | 100–1.000 / 10–100 | Comparación | `/blog/app-para-empleados-partes-fichajes` (retitular) | B: jibble, stelorder (listados SaaS) |
| 15 | Entrenadores | app para entrenador personal (+ reservar clases, reservas gimnasio) | 10–100 | Comparación | **NUEVO** `/blog/app-entrenador-personal` (C5) | B: harbiz, trainerstudio |
| 16 | Clubes | app para clubes deportivos (+ inscripciones online, página web club deportivo) | 10–100 | Comparación | **NUEVO** `/blog/inscripciones-online-club-deportivo` (C3) | B: sportmember, sporteasy, 4club |
| 17 | Formación | plataforma de formación online (+ cursos online, vender cursos) | 100–1.000 / 10–100 | Comparación | **NUEVO** `/blog/plataforma-cursos-online-propia` (C6) | B: tiendanube, time.ly |
| 18 | Software · Vigo | software a medida Vigo / empresa de software Vigo | sin datos | Transaccional local | `/software-a-medida-vigo` | bytesoft, forgenex, galvintec, docastix; sortlist, caisoft |
| 19 | Software · nacional | software a medida / desarrollo de software a medida | 100–1.000 | Comercial | `/software-a-medida-vigo` (secundaria) | — |
| 20 | Integración | integración erp | 100–1.000 / 10–100 | Informativa-comercial | **NUEVO** `/blog/integracion-erp` (I6) | sin medir en Google |
| 21 | Autoescuelas | software autoescuela / programa gestión autoescuela | 10–100 | Comparación | **NUEVO** `/blog/software-autoescuela` (C4) | B: sgautoescuelas, autogest, aptoa… |
| 22 | Ayudas | ig300c / igape ayudas | 100–1.000 / 100–1.000 | Informativa | **NUEVO** `/blog/ayudas-igape-ig300c` (I1) | B: igape.gal, sede.xunta.gal, consultoras |
| 23 | Diseño web · Vigo | diseño web Vigo (+ páginas web vigo) | 100–1.000 / 100–1.000 | Transaccional local | `/diseno-web-vigo` | B: croquetastudio, vigoindesign, websgalicia, hacce |
| 24 | Desarrollo web · Vigo | desarrollo web Vigo / web a medida | 10–100 | Transaccional local | `/desarrollo-web-vigo` | B: mejoresdevigo, onlydevs, **home de actiondev.es** |
| 25 | Web · provincia | diseño web Pontevedra (+ desarrollo, páginas web) | 100–1.000 / 100–1.000 | Transaccional local | `/desarrollo-web-pontevedra` (retitular) | — |
| 26 | Web · Redondela | páginas web Redondela | sin datos | Transaccional local | `/desarrollo-web-redondela` (prueba local real) | — |
| 27 | Web · Galicia | diseño web Galicia / agencia desarrollo web Galicia | 100–1.000 / sin datos | Comercial | `/agencia-desarrollo-web-galicia` (retitular) | — |
| 28 | Coste web | cuánto cuesta hacer una página web (+ crear, precio, presupuesto) | 100–1.000 / 10–100 | Informativa-comercial | **NUEVO** `/blog/cuanto-cuesta-una-pagina-web` (I2) | B: hostinger, cronoshare, jrcweb |
| 29 | Mantener web | mantenimiento página web (+ web, precio) | 100–1.000 / 10–100 | Informativa | **NUEVO** `/blog/mantenimiento-pagina-web` (I3) | — |
| 30 | Carta | carta digital restaurante | 100–1.000 / 10–100 | Comparación | **NUEVO** `/blog/carta-digital-restaurante` (C1) | — |
| 31 | Entradas | vender entradas online | 100–1.000 / 10–100 | Comparación | **NUEVO** `/blog/vender-entradas-online` (C2) | B: reservaok, talonarium |
| 32 | Reservas | sistema de reservas online | 100–1.000 / 10–100 | Comparación | **NUEVO** `/blog/sistema-reservas-online` (I5) | B: meetergo |
| 33 | 3D | web 3d | 100–1.000 / 10–100 | Informativa | **NUEVO** `/blog/web-3d-interactiva` (I7) | sin medir |
| 34 | Tienda · Vigo | diseño de tiendas online Vigo / ecommerce / Shopify Vigo | 10–100 / sin datos | Transaccional local | `/tienda-online-vigo` | B: «tienda online vigo» devuelve tiendas |
| 35 | Shopify | Shopify o a medida / shopify o woocommerce / cuánto cuesta una tienda online | 10–100 | Comparación | `/blog/shopify-o-tienda-online-a-medida` | — |
| 36 | Elegir agencia | cómo elegir agencia / contratar agencia | sin datos | Comparación | `/blog/como-elegir-agencia-desarrollo-web-galicia` | — |
| 37 | Maps | cómo salir en Google Maps | 10–100 | Informativa | `/blog/como-salir-en-google-maps-vigo` | — |
| 38 | Web que no funciona | web pierde clientes / visitas y conversión | sin medir | Informativa | `/blog/senales-web-pierde-clientes` | — |

**No se persiguen:** «kit digital» (programa cerrado; solo se menciona dentro de I1), «seo vigo» / «posicionamiento web vigo» (no es un servicio que Action venda), «app de trading» y «app inmobiliaria» (intención de usuario final; Tratum está en desarrollo), «venta de entradas» y «ticketera» (intención de comprador), «agencia o freelance» (ya cubierto en el post de elegir agencia), «cuánto cuesta un software a medida» como artículo propio (10–100, la landing ya lo cubre y sin cifras no compite), páginas por municipio o en gallego (auditoría §3.2).

### 3.1 Canibalizaciones a resolver

| # | Choque | Evidencia (8-10-2026) | Resolución |
|---|---|---|---|
| 1 | **Home** vs `/desarrollo-de-aplicaciones-vigo` y `/desarrollo-web-vigo` | Bing: la home es #2 en «desarrollo apps vigo» y #4 en «desarrollo web vigo»; las landings no aparecen | No tocar el title de la home (auditoría). Enlaces contextuales de la home y de todos los posts a las landings con anclas descriptivas (§6). Revisar con Search Console en diciembre |
| 2 | **pablo.actiondev.es** vs landing de apps Vigo | Su title sigue siendo «Desarrollo de aplicaciones móviles en Vigo — Pablo Cabaleiro» | Negocio: title de marca personal y enlace a la landing (auditoría §3.4) |
| 3 | `/desarrollo-web-pontevedra` vs `/desarrollo-web-redondela` | La de Pontevedra lleva Redondela en la meta y 2 de sus 3 casos son de Redondela | Retitular a «diseño web Pontevedra», quitar Redondela de la meta y cambiar un caso (§5) |
| 4 | Posts `que-mirar-antes-de-contratar-agencia-vigo` vs `como-elegir-agencia-desarrollo-web-galicia` (y la sección «Cómo elegir agencia…» de la landing de Galicia) | Misma intención; el primero tiene 323 palabras | Fusionar el corto en el largo con 301 (§5) |
| 5 | Posts `como-hacer-que-tu-web-tenga-visitas-y-convierta` vs `senales-web-pierde-clientes` (y `como-salir-en-google-maps-vigo`) | 330 palabras, sin keyword ni autor, solapa con los otros dos | Fusionar en `senales-web-pierde-clientes` con 301 |
| 6 | `/desarrollo-de-aplicaciones-galicia` vs `/desarrollo-de-aplicaciones-vigo` | Mismo servicio, otra geografía | Diferenciar por intención (Galicia = producto, formación, comunidad, en remoto) o 301; decisión en §5 |
| 7 | Artículo C6 (cursos) vs sección «Proteger el contenido y la comunidad» de la landing de Galicia (`landings.ts:1346`) | Tema común | El artículo apunta a la landing de Vigo y desarrolla; no copia la sección |
| 8 | Nuevos artículos de coste (I2) vs FAQ de precio de las landings | `landings.ts:358`, `:1538` | El post es nacional e informativo; las landings conservan su FAQ local y enlazan al post |

---

## 4. Artículos nuevos

### 4.0 Reglas para quien redacta (todas obligatorias)

**Formato del CMS (`BlogPost`, `packages/shared/src/blog.ts`)**
- Campos: `slug`, `title`, `metaDescription`, `h1`, `excerpt` (1–2 frases), `category`, `date` (fecha real de publicación, `yyyy-mm-dd`), `updatedAt`, `readingTime`, `author: "pablo-cabaleiro"`, `keyword`, `targetLanding`, `faqs` (3–5), `image`, `status`.
- **El cuerpo solo admite bloques `paragraph`, `heading` (se pinta como H2), `list` y `quote`. No hay H3 en el cuerpo**: los esquemas de abajo son H2 con lo que va dentro en párrafos y listas. Las preguntas frecuentes se pintan como H3 y salen en el JSON-LD `FAQPage`.
- En línea solo funcionan `**negrita**` y enlaces **internos** `[texto](/ruta)`. **Un enlace externo en Markdown se pinta tal cual, con corchetes**: las fuentes externas se citan en texto plano («DOG n.º 107, de 10 de junio de 2026»), sin `[]()`.
- `title` **≤ 51 caracteres** (la plantilla añade « — Action»). `metaDescription` ≤ 155. Todos los de abajo están contados.
- Extensión orientativa: 900–1.400 palabras. Mejor 900 con datos que 1.400 de relleno.

**Veracidad**
- **Ni precios en € ni plazos de entrega propios.** Solo pueden aparecer los que ya están publicados en actiondev.es: «una app bien definida suele estar en las tiendas entre 2 y 4 meses» (posts `cuanto-cuesta-desarrollar-una-app` y `mvp-de-una-app`) y «un ecommerce suele estar en producción entre 1 y 3 meses» (post `shopify-o-tienda-online-a-medida`). Las cuotas de Apple y Google (99 USD/año, 25 USD una vez) son datos de terceros y ya están en el blog.
- Donde haga falta una cifra de precio, se deja el párrafo con el texto literal **«decisión pendiente: rangos de precio»** para que lo vea el dueño antes de publicar, o se explica de qué depende sin cifras.
- Solo hechos de esta lista, de `projects.ts`, de las reseñas de `testimonials.ts` o de la web pública del cliente. Ni métricas, ni clientes, ni citas, ni tecnologías, ni localidades que no estén ahí. Una reseña se cita literal (`quoteEs`) y con el nombre tal como aparece.
- No atribuir a un cliente una reseña que no lleve su proyecto en `testimonials.ts`.
- Sin comparativas con marcas de la competencia por su nombre en tono negativo. Se puede decir «plataformas SaaS de gestión de clubes» sin señalar a nadie.

**SEO**
- La keyword principal en el `title`, el `h1`, el primer párrafo y un H2; variantes en H2 y FAQs, sin forzar.
- El enlace a la `targetLanding`, en los dos primeros párrafos y con un ancla descriptiva distinta de las que ya usan otros posts (§6).
- Cada artículo de caso enlaza a su ficha `/projects/<slug>`.
- Imagen: la indicada (ruta en `apps/desktop/public`), con `alt` descriptivo.
- Al publicar: `pnpm seo:indexnow /blog/<slug>` (y la landing objetivo).

### 4.1 Lista y prioridades

| ID | Slug | Keyword principal | Vol. ES / Galicia | Landing objetivo | Tipo | Prioridad |
|---|---|---|---|---|---|---|
| C4 | `software-autoescuela` | software autoescuela | 10–100 / 10–100 | `software-a-medida-vigo` | Caso (Autoescuela GTI) | **P1** |
| C3 | `inscripciones-online-club-deportivo` | app para clubes deportivos | 10–100 / 10–100 | `desarrollo-de-aplicaciones-pontevedra` | Caso (PBB, O Porriño) | **P1** |
| C2 | `vender-entradas-online` | vender entradas online | 100–1.000 / 10–100 | `desarrollo-web-vigo` | Caso (La Fábrica, Musa) | **P1** |
| C1 | `carta-digital-restaurante` | carta digital restaurante | 100–1.000 / 10–100 | `desarrollo-web-redondela` | Caso (Samoa Café) | **P1** |
| I6 | `integracion-erp` | integración erp | 100–1.000 / 10–100 | `software-a-medida-vigo` | Informativa con casos | **P1** |
| I1 | `ayudas-igape-ig300c` | ig300c | 100–1.000 / 100–1.000 | `software-a-medida-vigo` | Informativa (Galicia) | **P1** (verificación estricta) |
| I2 | `cuanto-cuesta-una-pagina-web` | cuánto cuesta hacer una página web | 100–1.000 / 10–100 | `desarrollo-web-vigo` | Informativa | **P1** (flojo sin cifras) |
| C5 | `app-entrenador-personal` | app para entrenador personal | 10–100 / 10–100 | `desarrollo-de-aplicaciones-vigo` | Caso (Óscar Soto) | P2 (P1 si el cliente lo autoriza) |
| C6 | `plataforma-cursos-online-propia` | plataforma de formación online | 100–1.000 / 10–100 | `desarrollo-de-aplicaciones-vigo` | Caso (PRO Lift, Kairos, XauLabs) | P2 |
| I4 | `react-native-o-flutter` | react native o flutter | 10–100 / 10–100 | `desarrollo-de-aplicaciones-vigo` | Comparación | P2 |
| I5 | `sistema-reservas-online` | sistema de reservas online | 100–1.000 / 10–100 | `desarrollo-web-vigo` | Comparación con casos | P2 |
| I3 | `mantenimiento-pagina-web` | mantenimiento página web | 100–1.000 / 10–100 | `agencia-desarrollo-web-galicia` | Informativa | P2 |
| I7 | `web-3d-interactiva` | web 3d | 100–1.000 / 10–100 | `diseno-web-vigo` | Caso propio (actiondev.es) | P3 |

**Por qué casi todo lo de apps va por casos y no por guías:** el blog ya tiene 9 guías de apps (coste, mantenimiento, publicación, MVP, PWA, nativa, ASO, empleados, UX). Otra guía genérica canibalizaría; lo que suma ahora son los casos (C3, C4, C5, C6) y retitular las guías existentes con la variante que se busca (§5).

---

### 4.2 Casos y proyectos

#### C4 · Software para autoescuelas (Autoescuela GTI) — P1

- **slug:** `software-autoescuela`
- **title (47):** Software para autoescuelas: estándar o a medida
- **metaDescription (153):** Programa de gestión estándar o ERP a medida para tu autoescuela: matrículas, prácticas, exámenes, flota y app de alumnos. Con el caso de Autoescuela GTI.
- **h1:** Software para autoescuelas: programa estándar o ERP a medida con app para alumnos
- **excerpt:** Qué gestiona de verdad una autoescuela, cuándo basta un programa estándar y cuándo compensa un ERP propio con app para alumnos, con el caso de Autoescuela GTI.
- **category:** Software a medida (categoría nueva; si se prefiere no crearla, «Desarrollo de apps»)
- **keyword:** software autoescuela. Secundarias: programa gestión autoescuela (10–100), software para autoescuelas.
- **targetLanding:** `software-a-medida-vigo`
- **Intención:** comparación. En Bing, los 9 resultados son programas SaaS para autoescuelas: quien busca está eligiendo herramienta. El artículo responde «¿estándar o a medida?» con honestidad y no compite con la landing (que ataca «software a medida Vigo»).
- **Esquema (H2):**
  1. Qué gestiona de verdad una autoescuela — matrículas, prácticas, exámenes, flota de coches, comunicación con alumnos.
  2. Cuándo basta un programa estándar — decirlo claro: si tus procesos son los de cualquier autoescuela y no necesitas app propia.
  3. Cuándo compensa un ERP a medida — procesos propios, profesores que registran desde el sistema, una app de la autoescuela para el alumno, datos compartidos.
  4. El caso de Autoescuela GTI: qué pidieron — los cuatro objetivos del brief, en lista.
  5. Qué se construyó y qué cambió — ERP de secretaría + registro de prácticas y exámenes por el profesorado + app del alumno + flota; resultado literal.
  6. La app del alumno — próximas prácticas, clases pasadas y exámenes desde el móvil.
  7. Cómo se aborda un proyecto así — por módulos, migración de los datos actuales, mantenimiento posterior.
- **Hechos y fuentes:**
  - Brief: «Un ERP para que las secretarias gestionen matrículas y administración» / «Los profesores registran prácticas y resultados de examen desde el propio sistema» / «Una app móvil donde los alumnos consultan sus próximas prácticas, clases pasadas y exámenes» / «Gestión completa de la flota de coches de prácticas» — `packages/shared/src/projects.ts:98-103`.
  - Resultado: «El ecosistema ERP + app móvil digitalizó de punta a punta la gestión de la autoescuela, multiplicando por 10 los trámites que alumnos y profesores resuelven sin pasar por secretaría.» — `projects.ts:106-107`. Antes / ahora: `projects.ts:83-84`.
  - App y ERP comparten los mismos datos — `apps/desktop/src/data/landings.ts:133` y `:210`.
  - Presupuesto por módulos, migración de datos de Excel, mantenimiento — `landings.ts:816-817`, `:804-805`, `:812-813` (parafrasear, no copiar).
- **No decir:** localidad de la autoescuela (no consta), tecnologías (`technologies: ["TBD"]`), número de alumnos, nombres de programas competidores con juicios. Confirmar con el dueño que el cliente acepta un artículo dedicado (ya aparece en dos landings).
- **FAQs (de autocompletado y SERP):**
  1. ¿Qué programa de gestión usa una autoescuela? (Bing: SERP de programas; autocompletado «software para autoescuelas»)
  2. ¿Puede una autoescuela tener su propia app para alumnos?
  3. ¿Se pueden pasar los datos del programa actual a uno nuevo?
  4. ¿Cuánto cuesta un software a medida para una autoescuela? → factores, sin cifras, «decisión pendiente: rangos de precio».
- **Enlaces internos:** `/software-a-medida-vigo` (ancla: «software a medida para empresas de Vigo»), `/projects/autoescuela-gti`, `/desarrollo-de-aplicaciones-vigo` (ancla: «una app y su panel de gestión en el mismo proyecto»), `/blog/app-para-empleados-partes-fichajes`.
- **Imagen:** `/projects/autoescuela-gti-mockup.webp`

#### C3 · Inscripciones y cuotas online para un club deportivo (PBB, O Porriño) — P1

- **slug:** `inscripciones-online-club-deportivo`
- **title (50):** Inscripciones online para clubes: app o web propia
- **metaDescription (153):** Cómo pasar altas, cuotas y matrículas de un club deportivo a online: app de gestión o web propia, cuentas de familias y pagos. Caso real: PBB, O Porriño.
- **h1:** Inscripciones y cuotas online para un club deportivo: app de gestión o web propia
- **excerpt:** Altas, cuotas y matrículas sin papeleo en ventanilla: qué ofrece una app de gestión de clubes, cuándo compensa una web propia y cómo lo resolvió PBB en O Porriño.
- **category:** Desarrollo de apps
- **keyword:** app para clubes deportivos. Secundarias: página web club deportivo (10–100), inscripciones online (10–100), software gestión club deportivo (10–100).
- **targetLanding:** `desarrollo-de-aplicaciones-pontevedra` (su oferta «Gestión de socios y cuotas», `landings.ts:872`, y PBB es uno de sus casos). Es el apoyo que necesita esa landing, que Bing ni tenía indexada.
- **Intención:** comparación; SERP de Bing 100 % SaaS de clubes. Prueba local real en la provincia (O Porriño).
- **Esquema (H2):**
  1. El papeleo de un club — altas, cuotas, matrículas, campus, comunicación con familias.
  2. App de gestión de clubes o web propia: qué da cada una — sin nombrar marcas.
  3. Las cuentas de familias y deportistas: la pieza que decide — un padre con dos hijos en equipos distintos.
  4. El caso de PBB: qué pidieron — lista del brief.
  5. Qué hay hoy en su web — inscripción y pago, área de usuario, campus, torneo 3x3, noticias y equipos (comprobar en vivo antes de publicar).
  6. Pagos y datos de menores: lo que hay que cuidar — consentimiento y acceso por perfil, sin afirmaciones legales que no se puedan citar.
  7. ¿Y si el club quiere app en las tiendas? — web instalable o app; enlazar al post de PWA.
- **Hechos y fuentes:**
  - PBB, club deportivo de O Porriño, web `https://www.porrinobaloncestobase.com/`, 2025 — `projects.ts:144-163`.
  - Brief: «Inscripción y pago completo (cuota + matrícula) directamente desde la web» / «Sistema de cuentas diferenciado para padres y deportistas» / «Los padres pueden gestionar las cuentas de sus hijos desde su propio perfil» — `projects.ts:171-175`.
  - Resultado: «Pasar la inscripción y el cobro a la web acabó con el papeleo en ventanilla, multiplicando las altas gestionadas sin intervención administrativa.» — `projects.ts:178-179`.
  - Web en vivo (8-10-2026): páginas `/campus`, `/equipos`, `/noticias`, `/torneo-3x3`, `/login`, `/profile`; texto «O Porriño, Galicia».
  - Tecnologías publicadas: Next.js y Tailwind — `projects.ts:163`.
- **No decir:** número de socios o de inscripciones; cifras de cobro; nombres de familias.
- **FAQs:**
  1. ¿Hay apps gratuitas para clubes deportivos? (autocompletado «app para clubes deportivos gratis»)
  2. ¿Se pueden cobrar las cuotas del club por internet?
  3. ¿Pueden los padres gestionar la cuenta de sus hijos?
  4. ¿El club necesita una app en las tiendas o le basta la web?
- **Enlaces internos:** `/desarrollo-de-aplicaciones-pontevedra` (ancla: «apps a medida para clubes y empresas de la provincia de Pontevedra»), `/projects/pbb-porrino`, `/desarrollo-web-pontevedra`, `/blog/app-o-aplicacion-web-pwa`.
- **Imagen:** `/projects/pbb-porrino-mockup.webp`

#### C2 · Vender entradas desde tu propia web (La Fábrica y Musa) — P1

- **slug:** `vender-entradas-online`
- **title (50):** Vender entradas online desde tu web, sin ticketera
- **metaDescription (147):** Qué necesita una sala o un recinto para vender entradas en su propia web: pago, perfil de cliente, aforo y acceso. Casos reales: La Fábrica y Musa.
- **h1:** Vender entradas online desde tu propia web, sin ticketera externa
- **excerpt:** Ticketera o venta en tu web: qué cambia en comisiones, datos del público y aforo, y cómo lo hacen La Fábrica, en Redondela, y Musa, en Vigo.
- **category:** Desarrollo web
- **keyword:** vender entradas online. Secundarias: venta de entradas online (10–100), plataforma venta de entradas (10–100), vender entradas online sin comisiones (Bing: reservaok, talonarium).
- **targetLanding:** `desarrollo-web-vigo`
- **Intención:** comparación (ticketera externa frente a venta propia). No atacar «venta de entradas» ni «ticketera»: las busca quien quiere comprar.
- **Esquema (H2):**
  1. Ticketera externa o venta en tu web: qué cambia — comisión por entrada frente a comisión de la pasarela, datos del público, marca, dependencia.
  2. Qué necesita un sistema de venta propio — eventos o noches, pago, perfil con historial, aforo en tiempo real, documentación (p. ej., autorización de menores).
  3. La Fábrica, en Redondela: de la taquilla a la web — antes, ahora, brief y resultado.
  4. Musa, en Vigo: entradas sin ticketera externa — brief y resultado (+40 %).
  5. Lo que hay que prever la noche del evento — picos de compra, soporte, cambios de aforo (sin cifras).
  6. Cuándo te conviene seguir con una ticketera — pocos eventos al año, giras, eventos de terceros.
  7. Cómo empezar — tipos de entrada, aforos, reglas de acceso, quién gestiona la puerta.
- **Hechos y fuentes:**
  - La Fábrica, recinto de eventos de Redondela, `https://www.lafabricaredondela.es/` — `projects.ts:320-338`. Antes: «Las entradas se vendían en la taquilla física.» Ahora: «Venta de entradas online, con perfil de compras y aforo en tiempo real, sin colas.» — `projects.ts:336-337`. Brief: `projects.ts:347-351`. Resultado: «La venta de entradas online sustituyó a la taquilla física como canal principal, multiplicando las entradas vendidas sin colas ni gestión manual.» — `projects.ts:354-355`.
  - Web en vivo (8-10-2026): título «LA FÁBRICA · Discoteca», páginas `/entradas` y `/cuenta`, y un PDF de autorización de menores enlazado (`/autorizacion-menores.pdf`).
  - Musa, Vigo, `https://www.musavigo.es/` — `projects.ts:357-374`. Brief: vender entradas sin ticketera externa, perfil con las entradas compradas, SEO local — `projects.ts:384-388`. Resultado: «La venta de entradas con perfil de usuario elevó las reservas online un 40%, reduciendo la dependencia de la taquilla y de WhatsApp para gestionar el acceso.» — `projects.ts:391-392` (ya publicado en `landings.ts:301`).
  - Mensaje coherente con la web: «Solo pagas la comisión de la pasarela de pago, no la de un intermediario» — `landings.ts:1099`.
- **No decir:** «sin comisiones» a secas (la pasarela cobra); que Musa es un restaurante (la `descriptionEs` de `projects.ts:364-365` está mal, ver §5.4); «discoteca líder» (es el reclamo de su web, no un dato); número de entradas vendidas.
- **FAQs:**
  1. ¿Puedo vender entradas desde mi propia web? (autocompletado «venta de entradas web»)
  2. ¿Vender entradas online tiene comisión?
  3. ¿Se puede vender entradas online gratis? (autocompletado «venta de entradas online gratis»)
  4. ¿Puedo seguir vendiendo en taquilla con el mismo aforo?
- **Enlaces internos:** `/desarrollo-web-vigo` (ancla: «webs que venden entradas y gestionan reservas en Vigo»), `/desarrollo-web-redondela`, `/projects/ticketera-la-fabrica`, `/projects/musa`.
- **Imagen:** `/projects/ticketera-la-fabrica-mockup.webp` (segunda opción: `/projects/musa-mockup.webp`)

#### C1 · Carta digital para restaurantes en tu web (Samoa Café, Redondela) — P1

- **slug:** `carta-digital-restaurante`
- **title (48):** Carta digital para restaurantes en tu propia web
- **metaDescription (147):** Carta digital en la web del restaurante: que la edites tú, que cambie sola de día a noche y que Google la lea. El caso de Samoa Café, en Redondela.
- **h1:** Carta digital para restaurantes: en tu propia web y editable por ti
- **excerpt:** Una carta digital que cambias tú en un minuto, que Google puede leer y que no depende de un servicio de terceros: qué necesita y cómo lo resolvió Samoa Café.
- **category:** Desarrollo web
- **keyword:** carta digital restaurante. Secundarias: menú digital restaurante (10–100), carta QR restaurante (10–100), página web para restaurante (10–100).
- **targetLanding:** `desarrollo-web-redondela` (prueba local real; hoy no recibe enlaces de ningún post ni ficha, auditoría §6 M4).
- **Intención:** el autocompletado e ideas apuntan a herramientas («app para hacer menú digital», «app para menú restaurante»). Ángulo: carta en tu web frente a carta en una plataforma o un PDF.
- **Esquema (H2):**
  1. Qué es (y qué no debería ser) una carta digital — PDF escaneado frente a carta en texto.
  2. En tu web o en un servicio de QR: qué cambia — quién la controla, si Google la lee, qué pasa si dejas de pagar el servicio.
  3. Lo que debe poder hacer el propio restaurante — cambiar platos y precios desde el móvil en un minuto.
  4. El caso de Samoa Café — identidad desde cero, carta editable desde la web, carta de día y de noche que cambia sola.
  5. Lo imprescindible en la web de un bar o restaurante — carta, horario, cómo llegar y cómo reservar, visibles.
  6. Que Google lea tu carta — texto real, enlace desde la ficha de Google Business.
  7. Cuándo no compensa — una carta que no cambia nunca: un PDF bien hecho basta.
- **Hechos y fuentes:**
  - Samoa Café, Redondela, `https://www.samoaredondela.com/`, 2024 — `projects.ts:588-605`.
  - Brief: «Identidad de marca completa desde cero: naming, logo y diseño de carta» / «Una carta que el propio restaurante pudiera actualizar desde la web» / «Una carta que cambiase automáticamente entre versión de día y de noche» — `projects.ts:615-619`.
  - Resultado: «La carta en tiempo real —editable al instante y sincronizada con el horario— acabó con las cartas impresas desactualizadas y elevó la percepción de marca de un negocio recién lanzado.» — `projects.ts:622-623`.
  - Web en vivo (8-10-2026): título «Samoa Cafés & Tapas | Redondela, Pontevedra»; describe «menú del día, cocina tradicional gallega y cócteles». **La web es una SPA: comprobar en un navegador que la carta de día/noche sigue publicada antes de afirmarlo en presente.**
  - Si se mencionan alérgenos, citar el Reglamento (UE) n.º 1169/2011 en texto plano.
- **No decir:** tecnologías de Samoa (en `projects.ts:607` pone Next.js, pero la web en vivo es una SPA con Vite; no citar ninguna); aumento de reservas o ventas (no consta); atribuir a Samoa la reseña de Carlos Alonso (es «LOCAL EN REDONDELA», sin proyecto).
- **FAQs:**
  1. ¿Qué es una carta digital?
  2. ¿Puedo cambiar la carta yo mismo? (autocompletado «app para hacer carta restaurante»)
  3. ¿Hace falta una app para tener la carta en el móvil? (ideas «app para menú restaurante»)
  4. ¿Google lee la carta de mi web?
- **Enlaces internos:** `/desarrollo-web-redondela` (ancla: «páginas web para negocios de Redondela»), `/projects/samoa`, `/diseno-web-vigo` (ancla: «diseño web con identidad propia»), `/blog/como-salir-en-google-maps-vigo`.
- **Imagen:** `/projects/samoa-mockup.webp`

#### C5 · App para entrenador personal (Óscar Soto) — P2, P1 si el cliente lo autoriza

- **slug:** `app-entrenador-personal`
- **title (49):** App para entrenador personal: propia o plataforma
- **metaDescription (148):** Reserva de clases, registro de entrenos y progreso semanal: cuándo compensa una app propia para tu centro y cuándo una plataforma. Con un caso real.
- **h1:** App para entrenador personal o centro de entrenamiento: ¿propia o de plataforma?
- **excerpt:** Qué necesita la app de un entrenador o de un centro pequeño, cuándo basta una plataforma y cuándo compensa una app con tu marca, con el caso de Óscar Soto.
- **category:** Desarrollo de apps
- **keyword:** app para entrenador personal. Secundarias: app para reservar clases (10–100), app reservas gimnasio (10–100), software gestión gimnasio (10–100). No atacar «app para gimnasio» (100–1.000): la buscan usuarios que quieren una app de rutinas.
- **targetLanding:** `desarrollo-de-aplicaciones-vigo`
- **Intención:** comparación (Bing: listados de plataformas para entrenadores).
- **Esquema (H2):**
  1. Qué necesita un entrenador o un centro pequeño — reservar, entrenar, ver el progreso, no perder el hábito.
  2. Las plataformas para entrenadores: qué resuelven y dónde se quedan cortas — marca ajena, funciones fijas, datos.
  3. Cuándo compensa una app con tu marca — método propio, comunidad, clases propias.
  4. El caso de Óscar Soto — brief y resultado.
  5. Diseñar para el hábito — rachas y objetivo semanal; la pantalla de inicio con lo que importa.
  6. Una sola app para iPhone y Android — React Native y Expo.
  7. Empezar por lo imprescindible — enlace al post de MVP.
- **Hechos y fuentes:**
  - Óscar Soto, app de entrenamiento, 2026, React Native y Expo — `projects.ts:218-236`.
  - Brief: «Que los clientes reserven sus clases desde el móvil» / «Registrar los entrenamientos y ver el progreso semana a semana» / «Mantener el hábito con rachas y un objetivo de clases por semana» — `projects.ts:243-247`.
  - Resultado: «Una sola app reúne la reserva de clases, el entrenamiento y el seguimiento: carga semanal, clases hechas en la semana, peso y racha activa, todo en la pantalla de inicio.» — `projects.ts:250-251`.
- **No decir:** localidad, número de usuarios, enlaces a tiendas (no aparece en la búsqueda pública de App Store del 8-10-2026), pagos dentro de la app (no consta).
- **Bloqueo:** confirmar con el dueño si la app está publicada y si el cliente acepta el artículo.
- **FAQs:**
  1. ¿Hay apps gratis para entrenadores personales? (autocompletado «app para entrenador personal gratis»)
  2. ¿Puedo tener una app con mi propia marca?
  3. ¿Se pueden reservar clases desde la app?
  4. ¿Cuánto cuesta una app para un entrenador personal? → factores, «decisión pendiente: rangos de precio», enlace al post de coste.
- **Enlaces internos:** `/desarrollo-de-aplicaciones-vigo` (ancla: «desarrollo de apps iOS y Android en Vigo»), `/projects/oscar-soto`, `/blog/mvp-de-una-app`, `/blog/importancia-ux-ui-apps-moviles`, `/blog/cuanto-cuesta-desarrollar-una-app`.
- **Imagen:** `/projects/oscar-soto-mockup-vertical.webp`

#### C6 · Plataforma de cursos propia (PRO Lift, Kairos, XauLabs) — P2

- **slug:** `plataforma-cursos-online-propia`
- **title (51):** Plataforma de cursos online propia: cuándo compensa
- **metaDescription (150):** Vender formación en tu propia plataforma o app: acceso solo para quien paga, bloqueo de capturas, progreso del alumno y asistente de IA. Casos reales.
- **h1:** Plataforma de formación online propia: cuándo compensa y cómo proteger el contenido
- **excerpt:** Plataforma de terceros o propia para vender cursos: qué cambia, cómo se protege el contenido y qué aportan el progreso visible y un asistente de IA, con tres casos.
- **category:** Desarrollo de apps
- **keyword:** plataforma de formación online. Secundarias: plataforma de cursos online (100–1.000), vender cursos online (10–100), app para vender cursos (10–100), evitar capturas de pantalla (10–100).
- **targetLanding:** `desarrollo-de-aplicaciones-vigo` (sirve se mantenga o no la landing de Galicia; no copiar su sección «Proteger el contenido y la comunidad», `landings.ts:1346-1350`).
- **Intención:** comparación (Bing: listados de plataformas para vender cursos).
- **Esquema (H2):**
  1. Plataforma de terceros o propia: qué cambia — control, marca, datos de alumnos.
  2. Lo mínimo de una plataforma propia — acceso por pago, catálogo, progreso por alumno.
  3. Proteger el contenido — acceso solo a quien paga y bloqueo de grabación y capturas; y el límite honesto: nada impide grabar la pantalla con otro móvil.
  4. Web, app móvil o app de escritorio — PRO Lift: la protección contra capturas era el requisito y se resolvió con una app de escritorio.
  5. Progreso visible y gamificación — XauLabs.
  6. Un asistente de IA para las dudas — Kairos.
  7. Empezar sin construir de más — enlace al post de MVP.
- **Hechos y fuentes:**
  - Formación PRO Lift, app de escritorio: «Bloqueo de grabación de pantalla y capturas para proteger el contenido» / «Acceso restringido únicamente a quien ha pagado el curso»; resultado «…permitió vender formación de alto valor sin miedo a la piratería…» — `projects.ts:524-554`.
  - Kairos Futures: catálogo de cursos, asistente de IA integrado, progreso centralizado; resultado «El asistente de IA integrado redujo las consultas repetitivas al equipo y multiplicó el ritmo al que los alumnos completaban los cursos.» — `projects.ts:426-456`.
  - XauLabs: app multiplataforma iOS y Android con React Native, niveles y progreso visible — `projects.ts:394-424`.
  - Reseña de YondayX (proyecto KAIROS FUTURES): «Gran experiencia trabajando con Action. Escuchó y dedicó tiempo a entender lo que pedía…» — `apps/desktop/src/data/testimonials.ts:46-55`.
- **No decir:** «imposible de piratear»; comisiones de plataformas con cifras; número de alumnos o cursos.
- **FAQs:**
  1. ¿Se puede evitar que graben la pantalla de mi curso? (KP «evitar capturas de pantalla»)
  2. ¿Cómo vender cursos online sin plataformas de terceros? (ideas «plataformas para vender cursos online»)
  3. ¿Es mejor una app o una web para un curso online?
  4. ¿Se puede añadir un asistente de IA a mi plataforma? (KP «chatbot para web», 10–100)
- **Enlaces internos:** `/desarrollo-de-aplicaciones-vigo` (ancla: «apps de formación y comunidad hechas en Vigo»), `/projects/pro-lift-formacion`, `/projects/kairos-futures`, `/projects/xaulabs`, `/blog/mvp-de-una-app`, `/blog/app-o-aplicacion-web-pwa`.
- **Imagen:** `/projects/kairos.webp`

---

### 4.3 Búsquedas informativas

#### I6 · Integración con el ERP — P1

- **slug:** `integracion-erp`
- **title (48):** Integración con el ERP: web, tienda online y app
- **metaDescription (149):** Qué datos conviene sincronizar entre el ERP y la web, la tienda o la app (stock, pedidos, disponibilidad, clientes) y cómo se plantea la integración.
- **h1:** Integrar el ERP con tu web, tu tienda online o tu app: qué se puede automatizar
- **excerpt:** Qué significa integrar el ERP con la web, la tienda o la app, qué datos se suelen conectar, cómo exponen los datos los ERP y qué hay que decidir antes.
- **category:** Software a medida
- **keyword:** integración erp (100–1.000, +900 % en tres meses; puja 2,7–11,4 €). Secundaria: erp para pymes (100–1.000; solo como mención, su intención es elegir ERP).
- **targetLanding:** `software-a-medida-vigo`
- **Intención:** informativa con intención comercial (puja alta). SERP de Google sin medir (captcha): revisarla antes de escribir.
- **Esquema (H2):**
  1. Qué significa integrar — que los datos viajen solos y nadie copie a mano.
  2. Qué se suele conectar — disponibilidad o stock, pedidos, clientes, licencias, facturas.
  3. Cómo expone los datos un ERP — API, base de datos accesible o exportaciones periódicas.
  4. Cuatro integraciones reales — Nautirent, Autoescuela GTI, Licentia y Cliché.
  5. Dónde fallan las integraciones — duplicados, sincronizaciones a mano, nadie avisa cuando algo se rompe.
  6. Qué decidir antes de empezar — qué sistema manda en cada dato, cada cuánto se sincroniza, qué pasa si falla, quién lo mantiene.
  7. ¿Hay ayudas? — mención breve a la IG300C con enlace a I1 cuando esté publicado.
- **Hechos y fuentes:**
  - Nautirent: «Conectar la web con el software de gestión interno de la flota» / «Mostrar la disponibilidad de las embarcaciones en tiempo real»; resultado «…eliminó los huecos de disponibilidad desactualizada y multiplicó el volumen de reservas cerradas online…» — `projects.ts:288-318`. Reseña de Samuel D. Flores (proyecto NAUTIRENT): «100% responsable, una elegancia la web que nos hizo. Muy amable, siempre atento y eficiente.» — `testimonials.ts:56-66`.
  - Autoescuela GTI: app de alumnos y ERP de secretaría con los mismos datos — `landings.ts:133`, `:210`.
  - Licentia: entrega automática de la licencia tras la compra, sin gestionar cada pedido a mano — `projects.ts:556-586`; automatización descrita en `landings.ts:731-732`.
  - Cliché: tienda Shopify a medida que gestiona pedidos sin intervención manual — `projects.ts:833-866`.
  - Cómo exponen datos los ERP (API, base de datos, exportaciones) — `landings.ts:800-801` (parafrasear y desarrollar).
- **No decir:** qué ERP usa cada cliente (no consta); plazos de una integración.
- **FAQs:**
  1. ¿Qué es integrar un ERP?
  2. ¿Y si mi ERP no tiene API?
  3. ¿Qué pasa si la integración falla un día?
  4. ¿Quién mantiene la integración después?
  (No repetir «¿Puedo conectar Shopify con mi ERP?», que ya está en `/blog/shopify-o-tienda-online-a-medida`: enlazarlo.)
- **Enlaces internos:** `/software-a-medida-vigo` (ancla: «integraciones y software a medida en Vigo»), `/projects/nautirent`, `/projects/licentia`, `/projects/autoescuela-gti`, `/tienda-online-vigo` (ancla: «tiendas online conectadas a tu gestión»), `/blog/shopify-o-tienda-online-a-medida`.
- **Imagen:** ninguna (OG dinámica); Nautirent no tiene captura.

#### I1 · IG300C: ayudas del IGAPE para digitalizar una pyme — P1 (verificación estricta)

- **slug:** `ayudas-igape-ig300c`
- **title (49):** IG300C: ayudas del IGAPE para digitalizar tu pyme
- **metaDescription (149):** Qué es la IG300C del IGAPE, qué proyectos cubre (ERP, automatización, venta digital…), cómo fue la convocatoria de 2026 y cómo preparar la siguiente.
- **h1:** IG300C: las ayudas del IGAPE para la transformación digital de las pymes gallegas
- **excerpt:** Qué cubre la línea IG300C del IGAPE, quién puede pedirla, cómo fue la convocatoria de 2026 y qué conviene tener preparado para la próxima.
- **category:** Guías
- **keyword:** ig300c (100–1.000 en España y en Galicia). Secundarias: igape ayudas (100–1.000), ayudas igape digitalización (10–100), subvenciones digitalización Galicia (10–100), kit digital Galicia (10–100), ticket innova (10–100).
- **targetLanding:** `software-a-medida-vigo`
- **Intención:** informativa. SERP de Bing: igape.gal, sede.xunta.gal y consultoras. Es la búsqueda gallega con más volumen relacionada con lo que vende Action.
- **Esquema (H2):**
  1. Qué es la IG300C — una frase con la fuente.
  2. Quién puede pedirla — pymes y autónomos con centro de trabajo en Galicia.
  3. Qué tipos de proyecto cubre — las seis tipologías, copiadas del DOG.
  4. Cómo fue la convocatoria de 2026 — publicación, plazo, presupuesto, máximo de solicitudes, plazo de ejecución.
  5. Qué conviene tener listo antes — memoria del proyecto, ofertas de proveedores cuando proceda, no empezar el proyecto antes de solicitar (solo lo que diga el DOG).
  6. Qué pasó con el Kit Digital — y otras líneas, solo con fuente oficial.
  7. Qué proyectos de software encajan — ERP, automatización, venta digital; ejemplos de tipo de proyecto (Autoescuela GTI, Timetracker) **sin insinuar que se financiaron con ayudas**.
  8. Cuándo sale la próxima — no hay fecha fija: la de 2025 salió en enero y la de 2026 en junio.
- **Hechos y fuentes (verificar cada uno en el texto oficial antes de publicar):**
  - DOG n.º 107, de 10 de junio de 2026: Resolución de 9 de junio de 2026 que aprueba las bases y convoca para 2026-2027 las ayudas a la transformación digital de las pymes (IG300C), cofinanciadas por el programa Galicia FEDER 2021-2027 — `https://www.xunta.gal/dog/Publicados/2026/20260610/AnuncioO92-220526-0001_es.html` (extracto: `…/AnuncioO92-220526-0002_es.html`).
  - Ficha del procedimiento: `https://sede.xunta.gal/es/detalle-procedemento?codtram=IG300C&ano=2026&numpub=1`.
  - Según esas fuentes (resumen del 8-10-2026, **comprobar en el DOG**): plazo del 11-6-2026 (09:00) al 10-7-2026 (14:00); unos 3 millones de euros; seis tipologías de proyecto (interfaces digitales de venta y operación, automatización de procesos, sistemas de gestión integral, ESG con tecnología, logística, ciberseguridad); máximo de dos solicitudes por pyme; ejecución hasta el 30-6-2027; resolución en tres meses.
  - Convocatoria anterior: DOG n.º 7, de 13 de enero de 2025 (`…/2025/20250113/AnuncioO92-101224-0001_es.html`); concesión de 2025: DOG n.º 19, de 29 de enero de 2026; ampliación del plazo de ejecución: DOG n.º 250, de 29 de diciembre de 2025.
  - Porcentajes de ayuda e importe mínimo: **solo si salen del DOG**; las cifras que circulan (50 %, 35 %/25 %, mínimo de 12.000 €) vienen de un blog privado.
  - Kit Digital: la auditoría dice que cerró el 31-10-2025 (§3.1); citar la fuente oficial (acelerapyme.gob.es) o no dar fecha.
- **Reglas propias:** las fuentes van en texto plano (el CMS no pinta enlaces externos). Poner `updatedAt` y una frase «Información revisada el <fecha>». Revisar el artículo cada vez que el DOG publique una convocatoria IG300C.
- **Decisión pendiente (dueño):** ¿Action ayuda a preparar la memoria técnica o el presupuesto para la solicitud? Si no, decir «no tramitamos ayudas; te preparamos el alcance y el presupuesto del proyecto».
- **FAQs:**
  1. ¿Qué es la IG300C del IGAPE?
  2. ¿Cuándo sale la próxima convocatoria? (no hay fecha oficial: decirlo)
  3. ¿La IG300C cubre el desarrollo de software a medida? (responder solo con lo que digan las bases)
  4. ¿Sigue existiendo el Kit Digital? (autocompletado «kit digital 2026»)
- **Enlaces internos:** `/software-a-medida-vigo` (ancla: «software de gestión a medida para pymes gallegas»), `/projects/autoescuela-gti`, `/blog/app-para-empleados-partes-fichajes`, `/desarrollo-de-aplicaciones-vigo`.
- **Imagen:** ninguna (OG dinámica).

#### I2 · ¿Cuánto cuesta una página web? — P1 (flojo hasta que haya rangos)

- **slug:** `cuanto-cuesta-una-pagina-web`
- **title (51):** ¿Cuánto cuesta una página web? Qué decide el precio
- **metaDescription (153):** Qué mueve el precio de una página web: tipos de página, venta o reservas, integraciones, contenidos y mantenimiento. Cómo pedir presupuestos comparables.
- **h1:** ¿Cuánto cuesta hacer una página web? Lo que decide el precio
- **excerpt:** Por qué dos webs «iguales» no cuestan lo mismo: los factores que mueven el presupuesto, los costes que no están en él y cómo pedir presupuestos que se puedan comparar.
- **category:** Desarrollo web
- **keyword:** cuánto cuesta hacer una página web. Secundarias: cuánto cuesta crear una página web, cuánto cuesta una página web, cuánto cuesta una web, presupuesto página web, precio página web (todas 100–1.000), cuánto cuesta una página web profesional (10–100).
- **targetLanding:** `desarrollo-web-vigo` (su FAQ local `landings.ts:358-359` se queda; enlaza al post).
- **Intención:** informativa-comercial nacional. **Toda la SERP (Hostinger, Cronoshare, jrcweb) da tablas en €.** Sin cifras rendirá poco: el bloque de rangos queda marcado «decisión pendiente: rangos de precio».
- **Esquema (H2):**
  1. Por qué dos webs «iguales» no cuestan lo mismo.
  2. Lo que mueve el precio — tipos de página distintos; vender, reservar o cobrar; integraciones; quién hace los textos y las fotos; idiomas; diseño propio o plantilla; migración de la web anterior.
  3. Cuatro alcances reales, de menos a más — landing de presentación (Cervecería Equs, Fisionorte), web corporativa en varios idiomas (FASE), inscripciones y pagos (PBB), venta de entradas con perfil de cliente (Musa, La Fábrica).
  4. Costes que no están en el presupuesto de desarrollo — dominio, alojamiento, pasarela de pago, mantenimiento.
  5. Plantilla, WordPress o a medida — resumen y enlace a la landing (no copiar su sección).
  6. Cómo pedir un presupuesto que se pueda comparar — alcance por escrito, qué incluye, a nombre de quién queda todo, mantenimiento.
  7. [Bloque reservado] Rangos orientativos — «decisión pendiente: rangos de precio».
- **Hechos y fuentes:**
  - Factores de precio de Action — `landings.ts:358-359` (cuatro), `:520` (diseño), `:1538-1539` (tres datos para presupuestar).
  - Por qué no WordPress para webs que venden o se conectan — `landings.ts:318-322`. Redirecciones 301 al rehacer — `landings.ts:370-371`.
  - Alcances: Cervecería Equs, landing de presentación (`projects.ts:1023-1053`; su web dice que está en Noia); Fisionorte, landing de una clínica de Noia (`projects.ts:1055-1086`); FASE, web corporativa para clientes de todo el mundo (`projects.ts:655-688`; su web está en español, inglés, alemán y francés); Patricia Avendaño, web bilingüe (`projects.ts:690-725`); PBB (`projects.ts:144-179`); Musa y La Fábrica (`projects.ts:320-392`).
- **No decir:** cifras en € ni plazos de entrega de una web (no hay ninguno publicado).
- **FAQs:**
  1. ¿Cuánto cuesta mantener una página web al año? (autocompletado) → enlazar a I3 cuando exista.
  2. ¿Cuánto cuesta una página web para un negocio pequeño? (autocompletado «para mi negocio», «básica»)
  3. ¿Es más barato hacer la web con WordPress? (autocompletado «en wordpress»)
  4. ¿Qué tiene que incluir un presupuesto de página web?
- **Enlaces internos:** `/desarrollo-web-vigo` (ancla: «desarrollo web a medida en Vigo»), `/diseno-web-vigo`, `/tienda-online-vigo` (para «web con tienda online»), `/blog/como-elegir-agencia-desarrollo-web-galicia`, `/blog/shopify-o-tienda-online-a-medida`, `/projects/fase`, `/projects/cerveceria-equs`.
- **Imagen:** `/projects/fase-mockup.webp`

#### I5 · Sistema de reservas online: propio o plataforma — P2

- **slug:** `sistema-reservas-online`
- **title (47):** Sistema de reservas online: propio o plataforma
- **metaDescription (150):** Cuándo compensa un sistema de reservas propio en tu web y cuándo una plataforma: comisiones, disponibilidad en tiempo real, pagos y datos de clientes.
- **h1:** Sistema de reservas online: ¿propio o de una plataforma?
- **excerpt:** Plataforma de reservas o sistema propio en tu web: qué cambia en comisiones, disponibilidad y datos, con dos casos de reservas conectadas y con pago.
- **category:** Desarrollo web
- **keyword:** sistema de reservas online (100–1.000; puja 5,2–14,3 €). Secundarias: sistema de reservas (100–1.000), software de reservas (10–100), app de reservas (10–100).
- **targetLanding:** `desarrollo-web-vigo`
- **Intención:** comparación (Bing: listados de software de reservas).
- **Esquema (H2):**
  1. Plataforma o sistema propio: qué cambia — comisión por reserva frente a pasarela, datos, marca, reglas propias.
  2. Lo imprescindible — disponibilidad real, calendario, pago o señal, confirmación, cancelación.
  3. Disponibilidad en tiempo real conectada a tu gestión — Nautirent.
  4. Calendario, pago y panel propio — Fang Tours.
  5. Cuándo te basta una plataforma — pocas reservas, sin reglas propias.
  6. Qué preparar antes de encargarlo.
- **Hechos y fuentes:**
  - Nautirent — `projects.ts:288-318`; nota de la landing `landings.ts:308-309`; reseña de Samuel D. Flores, `testimonials.ts:56-66`.
  - Fang Tours: «Landing con calendario de disponibilidad y pasarela de pago integrada» / «Gestionar los tours y su disponibilidad en tiempo real desde un panel propio»; Next.js, Supabase y Stripe; resultado «La reserva online sustituyó casi por completo al teléfono como canal de contratación…» — `projects.ts:490-522`; nota `landings.ts:312-313`.
  - Oferta «Reservas y disponibilidad… sin comisiones de intermediarios» — `landings.ts:868-869`.
- **No decir:** localidad de Nautirent o de Fang Tours (no consta); cifras.
- **FAQs:**
  1. ¿Qué es un sistema de reservas online?
  2. ¿Hay sistemas de reservas gratis? (autocompletado «app gestión reservas gratis»)
  3. ¿Puedo cobrar una señal al reservar?
  4. ¿Se puede conectar con mi programa de gestión?
- **Enlaces internos:** `/desarrollo-web-vigo` (ancla: «reservas online en tu propia web»), `/desarrollo-de-aplicaciones-pontevedra` (ancla: «apps de reservas para turismo y náutica en la provincia»), `/projects/nautirent`, `/projects/fang-tours`, `/software-a-medida-vigo`.
- **Imagen:** `/projects/fang-tours.webp`

#### I4 · React Native o Flutter — P2

- **slug:** `react-native-o-flutter`
- **title (47):** React Native o Flutter: cuál elegir para tu app
- **metaDescription (154):** React Native o Flutter para la app de una empresa: rendimiento, equipo, mantenimiento y ecosistema. Y por qué nosotros trabajamos con React Native y Expo.
- **h1:** React Native o Flutter en 2026: cuál elegir para la app de tu empresa
- **excerpt:** Las dos tecnologías para hacer una sola app para iPhone y Android, explicadas para quien encarga la app y no para quien la programa.
- **category:** Desarrollo de apps
- **keyword:** react native o flutter. Secundarias: flutter vs react native (10–100), expo react native (100–1.000, perfil técnico: solo mención).
- **targetLanding:** `desarrollo-de-aplicaciones-vigo`
- **Intención:** comparación. SERP distinta de la de «nativa o multiplataforma» (no comparten ni un resultado en el top 8), así que no canibaliza a `apps-nativas-o-multiplataforma`; se enlazan entre sí.
- **Esquema (H2):**
  1. La respuesta corta para quien encarga una app.
  2. Lo que tienen en común — una base de código para iOS y Android.
  3. En qué se diferencian — lenguaje (JavaScript/TypeScript frente a Dart), cómo pintan la interfaz, ecosistema (contrastar con reactnative.dev y flutter.dev; nada de benchmarks sin fuente).
  4. Lo que importa al negocio — quién la mantendrá, si comparte código o equipo con la web, cómo llegan las actualizaciones.
  5. Por qué trabajamos con React Native y Expo — hechos de abajo.
  6. Cuándo ninguna de las dos — enlace al post de nativa.
- **Hechos y fuentes:**
  - Action usa React Native en sus apps multiplataforma — `landings.ts:125`; XauLabs (`projects.ts:409`), Óscar Soto (`projects.ts:236`, React Native y Expo), Tratum (`projects.ts:271`, React Native y Expo, en desarrollo).
  - La web de Action está hecha con React y Next.js — `CLAUDE.md` [CONTEXTO] (argumento: mismo lenguaje y equipo en web y app).
  - PAA de Google (8-10-2026, en inglés): «Is Flutter better than React Native?», «Is Flutter still relevant in 2026?», «Which is better, Flutter or React Native in 2026?», «Is Flutter really native?».
- **No decir:** que TrueTrading o Lift están hechas con React Native (en `projects.ts` figuran como «TBD»); rendimiento comparado sin fuente.
- **FAQs:**
  1. ¿Flutter es mejor que React Native?
  2. ¿Flutter sigue siendo una buena opción en 2026?
  3. ¿Una app hecha con React Native es nativa?
  4. ¿Qué usáis vosotros y por qué?
- **Enlaces internos:** `/desarrollo-de-aplicaciones-vigo` (ancla: «apps multiplataforma con React Native en Vigo»), `/blog/apps-nativas-o-multiplataforma`, `/blog/app-o-aplicacion-web-pwa`, `/blog/cuanto-cuesta-mantener-una-app`, `/projects/xaulabs`, `/projects/oscar-soto`.
- **Imagen:** `/projects/oscar-soto-mockup.webp`

#### I3 · Mantenimiento de una página web — P2

- **slug:** `mantenimiento-pagina-web`
- **title (44):** Mantenimiento de una página web: qué incluye
- **metaDescription (149):** Qué incluye el mantenimiento de una web (seguridad, actualizaciones, copias, contenidos, velocidad), qué lo encarece y qué pasa cuando nadie lo hace.
- **h1:** Mantenimiento de una página web: qué incluye y qué pasa si no se hace
- **excerpt:** Qué cubre de verdad el mantenimiento de una web, en qué se diferencia una web con plugins de una hecha a medida y qué pedir por escrito.
- **category:** Desarrollo web
- **keyword:** mantenimiento página web. Secundarias: mantenimiento web (100–1.000), mantenimiento web precio (100–1.000), cuánto cuesta mantener una página web al mes / al año (autocompletado).
- **targetLanding:** `agencia-desarrollo-web-galicia` (oferta «Mantenimiento y evolución», `landings.ts:1462`, y FAQ `:1542`; esa landing recibe un solo enlace interno, auditoría §6 M4).
- **Intención:** informativa con intención de precio. Es el paralelo web del post `cuanto-cuesta-mantener-una-app`.
- **Esquema (H2):**
  1. Qué es mantener una web (y qué no: rediseñarla).
  2. Qué incluye — seguridad y dependencias, copias, contenidos, velocidad, formularios que llegan, certificados.
  3. Web con plugins o web a medida: dos mantenimientos distintos.
  4. Qué pasa si nadie lo hace — formularios que no llegan a nadie, webs que nadie puede actualizar.
  5. Qué lo encarece — integraciones, pagos, frecuencia de cambios.
  6. Actualizar en vez de rehacer — París de Noia.
  7. Qué pedir por escrito.
- **Hechos y fuentes:**
  - Mantenimiento en la propuesta (actualizaciones, cambios de contenido, copias, soporte) — `landings.ts:1542-1543`; mismo equipo — `:1462-1463`.
  - Web a medida sin panel expuesto ni plugins — `landings.ts:318-322`. «Formularios que no llegan a nadie», «webs que no se pueden actualizar sin llamar al informático» — `landings.ts:270`.
  - Reseña de Adrián Rodríguez (proyecto PARIS DE NOIA): «Contratamos sus servicios para actualizar la página web de Paris de Noia y la han dejado perfecta, con un toque súper moderno y actual. Trabajan impecablemente.» — `testimonials.ts:153-163`; proyecto `projects.ts:763-798`.
  - Reseña de Carla Hermida: «…siempre están a disposición del cliente, antes y después de la puesta en marcha de nuestra página web.» — `testimonials.ts:109-119`.
- **No decir:** cuotas mensuales en €, tiempos de respuesta garantizados.
- **FAQs:**
  1. ¿Cuánto cuesta mantener una página web al mes? (autocompletado) → factores, «decisión pendiente: rangos de precio».
  2. ¿Es obligatorio mantener una web?
  3. ¿Qué incluye un servicio de mantenimiento web?
  4. ¿Puedo mantener yo mi web?
- **Enlaces internos:** `/agencia-desarrollo-web-galicia` (ancla: «agencia de desarrollo web en Galicia»), `/desarrollo-web-vigo`, `/blog/cuanto-cuesta-mantener-una-app`, `/blog/senales-web-pierde-clientes`, `/projects/paris-de-noia`.
- **Imagen:** `/projects/paris-de-noia-mockup.webp`

#### I7 · Web 3D interactiva: lo que aprendimos con la nuestra — P3

- **slug:** `web-3d-interactiva`
- **title (40):** Web 3D interactiva: cuándo tiene sentido
- **metaDescription (144):** Lo que aprendimos haciendo nuestra web en 3D: carga, móvil, accesibilidad y SEO. Cuándo una experiencia 3D suma a una marca y cuándo le estorba.
- **h1:** Webs en 3D: cuándo tienen sentido y qué exigen en rendimiento y SEO
- **excerpt:** Una web 3D puede hacer memorable una marca o espantar visitas. Lo que medimos con la nuestra y cuándo lo recomendamos.
- **category:** SEO y diseño web
- **keyword:** web 3d (100–1.000; intención mezclada: parte busca herramientas de modelado, autocompletado «página web para crear modelos 3d»). Secundarias: página web 3D (10–100), página web interactiva (10–100), diseño web premium (10–100).
- **targetLanding:** `diseno-web-vigo` (oferta «Experiencias 3D», `landings.ts:436`).
- **Esquema (H2):**
  1. Qué es una web 3D y qué no.
  2. Cuándo suma y cuándo estorba.
  3. Nuestra web como laboratorio — el puerto de Vigo de la home, la sala recreativa de proyectos, la plaza de reseñas inspirada en Castrelos, la calle de nuestra oficina en /contact.
  4. Rendimiento: lo que medimos — cifras de Lighthouse de abajo; el coste de compilar shaders.
  5. SEO con 3D — el texto tiene que estar en el HTML; listas de proyectos y reseñas en el HTML; versión móvil sin 3D.
  6. Accesibilidad — alternativa sin jugar.
- **Hechos y fuentes:** Lighthouse de laboratorio, septiembre de 2026, build de producción, escritorio: accesibilidad, buenas prácticas y SEO 100 en siete rutas; rendimiento 100 salvo la home (90, LCP 1,9 s) — `CLAUDE.md:501-502`. Compilar shaders: ~110 ms por material PBR con la caché vacía — `CLAUDE.md:471`. Home: texto indexable con H1 y navegación — `CLAUDE.md:235`. Plaza de Castrelos — `CLAUDE.md:241`. Web móvil v2 sin Three.js — `CLAUDE.md:127`. `/contact` en móvil (laboratorio, CPU 4×): rendimiento 45 — auditoría §6 M7 (contarlo: es honesto y útil). Musa lleva Three.js — `projects.ts:376`.
- **No decir:** premios; cifras que no estén aquí.
- **FAQs:** ¿Una web en 3D carga lento? · ¿Google indexa una web en 3D? · ¿Se ve bien en el móvil? · ¿Qué necesita mi marca para una experiencia 3D? (no repetir la FAQ de la landing «¿Podéis hacer una web con 3D como la vuestra?», `landings.ts:512`).
- **Enlaces internos:** `/diseno-web-vigo` (ancla: «diseño web con 3D y motion en Vigo»), `/projects`, `/resenas`, `/projects/musa`.
- **Imagen:** `/projects/actiondev-mockup.webp` (existe y no se usa).

---

## 5. Mejoras en páginas existentes

Regla: se mantienen todas las URLs. Los cambios de copy van con el texto exacto. Donde la página ya posiciona (Bing #1 de la landing de agencia en Galicia), el cambio se justifica con datos.

### 5.1 Landings SEO (`apps/desktop/src/data/landings.ts` + `packages/shared/src/seo.ts` si cambia el nombre)

**Común a las 10 (código):** bloque «Guías relacionadas» con los posts cuyo `targetLanding` es esa landing (auditoría §6 M4; hoy ninguna landing enlaza a un post). Es el cambio de enlazado con más efecto: reparte autoridad del blog a las landings y da contexto a Google.

**`/desarrollo-de-aplicaciones-vigo`**
- Title y meta: se quedan (el title ya es el de la auditoría).
- Añadir sección (`sections`) — título exacto: **«Una empresa de desarrollo de apps en Vigo»**. Contenido: quién programa, oficina en Rúa Colón 20, reuniones en persona, mismo equipo en mantenimiento (`landings.ts:110`, `:222`). Justificación: «empresas de desarrollo de apps» y «empresa desarrollo de apps» tienen 100–1.000 en España y la PAA «¿Qué empresas desarrollan aplicaciones?» sale en 3 SERPs.
- Añadir FAQ — **«¿Cuánto se cobra por el desarrollo de una app?»** (PAA en 4 de las 5 SERPs de apps medidas). Respuesta exacta: «Depende del alcance: cuántas pantallas y tipos de usuario tiene, si necesita backend propio, con qué sistemas se conecta y si debe funcionar sin conexión. Por eso no damos una cifra sin conocer el proyecto: tras una reunión de definición te enviamos una propuesta cerrada con el alcance por escrito.» Si el dueño aprueba rangos, sustituir por la plantilla de la auditoría §5.3.
- Añadir FAQ — **«¿Qué empresas desarrollan aplicaciones en Vigo?»**. Respuesta exacta: «En Vigo hay agencias generalistas, estudios centrados en apps y empresas de fuera con páginas por ciudad. Para distinguirlas, pide apps publicadas que puedas descargar, pregunta quién va a programar la tuya y qué pasa con el mantenimiento. Nosotros somos un estudio con oficina en la Rúa Colón, 20, y en esta página tienes nuestros casos.»
- Caso True Trading (`landings.ts:155-156`): añadir a la nota «Disponible en App Store.» y, en la ficha `/projects/true-trading-app`, el enlace `https://apps.apple.com/es/app/truetrading/id6758015608` (comprobado el 8-10-2026; publicada el 4-3-2026). **Antes**, ver el bloqueo de §8: la ficha de App Store tiene como vendedor «PABLO CABALEIRO SOUTO», y la landing promete cuentas «a nombre de tu empresa» (`landings.ts:214`).
- `related`: si se hace el 301 de Galicia, quitar ese enlace.

**`/desarrollo-de-aplicaciones-pontevedra`**
- Title y meta: se quedan.
- Añadir FAQ — **«¿Hacéis apps para clubes deportivos y asociaciones?»**. Respuesta exacta: «Sí. Para PBB, el club de baloncesto base de O Porriño, la inscripción y el pago de la cuota y la matrícula se hacen desde la web, con cuentas separadas para familias y deportistas, y los padres gestionan las cuentas de sus hijos desde su propio perfil.» (`projects.ts:171-175`). Justificación: «app para clubes deportivos» 10–100 en la provincia, y es la prueba local más fuerte que tiene esta landing.
- Recibirá enlaces de C3, I5 y de los posts de publicación y ASO.

**`/desarrollo-de-aplicaciones-galicia` — decisión (actualiza la auditoría §3.4)**
- **Dato nuevo:** «desarrollo apps galicia» es la **única** búsqueda de apps con modificador geográfico, de las medidas, que da volumen (10–100 en España, Galicia, Pontevedra y A Coruña). Las de Vigo y Pontevedra salen sin datos. Y la SERP de Google para «desarrollo apps galicia» (8-10-2026) es de agencias (Sortlist, Galvintec, Docastix, Coco Solution…), no de FP; la de FP era «desarrollo de **aplicaciones** galicia».
- **Opción A (recomendada): mantener y reorientar.** Title exacto: **«Desarrollo de Apps en Galicia | Apps y Plataformas»** (50). H1 se queda. Mantener el enfoque en producto, formación, comunidad y escritorio, que no repite la de Vigo. Ventaja: no se pierde la única variante con demanda. Coste: sigue habiendo dos landings de apps; hay que vigilar en Search Console cuál sale para cada búsqueda.
- **Opción B (la de la auditoría): 301 a Vigo.** Ventaja: concentra autoridad. Coste: se deja sin URL específica la búsqueda regional con demanda medible.
- Decisión del dueño (§8).

**`/software-a-medida-vigo`**
- Title y meta: se quedan.
- Oferta «Integraciones y middleware» (`landings.ts:727`): título exacto nuevo **«Integración con tu ERP y otros sistemas»**. Justificación: «integración erp» 100–1.000 y +900 % a tres meses.
- FAQ «¿Cómo se presupuesta un software a medida?» (`landings.ts:816`): cambiar la pregunta a **«¿Cuánto cuesta un software a medida?»** (PAA en «software a medida vigo» y «erp a medida») y anteponer a la respuesta actual: «No damos una cifra cerrada sin conocer el proceso.»
- Añadir FAQ — **«¿Hay ayudas para digitalizar una pyme en Galicia?»**. Respuesta (verificar contra el DOG antes de publicar): «Sí. La principal es la línea IG300C del IGAPE para la transformación digital de las pymes, que en su convocatoria de 2026 incluía, entre otros, sistemas de gestión integral y automatización de procesos (DOG n.º 107, de 10 de junio de 2026). El plazo de 2026 ya cerró; conviene tener el proyecto definido antes de que se publique la siguiente.» Justificación: «ig300c» e «igape ayudas» 100–1.000 en Galicia.
- Recibirá enlaces de C4, I6 e I1.

**`/desarrollo-web-vigo`**
- Title y meta: se quedan. Bing elige la home para «desarrollo web vigo» (#4): la solución es enlazado (§6), no reescribir.
- Recibirá C2, I2, I5. Sin más cambios de copy.

**`/diseno-web-vigo`**
- H1: «Diseño web en Vigo» → **«Diseño de páginas web en Vigo»** (igual que el title; «diseño páginas web vigo» y «páginas web vigo» 10–100).
- **Corrección de veracidad** (`landings.ts:417`): Almudena Muhle es un estudio de Mallorca (título de `almudenamuhle.com`: «Almudena Muhle | Diseño de Interiores en Mallorca») y la frase la presenta dentro de un párrafo sobre marcas de Vigo. Texto exacto nuevo para esa frase: «Proyectos de interiorismo contados como historias, como en la web del estudio mallorquín de Almudena Muhle.»
- Añadir FAQ — **«¿Cómo elijo una empresa de diseño web en Vigo?»** (autocompletado «empresas de diseño web en vigo»). Respuesta exacta: «Mira webs suyas publicadas y ábrelas en tu móvil, pregunta quién diseña y quién programa, y pide un presupuesto cerrado que diga qué incluye. En Action diseño y programación los hace el mismo equipo, en Vigo.» (`landings.ts:411`).

**`/tienda-online-vigo`**
- Meta: la actual promete «ecommerce a medida con React y Node.js» y cita Koopey, pero `koopeyclub.com` en vivo es una tienda Shopify (el HTML lo menciona 649 veces) y `projects.ts:745` dice React, Node.js y WebSocket. Hasta aclararlo (§8), meta exacta nueva (142): **«Creamos tiendas online en Vigo: Shopify o ecommerce a medida, pagos y catálogo cuidado. Casos reales: Canelita, en Redondela, Cliché y Koopey.»**
- Añadir FAQ — **«¿Cuánto cuesta una tienda online?»** (10–100; autocompletado «en España», «en Shopify»). Respuesta exacta: «Depende sobre todo del tamaño del catálogo, de si se conecta con tu programa de gestión, de los métodos de pago y de quién prepara fotos y fichas. Una tienda Shopify bien montada y un ecommerce a medida no se presupuestan igual: tras una primera conversación te enviamos una propuesta cerrada.»

**`/desarrollo-web-pontevedra`**
- Title: «Desarrollo y Diseño Web en Pontevedra | Webs a Medida» → **«Diseño Web en Pontevedra | Desarrollo de Webs a Medida»** (54). Justificación: «diseño web pontevedra» 100–1.000 (España, Galicia y provincia) frente a «desarrollo web pontevedra» 10–100.
- H1: → **«Diseño y desarrollo web en Pontevedra»**.
- Meta exacta nueva (149), sin Redondela (canibalización §3.1-3): **«Diseño y desarrollo de páginas web a medida en Pontevedra y las Rías Baixas: hostelería, eventos, clubes y comercio, con casos en la provincia. ★ 5,0»**
- Casos: cambiar `samoa` por `fase` (su web dice «Vigo · Marín»; antes, confirmar `location` con el dueño, §5.4). Así quedan La Fábrica (Redondela), PBB (O Porriño) y FASE, y Samoa se queda para Redondela y diseño.
- Quitar Redondela de `areaServed` (auditoría).

**`/desarrollo-web-redondela`**
- Title y meta: se quedan (es la landing local con prueba real).
- Recibirá C1 y C2 (hoy no la enlaza ningún post ni ficha).

**`/agencia-desarrollo-web-galicia`**
- Title: «Agencia de Desarrollo Web en Galicia | Webs a Medida» → **«Diseño y Desarrollo Web en Galicia | Agencia en Vigo»** (52). Justificación: «diseño web galicia» 100–1.000 frente a «agencia desarrollo web galicia», sin datos. Conserva «Desarrollo Web en Galicia» y «Agencia», que es por lo que es #1 en Bing. H1 se queda.
- Meta exacta nueva (153), sin la lista de ciudades (auditoría §3.4): **«Agencia de diseño y desarrollo web con sede en Vigo: webs corporativas, tiendas online y aplicaciones web para empresas gallegas, en persona o en remoto.»**
- Recibirá I3.

### 5.2 Páginas hub

**Home (`/`)** — No tocar title ni H1 (auditoría: esperar 4-6 semanas de Search Console). Bing la sigue eligiendo para «desarrollo apps vigo» (#2) y «desarrollo web vigo» (#4) el 8-10-2026. Lo que sí: en el texto indexable y en la home móvil, anclas descriptivas hacia las landings («desarrollo de apps en Vigo», «diseño de páginas web en Vigo») en vez de nombres genéricos.

**`/servicios`** — Title se queda. H1 «Servicios de desarrollo y diseño digital» → **«Servicios de desarrollo de apps, software y webs en Vigo»**. Añadir debajo de cada grupo un enlace a 1-2 guías del blog (las de mayor volumen de cada servicio).

**`/projects`** — Title y meta se quedan. H1 (hoy `sr-only` «Nuestros trabajos», `lib/i18n/es.ts:195`) → **«Proyectos de apps, software y webs hechos en Vigo»**. Párrafo introductorio en el HTML del servidor (auditoría §6 M5). El `ItemList` del JSON-LD solo con las fichas indexables.

**`/resenas`** — H1 (hoy `sr-only` «La plaza de las reseñas», `lib/i18n/es.ts:183`) → **«Reseñas de clientes de Action Development en Google»**. Ojo: `app/(site)/resenas/page.tsx` tiene un cambio del usuario sin commitear; hacer esto cuando esté commiteado. Pedir al dueño las reseñas nuevas de la ficha para añadirlas a `testimonials.ts` (las landings dicen «22 reseñas» y la ficha tenía 23 el 2-10).

**`/blog`** — Title «Blog» → **«Guías sobre apps, software y webs»** (33 + plantilla). El H1 visual del corcho («Nuestro Blog») es decisión del cliente: no se toca.

### 5.3 Posts existentes (Firestore `posts`, desde el panel)

Problemas comunes: 6 titles pasan de 51 caracteres (con « — Action» pasan de 60), 5 metas pasan de 155, 3 fechas son anteriores a que existiera el blog (auditoría §6 M2) y 2 posts no tienen autor, keyword, `targetLanding` ni FAQs.

| Post | Cambio exacto | Por qué |
|---|---|---|
| `cuanto-cuesta-desarrollar-una-app` | title → **«¿Cuánto cuesta crear una app? Qué decide el precio»** (50); h1 → **«¿Cuánto cuesta crear una app?»**; meta → **«Qué hace que crear una app para tu negocio cueste más o menos: alcance, plataformas, backend, integraciones y costes de tienda. Guía desde Vigo.»** (144); keyword → «cuánto cuesta crear una app». Añadir H2 **«Cuánto cuesta una app para un negocio pequeño»** y FAQ **«¿Cuánto se cobra por hacer una app?»** (PAA). Bloque «decisión pendiente: rangos de precio». URL igual | «crear» 100–1.000 frente a «desarrollar» 10–100; «para mi negocio» y «sencilla» en autocompletado |
| `cuanto-cuesta-mantener-una-app` | title → **«Cuánto cuesta mantener una app y qué incluye»** (44); FAQ nueva **«¿Cuánto cuesta mantener una app al mes?»** (autocompletado «al mes»), sin cifras propias | Title de 56 (+9 = 65) |
| `publicar-app-app-store-google-play` | title → **«Publicar en App Store y Google Play: coste y plazos»** (51); FAQ nueva **«¿Cuánto vale poner una app en Play Store?»** (PAA) remitiendo a la cuota de 25 USD que ya cita | Title de 59 (+9 = 68) |
| `apps-nativas-o-multiplataforma` | title → **«App nativa o multiplataforma: cómo decidir»** (42); meta → **«App nativa o multiplataforma (React Native, Flutter): rendimiento, coste, plazos y mantenimiento. Cuándo compensa cada opción para una empresa.»** (143); ampliar de 316 a ~900 palabras: H2 **«¿Y las apps híbridas?»** («app nativa o híbrida» 10–100) y H2 **«React Native y Flutter, en dos líneas»** con enlace a I4; fecha real | Title 60, meta 160, contenido fino, fecha 08-09 anterior al blog |
| `app-o-aplicacion-web-pwa` | meta → **«App de tienda o aplicación web (PWA): qué puede hacer cada una hoy, cuándo compensa cada opción y cómo cambian coste y mantenimiento.»** (133). Si se hace el 301 de Galicia, `targetLanding` → `desarrollo-de-aplicaciones-vigo` | Meta 169; «qué es una PWA» 100–1.000 ya cubierta por su H2 |
| `app-para-empleados-partes-fichajes` | title → **«App para fichar y partes de trabajo en tu empresa»** (49); meta → **«App para fichar, partes de trabajo y pedidos desde el móvil: qué debe tener para que la plantilla la use, qué dice la ley y cómo instalarla sin tiendas.»** (152); keyword → «app para fichar»; H2 nuevo **«¿App de fichaje gratuita o a medida?»** (el autocompletado de «app para fichar» es casi todo «gratis»; SERP de listados SaaS) | «app para fichar» y «app control horario» 100–1.000 |
| `importancia-ux-ui-apps-moviles` | title → **«Diseño de apps: por qué el UX/UI decide si se usa»** (49); meta → **«Una app se abre cientos de veces. Cómo diseñamos navegación, alcance del pulgar y coherencia entre pantallas, con un prototipo antes de programar.»** (146); keyword «diseño de apps»; `author`, `targetLanding: desarrollo-de-aplicaciones-vigo`, 3 FAQs; ampliar a ~900 palabras con el prototipo navegable antes de programar (`landings.ts:187-189`) y la pantalla de inicio de Óscar Soto (`projects.ts:250-251`) | «diseño apps» 100–1.000 (ideas); hoy 320 palabras, sin autor ni keyword |
| `como-elegir-agencia-desarrollo-web-galicia` | title → **«Cómo elegir agencia de desarrollo web en Galicia»** (48); meta → **«Criterios para elegir agencia de desarrollo web en Galicia: trabajo verificable, trato directo, presupuesto cerrado, código propio y mantenimiento.»** (147); absorber las tres preguntas de `que-mirar…` | Title 52, meta 167; canibalización §3.1-4 |
| `que-mirar-antes-de-contratar-agencia-vigo` | **Opción A (recomendada):** fusionar en el anterior y 301 (`redirects()` de `next.config.ts`; sacarlo del sitemap y de `llms.txt`). **Opción B:** title → **«Qué preguntar a una agencia antes de contratarla»** (48), meta → **«Las preguntas para la primera reunión con una agencia de desarrollo en Vigo: quién programa, presupuesto cerrado, propiedad del código y mantenimiento.»** (151), ampliar a ~800 palabras y fecha real | 323 palabras, misma intención, fecha 30-07 anterior al blog |
| `senales-web-pierde-clientes` | title → **«Cinco señales de que tu web pierde clientes»** (43); fecha real; absorber `como-hacer-que-tu-web…` | Title 68; fecha 22-08 anterior al blog |
| `como-hacer-que-tu-web-tenga-visitas-y-convierta` | Fusionar en `senales-web-pierde-clientes` y 301 | 330 palabras, sin keyword, autor ni FAQs; solapa con dos posts |
| `shopify-o-tienda-online-a-medida` | meta → **«Shopify o tienda a medida: catálogo, costes recurrentes, pagos con Redsys y Bizum, integración con el ERP y plazos. Guía para negocios de Galicia.»** (146); H2 nuevo **«Qué entra en el precio de una tienda online»** sin cifras; enlace a I6 | Meta 175; «cuánto cuesta una tienda online» 10–100, «montar tienda online» 100–1.000 |
| `mvp-de-una-app` | Sin cambios de metadatos. Enlaces nuevos a C5 e I4 cuando existan | — |
| `como-posicionar-una-app-aso` | Sin cambios | Title y meta correctos |
| `como-salir-en-google-maps-vigo` | Sin cambios de metadatos. Enlace nuevo a C1 (carta en la ficha) cuando exista | — |

### 5.4 Fichas de proyecto (`packages/shared/src/projects.ts` + `lib/project-case.ts`)

**Descripciones (`descriptionEs`, ≤155; salen de `brief`/`result`):**

| Proyecto | Problema | `descriptionEs` exacta nueva |
|---|---|---|
| `musa` | Dice «restaurante… menú interactivo» (`projects.ts:364-365`); es una discoteca con venta de entradas (brief `:384-388`, su web: «Discoteca … en Vigo»). Hoy se sirve así en producción | «Web para Musa, discoteca de Vigo: venta de entradas en su propia web, sin ticketera externa, con perfil de cliente. Reservas online: +40 %.» (139) |
| `pbb-porrino` | Habla de «sistema de reservas y estrategia SEO local que genera tráfico orgánico constante», que no sale del brief | «Web del club PBB de O Porriño: inscripción y pago de cuota y matrícula online, con cuentas para familias y deportistas. Adiós al papeleo en ventanilla.» (151) |
| `samoa` | Cita «web con reservas» y «estrategia de lanzamiento en redes», que no salen del brief | «Samoa Café, en Redondela: identidad de marca desde cero (naming, logo y carta) y una web con carta editable que cambia sola entre día y noche.» (142) |
| `fase` | Sin localidad; su web dice «Vigo · Marín» y «Más de 25 años…» | «Web corporativa multilingüe para FASE, instalaciones eléctricas navales e industriales en Vigo y Marín, con contenidos claros por línea de servicio.» (148). Añadir `location` cuando el dueño confirme cuál |
| `cerveceria-equs` | Sin localidad; su web: «Cervecería Equs | Hamburguesas, Tapas y Deportes en Noia, Galicia» | Mantener texto y añadir `location: "Noia"` |

**Otros datos a revisar con el dueño:**
- `true-trading-app`: `year: 2024` (`projects.ts:200`), pero la app está en App Store desde el 4-3-2026 (versión 2.1.6 del 18-9-2026). Añadir el enlace a App Store en la ficha («Descargar en App Store»).
- `koopey`: tecnologías (`projects.ts:745`) frente a la web en vivo en Shopify.
- `samoa`: `technologies` dice Next.js (`projects.ts:607`) y la web en vivo es una SPA con Vite.
- `almudena-muhle`: si se añade `location`, es Mallorca.

**Servicio relacionado (`relatedService`, `lib/project-case.ts:74-84`, va por categoría):**
- `autoescuela-gti` («Web Application» → desarrollo web) debería apuntar a `/software-a-medida-vigo`.
- `timetracker` («Mobile App» → apps) debería apuntar a `/software-a-medida-vigo`.
- `san-jose` está como «Landing Page» y es una app (auditoría): categoría «Mobile App».
- `fang-tours` está como «Landing Page» y es una plataforma de reservas con Stripe, Supabase y panel: «Web Application».
- Propuesta de código: campo opcional `relatedLanding` por proyecto que pise al de la categoría.

**Fichas ↔ blog (código):** en cada ficha con artículo, un enlace «Caso contado en el blog» → C1 en `samoa`; C2 en `ticketera-la-fabrica` y `musa`; C3 en `pbb-porrino`; C4 en `autoescuela-gti`; C5 en `oscar-soto`; C6 en `pro-lift-formacion`, `kairos-futures` y `xaulabs`; I6 en `nautirent` y `licentia`; I5 en `fang-tours`.

**Contenido fino (auditoría A4, 37-77 palabras):** se mantiene la recomendación de añadir sector, año, localidad, tecnologías (sin «TBD»), la reseña del cliente si existe (Nautirent → Samuel D. Flores; Kairos → YondayX; París de Noia → Adrián Rodríguez; Almudena Muhle → Almudena Muhle) y los enlaces a tiendas.

---

## 6. Enlazado interno: hubs y spokes

**Reglas**
1. Cada post enlaza a su `targetLanding` en los dos primeros párrafos, con un ancla descriptiva que no repita literalmente la de otro post.
2. Cada artículo de caso enlaza a su ficha `/projects/<slug>` y la ficha le devuelve el enlace (§5.4).
3. Cada landing muestra sus posts en «Guías relacionadas» (§5.1).
4. Al publicar un artículo nuevo, se añade un enlace desde 1-2 posts antiguos del mismo hub (tabla de abajo).
5. Nada de enlaces a la home con anclas de keyword («desarrollo de apps en Vigo» siempre va a la landing, nunca a `/`).

| Hub (landing) | Spokes que existen | Spokes nuevos | Anclas a usar (variar) |
|---|---|---|---|
| `/desarrollo-de-aplicaciones-vigo` | cuanto-cuesta-desarrollar-una-app, cuanto-cuesta-mantener-una-app, mvp-de-una-app, apps-nativas-o-multiplataforma, importancia-ux-ui-apps-moviles, app-o-aplicacion-web-pwa (si 301 de Galicia) | C5, C6, I4 | «desarrollo de apps iOS y Android en Vigo», «apps multiplataforma con React Native en Vigo», «apps de formación y comunidad hechas en Vigo», «estudio de desarrollo de apps en Vigo» |
| `/desarrollo-de-aplicaciones-pontevedra` | publicar-app-app-store-google-play, como-posicionar-una-app-aso | C3 (y enlace secundario desde I5) | «apps a medida para clubes y empresas de la provincia de Pontevedra», «apps de reservas para turismo y náutica en la provincia» |
| `/desarrollo-de-aplicaciones-galicia` (si se mantiene) | app-o-aplicacion-web-pwa | — (C6 la enlaza solo en contexto) | «apps y plataformas para empresas de Galicia» |
| `/software-a-medida-vigo` | app-para-empleados-partes-fichajes | C4, I6, I1 | «software a medida para empresas de Vigo», «integraciones y software a medida en Vigo», «software de gestión a medida para pymes gallegas» |
| `/desarrollo-web-vigo` | senales-web-pierde-clientes, como-salir-en-google-maps-vigo | C2, I2, I5 | «webs que venden entradas y gestionan reservas en Vigo», «desarrollo web a medida en Vigo», «reservas online en tu propia web» |
| `/desarrollo-web-redondela` | — (ninguno hoy) | C1 (y enlace secundario desde C2) | «páginas web para negocios de Redondela» |
| `/diseno-web-vigo` | — | I7 (y secundarios desde C1 e I2) | «diseño web con identidad propia», «diseño web con 3D y motion en Vigo» |
| `/tienda-online-vigo` | shopify-o-tienda-online-a-medida | secundario desde I6 e I2 | «tiendas online conectadas a tu gestión», «diseño de tiendas online en Vigo» |
| `/agencia-desarrollo-web-galicia` | como-elegir-agencia-desarrollo-web-galicia | I3 | «agencia de desarrollo web en Galicia» |
| `/desarrollo-web-pontevedra` | — | secundario desde C3 | «diseño web en Pontevedra» |

**Enlaces que hay que añadir en posts antiguos cuando se publiquen los nuevos**
- `cuanto-cuesta-desarrollar-una-app` → C5 (app para un negocio pequeño), I4.
- `apps-nativas-o-multiplataforma` → I4.
- `mvp-de-una-app` → C5, C6.
- `app-para-empleados-partes-fichajes` → C4, I1.
- `shopify-o-tienda-online-a-medida` → I6.
- `como-salir-en-google-maps-vigo` → C1.
- `senales-web-pierde-clientes` → I3, I2.
- `cuanto-cuesta-mantener-una-app` → I3 (paralelo web).
- Entre nuevos: C2 ↔ I5; C4 ↔ I6 ↔ I1; C1 → C2; I2 ↔ I3.

**Hub de hubs:** `/servicios` enlaza a todas las landings (ya lo hace) y, tras el cambio de §5.2, a una o dos guías por servicio. `/blog` enlaza a todos los posts. `llms.txt`: añadir los nuevos a la sección de guías.

---

## 7. Fuera de la web: tareas rápidas que necesitan al dueño

1. **Perfil en Sortlist** con casos y reseñas. Es #1 en Google (desde Vigo) para «desarrollo apps vigo», «empresas desarrollo apps vigo» y «desarrollo apps galicia», y #2 para «desarrollo de aplicaciones vigo».
2. **Alta en el mapa de capacidades del Clúster TIC Galicia** (`mapatic.clusterticgalicia.com`): sale en el top 10 de Google para «desarrollo apps galicia» y «software a medida vigo».
3. **Páxinas Galegas, categoría «Diseño y desarrollo de software y aplicaciones»**: #3 en Google para «desarrollo aplicaciones pontevedra».
4. **Reclamar Mejores de Vigo** y recategorizar: #1 en Bing para «desarrollo web vigo».
5. **Pedir la inclusión en los listados que rankean**: q2bstudio («30 mejores empresas de desarrollo de apps en Vigo», top 10 en dos SERPs), lafabriquedunet («Top 3 agencias de desarrollo de software en Vigo»), proveedores.com.
6. **`pablo.actiondev.es`**: sigue con el title «Desarrollo de aplicaciones móviles en Vigo — Pablo Cabaleiro» (8-10-2026). Cambiarlo a marca personal y enlazar a la landing.
7. **`clientes.actiondev.es`**: sigue respondiendo 200 sin `X-Robots-Tag` (8-10-2026). Aplicar la auditoría §2.3.
8. **Search Console y Bing Webmaster Tools** (si no está hecho) y `pnpm seo:indexnow` tras cada publicación.
9. **Ficha de Google**: con la ubicación de Vigo forzada, el pack local de «desarrollo apps vigo» mostró Anubía, Solvos, Rodapro e Innatial, no Action. La auditoría la vio 1.ª desde Vigo con ubicación física: medir con rejilla (Local Falcon) antes de sacar conclusiones. Categorías secundarias (apps, diseño web, software), servicios con descripción y reseñas recientes.
10. **Créditos con enlace en las webs de clientes locales** (La Fábrica, PBB, Samoa, Canelita, FASE): relevantes y de la provincia.
11. **Permisos** para los artículos de caso: Autoescuela GTI, Óscar Soto, PBB, La Fábrica, Musa, Samoa.

---

## 8. Decisiones pendientes y bloqueos

**Del dueño**
1. **Rangos de precio** (auditoría §5.3 y §8.1). Afecta a I2, a C4/C5 y a las FAQs de precio. Sin ellos, I2 compite en desventaja con SERPs llenas de tablas en €.
2. **Landing de apps en Galicia: mantener (opción A, recomendada con los datos nuevos) o 301 (opción B).**
3. **¿Action ayuda a preparar solicitudes de ayudas (IG300C)?** Cambia el cierre de I1.
4. **Cuenta de App Store de TrueTrading**: el vendedor es «PABLO CABALEIRO SOUTO», y la web promete cuentas «a nombre de tu empresa» (`landings.ts:214`; post de mantenimiento, «Antes de firmar: de quién es la app»). Decidir antes de enlazar la ficha de App Store.
5. **Koopey**: ¿qué se hizo (Shopify o capa a medida con React, Node.js y WebSocket)? La meta de `/tienda-online-vigo` depende de esto.
6. **Localidad de FASE** (Vigo o Marín) y año real de True Trading.
7. **Óscar Soto**: ¿la app está publicada? ¿El cliente acepta el artículo?
8. **Fusiones con 301** de los dos posts cortos (§5.3).

**Del método**
- Google pidió captcha tras 16 SERPs; el resto se midió en Bing. Las SERPs de «carta digital restaurante», «integración erp», «web 3d» y «mantenimiento página web» no se vieron en Google: quien redacte, que las mire antes.
- Keyword Planner solo da intervalos (cuenta sin gasto).
- La web de Samoa es una SPA: confirmar en el navegador la carta de día y de noche antes de escribir C1 en presente.
