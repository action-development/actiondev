# Kit operativo SEO off-page y SEO local — Action Development

**Titular:** Alcasi Systems, S.L. (CIF B72910664) · marca "Action Development" activa desde 2020, sociedad desde 2022.
**Elaborado:** 30 sep 2026. Complementa `docs/seo-playbook.md` (estado on-page/código); este archivo es el manual de ejecución fuera de la web.

**Leyenda:** `verificar` = no se pudo confirmar desde aquí (hay que comprobarlo a mano en el momento). Todo lo demás procede del repo (`packages/shared/src/seo.ts`, `projects.ts`, `testimonials.ts`) o de una página consultada el 30 sep 2026.

## Avisos previos (léelos antes de ejecutar)

1. **`/software-a-medida-vigo` NO existe en el repo** (no está en `landings.ts`, `SERVICE_LANDINGS` ni sitemap). No la enlaces en GBP ni en directorios hasta crearla y desplegarla; mientras tanto, el servicio "Software a medida" apunta a `/desarrollo-de-aplicaciones-vigo`. Al crearla: `landings.ts`, `SERVICE_LANDINGS`, `llms.txt`, `sitemap.ts` (regla del CLAUDE.md).
2. **Nombre de entidad.** GBP y JSON-LD usan "Action Development". `BUSINESS.displayName` = "Action Digital Agency" (solo OG image) y `BUSINESS.name` = "Action". En citaciones usa SIEMPRE "Action Development"; nunca "Action Digital Agency".
3. **Dirección de la ficha ≠ domicilio social.** Oficina/NAP: Rúa Colón, 20 (Vigo). Domicilio social registral: Marín (Puerto Pesquero Este, nave 21). Marín solo va en aviso legal y fichas que pidan datos registrales; jamás como segunda ficha de negocio.
4. **Cifras de resultados de los proyectos.** En `projects.ts` casi todas son cualitativas ("multiplicando…"). Solo Musa (+40 % reservas online) y Autoescuela GTI (x10 trámites) llevan número. Antes de usarlas en posts o notas de prensa: confirmarlas con el cliente por escrito. Lo mismo con el permiso para nombrar al cliente.
5. **Reseñas:** el playbook cita 20 × 5,0 en Google; `testimonials.ts` tiene 23 entradas (no todas de Google). Cuenta real: mírala en la ficha antes de citar un número en cualquier nota.

---

## 1. Ficha NAP canónica

Copiar y pegar tal cual. Un solo formato, sin abreviar, en TODOS los sitios.

```
Nombre:            Action Development
Dirección:         Rúa Colón, 20, 36201 Vigo, Pontevedra
Calle:             Rúa Colón, 20
Código postal:     36201
Localidad:         Vigo
Provincia:         Pontevedra
País:              España
Teléfono:          +34 614 02 74 10
Email:             hi@actiondev.es
Web:               https://actiondev.es
Ficha de Google:   https://maps.google.com/?cid=18162141466997281764
Reseñas Google:    https://g.page/r/CeTTw-Rv4wz8EBM/review
Instagram:         https://instagram.com/action.dev
LinkedIn:          https://linkedin.com/company/action-development
Razón social:      Alcasi Systems, S.L. (solo donde se pida: CIF B72910664)
Año de inicio:     2020 (marca) · 2022 (sociedad, constituida el 22-12-2022)
```

Reglas: "Rúa" (no "Calle" ni "C/"); coma antes del número; teléfono con espacios `+34 614 02 74 10`; sin teléfono fijo alternativo; web SIN barra final salvo que el formulario la exija; una sola URL de web (la home) salvo que el directorio pida enlace por servicio.

### Descripciones de empresa

**160 caracteres (149)** — para campos cortos (Instagram, LinkedIn tagline, directorios con límite):

```
Action Development, agencia de Vigo: aplicaciones móviles, webs a medida, tiendas online y software a medida. Diseño web premium con experiencias 3D.
```

**400 caracteres (376)** — descripción estándar de directorios:

```
Action Development es una agencia de desarrollo de software con oficina en Vigo. Creamos aplicaciones móviles para iOS y Android, webs a medida, tiendas online en Shopify o programadas desde cero y software de gestión con integraciones. También diseñamos sitios web premium con experiencias 3D interactivas. Trabajamos con negocios y marcas de Vigo, Pontevedra y toda Galicia.
```

**750 caracteres (671)** — GBP, Clutch, LinkedIn "Acerca de", Wikidata/prensa:

```
Action Development es una agencia de desarrollo de software con oficina en Rúa Colón, en Vigo. Diseñamos y desarrollamos aplicaciones móviles para iOS y Android, webs a medida, tiendas online (en Shopify o programadas desde cero) y software de gestión a medida, incluidos ERP e integraciones entre sistemas. También creamos sitios web de diseño premium con experiencias 3D interactivas. La marca está activa desde 2020 y pertenece a Alcasi Systems, S.L. Hemos trabajado con clubes deportivos, autoescuelas, hostelería, moda, comercio electrónico y empresas de servicios de Galicia. Atendemos a empresas de Vigo, Pontevedra y el resto de Galicia, en persona o a distancia.
```

Versión en inglés (Clutch, GoodFirms, DesignRush; ~300 car.): *"Action Development is a software and web agency based in Vigo, Spain. We build mobile apps (iOS and Android), custom websites, online stores (Shopify or custom-built), custom software and ERP integrations, and premium web design with interactive 3D. Active since 2020."*

---

## 2. Google Business Profile

Ficha existente: "Action Development", CID 18162141466997281764. Es una ficha con dirección visible (establecimiento), no de área de servicio pura.

### 2.1 Categorías

La taxonomía es cerrada: escribe en el autocompletado y usa SOLO lo que Google ofrezca. Lo único que pude confirmar literalmente en español es **"Diseñador de sitios web"** (Web designer). El resto son las traducciones habituales: comprobar cada una en el desplegable (`verificar`).

| Rol | Categoría propuesta | Estado |
|---|---|---|
| Principal | **Empresa de desarrollo de software** | verificar (el playbook proponía "Empresa de software": elegir la que salga al escribir y esté más cerca de "software development company"). Justificación: es el 60 % del negocio (apps, ERP, a medida) y evita competir en "diseño web" con estudios y freelancers |
| Secundaria 1 | **Diseñador de sitios web** | Confirmada |
| Secundaria 2 | **Empresa de desarrollo de aplicaciones** (App developer / "Desarrollador de aplicaciones") | verificar |
| Secundaria 3 | **Consultor informático** / "Consultora informática" | verificar |
| Secundaria 4 (opcional) | **Desarrollador web** / "Empresa de desarrollo web" | verificar |

