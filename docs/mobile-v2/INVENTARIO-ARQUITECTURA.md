# Móvil v2 de actiondev.es — Inventario, arquitectura y plan

Fecha: 2026-10-08. Fuente: `~/actiondev` (código) + producción (recorrido con Chromium 1217, 390x844, UA iPhone).
No se ha tocado código. Capturas en `recorrido/` (viewport y página completa de 11 rutas).

## 0. Decisiones del cliente (vinculantes)

1. **Entra:** home, servicios, proyectos (lista + ficha), reseñas, contacto y `/hablemos/*`.
2. **Se queda como está (fase 2):** las 10 landings SEO, el blog y `/legal/*`. Se mantiene el análisis de riesgo, pero el plan de construcción (§5) solo cubre lo que entra.
3. **Sin fotos de equipo ni de oficina** (de momento). No son hueco: la confianza se apoya en proyectos reales, reseñas, datos de empresa y proceso.
4. **Primera reunión gratis y sin compromiso: CONFIRMADO**, usable en copy.
5. **Google Ads no se lanza hasta que exista la nueva móvil** → `/hablemos/*` en móvil sale en la **primera entrega**.
6. **Acento de marca: lima `#c8ff00`** (el de desktop). Se descarta el naranja.

---

## 1. Recorrido real en móvil (producción, 390x844, iPhone UA)

Método: Chromium 1217 propio (headless, GL por SwiftShader, sin throttling) para las capturas y el peso; segunda pasada con CPU x4 y red 1,6 Mbps / 150 ms RTT para tiempos "de teléfono medio". Las cifras sin throttling son OPTIMISTAS: sirven para comparar rutas, no como promesa.

### 1.1 Medidas (sin throttling)

| Ruta | Peso total / JS / img | Req. | FCP | LCP (elemento) | Texto visible ≥300 car. | Canvas WebGL | Alto página | Forms / enlaces wa.me |
|---|---|---|---|---|---|---|---|---|
| / | 1903 KB / 1412 KB JS / 96 KB img | 22 | 1152 ms | 1968 ms (P.text-[13px] leading-) | 891 ms | sí | 844px | 0/1 |
| /projects | 3297 KB / 1586 KB JS / 1484 KB img | 49 | 1728 ms | 1968 ms (P.text-sm leading-snug) | nunca ≥300 car. (HUD ~270) | sí | 844px | 0/0 |
| /projects/autoescuela-gti | 847 KB / 613 KB JS / 13 KB img | 28 | 788 ms | 788 ms (IMG.object-cover) | 753 ms | no | 2075px | 0/1 |
| /resenas | 2066 KB / 1708 KB JS / 156 KB img | 30 | 732 ms | 776 ms (P.text-sm leading-snug) | nunca ≥300 car. (HUD ~270) | sí | 844px | 0/0 |
| /contact | 1681 KB / 1478 KB JS / 5 KB img | 26 | 1076 ms | 1116 ms (P.text-sm leading-snug) | 1259 ms | sí | 844px | 0/1 |
| /servicios | 682 KB / 515 KB JS / 0 KB img | 18 | 356 ms | 356 ms (P.prose-body) | 368 ms | no | 5349px | 0/2 |
| /desarrollo-de-aplicaciones-vigo | 756 KB / 533 KB JS / 0 KB img | 21 | 368 ms | 368 ms (P.prose-body text-lg) | 367 ms | no | 10645px | 1/4 |
| /software-a-medida-vigo | 755 KB / 533 KB JS / 0 KB img | 21 | 464 ms | 464 ms (P.prose-body text-lg) | 431 ms | no | 9864px | 1/4 |
| /blog | 849 KB / 557 KB JS / 5 KB img | 29 | 1448 ms | 1448 ms (P.CorkBoard-module__aJ) | 883 ms | no | 6729px | 0/1 |
| /blog/cuanto-cuesta-desarrollar-una-app | 823 KB / 557 KB JS / 5 KB img | 27 | 784 ms | 784 ms (P.mt-8 text-lg leading) | 815 ms | no | 10785px | 0/1 |
| /hablemos/app | 728 KB / 533 KB JS / 15 KB img | 21 | 428 ms | 428 ms (H1.text-[clamp(1.625re) | 427 ms | no | 4601px | 1/2 |

Ficha de proyecto = `/projects/autoescuela-gti`. Landings = apps-vigo y software-a-medida. "Texto visible" cuenta `innerText` (incluye sr-only), así que la home da 914 caracteres aunque en pantalla solo se vea una palabra.

### 1.2 Con throttling (CPU x4, 1,6 Mbps, 150 ms)

```
/ load 1826 FCP 3760 LCP 4284 KB(decoded) 1040
/projects load 2292 FCP 0 LCP 0 KB(decoded) 1632
/resenas load 2014 FCP 1580 LCP 2520 KB(decoded) 1754
/contact load 1850 FCP 1732 LCP 1980 KB(decoded) 1431
/desarrollo-de-aplicaciones-vigo load 1654 FCP 1256 LCP 1256 KB(decoded) 589
/hablemos/app load 2121 FCP 1652 LCP 1652 KB(decoded) 415
/blog load 1787 FCP 2916 LCP 2916 KB(decoded) 677
```

`/projects` no pintó NADA (FCP/LCP = 0) en los ~5 s medidos con throttling: el texto del HUD espera al chunk de Three de 885 KB. `/` tarda 3,8 s en FCP porque carga 1,4 MB de JS (dos chunks de ~350-380 KB de Three/GLTF) para mostrar la palabra «Toca».

### 1.3 Dónde se pierde un usuario no técnico

| # | Dónde | Qué pasa (evidencia) | Gravedad |
|---|---|---|---|
| 1 | **Home (`apps/mobile`)** | Primera pantalla = fondo blanco y UNA palabra («Toca»). No dice qué hace Action. Hay que tocar ~80 palabras sueltas («Hola», «qué tal», «Lorem ipsum dolor sit amet»…) para llegar a una «cerveza» en un carrito que abre WhatsApp. El `<h1>` y los enlaces a servicios son `sr-only`: existen para Google, no para personas. 1,4 MB de JS + dos canvas 3D. | Crítica |
| 2 | **No hay navegación en móvil** | En desktop el `Header` lleva `nav` con `hidden md:inline-flex`: por debajo de 768 px solo queda el logo y «HABLEMOS ↗» → `/contact`. Proyectos, Reseñas, Blog y Servicios son INALCANZABLES desde el header. La home mobile tiene un menú vertical rotado (Inicio/Trabajo/Sobre) distinto del resto. Tres cabeceras distintas según ruta: «HABLEMOS» (3D), teléfono (landings/servicios), «WHATSAPP» (`/hablemos`). | Crítica |
| 3 | **`/projects` y `/resenas`: juegos 3D** | Pasillo de recreativas en primera persona y plaza con muñecos. Para ver un proyecto hay que andar con ▲▼, girar, acoplar la cámara, salir con Esc. Reseñas: «HAZ CLICK EN UN PERSONAJE». Texto real visible: ~270 caracteres. 885 KB de JS de Three, red nunca "idle" (25-28 s), 3,3 MB en `/projects`. El listado y las reseñas están en HTML pero ocultos (`hidden`) tras «VER LISTA». | Crítica |
| 4 | **`/contact`: calle 3D** | La cabina/buzón/portero son escenografía; el canal real es un panel debajo con WhatsApp y email (bien), pero el «¿Prefieres que te contactemos?» (único camino a un formulario) queda tapado por el banner de cookies en primera visita y es un enlace gris pequeño. Sin formulario de proyecto. | Alta |
| 5 | **CTA principal = formulario, y no está donde se compra** | El formulario cualificador de 2 pasos (`LeadForm`) solo existe en `/hablemos/*` (noindex) y al FINAL de las landings SEO (la de apps mide 10.645 px ≈ 12 pantallas). Home, proyectos, reseñas, fichas y servicios no lo tienen: su CTA es «HABLEMOS» → `/contact` → 3D. | Alta |
| 6 | **Banner de cookies** | Ocupa ~20 % de la altura (≈ 250 px de 844) en CADA primera pantalla de CADA ruta y tapa justo el CTA/pie. | Media |
| 7 | **Landings y servicios** | Muro de texto (800-1.000 palabras) con párrafos de 18-20 px; buena base SEO pero ninguna prueba social ni CTA hasta el final; hero de landing de anuncios sí convierte (precedente a copiar). | Media |
| 8 | **Ficha de proyecto** | Correcta y ligera (847 KB, LCP 0,8 s) pero sin CTA propio, 9 de 31 proyectos con imagen placeholder, solo 13 con web pública. | Media |
| 9 | **Popup de atajo (`ContactPopup`)** | Pensado para ratón (salida con `mouseout`); en móvil solo entra el disparador por tiempo (40 s / 2ª ruta + 15 s). Hay que decidir si convive con la barra fija. | Baja |

Lo que YA funciona y hay que conservar como patrón: `/hablemos/app` (FCP 428 ms, 728 KB, `h1` + valoración + formulario en la primera pantalla, `StickyCta`, WhatsApp arriba).

---

## 2. Inventario de contenido REAL

Todo sale del repo. Rutas de origen entre corchetes.

### 2.1 Datos de empresa [`packages/shared/src/seo.ts` → `BUSINESS`, `LEGAL_ENTITY`; `apps/desktop/src/data/socials.ts`]

| Dato | Valor |
|---|---|
| Marca / nombre GBP | Action Development (alias «Action») |
| Titular legal | Alcasi Systems, S.L. — CIF **B72910664** — constituida 22/12/2022, Registro Mercantil de Pontevedra (T. 4428, F. 200, S. 8, H. PO-70894); capital 3.000 € |
| Domicilio social | Lugar Puerto Pesquero Este, S/N, Nave 21, 36900 Marín (Pontevedra) — NO es la oficina |
| Oficina (NAP Google) | Rúa Colón, 20, 36201 Vigo (Pontevedra); geo 42.2372, -8.7203 (aprox., "verificar contra el pin") |
| WhatsApp / teléfono | +34 614 02 74 10 (`wa.me/34614027410`) — **único canal telefónico** |
| Email | hi@actiondev.es |
| Redes | Instagram @actiondev.es · LinkedIn company/action-development |
| Google Business Profile | `maps.google.com/?cid=18162141466997281764`; reseña directa `g.page/r/CeTTw-Rv4wz8EBM/review` |
| Fundación | Marca activa desde 2020 (`foundingYear`) |
| Valoración | 5,0 de 5. **Inconsistencia:** `/hablemos/*` calcula «22 reseñas» (= `testimonials.length`); `llms.txt` dice «23 reseñas (2 oct)». Unificar antes de publicar copy con el número. |
| Área de servicio | Vigo y área (Redondela, O Porriño, Cangas, Nigrán, Baiona…), provincia de Pontevedra en persona; Galicia y España en remoto [`public/llms.txt`] |
| Autor del blog | Pablo Cabaleiro (`packages/shared/src/authors.ts`; web personal `pablo.actiondev.es`) |

### 2.2 Servicios [`BUSINESS.services`, `public/llms.txt`, `/servicios`, `data/landings.ts`]

| Servicio (lenguaje del sitio) | Qué incluye según el repo | Landing que lo explica | Casos enlazados |
|---|---|---|---|
| Desarrollo de aplicaciones móviles (iOS y Android) | Multiplataforma (React Native), app + panel de gestión, backend/APIs, publicación en App Store/Google Play, mantenimiento. Prototipo navegable antes de programar. | `/desarrollo-de-aplicaciones-vigo` (+ Pontevedra, Galicia) | Autoescuela GTI, XauLabs, True Trading App, San José |
| Software a medida / ERP / integraciones | ERP, control horario, paneles, portales, conexión por API entre programas, migración de datos de Excel, presupuesto por módulos | `/software-a-medida-vigo` | Autoescuela GTI, Timetracker, Nautirent, Formación PRO Lift |
| Desarrollo web a medida | React/Next.js; webs que venden entradas, cobran cuotas o gestionan reservas | `/desarrollo-web-vigo`, `/desarrollo-web-pontevedra`, `/desarrollo-web-redondela`, `/agencia-desarrollo-web-galicia` | Musa, PBB, Nautirent, Fang Tours, Samoa… |
| Diseño web premium | Dirección de arte, motion (GSAP), 3D (Three.js) | `/diseno-web-vigo` | Samoa Café, Almudena Muhle, Patricia Avendaño, Equs |
| Tiendas online | Shopify o ecommerce a medida | `/tienda-online-vigo` | Canelita, Koopey, Cliché, Licentia |
| Experiencias 3D interactivas / Interfaces de producto y SaaS / Estrategia y diseño | Solo en `BUSINESS.services` (JSON-LD) y llms.txt; sin landing propia | — | — |

Necesidades del formulario (`LEAD_NEED_LABELS`): App móvil · Software de gestión o ERP · Integración entre programas · Web corporativa o tienda online · Aún no lo tengo claro. Fase (`LEAD_STAGE_LABELS`): Es una idea · Sé lo que necesito · Ya existe y hay que mejorarlo o conectarlo. Presupuesto (solo opciones del formulario, NO precios): <5.000 € · 5-15 k · 15-40 k · >40 k · Aún no lo sé.

### 2.3 Proyectos y casos [`packages/shared/src/projects.ts` — 31 proyectos; imágenes en `apps/desktop/public/projects/`, vídeos en `public/projects_video/`]

Resumen: 31 proyectos · 24 indexables (con caso) · 7 `noindex` · **9 con imagen placeholder (7 si se usan los mockups de `apps/pablo`, §2.3b)** · 7 con vídeo (`.webm`) · 13 con web pública. **Permiso de uso: no existe ningún campo ni nota de permiso en el repo.** Por defecto se asume que los 13 con URL pública y los citados con nombre en landings/reseñas son mostrables; el resto (apps internas de Trading, Autoescuela GTI, Timetracker, Nautirent, Lift…) → **PENDIENTE DE CONFIRMAR CON EL CLIENTE** si se pueden nombrar y enseñar captura.

| slug | Proyecto | Tipo | Sector | Año | Qué se hizo (descripción ES) | Resultado | Imagen | URL / localidad | SEO |
|---|---|---|---|---|---|---|---|---|---|
| autoescuela-gti | Autoescuela GTI | Aplicación Web | Autoescuela | 2024 | ERP a medida para una autoescuela: matrículas, prácticas, exámenes y flota de coches, con una app móvil para que los alumnos sigan sus clases. | El ecosistema ERP + app móvil digitalizó de punta a punta la gestión de la autoescuela, multiplicando por 10 los trámites que alumnos y profesores resuelven sin pasar por | autoescuelagti.webp | sin URL pública | indexable |
| lift | Lift | Aplicación Móvil | Trading | 2024 | App propia para la comunidad de traders de Lift, antes repartida en grupos de Telegram: chats, perfiles y conexión en tiempo real con plataformas. | Trasladar la comunidad de Telegram a una app propia le dio al cliente el control total sobre ella, con toda la actividad centralizada y sincronizada en tiempo real. | **placeholder** | sin URL pública | indexable |
| pbb-porrino | PBB | Aplicación Web | Club deportivo | 2025 | Presencia digital completa para negocio local: web, sistema de reservas y estrategia SEO local que genera tráfico orgánico constante. | Pasar la inscripción y el cobro a la web acabó con el papeleo en ventanilla, multiplicando las altas gestionadas sin intervención administrativa. | pbb-porrino.webp + vídeo | https://www.porrinobaloncestobase.com/ · O Porriño | indexable |
| true-trading-app | True Trading App | Aplicación Móvil | Trading | 2024 | App móvil para un equipo de trading: chats, grupos y perfiles propios, conectada en tiempo real a plataformas externas para dejar atrás Telegram. | Centralizar la operativa en una sola app eliminó la dispersión entre Telegram y otras herramientas: el equipo dejó de salir de la app para trabajar, con toda la actividad | truetrading.webp | sin URL pública | indexable |
| nautirent | Nautirent | Aplicación Web | Náutica | 2024 | Web de alquiler de embarcaciones conectada al software de gestión de la flota: disponibilidad en tiempo real y reservas online sin llamadas. | El sistema de reservas conectado a la gestión interna eliminó los huecos de disponibilidad desactualizada y multiplicó el volumen de reservas cerradas online sin interven | **placeholder** | sin URL pública | indexable |
| ticketera-la-fabrica | Ticketera La Fábrica | Aplicación Web | Ocio y eventos | 2024 | Venta de entradas online para La Fábrica, recinto de eventos de Redondela: perfil con historial de compras y aforo gestionado en tiempo real. | La venta de entradas online sustituyó a la taquilla física como canal principal, multiplicando las entradas vendidas sin colas ni gestión manual. | **placeholder** | https://www.lafabricaredondela.es/ · Redondela | indexable |
| musa | Musa / Night Club | Aplicación Web | Hostelería y ocio nocturno | 2024 | Web sensorial para restaurante con reservas integradas, menú interactivo y SEO local. Reservas online +40%. | La venta de entradas con perfil de usuario elevó las reservas online un 40%, reduciendo la dependencia de la taquilla y de WhatsApp para gestionar el acceso. | musa.webp + vídeo | https://www.musavigo.es/ · Vigo | indexable |
| xaulabs | XauLabs | Aplicación Móvil | Trading | 2023 | Aplicación multiplataforma para iOS y Android que busca gamificar el proceso de aprendizaje en el mundo del trader. | La gamificación del aprendizaje multiplicó el compromiso de los usuarios con el contenido formativo, convirtiendo un proceso tradicionalmente árido en uno con progreso vi | **placeholder** | sin URL pública | indexable |
| kairos-futures | Kairos Futures | Aplicación Web | Trading | 2024 | Plataforma de formación en trading con catálogo de cursos, progreso de cada alumno y un asistente de IA integrado que resuelve sus dudas. | El asistente de IA integrado redujo las consultas repetitivas al equipo y multiplicó el ritmo al que los alumnos completaban los cursos. | kairos.webp | sin URL pública | indexable |
| timetracker | Timetracker | Aplicación Móvil | Industrial | 2023 | Software a medida para una PYME que buscaba la gestión completamente digital de las horas de sus empleados. | La digitalización del control horario eliminó el papel y los errores de fichaje manual, dando a la dirección visibilidad en tiempo real sobre la jornada de toda la planti | **placeholder** | sin URL pública | indexable |
| fang-tours | Fang Tours | Landing Page | Turismo | 2024 | Plataforma de reservas con calendario interactivo, pasarela de pago y gestión de tours en tiempo real. | La reserva online sustituyó casi por completo al teléfono como canal de contratación, multiplicando el flujo de tours reservados sin intervención manual. | fang-tours.webp + vídeo | sin URL pública | indexable |
| pro-lift-formacion | Formación PRO Lift | App de Escritorio | Formación | 2024 | App de escritorio para vender cursos de formación propios: acceso solo para alumnos que han pagado y bloqueo de grabación y capturas de pantalla. | Bloquear la grabación y las capturas permitió vender formación de alto valor sin miedo a la piratería, dando al cliente un canal de venta de cursos totalmente controlado. | **placeholder** | sin URL pública | indexable |
| licentia | Licentia Marketplace | Web | Tienda online | 2024 | Marketplace de licencias de software con entrega automática tras la compra y catálogo por tipo de producto, sin gestionar cada pedido a mano. | La automatización de la entrega de licencias tras la compra eliminó la gestión manual de cada pedido, multiplicando el volumen de ventas sin intervención del equipo. | licentia.webp | https://www.licentia.pro/ | indexable |
| samoa | Samoa Café | Aplicación Web | Hostelería | 2024 | Identidad de marca completa desde cero: naming, logo, diseño de carta, web con reservas y estrategia de lanzamiento en redes. | La carta en tiempo real —editable al instante y sincronizada con el horario— acabó con las cartas impresas desactualizadas y elevó la percepción de marca de un negocio re | samoa.webp + vídeo | https://www.samoaredondela.com/ · Redondela | indexable |
| true-trading-landing | TT Landing | Landing Page | Trading | 2024 | Case study próximamente. | La landing se convirtió en la puerta de entrada principal de nuevos usuarios a la app, multiplicando los registros captados frente a la difusión exclusiva por redes. | truetrading.webp | sin URL pública | noindex |
| fase | Fase Service Partner | Web | Corporativo | 2024 | Web corporativa para Fase Service Partner pensada para clientes de todo el mundo: contenidos claros por línea de servicio y una imagen sólida. | La nueva web corporativa dotó a la marca de una imagen homogénea y profesional de cara a mercados internacionales, reforzando la confianza desde el primer contacto. | fase.webp | https://www.fasepower.com/ | indexable |
| patricia-avendano | Patricia Avendaño / Diseñadora | Web | Moda | 2024 | Web bilingüe para una diseñadora de moda nupcial consolidada internacionalmente —más de 100 tiendas en España y presencia en México, Japón y Europa— con lookbook interact | La web posicionó a la diseñadora como una figura consolidada del sector, combinando su trayectoria con una presentación bilingüe de nivel editorial. | patricia-avendano.webp + vídeo | https://www.patricia-avendano.com/ | indexable |
| koopey | Koopey | E-commerce | Moda | 2024 | Tienda online con capa en tiempo real (React, Node.js, WebSocket) para Koopey, la marca de moda para hombre y mujer que se volvió viral a nivel nacional en su lanzamiento | La nueva tienda le dio a la marca de ropa un canal de venta directo propio, multiplicando el volumen de pedidos online frente a vender exclusivamente por redes sociales. | koopey.webp + vídeo | https://koopeyclub.com/ | indexable |
| paris-de-noia | París de Noia | Web | Orquesta | 2024 | Web para París de Noia, una de las orquestas más solicitadas y reconocidas del circuito de verbenas gallego, fundada en 1957. | El calendario de conciertos integrado en la web se convirtió en la referencia del público para seguir la agenda, sustituyendo el aviso disperso por redes sociales. | parisdenoia.webp | https://www.parisdenoia.es/ · Noia | indexable |
| almudena-muhle | Almudena Muhle | Web | Interiorismo | 2025 | Web elegante para un estudio de diseño de interiores que presenta proyectos como historias inmersivas. | La narrativa inmersiva de cada proyecto elevó la percepción de marca del estudio, generando consultas de clientes de mayor nivel que las captadas antes solo por redes. | almudena-muhle.webp + vídeo | https://www.almudenamuhle.com/ | indexable |
| cliche | C L I C H É | E-commerce | Tienda online | 2024 | Tienda Shopify a medida para la marca C L I C H É: checkout rápido y sin fricción, catálogo preparado para crecer e identidad visual coherente. | El paso a una tienda Shopify a medida ordenó el catálogo y multiplicó el volumen de pedidos gestionados sin intervención manual. | cliche.webp | https://www.clichespain.com/ | indexable |
| canelita | Canelita | E-commerce | Tienda online | 2024 | Tienda online en Shopify para Canelita, comercio de Redondela: catálogo, checkout optimizado y un canal de venta propio además de la tienda física. | La tienda Shopify le dio a la marca un canal de venta propio, multiplicando los pedidos frente a la venta exclusivamente presencial. | canelita.webp | https://canelitaredondela.es/ · Redondela | indexable |
| nabi | Nabi Cosmética | E-commerce | Cosmética | 2024 | Case study próximamente. | La tienda Shopify le dio a la marca de cosmética un canal de venta directo al consumidor, multiplicando el volumen de pedidos online. | nabi.webp | sin URL pública | noindex |
| cachadas | Cachadas | E-commerce | Tienda online | 2024 | Case study próximamente. | El paso a Shopify le dio a la marca un canal de venta propio, multiplicando el volumen de pedidos gestionados online. | cachadas.webp | sin URL pública | noindex |
| ertuned | ERTuned | Web | Automoción | 2024 | Case study próximamente. | La landing puso en valor el trabajo técnico del taller ante nuevos clientes, generando más consultas cualificadas a través del canal de contacto. | ertuned.webp | sin URL pública | noindex |
| san-jose | San José | Landing Page | Inmobiliaria | 2023 | App móvil sencilla para una inmobiliaria que muestra su catálogo de propiedades. | La app le dio a la inmobiliaria un escaparate de propiedades pensado para móvil, facilitando que los clientes potenciales navegaran el catálogo y contactaran directamente | **placeholder** | sin URL pública | indexable |
| cerveceria-equs | Cervecería Equs | Web | Hostelería | 2024 | Landing para una cervecería artesana: el carácter de su cerveza, ubicación y contacto claros, y una presencia propia más allá de las redes. | La landing le dio a la cervecería una presencia digital propia, mejorando la primera impresión de clientes que antes solo la conocían por redes sociales. | equs.webp | https://www.cerveceriaequs.es/ | indexable |
| fisioterapia-noia | Fisionorte | Web | Fisioterapia | 2024 | Landing para Fisionorte, clínica de fisioterapia en Noia: una presentación cercana y profesional, con contacto y ubicación siempre a mano. | La landing le dio a la clínica una presencia digital profesional, facilitando que nuevos pacientes encontraran y contactaran con el centro. | fisionorte.webp | sin URL pública · Noia | indexable |
| ratsquad | Ratsquad | Web | — | 2024 | Case study próximamente. | La landing le dio a la marca una presencia digital con personalidad propia, reforzando su identidad frente a la competencia del sector. | **placeholder** | sin URL pública | noindex |
| roots | Roots | Web | — | 2024 | Case study próximamente. | La landing le dio a la marca una imagen digital coherente con su identidad, mejorando la primera impresión de los visitantes que llegaban desde redes. | roots.webp | sin URL pública | noindex |
| marisa-gamez | Marisa Gámez | Web | — | 2024 | Case study próximamente. | La landing ordenó la presencia digital de la marca personal, dando una primera impresión profesional a quien la busca online. | **placeholder** | sin URL pública | noindex |

Resultados con dato cuantificado en el repo: solo **Autoescuela GTI (x10 trámites sin pasar por secretaría)**. El resto son cualitativos. Hay descripciones/briefs completos (`briefEs`, `resultEs`) en el archivo para las fichas.

#### 2.3b Mockups nuevos de `apps/pablo` cruzados con `projects.ts`

Origen: `apps/pablo/public/projects/*.webp` (8 mockups, 31-123 KB, 1066-1800 px) + textos en `apps/pablo/src/data/work.ts` (cuerpo narrativo, `kind`, `stack`, año 2026 salvo Patricia 2024). Vista previa en `pablo-mockups/_montage.png`. `apps/pablo` es otro proyecto Vercel: **no comparte `public/`**.

| Mockup (pablo) | Tamaño | Qué muestra | Proyecto en `projects.ts` | Estado | Imagen actual en desktop | ¿Cuál usar? |
|---|---|---|---|---|---|---|
| `trading-app.webp` | 1800x1201 | iPhone con gráfico XAU/USD, velas y menú de app | **Ambiguo**: `true-trading-app`, `xaulabs` (XAU/USD, gamificación de aprendizaje) o `lift` (comunidad que dejó Telegram). El texto de `work.ts` («comunidad en un grupo de mensajería», «formación dentro», TradingView/Supabase) encaja con los tres | **Coincide, pero hay que decidir a cuál** — PENDIENTE DE CONFIRMAR CON EL CLIENTE | `true-trading-app` = `truetrading.webp` (captura); `xaulabs` y `lift` = placeholder | **Mockup**: es la única imagen real de una app de trading en móvil y rellena un placeholder |
| `autoescuela.webp` | 1800x1009 | iPhone con la app del alumno («Tu formación», próxima clase) | `autoescuela-gti` (la app de alumnos) | **Coincide** | `autoescuelagti.webp` = pantalla de login del ERP | **Mockup** para tarjeta y hero (enseña la app que el alumno usa, la captura del login no vende); conservar la captura como segunda imagen del ERP |
| `fase.webp` | 1800x1011 | iMac con la web «WE ARE FASEPOWER» sobre astillero | `fase` («Fase Service Partner») | **Coincide** | `fase.webp` 1600x912 (captura) | **Mockup** (más contexto y 1800 px); el nombre público difiere: `work.ts` dice «Fasepower», `projects.ts` «Fase Service Partner» → unificar |
| `la-fabrica.webp` | 1800x1198 | MacBook con la web de agenda y entradas «La Fábrica y Paraíso» | `ticketera-la-fabrica` (hoy **placeholder**) | **Coincide y resuelve un placeholder** | `placeholder.webp` | **Mockup** |
| `cliche.webp` | 1800x1350 | MacBook con portada en vídeo/lookbook de moda | `cliche` | **Coincide** | `cliche.webp` 1600x948 | **Mockup** (ratio 4:3; recortar a 16:10 en tarjeta) o captura si se quiere ver la UI |
| `patricia-avendano.webp` | 1066x1600 | MacBook sobre sofá de cuero con la web de novias | `patricia-avendano` | **Coincide** | `patricia-avendano.webp` 1024x631 (captura) + vídeo | **Mockup vertical** para ficha móvil (4:5, encaja en pantalla estrecha); captura horizontal para tarjeta de lista |
| `biyoga.webp` | 1800x1013 | MacBook con web editorial oscura de yoga («Habita la práctica») | **NO existe** en `projects.ts` ni en el sitemap | **NUEVO** — hay que añadir proyecto (slug, brief, resultado) y permiso | — | **Mockup** (única imagen) |
| `true-trading.webp` | 1246x1600 | iPhone sobre bloque de hormigón con splash (monograma serif) | `true-trading-app` (o `true-trading-landing`, `noindex`) | **Coincide** (splash de la app) | `truetrading.webp` (captura reutilizada por dos proyectos) | **Mockup vertical**; el texto de `work.ts` es meta («pantalla de carga») → no sirve como descripción de caso |

Resumen: **7 coinciden con `projects.ts`, 1 es nuevo (Biyoga)**; 2 rellenan un placeholder (La Fábrica, y Trading App si se asigna a XauLabs/Lift). Con los mockups, los placeholders bajan de 9 a 7 (8 si se confirma Trading App en un proyecto sin imagen, y 7 con La Fábrica) y los 7 proyectos con mejor imagen pasan a tener una pieza coherente de portfolio para la lista móvil.

Texto de `work.ts` ≠ texto de `projects.ts`: `work.ts` añade afirmaciones que NO están en el repo de la web principal y no se pueden usar como copy sin confirmación — «web de 2012» (Fasepower), «el teléfono de la oficina dejó de sonar» (Autoescuela), «web bilingüe», «venta de entradas… cuenta atrás» (La Fábrica), «checkout propio» (Cliché), «reservas por WhatsApp y horarios en un PDF» (Biyoga), stacks (Supabase, TradingView, Shopify, CMS). Años 2026 vs 2024 en `projects.ts`. → **PENDIENTE DE CONFIRMAR CON EL CLIENTE** antes de portarlos a `brief/result`. Mientras, usar los `descriptionEs`/`briefEs`/`resultEs` de `projects.ts`.

### 2.4 Reseñas [`apps/desktop/src/data/testimonials.ts` — 22, todas 5/5, textos de Google]

La columna "Respalda" es la landing SEO donde ya se cita (cada reseña se cita en una sola); servicio inferido por proyecto/landing, no hay campo `service` en los datos.

| id | Autor | Proyecto/etiqueta | Texto (ES) | Respalda |
|---|---|---|---|---|
| almudena-muhle | Almudena Muhle | ALMUDENA MUHLE | Increíble trabajo con mi página web. Desde el primer momento entendió lo que necesitaba y supo plasmarlo a la perfección. Sin duda lo recomiendo al 100%. | diseno-web-vigo |
| ivan-matas | Iván Matas | CLIENTE — 2026 | Pablo es un completo crack. Calidad sublime y en tiempo récord, ajustándose al 100% a mis necesidades y con un trato de 10. Sin duda volvería a repetir, me arrepentiría de no haber puesto mi web en sus manos. | diseno-web-vigo |
| yonday | YondayX | KAIROS FUTURES | Gran experiencia trabajando con Action. Escuchó y dedicó tiempo a entender lo que pedía. Su trabajo es impecable y supo plasmar justo lo que tenía en mente para la tienda de puntos de Kairos Future. | desarrollo-de-aplicaciones-galicia |
| samuel-flores | Samuel D. Flores | NAUTIRENT | 100% responsable, una elegancia la web que nos hizo. Muy amable, siempre atento y eficiente. | software-a-medida-vigo |
| noa-martinez | Noa Martínez | CLIENTE | Solo dos palabras: PROFESIONALIDAD y RAPIDEZ. Soñé con mi página web y Pablo lo hizo realidad, superando incluso las expectativas. | (sin landing) |
| pablo-r | Pablo R. | LOCAL GUIDE · GOOGLE | Excelente experiencia. Desde el primer momento demostraron profesionalismo y un conocimiento profundo. Cumplieron todos los plazos acordados y destaca la atención al detalle. | desarrollo-de-aplicaciones-pontevedra |
| nabi-nabi | Nabi Nabi | RESEÑA DE GOOGLE | Ha sido un placer trabajar con ellos. Me ayudaron en todo momento y la web ha quedado justo como quería. Destaco su profesionalidad y rapidez. Sin duda los recomendaría. | tienda-online-vigo |
| ratsquad | #ratsquad | RESEÑA DE GOOGLE | Muy contento con el trabajo! Ha entendido perfectamente lo que necesitábamos y lo ha llevado a otro nivel. La web va rápida, se ve profesional y todo funciona perfecto. 100% recomendable. | desarrollo-web-vigo |
| carla-hermida | Carla Hermida | RESEÑA DE GOOGLE | Los recomiendo encarecidamente. Son cercanos, flexibles y siempre están a disposición del cliente, antes y después de la puesta en marcha de nuestra página web. | desarrollo-web-vigo |
| pablo-martinez-lamas | Pablo Martínez Lamas | RESEÑA DE GOOGLE | Súper contentos con el trabajo. Desde el primer momento, súper atentos y cercanos. | desarrollo-web-pontevedra |
| rodri-vegas | Rodri Vegas | RESEÑA DE GOOGLE | Si estás buscando un servicio serio y una atención al cliente buena, esta es tu empresa. | agencia-desarrollo-web-galicia |
| carlos-alonso | Carlos Alonso | LOCAL EN REDONDELA | Impresionante. Tenemos un local en Redondela y nos creó la página web; el trato y la gestión fueron de 10, totalmente recomendable. | desarrollo-web-redondela |
| adrian-rodriguez | Adrián Rodríguez | PARIS DE NOIA | Contratamos sus servicios para actualizar la página web de Paris de Noia y la han dejado perfecta, con un toque súper moderno y actual. Trabajan impecablemente. | agencia-desarrollo-web-galicia |
| julio-walker | Julio Walker | RESEÑA DE GOOGLE | Tienen solución para literalmente todo, no me he topado con nadie tan profesional en mi vida. 100% recomendable. | software-a-medida-vigo |
| fangfamily | fangfamily.3 | RESEÑA DE GOOGLE | Todo perfecto, Pablo un chico muy profesional y amable, muy recomendable!!! | desarrollo-de-aplicaciones-galicia |
| dominik-saworski | Dominik Saworski | RESEÑA DE GOOGLE | Pablo es muy bueno y rápido, disponible en cualquier momento y siempre listo para ayudar! | desarrollo-de-aplicaciones-vigo |
| sleepy | Sleepy | RESEÑA DE GOOGLE | La profesionalidad y la atención al cliente es excepcional. Personalmente, mi empresa ha mejorado en un 200% tras los servicios que me han brindado. | (sin landing) |
| eduardo-castro | Eduardo Castro Avendaño | RESEÑA DE GOOGLE | Rápido, resolutivo y con ganas de sacar el máximo potencial, ha renovado la imagen de mi negocio gracias a una web limpia, moderna y dinámica, totalmente recomendable! | desarrollo-web-pontevedra |
| odiseo | Odiseo | RESEÑA DE GOOGLE | Pablo resolvió todas mis dudas y me ayudó en lo que necesitaba. Muchísimo mejor de lo esperado. | desarrollo-de-aplicaciones-pontevedra |
| nuria-balaguer | Nuria Balaguer | RESEÑA DE GOOGLE | Gran profesional, 100% recomendado. | desarrollo-web-redondela |
| katherine-tovar | Katherine Tovar & Solarte | RESEÑA DE GOOGLE | Muy buen trabajo, confiable y responsable. Muy feliz con el resultado! | tienda-online-vigo |
| rapeal-john | Rapeal John | APP EN VIGO | Contratamos a Action Development para desarrollar nuestra app en Vigo y el resultado ha sido espectacular. Pablo entendió desde el primer día lo que necesitábamos. | desarrollo-de-aplicaciones-vigo |

Notas de uso veraz: «Sleepy» afirma «mi empresa ha mejorado un 200 %» (opinión del cliente, no usar como cifra propia); Iván Matas/Noa Martínez/otros mencionan «Pablo» (persona real; ok si se cita textualmente); `#ratsquad`, `fangfamily.3` son alias de Google. Las reseñas de app: Rapeal John (app en Vigo), Dominik Saworski, Pablo R. (plazos cumplidos), Odiseo, Yonday (Kairos), Julio Walker («solución para todo»), Samuel Flores (Nautirent).

### 2.5 Proceso de trabajo [`data/landings.ts`, `data/ads-landings.ts`]

Versión corta (`/hablemos/*`, la que conviene a móvil):
1. **Reunión de definición** (en Rúa Colón o por videollamada): usuarios, pantallas clave y alcance de la primera versión.
2. **Propuesta cerrada**: alcance por escrito, qué entra en la v1 y qué puede esperar (software: cerrada por módulo).
3. **Desarrollo con entregas**: prototipo navegable antes de programar; versiones de prueba en tu móvil.
4. **Lanzamiento y mantenimiento**: publicación en App Store/Google Play (cuentas a nombre de la empresa), seguimiento los primeros días, mantenimiento.
Respuesta prometida: «te respondemos en 24 horas con los siguientes pasos» (existe en copy actual; **PENDIENTE DE CONFIRMAR** que se sostiene operativamente).

### 2.6 FAQs [por landing: 5-6 cada una; campaña: 5 por oferta]

Las 50+ FAQs están en `landings.ts` (10 landings) y `ads-landings.ts` (2 ofertas). Las reutilizables en móvil (ya redactadas y veraces):
- Precio: «¿Cuánto cuesta una app?» / «¿Cómo se presupuesta un software a medida?» / «¿Cuánto cuesta una web a medida?» → depende de pantallas, backend, integraciones; propuesta cerrada; «No publicamos tarifas».
- «¿Se puede empezar por una versión pequeña?» → «Sí, y casi siempre lo recomendamos».
- «¿iOS, Android o las dos?» → las dos, una base de código (React Native).
- «¿Os encargáis de publicarla?» → sí.
- «¿Podemos vernos en persona?» → sí, en Rúa Colón 20; resto en remoto.
- Ya tengo algo: «Ya tengo una app que no funciona bien» (auditamos y decimos con franqueza si compensa arreglar o rehacer), «¿Podéis rescatar una app que otro proveedor dejó a medias?», «¿Podéis conectar mi ERP actual…?», «¿Qué pasa con mi web actual y su posicionamiento?» (redirecciones 301).
- «¿Quién lo mantiene?» → nosotros, si quieres; va en la propuesta.
- «¿Trabajáis solo con empresas de Vigo?» → no, pero es donde más trabajamos; presencial hasta O Porriño/Redondela, resto remoto.
- Sector público: «Action es la marca comercial de Alcasi Systems, S.L. (CIF B72910664)… nuestras condiciones contemplan el sector público».

### 2.7 Landings SEO (fase 2, NO se tocan) [`apps/desktop/src/data/landings.ts`]

| Ruta | Grupo | `<title>` (sin « — Action») | H1 | Casos | FAQs | Palabras aprox. |
|---|---|---|---|---|---|---|
| /desarrollo-de-aplicaciones-vigo | servicio | Desarrollo de Apps en Vigo / Aplicaciones iOS y Android | Desarrollo de aplicaciones en Vigo | autoescuela-gti, xaulabs, true-trading-app, san-jose | 5 | ~1032 |
| /desarrollo-web-vigo | servicio | Desarrollo Web en Vigo / Webs y Aplicaciones a Medida | Desarrollo web en Vigo | musa, pbb-porrino, nautirent, fang-tours | 5 | ~809 |
| /diseno-web-vigo | servicio | Diseño de Páginas Web en Vigo / Webs con Identidad Propia | Diseño web en Vigo | samoa, almudena-muhle, patricia-avendano, cerveceria-equs | 5 | ~792 |
| /tienda-online-vigo | servicio | Diseño de Tiendas Online en Vigo / Shopify y Ecommerce | Diseño de tiendas online en Vigo | canelita, koopey, cliche, licentia | 5 | ~810 |
| /software-a-medida-vigo | servicio | Empresa de Software a Medida en Vigo / ERP e Integraciones | Software a medida en Vigo | autoescuela-gti, timetracker, nautirent, pro-lift-formacion | 6 | ~875 |
| /desarrollo-de-aplicaciones-pontevedra | zona | Desarrollo de Aplicaciones en Pontevedra / Apps a Medida | Desarrollo de aplicaciones en Pontevedra | pbb-porrino, nautirent, fang-tours, kairos-futures | 5 | ~719 |
| /desarrollo-web-pontevedra | zona | Desarrollo y Diseño Web en Pontevedra / Webs a Medida | Desarrollo y diseño web en Pontevedra | samoa, ticketera-la-fabrica, pbb-porrino | 5 | ~826 |
| /desarrollo-web-redondela | zona | Páginas Web en Redondela / Diseño y Desarrollo Web | Diseño y desarrollo web en Redondela | samoa, ticketera-la-fabrica, canelita | 5 | ~747 |
| /desarrollo-de-aplicaciones-galicia | zona | Desarrollo de Aplicaciones en Galicia / Apps y Plataformas | Desarrollo de aplicaciones en Galicia | xaulabs, kairos-futures, pro-lift-formacion, lift | 5 | ~729 |
| /agencia-desarrollo-web-galicia | zona | Agencia de Desarrollo Web en Galicia / Webs a Medida | Agencia de desarrollo web en Galicia | paris-de-noia, fisioterapia-noia, fase, patricia-avendano | 5 | ~765 |

Palabras clave objetivo: las del `title`/H1 + `keywords` de `apps/mobile` layout: «desarrollo de aplicaciones Vigo», «desarrollo de apps Vigo», «desarrollo de aplicaciones móviles Vigo», «desarrollo web Vigo», «diseño web Vigo», «desarrollo de aplicaciones Pontevedra», «desarrollo web Pontevedra», «agencia desarrollo web Galicia». Auditoría completa en `docs/seo-auditoria-2026-10.md` (foco: apps + Vigo/Pontevedra). Redirects vigentes: `/diseno-web-pontevedra` → `/desarrollo-web-pontevedra` (301), `/reviews` → `/resenas` (301).

Landings de campaña `/hablemos/app` y `/hablemos/software` [`data/ads-landings.ts`]: H1 «Desarrollo de apps para empresas, de la idea a App Store y Google Play» / «Software a medida e integraciones con tu ERP, sin tirar lo que ya funciona»; 3 bullets, casos (GTI, True Trading / GTI, Timetracker, Nautirent, Licentia), 2 reseñas cada una, 4 pasos, 5 FAQs, CTA «¿Tienes una app en la cabeza?» / «¿Qué proceso de tu empresa sigue en Excel?». `noindex,follow`, canonical propio, fuera de sitemap, **sin bloquear en robots** (AdsBot). `/hablemos/gracias` noindex.

### 2.8 Blog (fase 2, NO se toca) [Firestore `posts`, publicados; 15 posts]

| URL | Título | Publicado | Palabras |
|---|---|---|---|
| /blog/app-para-empleados-partes-fichajes | App para empleados: partes, fichajes y pedidos | 2026-10-02 | ~1.400 |
| /blog/como-salir-en-google-maps-vigo | Cómo salir en Google Maps con un negocio en Vigo | 2026-10-02 | ~1.230 |
| /blog/como-posicionar-una-app-aso | Cómo posicionar una app en App Store y Google Play | 2026-10-02 | ~1.330 |
| /blog/cuanto-cuesta-mantener-una-app | Cuánto cuesta mantener una app y qué pasa si no lo haces | 2026-10-02 | ~1.380 |
| /blog/mvp-de-una-app | MVP de una app: qué incluir en la primera versión | 2026-10-02 | ~1.210 |
| /blog/publicar-app-app-store-google-play | Publicar una app en App Store y Google Play: coste y plazos | 2026-10-02 | ~1.230 |
| /blog/como-elegir-agencia-desarrollo-web-galicia | Cómo elegir una agencia de desarrollo web en Galicia | 2026-09-29 | ~1.190 |
| /blog/app-o-aplicacion-web-pwa | ¿App o aplicación web? Cuándo te basta con una PWA | 2026-09-29 | ~1.375 |
| /blog/cuanto-cuesta-desarrollar-una-app | ¿Cuánto cuesta desarrollar una app? Qué decide el precio | 2026-09-29 | ~1.470 |
| /blog/shopify-o-tienda-online-a-medida | Shopify o tienda online a medida: cómo decidir | 2026-09-29 | ~1.220 |
| /blog/como-hacer-que-tu-web-tenga-visitas-y-convierta | Cómo hacer que tu web tenga visitas y convierta | 2026-09-23 | ~485 |
| /blog/importancia-ux-ui-apps-moviles | Por qué el UX/UI es la decisión más importante en una app móvil | 2026-09-23 | ~480 |
| /blog/apps-nativas-o-multiplataforma | Apps nativas o multiplataforma: cómo decidir sin equivocarte | 2026-09-08 | ~610 |
| /blog/senales-web-pierde-clientes | Cinco señales de que tu web está perdiendo clientes | 2026-08-22 | ~720 |
| /blog/que-mirar-antes-de-contratar-agencia-vigo | Qué mirar antes de contratar una agencia de desarrollo en Vigo | 2026-07-30 | ~650 |

Categorías vistas: «Desarrollo de apps» y afines. **Sin fecha visible** por decisión del cliente (solo en JSON-LD). Los posts de coste («¿Cuánto cuesta desarrollar una app?», «…mantener una app») NO contienen cifras en euros (comprobado): explican de qué depende el precio.

### 2.9 HUECOS: lo que una web que vende necesita y no existe

| Hueco | Estado hoy | Impacto | Qué aportar |
|---|---|---|---|
| **Precios orientativos o «desde»** | Inexistente por política («no publicamos tarifas»). Solo hay rangos como opciones del formulario (<5k…>40k €). | Alto: «¿cuánto cuesta?» es la objeción nº 1 y hoy se contesta con «depende». | Decisión del cliente: ¿«desde X €» por servicio, o rangos «proyectos típicos entre A y B»? Hasta entonces: PENDIENTE. |
| **Plazos típicos** | No hay ninguna cifra (solo reseñas: «tiempo récord», «cumplieron plazos»). | Alto. | Semanas típicas por tipo (web, tienda, app v1, módulo ERP). PENDIENTE. |
| **Resultados cuantificados** | Solo GTI (x10). | Medio-alto. | 3-5 métricas reales más (ventas, reservas, horas ahorradas) con permiso. |
| **Permisos de uso de proyectos/logos** | Sin constancia en el repo. | Medio (legal y confianza). | Lista de clientes que autorizan nombre + captura + cita. |
| **9 imágenes de proyecto = placeholder (7 tras los mockups de pablo)** (Lift, Nautirent, La Fábrica, XauLabs, Timetracker, Formación PRO Lift, San José, Ratsquad, Marisa Gámez) | Pantalla vacía en la ficha | Medio | Capturas reales o mockups; si no, esos casos no se muestran en la lista móvil. |
| **7 fichas `noindex`** (Nabi, Cachadas, ERTuned, TT Landing, Ratsquad, Roots, Marisa) | Sin brief/result | Bajo | Redactar brief/result los activa. |
| **Reseñas con foto/logo y empresa** | Solo nombre + etiqueta; avatares genéricos | Medio | Cargo/empresa o permiso para logo. |
| **Garantías/condiciones** | No hay: qué pasa si el cliente no queda satisfecho, soporte post-entrega con SLA, propiedad del código | Medio | Texto breve confirmado. PENDIENTE. |
| **Respuesta «24 horas»** | Existe en copy, no verificado | Medio | Confirmar horario real de atención. |
| **Reconciliar nº de reseñas (22 vs 23)** | Inconsistente | Bajo | Una única fuente (`testimonials.length` o GBP). |
| **Sectores / tipo de cliente objetivo** | Implícito | Bajo | Frase de «para quién somos» (pymes, hostelería, clubes, industria). |
| ~~Fotos de equipo/oficina~~ | **Descartado por el cliente** | — | — |

Qué SÍ está (no es hueco): oficina real con dirección, CIF y registro mercantil, 22 reseñas 5/5, 24 casos indexables, proceso en 4 pasos, primera reunión gratis (confirmado), propuesta cerrada por escrito, mismo equipo de principio a fin.

---

## 3. Arquitectura nueva para vender (dueño de pyme no técnico)

### 3.1 Principios

1. Una pregunta por pantalla: «¿Qué necesitas?» → «¿Cómo te llamo?».
2. CTA primario SIEMPRE visible: **«Cuéntanos tu proyecto»** → formulario corto (`LeadForm`, ya existe, 2 pasos). CTA secundario: **WhatsApp** (único canal telefónico). Email = terciario en el pie.
3. Cero juego, cero 3D, cero scroll-hijacking en móvil. Peso objetivo por ruta ≤ 300 KB JS y LCP < 2,5 s con throttling.
4. Texto indexable VISIBLE (no `sr-only`, no `hidden`): lo que Google lee es lo que se ve.
5. Lima `#c8ff00` como acento (decisión), tokens de `globals.css` de desktop; Space Grotesk; esquinas vivas (convención de desktop).

### 3.2 Mapa de páginas móvil (alcance fase 1)

| URL pública (no cambia) | Hoy en móvil | Móvil v2 | Acción |
|---|---|---|---|
| `/` | `apps/mobile`: juego de palabras/cerveza | **Home de venta** (§3.3) | Reescribir |
| `/servicios` | Hub de landings (texto largo, desktop) | **Servicios** en tarjetas por necesidad (App · Software · Web · Tienda) con enlaces a las 10 landings (conservar TODOS los enlaces) | Rediseñar (fusiona «por servicio / por zona» en una sola página con zona plegada) |
| `/projects` | Pasillo 3D | **Lista de casos** filtrable por tipo; tarjeta = captura + sector + 1 línea + resultado si existe | Reescribir |
| `/projects/[slug]` | Ficha desktop (ok) | Ficha con CTA propio, caso en 3 bloques (Qué nos pidieron / Qué conseguimos / Servicio relacionado), reseña si existe | Rediseñar misma URL |
| `/resenas` | Plaza 3D | **Reseñas** en lista (22, 5,0 en Google) con enlace «Ver en Google» y «Deja tu reseña»; las mejores también en la home | Reescribir |
| `/contact` | Calle 3D | **Contacto**: formulario corto arriba, WhatsApp, email, dirección con mapa (enlace GBP), horario si se confirma | Reescribir |
| `/hablemos/app`, `/hablemos/software` | Ya responsive (modelo a seguir) | Mismo contenido (`ads-landings.ts`), cabecera/pie/tokens del sistema nuevo | Adoptar diseño (primera entrega) |
| `/hablemos/gracias` | Ok | Adoptar diseño | Adaptar |
| 10 landings SEO, `/blog`, `/blog/[slug]`, `/legal/*` | Desktop tal cual | **Sin cambios** (fase 2). Solo cambia la cabecera compartida si se decide (ver riesgo §4.6) | Congelado |
| `/blog` (corcho 3D) | CSS 3D | Sin cambios fase 1 | — |

Desaparecen en móvil: el pasillo 3D, la plaza 3D, la calle 3D, el juego de la home, el carrito/cerveza, el menú vertical rotado, el `ContactPopup` (lo sustituye la barra fija). **No desaparece ninguna URL.**
Se fusionan: «Trabajo + Sobre» de la home mobile → secciones de la home; «Servicios por servicio/por zona» → una página.

### 3.3 Orden de secciones de la home

| # | Sección | Objetivo | Contenido (de dónde sale) |
|---|---|---|---|
| 0 | Cabecera fija | Navegar + convertir | Logo · «Cuéntanos tu proyecto» (primario) · menú hamburguesa (Servicios, Proyectos, Reseñas, Contacto). Mismo componente en TODAS las rutas nuevas. |
| 1 | **Hero** | Decir en 5 s qué hacemos y para quién; empezar el formulario | Titular (§3.4) + subtítulo + `★ 5,0 · 22 reseñas en Google · Rúa Colón 20, Vigo` + paso 1 del formulario («¿Qué necesitas?», 4 opciones) o botón al formulario; WhatsApp secundario |
| 2 | **Qué hacemos, sin jerga** | Que el dueño se reconozca | 4 tarjetas por problema: «Quiero una app», «Mi gestión sigue en Excel» (software/ERP), «Necesito una web que venda», «Quiero vender online» (`BUSINESS.services` + `landings.ts`), cada una enlaza a su landing SEO (enlaces internos conservados) |
| 3 | **Casos reales** | Prueba | 3-4 casos con captura real: Autoescuela GTI (x10), Musa (Vigo), PBB (O Porriño), Samoa/Canelita (Redondela) — los de imagen real; «Ver todos los proyectos» |
| 4 | **Cómo trabajamos** | Quitar miedo al proceso | Los 4 pasos (§2.5) con «primera reunión gratis y sin compromiso» destacada |
| 5 | **Reseñas** | Confianza | 3 reseñas (Almudena Muhle, Rapeal John, Samuel D. Flores) + «Ver las 22 reseñas» + enlace a ficha de Google |
| 6 | **Objeciones** | Resolver dudas antes de contactar | 5 FAQs en `<details>` (§3.6) |
| 7 | **Quiénes somos y dónde** | Cercanía y legitimidad | «Mismo equipo de principio a fin», dirección Rúa Colón 20, mapa (enlace GBP), «Action Development es marca de Alcasi Systems, S.L. · CIF B72910664» |
| 8 | **CTA final** | Cerrar | Formulario completo (o paso 2) + WhatsApp |
| 9 | Pie | Legal y canales | Aviso legal, privacidad, términos, cookies + «Preferencias de cookies» (`LegalLinks`), email, redes |
| — | **Barra fija inferior** | CTA siempre a mano | «Cuéntanos tu proyecto» + icono WhatsApp (patrón de `StickyCta`); se oculta con el formulario en pantalla y con el banner abierto |

### 3.4 Mensajes clave (todo veraz; lo no existente va marcado)

**Propuesta de valor (llano):** «Hacemos las apps, el software y las webs que tu negocio necesita, desde Vigo. Un solo equipo se ocupa de todo, de la primera reunión al mantenimiento, y la primera reunión es gratis y sin compromiso.»
Fuentes: llms.txt («el mismo equipo interno»), landings («quien diseña y programa tu proyecto es quien lo mantiene después»), decisión 3.

**3 titulares alternativos del hero**
1. **«Apps, software y webs a medida para tu negocio, hechas en Vigo»** — el más cercano al `<title>` indexado y a la keyword núcleo.
2. **«Cuéntanos qué te quita tiempo y lo convertimos en una app o un programa a tu medida»** — orientado a dolor (Excel, WhatsApp, papel); respaldado por `landings.ts` (pymes que «siguen resolviendo procesos críticos con hojas de cálculo, papel y grupos de WhatsApp»).
3. **«Tu idea, en tu móvil. Con un equipo de Vigo que te atiende de principio a fin»** — orientado a app y a cercanía.
Subtítulo común: «Primera reunión gratis y sin compromiso. Propuesta cerrada por escrito. ★ 5,0 en Google.»
(No usar «en 24 horas» ni «en X semanas» en el hero hasta confirmarlos.)

**Cómo explicar «software a medida» sin jerga** (base: `/software-a-medida-vigo`, `ads-landings`):
> «Es un programa hecho para cómo trabaja TU empresa, no al revés. Si hoy llevas pedidos, fichajes o matrículas en Excel, papel o WhatsApp, lo convertimos en una herramienta donde cada persona hace su parte y todo llega solo a la oficina. Empezamos por lo que más duele, y lo conectamos con lo que ya usas.»
Prueba: Autoescuela GTI (matrículas, prácticas, exámenes y flota; x10 trámites sin pasar por secretaría), Timetracker (fichaje y panel en tiempo real para una pyme industrial).

**Objeciones y respuesta**

| Objeción | Respuesta (veraz) | Origen / estado |
|---|---|---|
| «¿Cuánto cuesta?» | «Depende de lo que necesites: pantallas, tipos de usuario, conexiones con otros programas. Por eso la primera reunión es gratis y sin compromiso y luego te damos una propuesta cerrada por escrito, con lo que entra y lo que no. Si no encaja en tu presupuesto, te proponemos qué dejar para una segunda fase.» | FAQs de landings + decisión 3. Cifra «desde X €»: **PENDIENTE DE CONFIRMAR CON EL CLIENTE** |
| «¿Cuánto tarda?» | «Empezamos por una primera versión pequeña, que es lo que casi siempre recomendamos, y vas probándola en tu móvil mientras avanzamos.» | FAQ «versión pequeña». Plazo en semanas: **PENDIENTE DE CONFIRMAR CON EL CLIENTE** |
| «¿Y si ya tengo algo?» | «Lo revisamos contigo y te decimos con franqueza si compensa mejorarlo, conectarlo con otra cosa o rehacerlo. No empezamos de cero por empezar.» (si es web: redirecciones 301 para no perder posicionamiento) | FAQs «app que no funciona bien», «rescatar», «web actual» |
| «¿Sois de aquí?» | «Sí: nuestra oficina está en Rúa Colón 20, en Vigo. Tenemos clientes en Vigo, Redondela, O Porriño y Noia y podemos vernos en persona; con el resto de Galicia y España trabajamos en remoto con el mismo método.» | `BUSINESS`, `landings.ts` (Musa Vigo; Samoa/La Fábrica/Canelita Redondela; PBB O Porriño; París de Noia y Fisionorte Noia). Domicilio social en Marín solo en el pie legal. |
| «¿Me va a dejar tirado después?» | «Quien lo hace es quien lo mantiene. El mantenimiento va en la propuesta para que no sea una sorpresa.» | FAQ «¿Quién lo mantiene?» |
| «¿Es fiable?» | 22 reseñas de 5 estrellas en Google, casos con nombre y web pública, CIF y Registro Mercantil visibles. | `testimonials.ts`, `LEGAL_ENTITY` |
| «No sé qué necesito» | Opción «Aún no lo tengo claro» en el formulario + «Cuéntanos qué problema quieres resolver y para quién». | `LEAD_NEEDS` |

---

## 4. Restricciones técnicas y SEO (crítico)

### 4.1 Qué está indexado hoy y desde qué app sale en móvil

- **Sitemap actual: 56 URLs** (`/sitemap.xml`, revalidación horaria): `/`, `/servicios`, `/projects`, `/contact`, `/resenas`, `/blog`, las **10 landings**, **15 posts**, **24 fichas** de proyecto (solo las con caso) y 4 `/legal/*`.
- **`apps/mobile` sirve ÚNICAMENTE `/`** (y assets exclusivos `/3d/`, `/ai-logos/`, `/recursos/`, `/mascot.webm`), vía `apps/desktop/src/middleware.ts` con UA `device.type === "mobile"` y `MOBILE_ZONE_URL`; responde `Vary: User-Agent` y fuerza `X-Robots-Tag: index, follow` (las URLs `*.vercel.app` de la zona llevan noindex).
- **Todo lo demás sale de `apps/desktop` en cualquier dispositivo**, también para Googlebot Smartphone. Por tanto, **hoy Google (mobile-first) indexa para esas rutas el HTML de desktop**: `/projects`, `/resenas`, `/contact` y `/blog` con su contenido real pero oculto/3D; landings, fichas y posts como páginas de texto.
- Home: `<h1>` y nav de enlaces `sr-only` (`SeoIntro.tsx`) — enlaza `/servicios`, 10 landings, `/projects`, `/resenas`, `/blog`, `/contact`, legales. Metadatos en `<head>` gracias a `htmlLimitedBots: /.*/` (NO tocar si se conserva alguna parte de `apps/mobile`).
- No existe **hreflang** ni alternates por idioma (solo español indexable, decisión de negocio). Nada que conservar ahí; no añadir.
- `robots.ts`: permite todo salvo `/api/` y `/admin/`; `/_next/` NO bloqueado; grupo propio para crawlers de IA. `public/llms.txt`: servido por desktop (se reescribe a mobile solo `MOBILE_ONLY_ASSETS`).
- IndexNow clave `ae0fe17c76258830bbabcdaa2a1365de` (`pnpm seo:indexnow` tras cada deploy de contenido).

### 4.2 Qué pasa si una ruta pasa a servirse con otro contenido en móvil

Con indexación mobile-first Google rastrea con **Googlebot Smartphone** y usa **ese** HTML para indexar y rankear. Si `/projects`, `/servicios`, `/resenas`, `/contact`, `/` devuelven en móvil HTML distinto al de hoy:

| Riesgo | Rutas | Severidad en FASE 1 |
|---|---|---|
| Se pierde contenido que hoy está en el HTML (p. ej. el listado de 31 proyectos y las 22 reseñas que viven en `hidden`; los 11 enlaces de `/servicios`) | `/projects`, `/resenas`, `/servicios` | Media. Hoy ese contenido ya es débil (texto visible ~270 car.), un rediseño que lo muestre COMPLETO es mejora. El riesgo es hacerlo menos, no distinto. |
| Se rompe el enlazado interno hacia las 10 landings y 24 fichas | `/`, `/servicios`, `/projects` | **Alta**: las landings solo se descubren desde home (nav sr-only), `/servicios`, sitemap y `llms.txt`. Si la nueva home/servicios no los enlaza visibles, pierden autoridad interna. Conservar los 10 enlaces + todos los de fichas desde `/projects`. |
| Cambia/desaparece `<title>`, meta, canonical, JSON-LD | todas | Alta si se reescriben a mano. Mitigación: **reutilizar las mismas funciones `generateMetadata`/`StructuredData`**, no duplicarlas. |
| Contenido distinto entre bot desktop y móvil | `/` (ya es así hoy con Vary) | Aceptable si `Vary: User-Agent`; cloaking si el HTML móvil fuese ≠ semántica (no lo es). |
| Cache: el CDN sirve HTML móvil a desktop o al revés | todas las rutas rewriteadas | Alta si falta `Vary: User-Agent`. Hoy solo se fija en `/`. Cada ruta rewriteada necesita el header (`next.config.ts` → `headers()`, porque el del middleware lo pisa Next en la rama desktop: gotcha documentado). |
| Tablets, iPad y «Request desktop site» | todas | `device.type==="mobile"` excluye tablets: reciben el 3D pesado. Decidir (PENDIENTE). |
| Desindexación accidental de las **landings, fichas y posts** (fase 2) | 10 + 24 + 15 | **Baja en fase 1** porque no cambian de código. Pasa a ALTA si la cabecera/pie compartida se cambia y quita enlaces, o si el cambio de layout raíz altera sus metadatos. Test de regresión SEO obligatorio (§4.6). |
| Rendimiento: `/projects` y `/resenas` bajan de ~3 MB a <300 KB → mejora Core Web Vitals (señal positiva) | — | Positivo |

Regla de oro: **el HTML que recibe Googlebot Smartphone en cada URL debe contener, como mínimo, el mismo `<title>`, meta description, canonical, JSON-LD, `<h1>` y todos los enlaces internos y textos indexables que hoy**, ahora visibles y sin `sr-only`/`hidden`.

### 4.3 Qué hay que conservar (checklist)

| Elemento | Dónde vive | Cómo conservarlo |
|---|---|---|
| URLs (31 públicas + redirects) | rutas de `apps/desktop/src/app` | Ninguna URL cambia; los 301 de `next.config.ts` se mantienen |
| `<title>` / meta | `HOME_DESCRIPTION` en `app/layout.tsx` (desktop) + `dictionaries.ts` (mobile); `metadata` de cada página; título de ficha = `proyecto — tipo en español [en localidad]` (`projectCategoryLabel`) | Misma cadena; template `« — Action»` en el layout raíz (no duplicar marca) |
| Canonical | relativo por página; `/` canonical fijo `https://actiondev.es` | Idéntico en móvil y desktop |
| Datos estructurados | `components/seo/StructuredData.tsx` (desktop) / `components/StructuredData.tsx` (mobile); `organizationSchema()` en shared (`["Organization","ProfessionalService"]`, `@id` `#organization`, sin `aggregateRating`/`Review`); ficha: `CreativeWork`; landings: Service+FAQPage+BreadcrumbList; `/servicios`: CollectionPage+Breadcrumb | Un único generador compartido. **No reintroducir** `aggregateRating`/`Review` aunque ahora las reseñas sean visibles (política vigente; reconsiderar solo con criterio SEO) |
| hreflang | no existe | no añadir |
| `sitemap.ts` | desktop, revalida cada hora; fichas sin caso excluidas | Sin cambios; `CONTENT_UPDATED` manual → actualizar al lanzar |
| `robots.ts`, `llms.txt` | desktop | Sin cambios; **actualizar `llms.txt`** si cambia la descripción de la home («3D interactive hero» deja de ser cierto en móvil) |
| `noindex` de `/hablemos/*` + SIN bloqueo robots | `hablemos/[oferta]/page.tsx` | Mantener `noindex,follow` y canonical propio en la versión móvil |
| Enlaces legales en TODA ruta (LSSI/RGPD) | `LegalLinks` / `LegalDock` | Toda página móvil nueva lleva pie con `LegalLinks` |
| Idioma | `lang="es"` | Móvil v2 en español; EN opcional **PENDIENTE** (la home mobile actual cambia a inglés por Accept-Language: riesgo de contenido duplicado/mezcla; recomendado ES fijo) |
| Metadatos en `<head>` (no streaming) | `htmlLimitedBots` en mobile (Next 15.5) | En Next 16.3.8 verificar con `curl -A "<UA Googlebot Smartphone>"` que `<title>` cae antes de `</head>` |

### 4.4 Opciones de arquitectura

Contexto decisivo: el desktop no se toca. Los datos de landings (`landings.ts` 1.572 líneas), `ads-landings.ts`, `testimonials.ts`, `LeadForm`, `/api/lead`, `lib/leads/*`, `StructuredData`, `sitemap` y blog (Firestore) **viven en `apps/desktop`**; solo `projects`, `leads`, `analytics` y `seo` están en `packages/shared`.

| | **A — Ampliar `apps/mobile` (Next 15.5) + rewrites** | **B — Rehacer `apps/mobile` en Next 16.3.8** | **C — Árbol móvil dentro de `apps/desktop`** |
|---|---|---|---|
| Idea | Más rutas en la zona mobile; middleware reescribe 7+ rutas por UA | Igual que A pero repo de cero, mismo stack que desktop | Rutas móviles propias (`/m/...` interno) en el mismo proyecto; el middleware ya existente reescribe por UA a ese árbol |
| Aislamiento del desktop | Total (código); pero el middleware de desktop cambia | Total | Medio: mismo proyecto Vercel/deploy y mismo root layout; ruta y bundle separados |
| Datos y metadatos | Hay que extraer `landings`, `ads-landings`, `testimonials`, `LeadForm`, validación y JSON-LD a `shared` (refactor del desktop = lo que no se debe tocar) o duplicarlos (deriva SEO) | Igual | **Importan directamente los mismos módulos**: paridad de title/meta/canonical/JSON-LD por construcción |
| `/api/lead` | Vive en desktop; el navegador está en `actiondev.es` (rewrite) → `fetch('/api/lead')` es mismo origen y el check de `Origin` pasa. Funciona, pero hay que garantizar que el matcher no lo reescriba (hoy excluye `api`) | Igual | Mismo proceso, cero cruce |
| Consentimiento / GTM | `localStorage` compartido por mismo origen (ya ocurre hoy); componentes GTM/Cookie duplicados en cada app (hoy ya lo están) | Igual | Un único `GoogleTagManager` + `CookieConsent` |
| Despliegue | 2 proyectos Vercel, 2 deploys manuales por CLI (ni uno se despliega con push): riesgo de desfase | Igual | Un deploy |
| Assets/CDN | `assetPrefix` hacia otro deployment, 404s de assets ya sufridos (`MOBILE_ONLY_ASSETS`), noindex en URLs vercel.app | Igual | Mismo dominio y assets |
| Riesgo SEO | Rewrite cross-project por cada ruta + `Vary` + `htmlLimitedBots` (15.5) | Menor en metadatos (Next 16), igual en rewrite | `Vary` por ruta; riesgo de que el root layout de desktop (PageTransition/persiana, LegalDock, ContactPopup, SmoothScroll) envuelva el árbol móvil |
| Peso base JS | Controlable (hoy home mobile 1,4 MB por Three) | Controlable | **Línea base actual ~515-530 KB JS en rutas de texto de desktop** (`/servicios`, landings, `/hablemos`): hay que medir qué aporta el root layout; sin sacarlo, el objetivo de <300 KB no se cumple |
| Coste | Alto (extracción + duplicación + 2 ciclos de deploy) | Más alto (reconstrucción + extracción) | **Medio-bajo** |
| Reversibilidad | Media | Media | Alta (apagar la regla del middleware) |
| Desktop sigue idéntico | Sí | Sí | Sí si el árbol `/m` y las exclusiones no cambian rutas existentes |

### 4.5 RECOMENDACIÓN: **C, en su variante «árbol móvil dedicado con rewrite por UA»**

Matiz respecto a la definición del brief: no basta con «hacer responsive» las rutas del desktop. Las pantallas que hay que reemplazar (`/`, `/projects`, `/resenas`, `/contact`) son 3D en desktop y deben seguir siéndolo. Por eso la variante es: **misma URL pública, dos árboles de componentes**, elegido en el middleware que ya existe.

Por qué C y no A/B:
1. **SEO por construcción.** La condición crítica es no perder lo indexado. Con C, `generateMetadata`, `StructuredData`, `landings.ts`, `testimonials.ts` y `projects.ts` se importan, no se copian: el title/meta/canonical/JSON-LD móvil no puede divergir del desktop.
2. **El pipeline de leads es de desktop** (`/api/lead`, Firestore REST, SMTP, ERP, rate limit, `parse.ts`, `LeadForm`, honeypot, `trackLead`). En C se reutiliza sin tocar; en A/B hay que moverlo o llamarlo desde otra zona.
3. **Un solo deploy** en un proyecto donde ya hay desfases entre dos CLI y donde la zona mobile ya dio 404s de assets y noindex heredado.
4. **`/hablemos/*` ya está en desktop** y es el modelo de conversión; la versión nueva comparte datos y lógica con la actual.
5. **Retira `apps/mobile`** (Next 15.5, `htmlLimitedBots`, `MOBILE_ONLY_ASSETS`, Three en la home) en vez de ampliarla; una app menos que mantener.
6. **Reversible**: una variable en el middleware vuelve al estado actual.

Cómo (esqueleto, sin diseñar):
- Árbol interno `apps/desktop/src/app/m/**` (`/m`, `/m/servicios`, `/m/projects`, `/m/projects/[slug]`, `/m/resenas`, `/m/contact`, `/m/hablemos/[oferta]`, `/m/hablemos/gracias`), con `robots: noindex` y canonical a la URL pública por si se accediera directo. Bloqueo de acceso directo a `/m/*` desde desktop (redirect 308 a la URL pública si UA no móvil).
- Middleware: ampliar la lista de rutas (`/`, `/servicios`, `/projects`, `/projects/*`, `/resenas`, `/contact`, `/hablemos/*`) con `rewrite` a `/m/...` **solo si `device.type==="mobile"`** y el flag `MOBILE_V2` (env + cookie/`?mv2=1` para QA en producción antes de abrir al público, por ruta).
- Cabecera `Vary: User-Agent` por ruta en `next.config.ts` (no solo en middleware).
- Root layout: sacar de él lo que no debe cargar el móvil (PageTransition/persiana, `LegalDock`, `ContactPopup`, Lenis) mediante **route groups con layouts raíz independientes** o exclusión por contexto. ESTE es el único punto donde se toca estructura del desktop; los componentes y pantallas desktop no cambian. **Spike de 0,5 día obligatorio antes de empezar** para elegir entre (a) dos layouts raíz `(site)`/`(m)` (mueve carpetas con `git mv`, URLs idénticas) o (b) un wrapper que lea un header `x-mobile` del middleware. Nota: con rewrite, `usePathname()` devuelve la ruta PÚBLICA, así que las exclusiones por pathname existentes (`/hablemos`) no distinguen móvil.
- `apps/mobile`: se deja desplegada como respaldo hasta validar y se retira después (su middleware/`MOBILE_ZONE_URL` se vacía → vuelve al juego 3D de desktop solo si se apaga el flag; **decidir** que el fallback sea la home 3D de desktop o la zona antigua).

Contras asumidos de C: el árbol móvil comparte repo/deploy con el desktop (un error de build afecta a ambos), la línea base de JS del layout raíz debe medirse, y la lógica de elección de árbol añade superficie al middleware. Mitigación: tests e2e (§5) en CI de ambos viewports y despliegue por ruta con flag.

Alternativa si el cliente prohíbe tocar `layout.tsx` raíz: **B**, con la extracción de datos como primer paquete (coste mayor, riesgo de paridad SEO).

### 4.6 Analítica y leads

| Tema | Hoy | Implicación móvil v2 |
|---|---|---|
| GTM `GTM-T9766P5S` | Detrás de consentimiento (`GoogleTagManager.tsx`, sin script ni noscript hasta `granted`), Consent Mode v2 básico | En C, un solo componente en el layout raíz. Si se crea layout raíz móvil independiente, **montar GTM + `listenContactClicks` + `CookieConsent` también ahí** (si no, se pierde toda la medición) |
| `trackLead(params, userData)` | Contrato exacto para GTM: `lead_id`, `transaction_id`, `lead_source`, `lead_need`, `lead_budget`, `page_path`; solo tras `/api/lead` ok | Reutilizar `LeadForm` tal cual en las pantallas nuevas; no escribir `dataLayer.push` sueltos |
| `/api/lead` | Vive en desktop; check de `Origin` contra `host`; rate-limit 5/10 min; honeypot + `elapsedMs` | En C: mismo origen y mismo proceso. En A/B también funcionaría vía `actiondev.es` (rewrite) pero NO si la zona móvil se sirviera desde otro dominio |
| `click_whatsapp` / `click_email` / `click_phone` | Listener de captura sobre cualquier `<a>` a `wa.me`/`mailto:`/`tel:` | Todos los enlaces WhatsApp del diseño nuevo han de ser `<a href="https://wa.me/…">` reales (no `onClick` + `window.open`), con `?text=` según la página (ya hay `whatsappHref`/`useCampaignWhatsapp`) |
| Atribución gclid/UTM | `LeadForm` lee la URL al montar y la guarda solo en estado (sin storage por diseño y por la política de cookies) | El tráfico de Ads aterriza en `/hablemos/*` con el formulario en la misma página: funciona. Si el visitante navega a `/contact` pierde la atribución. Persistirla en `sessionStorage` exigiría actualizar `/legal/cookies` y `LEGAL_UPDATED` → **PENDIENTE DE DECISIÓN**; recomendación: no, y que todo CTA de la home lleve `?utm`/parámetros heredados solo si venían en la URL |
| Eventos del popup `contact_popup_*` | Solo si el popup se muestra | En móvil v2 se sustituye por barra fija; definir eventos nuevos (`sticky_cta_click`) con `track()` y avisar al responsable de GTM; **añadirlos al contenedor** (versionado en `~/Documents/ActionDev/Campañas/ads-2026/gtm/`) |
| Cualquier campo nuevo en `Lead` / tag nuevo | Obliga a tocar `/legal/privacy`, `/legal/cookies`, `firestore.rules`, `LEGAL_UPDATED` | Si el formulario móvil es el mismo `LeadForm`: ninguno |

### 4.7 Landings de anuncios `/hablemos/*`

**Sí, deben adoptar el diseño nuevo en móvil y salir en la primera entrega** (decisión 4: Google Ads depende de ello). Condiciones:
- Mismo contenido y datos (`ads-landings.ts`), mismo `LeadForm` (`source="ads_landing"`), mismos `data-testid` que ya usan los e2e (`smoke.spec.ts`, bloques «Landings de campaña»).
- Mantener: `noindex,follow`, canonical propio, fuera del sitemap, **sin bloquear en robots**, `StickyCta`, pie con titularidad legal, `LegalLinks`.
- Es la ruta con mejor rendimiento actual (FCP 428 ms): el listón a no empeorar. Calidad de la página de destino = factor de Quality Score de Google Ads.
- Revisar con Google Ads: la URL final no cambia (`/hablemos/app`, `/hablemos/software`), solo el HTML móvil; no hace falta reenviar anuncios a revisión salvo cambios de política, pero hay que pasar AdsBot (UA `AdsBot-Google-Mobile`) por la regla de UA móvil: **comprobarlo con curl** antes de lanzar.

### 4.8 Riesgos y puntos a confirmar

1. Elegir A/B/C (recomendado C). 2. Spike del root layout (§4.5). 3. Tablets. 4. Fallback si el flag se apaga (¿home 3D de desktop o zona mobile antigua?). 5. Cabecera/pie compartida con las páginas fase 2 (landings/blog/legal): al ser desktop, siguen con su cabecera sin menú móvil → el usuario que entra por Google a una landing no puede navegar al resto. Opción: añadir en fase 1 solo el **menú móvil** a esas páginas (cambio de header, riesgo SEO bajo pero toca desktop) — **PENDIENTE DE DECISIÓN DEL CLIENTE** (el CLAUDE.md prohíbe enlazar las landings desde Header/Footer; en el menú móvil nuevo habría que levantarlo). 6. `ContactPopup`/cookies: el banner nuevo debe pesar menos de ~120 px de alto y mantener «Rechazar» tan visible como «Aceptar». 7. Reconciliar 22 vs 23 reseñas.

---

## 5. Plan de construcción en paralelo (solo alcance fase 1)

Convenciones: árbol `apps/desktop/src/app/m/**` + `apps/desktop/src/components/m/**`; tokens de `globals.css`, lima `#c8ff00`, Space Grotesk, esquinas vivas; named exports; server components por defecto; sin Three/GSAP/Lenis; presupuesto ≤ 300 KB JS por ruta.

### Paquete 0 — Spike y routing (previo, 0,5-1 día, 1 agente)
Decide root layout (route groups vs header) y deja el flag funcionando con una página `/m` de prueba.

### Paquete 1 — Base (agente A)
- **Archivos:** `src/app/m/layout.tsx`, `src/components/m/{MobileHeader,MobileMenu,StickyCta,MobileFooter,CookieSheet,Button,Section,Card}.tsx`, tokens/estilos del árbol móvil, componente WhatsApp (`<a wa.me>` + `whatsappHref`), iconos, `viewport` (`viewportFit: "cover"`), GTM/`CookieConsent` montados.
- **Dependencias:** ninguna (es la base). Los demás paquetes importan de aquí.
- **Terminado:** cabecera única con menú (Servicios, Proyectos, Reseñas, Contacto) y CTA «Cuéntanos tu proyecto»; barra fija con WhatsApp; pie con `LegalLinks`; banner de cookies ≤ 120 px; sin overflow horizontal a 320/360/390/430; contraste AA con lima; carga de fuentes sin FOUT.
- **Tests (Playwright, viewport 390x844):** smoke: header presente en `/m`, menú abre/cierra y enlaza 4 rutas, barra fija visible y se oculta con formulario en pantalla, enlace WhatsApp con `href` `wa.me/34614027410`, `LegalLinks` presentes, `click_whatsapp` empuja al `dataLayer` tras aceptar cookies.

### Paquete 2 — Home (agente B)
- **Archivos:** `src/app/m/page.tsx` + `components/m/home/*` (Hero, Needs, Cases, Process, Reviews, Faq, About, FinalCta).
- **Dependencias:** P1; datos de `projects.ts`, `testimonials.ts`, `landings.ts` (solo enlaces), `LeadForm` (P5 expone la variante; si no está, usar el existente).
- **Terminado:** secciones §3.3 en ese orden; hero con titular elegido y paso 1 del formulario o CTA; 10 enlaces a landings visibles; `<h1>` único visible; texto ≥ el de hoy; sin placeholder en casos; LCP < 2,5 s con throttling; JS < 300 KB.
- **Tests:** smoke: `h1` visible y único, 4 tarjetas de necesidad enlazan a las landings correctas, 10 enlaces `/…-vigo|pontevedra|…` presentes, CTA lleva a/abre formulario, sección de reseñas con enlace GBP, FAQs `<details>` abren; **SEO**: `title`, meta, canonical `https://actiondev.es`, JSON-LD `Organization`+`WebSite` iguales a producción (snapshot).

### Paquete 0b — Activos (mockups de `apps/pablo`) (parte del spike P0 / agente C)
- **Qué:** copiar los 8 `.webp` a un lugar que sirva el árbol móvil. **Con la arquitectura C (recomendada) basta `apps/desktop/public/projects/`** con nombre nuevo (`<slug>-mockup.webp`, p. ej. `fase-mockup.webp`) para NO pisar las capturas actuales (siguen usándose en desktop y como segunda imagen). Si se elige A/B: copiar a `apps/mobile/public/projects/` y ojo con `MOBILE_ONLY_ASSETS` del middleware (hoy `/projects/` existe idéntico en las dos apps y NO se reescribe; si el mockup solo estuviera en mobile daría 404 desde desktop). `packages/shared` no sirve imágenes (no es app): solo puede llevar el **dato** (`mockup?: string` en `Project`).
- **Datos:** añadir campo opcional `mockup` y `mockupOrientation` a `Project` en `packages/shared/src/projects.ts` (cambio aditivo, no altera desktop), asignar los 7 existentes y crear la entrada **Biyoga** (slug, `categoryEs`, `nicheEs`, `briefEs`/`resultEs` solo con lo que confirme el cliente; hasta entonces `noindex` vía `hasCaseStudy`). Mantener `image` (captura) para desktop.
- **Cabecera de caché:** `/projects/:path*` ya lleva 1 día + 7 de SWR en `next.config.ts` (suficiente). Servir con `next/image` (`sizes="100vw"`) para entregar ≤ 800 px a 390 px de ancho; los originales de 1800 px (hasta 123 KB) no deben ir sin redimensionar.
- **Terminado:** 8 imágenes accesibles en producción con 200 y `Cache-Control` correcto; `projects.ts` compila; desktop sin cambios visuales (e2e visuales existentes verdes).
- **Tests:** smoke: `GET /projects/fase-mockup.webp` 200; ficha `/projects/fase` usa el mockup en móvil y la captura en desktop; `/projects/biyoga` responde 200 (noindex) o 404 según se decida.

### Paquete 3 — Proyectos (agente C)
- **Archivos:** `app/m/projects/page.tsx`, `app/m/projects/[slug]/page.tsx` (+ `generateStaticParams`, `generateMetadata` reutilizando el de desktop), `components/m/projects/*`.
- **Dependencias:** P1; `packages/shared/src/projects.ts`, `lib/project-case.ts` (`projectCategoryLabel`, `relatedService`), CTA de P5.
- **Terminado:** lista con los 31 enlaces en HTML (visibles o en bloque «Todos los proyectos»), filtro por tipo sin JS pesado, tarjetas con imagen real (los 9 placeholders se muestran sin imagen o van al final); ficha: «Qué nos pidieron/Qué conseguimos» como `<h2>`, servicio relacionado, `CreativeWork` JSON-LD, `noindex` donde `!hasCaseStudy`, CTA propio y enlace «Ver web» si hay URL.
- **Tests:** smoke: 31 enlaces `/projects/…`; ficha GTI muestra x10; `noindex` en `/projects/ratsquad`; canonical y title idénticos a producción (comparar con la salida desktop); CTA abre formulario; ninguna ruta devuelve 404; peso < 300 KB JS.

### Paquete 4 — Servicios y reseñas (agente D)
- **Archivos:** `app/m/servicios/page.tsx`, `app/m/resenas/page.tsx`, `components/m/services/*`, `components/m/reviews/*`.
- **Dependencias:** P1; `landings.ts` (`getLandingsByGroup`, `hubSummary`), `testimonials.ts`, `BUSINESS.mapsUrl/reviewUrl`.
- **Terminado:** `/servicios` conserva los 10 enlaces y el JSON-LD `CollectionPage`+`BreadcrumbList`; `/resenas` lista las 22 con texto visible y «Ver en Google»/«Deja tu reseña»; el `<h1>` y metas actuales se mantienen («La plaza de las reseñas» → texto equivalente validado con el cliente o mismo `title`).
- **Tests:** smoke: 10 enlaces de landings en `/servicios`; 22 reseñas visibles en `/resenas`; enlaces GBP correctos; title/canonical coincidentes; sin `hidden` para contenido indexable.

### Paquete 5 — Contacto, formulario y `/hablemos/*` (agente E) — PRIORIDAD (bloquea Ads)
- **Archivos:** `app/m/contact/page.tsx`, `app/m/hablemos/[oferta]/page.tsx`, `app/m/hablemos/gracias/page.tsx`, `app/m/hablemos/layout.tsx`, adaptación visual de `components/leads/LeadForm.tsx`/`StickyCta.tsx` para móvil (sin cambiar contrato: props, `data-testid`, `trackLead`, honeypot, `elapsedMs`).
- **Dependencias:** P1 (cabecera/tokens), `ads-landings.ts`, `/api/lead` (sin cambios), `lib/leads/*`.
- **Terminado:** `/hablemos/app|software` pixel-equivalentes en contenido a producción, con diseño nuevo; formulario envía y muestra error con salida a WhatsApp; `/hablemos/gracias` mide solo tras guardar; `/contact` con formulario corto + WhatsApp + email + dirección; `noindex` y robots intactos.
- **Tests:** los e2e existentes de `smoke.spec.ts` («Landings de campaña») pasan en viewport 390; nuevo: envío completo mockeando `/api/lead` → 200 → redirección a `/hablemos/gracias?tipo=`; `generate_lead` en `dataLayer` solo con consentimiento; con `elapsedMs` < 3000 no guarda (honeypot); gclid/utm en la URL llegan en el payload; `AdsBot-Google-Mobile` UA recibe 200 y `noindex` (no robots-block).

### Paquete 6 — SEO, routing y analítica (agente F, transversal; puede ir en paralelo con P1)
- **Archivos:** `src/middleware.ts` (reglas por ruta, flag, `Vary`), `next.config.ts` (`headers()` con `Vary: User-Agent` por ruta, redirect de `/m/*` directo), `sitemap.ts` (`CONTENT_UPDATED`), `public/llms.txt` (descripción de la home), IndexNow tras el deploy, script de verificación SEO.
- **Dependencias:** Spike P0; las rutas de P2-P5 existen para activar cada regla (se activan una a una).
- **Terminado:** cada ruta de fase 1 sirve el árbol móvil solo con UA móvil + flag; desktop idéntico byte a byte; `Vary: User-Agent` presente; Googlebot Smartphone y AdsBot-Mobile reciben el árbol móvil con title/meta/canonical/JSON-LD correctos; Googlebot desktop recibe el 3D; rollback en un cambio de variable; `/m/*` directo no indexable.
- **Tests:** script `curl` (UA iPhone, Googlebot Smartphone, Googlebot desktop, AdsBot-Google-Mobile, iPad) por cada ruta: status 200, `Vary`, `<title>` antes de `</head>`, canonical, `application/ld+json` presente y **diff contra el HTML actual de producción** (title, meta description, canonical, JSON-LD y lista de enlaces internos ⊇ los de hoy); regresión: las 10 landings, 24 fichas, 15 posts y sitemap sin cambios (hash de `<title>`+canonical+JSON-LD); visual desktop sin diferencias (`visual.spec.ts` existente).

### Dependencias entre paquetes

```
P0 spike ──> P0b activos ──> P3
          ├─> P1 base ──┬─> P2 home
          │             ├─> P3 proyectos
          │             ├─> P4 servicios+reseñas
          │             └─> P5 contacto+hablemos  (CRÍTICO para Ads)
          └─> P6 SEO/routing/analítica (en paralelo; activa rutas conforme P2-P5 terminan)
```
Orden de entrega sugerido: **Entrega 1 = P0+P1+P5+P6** (hablemos + contacto + routing: desbloquea Google Ads) → **Entrega 2 = P2+P3+P4**. La home puede mantenerse con la zona antigua hasta Entrega 2 (flag por ruta).

### Criterios globales de «terminado»
- Lighthouse móvil Performance ≥ 85, Accesibilidad ≥ 90, SEO ≥ 90 en las 8 rutas nuevas; JS ≤ 300 KB por ruta; sin overflow horizontal 320-430 px.
- `pnpm --filter @actiondev/desktop test:e2e` verde en desktop y en el proyecto Playwright móvil; test nuevo en `smoke.spec.ts` por cada sección/componente añadido.
- Actualizar `CLAUDE.md` (sección PÁGINAS/SEO/DEPLOY), `sitemap.ts` si aplica, `llms.txt`, y ejecutar `pnpm seo:indexnow` tras el deploy.
- Nada de precios, plazos o cifras que no estén en §2 o marcados «PENDIENTE DE CONFIRMAR CON EL CLIENTE».

---

## 6. Pendientes de confirmar con el cliente (resumen)

1. Precio orientativo («desde X €» o rangos) y plazos típicos por servicio.
2. Permiso para nombrar/mostrar cada proyecto y cada reseña; capturas para los 9 placeholders.
3. Resultados cuantificados adicionales además de GTI (x10).
4. «Respuesta en 24 horas» y horario de atención.
5. Garantías/condiciones post-entrega.
6. Tablets: ¿3D o móvil?
7. Fallback si se apaga el flag.
8. Menú móvil en las páginas de fase 2 y levantar la regla «no enlazar landings desde Header».
9. Persistencia de atribución gclid/UTM entre páginas.
10. Número oficial de reseñas (22 vs 23).
11. Idioma: ES fijo en móvil (recomendado) o conservar EN.