Evitar: "Agencia de marketing", "Agencia de publicidad", "Servicio de marketing en Internet" (el playbook la incluía; dispersa la señal y no describe el negocio). Máximo 4-5 categorías; coherencia > cantidad. **No cambiar la principal más de una vez**: mueve el ranking durante semanas.

### 2.2 Servicios (≤300 caracteres cada uno)

Pegar en Información → Servicios, con el nombre exacto de la primera columna. Longitudes medidas (todas ≤ 235). El campo de descripción de GBP no admite enlaces clicables: pon la URL de la landing en el campo "Enlace de servicio" si tu ficha lo ofrece (`verificar`, no todas las cuentas lo tienen) y, si no, úsala en el último post fijado y en las preguntas y respuestas.

| Servicio (nombre) | Descripción (pegar) | URL |
|---|---|---|
| Desarrollo de aplicaciones móviles | Diseño y desarrollo de apps para iOS y Android: desde la idea y el prototipo hasta la publicación en las tiendas. Apps propias de negocio, comunidades, formación o gestión interna, con panel de administración y mantenimiento posterior. | https://actiondev.es/desarrollo-de-aplicaciones-vigo |
| Desarrollo web a medida | Webs y aplicaciones web programadas a medida, rápidas y preparadas para buscadores: reservas, cuentas de usuario, pagos online, paneles de gestión e integraciones con el software que ya usas. Sin plantillas genéricas. | https://actiondev.es/desarrollo-web-vigo |
| Diseño web premium con 3D | Diseño de páginas web con identidad propia y experiencias 3D interactivas para marcas que quieren diferenciarse. Diseño, animación y desarrollo a cargo del mismo equipo, optimizado para móvil y velocidad de carga. | https://actiondev.es/diseno-web-vigo |
| Tiendas online (Shopify y a medida) | Tiendas online en Shopify o desarrolladas a medida: catálogo, checkout rápido, pasarelas de pago, envíos y conexión con tu gestión de stock. Te dejamos la tienda lista para que gestiones productos y pedidos tú mismo. | https://actiondev.es/tienda-online-vigo |
| Software a medida, ERP e integraciones | Software de gestión a medida para tu negocio: ERP, paneles internos, control horario, reservas y automatización de tareas. Conectamos tus herramientas y APIs para acabar con el papeleo y el trabajo duplicado. | **Pendiente:** `/software-a-medida-vigo` (no existe aún). Mientras tanto: https://actiondev.es/desarrollo-de-aplicaciones-vigo |
| Web en Pontevedra | Desarrollo de webs a medida para empresas y profesionales de Pontevedra y su comarca. Diseño, programación y posicionamiento local, con reuniones presenciales o por videollamada. | https://actiondev.es/desarrollo-web-pontevedra |
| Apps en Pontevedra | Desarrollo de aplicaciones móviles y web apps para empresas de la provincia de Pontevedra. Análisis de la idea, diseño, desarrollo y publicación en App Store y Google Play. | https://actiondev.es/desarrollo-de-aplicaciones-pontevedra |
| Apps en Galicia | Desarrollo de aplicaciones móviles y web para empresas y startups de toda Galicia. Trabajamos en remoto y en persona, con un único equipo responsable del producto de principio a fin. | https://actiondev.es/desarrollo-de-aplicaciones-galicia |
| Agencia web Galicia | Agencia de desarrollo y diseño web para empresas gallegas: webs corporativas, tiendas online y aplicaciones a medida, con un equipo pequeño y trato directo durante todo el proyecto. | https://actiondev.es/agencia-desarrollo-web-galicia |

Sin precios inventados: si añades "Desde X €" solo con cifras que ya publiquéis (ninguna en el repo hoy: `verificar`).

### 2.3 Zonas de servicio (máximo 20, límite confirmado por varias fuentes de 2026)

Google recomienda zonas a ~2 h de conducción y no aceptar zonas donde no puedas atender. Orden por cercanía y prioridad (Vigo ya es la ubicación, aun así se añade):

1. Vigo · 2. Redondela · 3. Mos · 4. O Porriño · 5. Nigrán · 6. Gondomar · 7. Baiona · 8. Vilaboa · 9. Soutomaior · 10. Pontevedra · 11. Marín · 12. Moaña · 13. Cangas · 14. Ponteareas · 15. Salceda de Caselas · 16. Tui · 17. Sanxenxo · 18. Vilagarcía de Arousa · 19. Ourense · 20. A Coruña

(Santiago de Compostela queda fuera del top 20; el JSON-LD sí la lista en `areaServed`. Si prefieres Santiago en vez de Salceda de Caselas, es una decisión de negocio.)

### 2.4 URL de la web con UTM

Web (campo principal):
```
https://actiondev.es/?utm_source=google&utm_medium=organic&utm_campaign=gbp
```
Reglas: mismos parámetros siempre (minúsculas), y `utm_medium=organic` para que GA/GTM lo separe del orgánico puro. Es la home, no una landing: GBP apunta a la home salvo que la categoría dé "enlace de servicios". En posts, un UTM por post:
```
https://actiondev.es/<landing>?utm_source=google&utm_medium=gbp-post&utm_campaign=<slug-del-post>
```
Enlace de reservas/cita: no lo pongas si no hay un flujo real de reserva; el CTA de contacto es "Llamar" (+34 614 02 74 10). Los UTM no afectan al ranking pero requieren que GTM esté cargado (solo con consentimiento; ver `[SECURITY]`): las visitas sin consentimiento no se medirán en GA, medir además desde Search Console → Rendimiento de GBP.

### 2.5 Doce posts (uno por semana)

Formato: 100-300 car. útiles (Google trunca hacia 250-300 en la vista; el máximo es 1.500), 1 foto real, botón "Más información" con UTM (o "Llamar"), tono factual, ciudad + servicio en la primera frase, sin teléfonos en el texto. Todos basados en `projects.ts`; **confirmar permiso del cliente para nombrarlo** y no publicar cifras no confirmadas.

| Sem. | Tema (proyecto real) | Borrador | Enlace |
|---|---|---|---|
| 1 | Presentación | "Action Development es la agencia de desarrollo de aplicaciones y webs a medida de Rúa Colón, en Vigo. Apps móviles, tiendas online y software de gestión. Pásate por la oficina o escríbenos." | /desarrollo-de-aplicaciones-vigo |
| 2 | Autoescuela GTI (ERP + app) | "Caso real: ERP para la gestión de matrículas y flota de una autoescuela, más una app para que los alumnos vean sus prácticas y exámenes. Desarrollo de software a medida desde Vigo." | /desarrollo-de-aplicaciones-vigo |
| 3 | PBB Porriño (inscripción y pago online) | "Un club deportivo de O Porriño ya cobra inscripción y cuotas desde su web, con cuentas para padres y deportistas. Así trabajamos el desarrollo web a medida." | /desarrollo-web-vigo |
| 4 | Nautirent (reservas conectadas a la gestión) | "Web de reservas conectada al software de gestión de la flota de una empresa náutica: la disponibilidad se actualiza sola. Desarrollo web con integraciones desde Vigo." | /desarrollo-web-vigo |
| 5 | Koopey / C L I C H É / Canelita (Shopify) | "Tres tiendas online de moda y complementos montadas en Shopify con un checkout rápido. Te contamos qué miramos antes de elegir entre Shopify y una tienda a medida." | /tienda-online-vigo |
| 6 | Timetracker (control horario) | "App de fichaje y control horario para digitalizar un proceso que se hacía en papel. Software a medida para empresas de Vigo y Pontevedra." | /desarrollo-de-aplicaciones-pontevedra |
| 7 | Musa Vigo (entradas online) | "Web con venta de entradas y perfil de usuario para un local de ocio nocturno de Vigo. Diseño web premium y pagos online. (Cifra de reservas solo si Musa la confirma.)" | /diseno-web-vigo |
| 8 | Samoa Café (carta editable) | "Naming, logo y carta digital editable al instante para una cafetería de Redondela. Una web que el propio negocio puede actualizar sin llamarnos." | /diseno-web-vigo |
| 9 | Fang Tours (reservas con pago) | "Landing con calendario de disponibilidad y pago integrado para un negocio de tours: reservas online sin llamadas. Desarrollo web para turismo en Galicia." | /agencia-desarrollo-web-galicia |
| 10 | Kairos Futures / XauLabs (apps y plataformas) | "Apps iOS y Android y plataformas de formación con asistente de IA integrado. Desarrollo de aplicaciones móviles para startups gallegas." | /desarrollo-de-aplicaciones-galicia |
| 11 | Fase Service Partner / Licentia (web corporativa y marketplace) | "Webs corporativas pensadas para vender fuera de Galicia y un marketplace de licencias con entrega automática. Desarrollo web a medida con integraciones." | /desarrollo-web-pontevedra |
| 12 | Oferta/consulta | "¿Tienes una idea de app o una web que se te ha quedado corta? Primera reunión en la oficina de Vigo o por videollamada, sin compromiso." (tipo Oferta solo si hay condiciones reales y fecha) | /desarrollo-de-aplicaciones-vigo |

Los posts caducan visualmente a los 6 meses en el perfil; rotarlos.

### 2.6 Checklist de fotos

Mínimo 10 fotos nuevas, todas reales (sin stock ni renders de IA como foto de local); subirlas con el móvil o con EXIF de la oficina, nombre de archivo descriptivo (`action-development-oficina-vigo-01.jpg`), 720 px de lado mínimo, sin texto superpuesto salvo el logo.

- [ ] Logo (cuadrado, `/logos/logo.webp` convertido a PNG/JPG) y foto de portada (oficina o equipo)
- [ ] Fachada y portal de Rúa Colón, 20 (de día y de noche; el portal es el mismo que recrea `/contact`)
- [ ] Entrada/rótulo, para que quien llegue reconozca el sitio
- [ ] Interior: zona de trabajo y sala de reuniones
- [ ] Equipo (foto de grupo y retratos de 1-2 personas), con consentimiento
- [ ] Pantallas con proyectos reales en curso (con permiso del cliente)
- [ ] Reunión con un cliente (con permiso)
- [ ] Vídeo corto (≤30 s) recorriendo la entrada y la oficina
- [ ] Calendario: 1-2 fotos nuevas al mes

### 2.7 Atributos y otros campos

- Atributos: los que ofrezca la categoría (p. ej. "Identifica como negocio…" y accesibilidad, "Cita previa requerida", "Cita online/en línea"): marcar solo los reales (`verificar` qué lista sale).
- Fecha de apertura: 2020 (marca) o 22-12-2022 (sociedad): elegir la de la marca, coherente con la web y `foundingYear`.
- Descripción de la empresa: la de 750 caracteres (§1). Sin URLs, sin teléfonos, sin mayúsculas en bloque, sin promociones.
- Preguntas y respuestas: publicar y responder tú mismo 5 (¿Hacéis apps iOS y Android? ¿Trabajáis fuera de Vigo? ¿Shopify o a medida? ¿Cuánto tarda un proyecto? ¿Hacéis mantenimiento?), respuestas cortas y verdaderas.
- **Horario:** no consta en el repo: **verificar** y publicar el real, incluido festivos. Si la oficina se atiende solo con cita, decirlo en la descripción y usar "Cita previa requerida"; no marcar 24 h.
- Mensajes/chat de GBP: solo si vas a responder en <24 h; si no, desactivar.

### 2.8 Riesgos de suspensión (evitar)

| Riesgo | Por qué suspende | Qué hacer |
|---|---|---|
| **Dirección no atendida / oficina compartida sin rótulo** | Google exige que un negocio con dirección visible atienda clientes allí en el horario publicado. Si la oficina es un espacio sin nadie o coworking sin cartel, pueden pedir vídeo de verificación | Tener el vídeo del portal + rótulo/buzón con "Action Development" listo. `verificar` cómo está señalizado hoy |
| Nombre con palabras clave ("Action Development – Apps Vigo") | Incumple las directrices de nombre | Mantener exactamente "Action Development" |
| Cambiar nombre, dirección o categoría principal a la vez | Dispara reverificación y suspensión | Un cambio por vez, espaciados, y siempre coherentes con la web |
| Segunda ficha (Marín, o "Action") | Duplicado = suspensión de ambas | Solo una ficha. Marín NUNCA como ubicación |
| Reseñas con incentivos, filtrado ("solo satisfechos") o en bloque desde la misma IP/wifi | Reseñas falsas o "gating" son motivo de retirada | Ver §3: pedir a todos, sin regalos, sin escribirlas por el cliente |
| Reseñas de empleados, familia o de otras empresas de los socios | Conflicto de interés | Excluirlos |
| Zonas de servicio lejanas o inventadas | Spam de área | Solo las de §2.3 |
| Publicar teléfonos, URLs, promos ficticias en descripción o posts | Contenido no permitido | Solo CTA con botón |
| Web de la ficha que no coincide (nombre, teléfono, dirección) | Señal de inconsistencia | Web ya alineada (NAP en `seo.ts`); repasar footer y aviso legal |
| Ediciones de terceros ("sugerir cambio") aceptadas sin ver | Cambios de dirección o teléfono por competidores | Revisar la ficha cada semana y activar notificaciones |
| Videos/fotos de stock o con marcas de agua | Retirada por spam | Solo material propio |

---

## 3. Reseñas

### 3.1 Cuándo pedirla

- En cuanto el cliente ve el resultado funcionando: **el día del lanzamiento o 2-7 días después**, no antes (con la web o app aún en cambios el cliente está impaciente).
- Tras un momento de satisfacción explícito (te lo ha dicho por WhatsApp o en la reunión de entrega).
- Ritmo objetivo: 2-4 al mes, sostenido; no 20 de golpe. Pedirla a TODOS los clientes cerrados, no solo a los contentos (pedirla solo a los satisfechos es filtrado y va contra las normas de Google).
- Ideal: pedirla en la reunión de entrega y mandar el enlace en el mismo momento, con el móvil delante.
- Una sola insistencia a los 7-10 días; luego, dejarlo.

### 3.2 Cómo sugerir contexto sin dictar el texto

No escribas la reseña por el cliente ni le des un guion, y no ofrezcas nada a cambio. Puedes decir: "si te apetece, cuéntanos qué necesitabas, qué construimos y cómo fue trabajar con nosotros; y si quieres, di que somos de Vigo". La reseña que menciona servicio y ciudad de forma natural ("app para mi negocio en Vigo") ayuda a ranking; una idéntica a otras 5 lo perjudica y rompe la norma.

### 3.3 Tres plantillas de petición

**A. WhatsApp (cliente al que has entregado esta semana)**
```
Hola {nombre}, gracias otra vez por confiar en Action Development para {la web / la app / la tienda}. Nos ayudaría muchísimo que contaras en Google cómo ha sido: qué necesitabas, qué hicimos y cómo fue trabajar juntos. Son dos minutos y este es el enlace directo: https://g.page/r/CeTTw-Rv4wz8EBM/review
Gracias de verdad, {tu nombre}
```

**B. Email (proyecto más largo o cliente más formal)**
```
Asunto: ¿Nos echas una mano con una reseña?

Hola {nombre}:

Ya está en marcha {proyecto} y para nosotros ha sido un gusto trabajar con {empresa}. Las reseñas de clientes reales son lo que más ayuda a otras empresas de Vigo y de Galicia a decidir si nos contratan.

Si te parece bien, ¿podrías dejar tu opinión sincera en Google? Puedes contar qué necesitabas, qué hemos hecho y cómo ha sido el proceso; con tus palabras y lo que tú quieras destacar, sea bueno o mejorable.

Enlace directo: https://g.page/r/CeTTw-Rv4wz8EBM/review

Gracias por tu tiempo.
{tu nombre} · Action Development · +34 614 02 74 10 · https://actiondev.es
```

**C. Recordatorio (7-10 días después, un único mensaje)**
```
Hola {nombre}, sin prisa: por si se te pasó, aquí tienes el enlace para dejar tu opinión sobre Action Development en Google (2 minutos): https://g.page/r/CeTTw-Rv4wz8EBM/review. Si prefieres no hacerlo, sin problema y gracias igualmente por todo.
```

### 3.4 Cinco plantillas de respuesta (mencionar el servicio con naturalidad, sin repetir la misma frase)

**1. Positiva con detalle**
```
Gracias, {nombre}. Ha sido un placer desarrollar {la tienda online / la app / la web} de {negocio} desde Vigo, y nos alegra que {detalle que mencione} haya funcionado. Seguimos a tu disposición para lo que necesites. — Equipo de Action Development
```

**2. Positiva breve (sin texto)**
```
Muchas gracias, {nombre}, por la confianza y por las cinco estrellas. Cualquier mejora futura, aquí estamos. — Action Development
```

**3. Neutra (3 estrellas o comentario mixto)**
```
Gracias por tu opinión, {nombre}, y por decirnos qué se podía mejorar: {punto concreto}. Nos interesa entenderlo bien; escríbenos a hi@actiondev.es o llámanos al +34 614 02 74 10 y lo vemos contigo. — Action Development
```

**4. Negativa con crítica razonable**
```
Lamentamos que la experiencia no haya sido la esperada, {nombre}. Hemos revisado el proyecto y queremos aclarar {hecho verificable, sin datos personales}. Preferimos hablarlo contigo directamente: hi@actiondev.es o +34 614 02 74 10. — Action Development
```
(Responder siempre, en <48 h, sin discutir ni revelar datos del contrato; el objetivo es el lector futuro, no ganar el debate.)

**5. Negativa falsa o de alguien que no es cliente**
```
Hola, no encontramos ningún proyecto asociado a este nombre. Si trabajamos juntos, escríbenos a hi@actiondev.es para revisar qué ocurrió. — Action Development
```
Luego, "Marcar como inapropiada" en GBP (Reseñas → menú de la reseña → Marcar como inapropiada) y, si sigue, formulario de retirada de contenido de Google. La retirada es discrecional.

---

## 4. Directorios y citaciones

Todos con el NAP de §1 (copiar/pegar, sin variar). Orden = prioridad. "URL de alta" = enlace comprobado el 30 sep 2026 (por consulta directa o por resultado de búsqueda); si dice `verificar`, no pude abrir el formulario. Costes: lo que indican las páginas oficiales o terceros citados; **los precios cambian: verificar antes de pagar**.

| # | Sitio | URL de alta | Coste | Tiempo | Notas y campos clave |
|---|---|---|---|---|---|
| 1 | **Bing Places** | https://www.bing.com/forbusiness/ (bingplaces.com redirige aquí) | Gratis | 30 min + verificación (postal/teléfono/email) 1-7 días (`verificar`) | Importar desde Google Business Profile con un clic y revisar campo a campo. Alimenta ChatGPT Search y Copilot. Alta paralela en Bing Webmaster Tools |
| 2 | **Apple Business** (antes Business Connect) | https://business.apple.com/ (businessconnect.apple.com redirige) | Gratis para reclamar ubicación en Mapas (según la página) | 30 min + verificación por teléfono; revisión 1-2 semanas (`verificar`) | Reclamar o añadir la ubicación en Apple Maps. Categoría: software/desarrollo de software; horario, logo, fotos, enlace web con UTM `utm_source=apple-maps`. Muy poco competido |
| 3 | **Páxinas Galegas** | https://www.paxinasgalegas.es/altaEmpresas.aspx | Alta gratis (verificada por su equipo en 24-48 h según su web); publicidad de pago desde 137 €/año (según su web) | 20 min | Directorio gallego de referencia. Actividad: informática / desarrollo de software / diseño de páginas web; poblacion Vigo; web, email, redes. Recibirás llamadas comerciales: rechazar el pago no afecta al perfil gratis |
| 4 | **Sortlist** | https://www.sortlist.es/providers (guía: https://help.sortlist.com/en/articles/1714404-how-to-be-listed-as-a-provider-on-sortlist) | Gratis el perfil; planes de pago aparte (ver https://www.sortlist.es/providers/pricing) | 1 h + webinar de bienvenida | Servicios: desarrollo web, apps móviles, e-commerce. Ubicación Vigo. Subir 4-6 proyectos reales y pedir reseñas de clientes en la plataforma. Aparece en rankings "mejores agencias de desarrollo web en Vigo" |
| 5 | **Trustlocal** | https://trustlocal.es/registro-de-empresa/ | Perfil básico gratis; Premium de pago (https://trustlocal.es/perfil-premium/) | 30 min | Servicios: desarrollo web, apps, tienda online, Vigo. Reseñas propias de Trustlocal (independientes de Google) |
| 6 | **Mejores de Vigo** | https://mejoresdevigo.es/join/ ("Publicar empresa", según la propia web) | Alta gratis; "servicios de destacado" de pago (según la web: `verificar` tarifas) | 20 min | Es el listicle local que Google ya premia: su ranking "se calcula automáticamente en función de reseñas, visibilidad online y autoridad" (texto de su web). **Action no aparece hoy en el top 25 de /desarrollo-web-vigo/**; listados a atacar: /desarrollo-web-vigo/, /empresas-diseno-web/ y las de marketing. Campos: categoría "Desarrollo web / Diseño web", descripción de 400, enlace a reseñas de Google |
| 7 | **Cylex España** | https://www.cylex.es/ (botón "Registrar" → "Registrar empresa"; ayuda: info@cylex-espana.es) | Gratis | 20 min | Crear usuario y registrar empresa. Categorías: desarrollo de software, diseño web. Añadir descripción de 160 y de 400 |
| 8 | **Páginas Amarillas** | https://www.paginasamarillas.es/a/registro/ (o "Incluye tu negocio gratis" en la home) | Gratis (hay llamadas comerciales de pago) | 20 min + llamada de confirmación en unos días | Actividad: informática-software / diseño web; Vigo; web y horario. Cuidado con la cuenta comercial: no contratar sin comparar |
| 9 | **Clutch** | https://clutch.co/get-listed | Perfil gratis; verificación de pago (~499 USD/año según un artículo de su centro de ayuda: `verificar`) | 1-2 h + captación de reseñas (semanas) | Piden ≥3 reseñas de clientes verificadas por Clutch para publicar (según su ayuda: `verificar`). Solo merece la pena si hay 3 clientes dispuestos a la entrevista. Perfil en inglés con la descripción larga en EN. Apps y web. Muy citado por buscadores de IA |
| 10 | **GoodFirms** | https://www.goodfirms.co/get-listed | Gratis (de pago: patrocinio) | 1 h | Mismo material que Clutch; aprobación manual |
| 11 | **DesignRush** | https://www.designrush.com/submit/agency | Perfil gratis; premium ~2.400-3.600 USD/año según un análisis de terceros (`verificar`, no lo contrates) | 1 h | Revisan web, portfolio y reseñas. Solo el perfil básico |
| 12 | **Foursquare** | https://app.foursquare.com/venue/claim (o añadir el sitio si no existe) | Reclamar puede costar un pago único (~20 USD según una guía externa; `verificar`) | 20 min | Su dato alimenta apps y Apple Maps/otros. Solo si el coste sigue siendo el comentado y quieres controlar la ficha; si no, dejar el sitio creado sin reclamar |
| 13 | **Hotfrog España** | https://www.hotfrog.es/ | Gratis | 20 min | Bajo valor SEO; solo por consistencia de NAP. Añadir 3-5 palabras clave en la descripción sin repetir |
| 14 | **Infobel** | https://www.infobel.com/es/spain (buscar la ficha y "reclamar/editar"; `verificar` flujo) | Gratis | 15 min | Suele existir ya la ficha (datos importados): corregir NAP |
| 15 | **Empresite / eInforma** | Empresite: https://empresite.eleconomista.es/ (FAQ https://empresite.eleconomista.es/FAQS.html) · eInforma: https://www.einforma.com/ | Gratis (Empresite). eInforma: `verificar` | 30 min por cada uno | Tu empresa ya está aquí como **Alcasi Systems, S.L.** con datos del Registro Mercantil. Objetivo: que aparezcan la **web** y el **nombre comercial**. Pasos: buscar "Alcasi Systems" → "Es mi empresa / Modificar datos" → crear cuenta → añadir Web `https://actiondev.es`, nombre comercial "Action Development", teléfono, email, descripción y actividad. Según la FAQ, los campos añadidos por la empresa aparecen marcados como tales. Si no permiten editar (otro usuario ya la reclamó o no verifican la relación), escribir a su soporte. eInforma/Iberinform: el formulario exacto para añadir web y nombre comercial es `verificar` (mismo proceso: buscar la ficha y reclamar) |
| 16 | **Cámara de Comercio de Pontevedra, Vigo y Vilagarcía** | https://www.camarapvv.com/ (C/ República Argentina, 18 A, 36201 Vigo; 986 43 25 33) | La afiliación es voluntaria: cuota `verificar`. Servicios de digitalización de pymes con ayudas (`verificar`) | Llamada + 1 semana | Pedir alta en su censo/directorio de empresas y en programas de digitalización: la agencia puede figurar como proveedor de servicios digitales (Acelera pyme / Kit Digital: `verificar` si hay convocatoria abierta y requisitos de "agente digitalizador") |
| 17 | **Clúster TIC Galicia** | https://www.clusterticgalicia.com/asociarse/?lang=es | Cuota `verificar` | 2-4 semanas | **Ojo:** según su web, pueden asociarse empresas TIC con sede, domicilio fiscal o instalaciones en Galicia y **mínimo 3 personas empleadas a tiempo completo al año** (o socios especiales para empresas recién creadas). `verificar` si Action lo cumple antes de solicitar |
| 18 | **INEO** (Asociación de Empresas de Tecnología de Galicia) | https://www.ineo.org/ (Av. García Barbón, 104, Edificio Vista Alegre, of. 10, Vigo) | Cuota `verificar` | 1-4 semanas | Asociación empresarial TIC con sede en Vigo (20 aniversario en 2026). Da ficha de socio con enlace, eventos, networking y acceso a información de subvenciones. Solicitar por su web o presencialmente |
| 19 | **Zona Franca de Vigo (startTIC / CEI)** | `verificar` URL (empezar por el programa startTIC en la web del Consorcio) | Programa sin coste directo en las convocatorias citadas, `verificar` | Convocatoria | Es incubadora para startups tecnológicas, no directorio: encaje dudoso para una agencia con clientes. Solo si se presenta un producto propio. Prioridad baja |
| 20 | **VigoTech Alliance** | https://vigotech.org/ (GitHub: https://github.com/VigoTech) | Gratis | Continuo | No es un directorio de pago: es la comunidad (GDG Vigo, PHPVigo, PythonVigo, JavaScript Vigo…). Aporta charlas y enlaces desde sus páginas; ver §6 |

**Extras** (todos gratis): LinkedIn Company (dirección, sector "Servicios de tecnologías de la información", web, logo y descripción de 750); Instagram (bio de 160); GitHub org con repos demo; Yelp España `verificar` si aún tiene tráfico local; Google Search Console y Bing Webmaster (ver §7).

**Orden de ejecución sugerido:** semana 1: filas 1, 2, 3, 15 (Empresite web+nombre comercial), LinkedIn. Semana 2: 4, 5, 6, 7, 8. Semana 3-4: 13, 14, 16 y solicitudes 17/18 tras `verificar`. Clutch/GoodFirms/DesignRush: solo tras juntar 3 clientes para reseña.

**Hoja de seguimiento:** para cada alta, apuntar en una tabla: sitio · fecha · usuario (email compartido, no personal) · URL del perfil · estado (pendiente/verificado/publicado) · NAP idéntico (sí/no).

---

## 5. Wikidata (Alcasi Systems / Action Development)

**Honestidad primero.** Wikidata exige que el ítem cumpla su política de notabilidad (referencias públicas serias que lo identifiquen, o enlace a Wikipedia, o necesidad estructural). Un registro mercantil ya es una fuente, pero los ítems creados por la propia empresa y sin fuentes independientes suelen borrarse o revertirse. Recomendación: **crearlo solo cuando existan al menos 2 referencias independientes** (registro/informe mercantil + una noticia en prensa o un perfil en un directorio de terceros). No crear página de Wikipedia.

### Pasos

1. Cuenta personal en https://www.wikidata.org (no de la empresa) y declarar el conflicto de interés en tu página de usuario. Confirmar el correo.
2. Buscar duplicados: "Alcasi Systems" y "Action Development" en el buscador de Wikidata; si ya existe, editar, no crear.
3. Crear ítem ("Crear un nuevo ítem", https://www.wikidata.org/wiki/Special:NewItem):
   - Etiqueta (es/gl/en): **Alcasi Systems, S.L.**; alias: **Action Development**, **Action**.
   - Descripción es: "empresa de desarrollo de software de Vigo (España)".
4. Declaraciones. Comprobar cada propiedad y código Q en el editor (el ID exacto se elige al escribir): `verificar` cada uno.

| Propiedad | Valor | Referencia |
|---|---|---|
| instance of (P31) | business (Q4830453, `verificar`) / empresa | Registro Mercantil o informe (eInforma/Iberinform) |
| country (P17) | España | idem |
| headquarters location (P159) | Vigo (nota: la sede social registral es Marín; **decidir**: la oficina abierta al público está en Vigo. Poner Vigo con calificador "sede operativa" y Marín como otra declaración con rango normal. `verificar`) | Ficha de Google/web propia (fuente débil) + informe mercantil |
| inception (P571) | 2022-12-22 (constitución de la sociedad; la marca opera desde 2020 y solo va en la descripción o en un ítem de marca aparte) | Registro Mercantil de Pontevedra |
| official website (P856) | https://actiondev.es | Sin referencia necesaria (es la propia web) |
| legal form (P1454) | sociedad limitada (`verificar` el ítem exacto) | Informe mercantil |
| industry (P452) | desarrollo de software / desarrollo web | Web propia |
| EU VAT number (P3608) | ESB72910664 (`verificar` que P3608 sea la propiedad correcta y el formato con prefijo) | Informe mercantil |
| official name (P1448) | Alcasi Systems, S.L. | Registro |
| coordinates (P625) | **Solo con las coordenadas exactas del pin de GBP** (las de `seo.ts` son aproximadas) | Google Maps |
| Instagram username (P2003) | action.dev | El propio perfil |
| LinkedIn company ID (P4264) | `action-development` | El propio perfil |
| Google Knowledge Graph ID | solo si Google ya tiene entidad: `verificar` | — |

5. Referencias por declaración con "stated in" (P248) + URL + fecha de consulta: informe de eInforma/Iberinform, publicación del BORME de la constitución (`verificar` fecha de publicación), artículo de prensa, etc. Una declaración sin referencia se revierte.
6. Volver a la web: añadir `sameAs` con la URL de Wikidata al JSON-LD (`organizationSchema` en `packages/shared/src/seo.ts`) y a `llms.txt`.
7. Revisar el ítem cada 3 meses.

Opcional: segundo ítem para la **marca** "Action Development" (instance of brand, owned by Alcasi), solo si hay cobertura suficiente.

---

## 6. Plan de enlaces locales y PR a 6 meses (oct 2026 – mar 2027)

**Reglas:** foco en 2-4 enlaces buenos al mes, no cantidad. Todo enlace debe venir de una página real, local o técnica, y ser natural (sin comprar enlaces; Google penaliza esquemas de enlaces). Contactos: no encontré emails de redacción verificables; usar los formularios/teléfonos de cada medio (`verificar`).

**Listicles "mejores agencias" a los que pedir inclusión** (contacto: formulario de cada sitio; no hay email público comprobado):
- https://mejoresdevigo.es/desarrollo-web-vigo/ , /empresas-diseno-web/ (alta en /join/)
- https://www.sortlist.es/desarrollo-web/vigo-ga-es y https://www.sortlist.es/s/aplicacion-web/vigo-ga-es (necesitan perfil + reseñas en Sortlist)
- https://bocode-web.es/blog/mejores-agencias-diseno-vigo y https://pablolopezdesign.es/mejores-agencias-de-diseno-web-de-vigo/ (blogs de competidores: la inclusión es voluntaria y poco probable; no invertir tiempo salvo que contesten)

**Medios locales (ángulos basados en el repo):**
- *Faro de Vigo* (C/ Policarpo Sanz, 22, Vigo; teléfonos localizados en buscadores: 986 43 43 44 / 986 81 46 00: `verificar`), *Atlántico Diario* (https://www.atlantico.net/vigo/), *Diario de Vigo* (https://diariodevigo.com/), *Treintayseis / El Español* (https://www.elespanol.com/treintayseis/vigo/), *Metropolitano.gal* (`verificar` URL/contacto).
- Ángulos: (1) "Una agencia viguesa recrea el portal de su oficina en 3D como web de contacto y como un juego" (el hero "La Grúa" del puerto de Vigo, la sala recreativa `/projects`, la plaza de reseñas basada en Castrelos: visual, muy fotogénico); (2) "Un club de baloncesto de O Porriño cobra inscripciones desde su web" (PBB) con el cliente citado; (3) "Autoescuela GTI digitaliza matrículas y flota con un ERP propio" (con datos confirmados); (4) "Cómo un negocio de ocio de Vigo vende entradas sin taquilla" (Musa/La Fábrica, con permiso); (5) nota de "estudio de Vigo abre oficina en Rúa Colón" (solo si hay un hito real: aniversario, contratación, premio).

**Mes a mes**

| Mes | Acciones concretas | Entregable |
|---|---|---|
| **1 (oct)** | Ejecutar §4 filas 1-8 y 15; completar GBP (§2); pedir reseñas a los últimos 5 clientes (§3); alta en Mejores de Vigo (/join/) y Sortlist; solicitud INEO/Clúster TIC tras `verificar` | 8+ citaciones consistentes; NAP unificado; 3-5 reseñas nuevas |
| **2 (nov)** | Pedir a 5 clientes con web propia un enlace "Web desarrollada por Action Development" en su footer (Fisionorte, Autoescuela GTI, PBB, Samoa, Musa… los que tengan URL real en `projects.ts`; 18 de 31 tienen `url: "#"`, empezar por los que tienen URL); preparar nota de prensa n.º 1 (portal 3D) con 3 fotos y un vídeo corto; enviar a Faro de Vigo, Atlántico, Diario de Vigo y Treintayseis | 3-5 backlinks de cliente; 1 nota enviada |
| **3 (dic)** | Post de blog "Cuánto cuesta desarrollar una app en 2026" (borrador en `docs/blog-borradores-seo.md`) y compartirlo con INEO/Cámara/VigoTech; pedir enlace en la web de INEO si son socios; enviar el cierre de año a listicles de Mejores de Vigo | 1 post + 1-2 enlaces temáticos |
| **4 (ene)** | Proponer charla en VigoTech (GDG Vigo / JavaScript Vigo / PHP Vigo): "Un puerto 3D en el navegador con Three.js y R3F" o "De la idea a la app: cómo cerramos un MVP en 8 semanas" (solo si es verdad); enlace a la charla desde meetup/GitHub de VigoTech | 1 charla propuesta y agendada |
| **5 (feb)** | UVigo: contactar con prácticas del centro de informática (la ESEI está en el campus de Ourense: https://esei.uvigo.es/es/docencia/practicas-en-empresa/; en Vigo, la vía es la Escola de Enxeñaría de Telecomunicación y la Fundación Universidade de Vigo, que tramita los convenios de prácticas: `verificar`). Ofrecer 1-2 plazas de prácticas y una charla. Nota de prensa n.º 2 (PBB o Autoescuela GTI) | Convenio de prácticas iniciado; 1 enlace .gal/.es institucional (verificar) |
| **6 (mar)** | Patrocinio pequeño: un evento de VigoTech, un club deportivo local o un torneo (300-500 € máx.), a cambio de logo y enlace en su web (pedirlo por escrito); revisar resultados de los 6 meses y decidir Clutch/GoodFirms si hay 3 reseñas de cliente | 1 patrocinio con enlace; informe de resultados (§7) |

Otras vías sin coste: Awwwards / CSS Design Awards / FWA (perfil y enlace de máxima autoridad; ya recomendado en el playbook), Product Hunt para un producto propio, GitHub org con repos demo, y "colaboraciones cruzadas" con estudios de diseño/branding y fotógrafos de Vigo (enlace mutuo en portfolio, sin intercambios masivos).

Métrica de éxito a 6 meses: 8-12 dominios de referencia nuevos y locales/temáticos, 15+ reseñas nuevas en Google, presencia en ≥2 listicles locales y ≥1 mención en prensa.

---

## 7. KPIs y herramientas

### Herramientas

| Herramienta | Uso | Coste |
|---|---|---|
| **Google Search Console** | Consultas, clics, indexación, enlaces (informe de enlaces). Propiedad ya en el playbook §1.1 | Gratis |
| **Bing Webmaster Tools** | Indexación en Bing (alimenta ChatGPT Search y Copilot); importa desde GSC | Gratis |
| **Rendimiento de GBP** (ficha → Rendimiento) | Llamadas, cómo llegar, clics a web, búsquedas | Gratis |
| **Local Falcon** (https://www.localfalcon.com/pricing) | Rejilla 7×7 sobre Vigo = 49 puntos = 49 créditos por palabra clave y escaneo; paquetes desde 24,99 USD/mes (según su web; 100 créditos gratis al crear cuenta) | Pago |
| **Ahrefs Webmaster Tools** / Semrush | Backlinks y dominios de referencia | Gratis / pago |
| **Seguimiento de prompts en IA** | Hoja de cálculo manual (ver abajo) | Gratis |

### Configuración de la rejilla (Local Falcon)

- Centro: coordenadas exactas del pin de la oficina (Rúa Colón, 20), 7×7, radio 5 km (ajustable: 3 km si la densidad urbana es alta).
- Palabras: "desarrollo de aplicaciones vigo", "desarrollo web vigo", "diseño web vigo", "agencia desarrollo web vigo", "tienda online vigo".
- Frecuencia: 1 escaneo mensual por palabra en las primeras 4 semanas de cada mes (49 créditos × 5 = 245/mes); guardar capturas y ARP/ATRP/SoLV (promedio de posición y % de rejilla en top 3).

### Seguimiento de prompts en IA (mensual, 30 min)

Preguntar en modo con búsqueda a ChatGPT, Perplexity, Gemini, Claude y Copilot, en incógnito, misma redacción cada mes:
1. "mejor empresa de desarrollo de aplicaciones en Vigo"
2. "agencia de desarrollo web en Vigo"
3. "quién hace tiendas online en Vigo"
4. "empresas de software a medida en Galicia"
5. "recomiéndame una agencia para hacer una app en Pontevedra"
Registrar: ¿aparece Action Development? (sí/no), posición en la lista, fuente que cita (¿mejoresdevigo? ¿Sortlist? ¿actiondev.es?), qué dice de nosotros (¿NAP correcto?) y competidores citados. Ajustar `llms.txt`, landings y directorios según las fuentes que cite.

### Tabla de KPIs mensuales (rellenar el día 1 de cada mes)

| KPI | Fuente | Mes 0 (oct 26) | Objetivo mes 3 | Objetivo mes 6 |
|---|---|---|---|---|
| Reseñas Google totales / nuevas en el mes | GBP | `verificar` (20-23) | +6 | +15 |
| Valoración media | GBP | 5,0 | ≥4,9 | ≥4,9 |
| % de reseñas con respuesta | GBP | — | 100 % | 100 % |
| Llamadas desde GBP | GBP → Rendimiento | `verificar` | +25 % | +60 % |
| Solicitudes de "cómo llegar" | GBP | `verificar` | +25 % | +60 % |
| Clics a la web desde GBP | GBP + UTM | `verificar` | +30 % | +80 % |
| Impresiones de la consulta "desarrollo de aplicaciones vigo" | GSC | `verificar` | crece | top 5 |
| Posición media de las 5 palabras núcleo | GSC | `verificar` | ≤15 | ≤8 |
| Clics orgánicos totales | GSC | `verificar` | +40 % | +100 % |
| Páginas indexadas (10 URLs núcleo) | GSC | 10 | 10 | 10 |
| % de rejilla en top 3 (Local Falcon, palabra núcleo) | Local Falcon | `verificar` | ≥25 % | ≥50 % |
| Dominios de referencia nuevos | Ahrefs WMT / GSC enlaces | — | +4 | +12 |
| Citaciones con NAP idéntico | Hoja de seguimiento | — | 12 | 15+ |
| Apariciones en respuestas de IA (de 5 prompts) | Hoja manual | `verificar` | 2/5 | 4/5 |
| Leads (WhatsApp, email, formulario de llámame) atribuibles a orgánico/GBP | GA/GTM (con consentimiento) + preguntar "¿cómo nos has conocido?" | `verificar` | +25 % | +60 % |

Los objetivos son orientativos: sin línea base, fijar el mes 0 en octubre y recalcular los objetivos.

---

## 8. "Hazlo esta semana" (dueño, < 3 horas)

Orden por retorno. Cronómetro orientativo entre paréntesis.

- [ ] (10 min) Abrir GBP y comprobar: nombre "Action Development", dirección "Rúa Colón, 20, 36201 Vigo, Pontevedra", teléfono `+34 614 02 74 10`, web con UTM (§2.4), horario real, fecha de apertura.
- [ ] (10 min) Confirmar que la categoría principal es una de software y añadir secundarias (§2.1); quitar "marketing" si está.
- [ ] (15 min) Pegar los 9 servicios de §2.2 y la descripción de 750 caracteres de §1.
- [ ] (10 min) Añadir las 20 zonas de servicio de §2.3.
- [ ] (20 min) Subir 10 fotos reales (§2.6): fachada, portal, oficina, equipo.
- [ ] (10 min) Publicar el post 1 de §2.5 y programar los siguientes en el móvil.
- [ ] (15 min) Mandar la plantilla A de §3.3 a los 5 últimos clientes con proyecto entregado; contestar todas las reseñas sin respuesta con §3.4.
- [ ] (20 min) Alta en Bing Places importando desde Google (§4, fila 1) y en Bing Webmaster.
- [ ] (15 min) Alta/reclamación en Apple Business (§4, fila 2).
- [ ] (20 min) Alta en Páxinas Galegas (§4, fila 3).
- [ ] (20 min) Empresite: reclamar "Alcasi Systems, S.L." y añadir web y nombre comercial (§4, fila 15).
- [ ] (10 min) Alta en Mejores de Vigo: https://mejoresdevigo.es/join/
- [ ] (10 min) LinkedIn Company y Instagram: descripción de 160, web y dirección exactas.
- [ ] (5 min) Anotar en la hoja de seguimiento (§4) y en KPIs el estado mes 0.

**Fuera de las 3 horas, pero esta semana:** pedir a desarrollo que cree `/software-a-medida-vigo` (aviso 1), sustituir las coordenadas aproximadas de `seo.ts` por las exactas del pin de GBP, y decidir si Action cumple los requisitos de Clúster TIC / INEO.

---

### Fuentes consultadas (30 sep 2026)

- Apple Business: https://business.apple.com/ · Bing Places: https://www.bing.com/forbusiness/ · Páxinas Galegas: https://www.paxinasgalegas.es/altaEmpresas.aspx
- Sortlist: https://help.sortlist.com/en/articles/1714404-how-to-be-listed-as-a-provider-on-sortlist · Trustlocal: https://trustlocal.es/registro-de-empresa/ · Mejores de Vigo: https://mejoresdevigo.es/desarrollo-web-vigo/
- Cylex: https://www.cylex.es/info/faq.html · Páginas Amarillas: https://www.paginasamarillas.es/a/registro/ · Empresite FAQ: https://empresite.eleconomista.es/FAQS.html
- Clutch: https://help.clutch.co/en/knowledge/get-listed-on-clutch · GoodFirms: https://help.goodfirms.co/how-can-my-business-get-listed-on-goodfirms/ · DesignRush: https://www.designrush.com/submit/agency
- Foursquare: https://support.foursquare.com/hc/en-us/articles/14902466076188-How-do-I-claim-my-listing · Clúster TIC Galicia: https://www.clusterticgalicia.com/asociarse/?lang=es · INEO: https://www.ineo.org/ · VigoTech: https://vigotech.org/
- Cámara PVV: https://www.camarapvv.com/ · UVigo prácticas: https://esei.uvigo.es/es/docencia/practicas-en-empresa/ · Local Falcon: https://www.localfalcon.com/pricing
- Categorías GBP en español: https://victormisa.com/entradas/categorias-my-business/ · Ayuda de Google: https://support.google.com/business/answer/7249669?hl=es
