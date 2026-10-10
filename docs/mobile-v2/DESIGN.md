# DESIGN.md — Action Development, web móvil v2

Sistema de diseño de la nueva web móvil (`apps/mobile`). Es la misma familia visual que Curro (`~/Developer/curro/DESIGN.md`): ficha técnica suiza, papel, tinta, celdas con filetes y letra condensada gruesa. Lo que cambia es la identidad: el acento es el **lima de Action** y la web está escrita para vender a un dueño de pyme que no sabe de tecnología.

Maquetas de referencia en esta carpeta: `home.html`, `landing-app.html`, `formulario.html` y `proyectos.html` (con la ficha de caso). `index.html` las enseña juntas para aprobarlas. Capturas en `shots/`.

## 1. Qué tiene que conseguir cada pantalla

Un dueño de pyme de Vigo tiene que entender en cinco segundos:

1. **Qué hacéis.** Titular literal: «Apps, programas y webs para tu negocio».
2. **Por qué vosotros.** Pruebas que se pueden comprobar, sin adjetivos: capturas de proyectos reales, reseñas con nombre, «5,0 en Google · 22 reseñas», oficina en Rúa Colón 20 (Vigo), presupuesto cerrado y por escrito, y la primera reunión gratis y sin compromiso.
3. **Qué hacer ahora.** Un único CTA principal, **Contar mi proyecto**, y WhatsApp siempre a mano.

No hay fotos del equipo ni de la oficina, y no se reservan huecos para ellas. La parte humana la ponen la tipografía, las reseñas con nombre y los datos de empresa (Alcasi Systems, S.L., CIF B72910664, Registro Mercantil de Pontevedra).

## 2. Qué se hereda de Curro y qué cambia

| | Curro | Action móvil v2 |
|---|---|---|
| Fondo / tinta | `#EDEAE3` / `#121212` | Igual |
| Acento de acción | Naranja `#FF5A1F` | **Lima de marca `#C8FF00`** (el `--accent` de `apps/desktop/src/app/globals.css`) |
| Lima | `#D7F93A` | Desaparece: un solo lima, el de Action |
| Violeta | `#5B4BFF` para empresa y contrato | **Retirado.** Con el lima hace un par complementario chillón que compite con el acento, y el violeta es el color de las webs «de IA» que el cliente quiere evitar |
| Naranja | Color de marca | **Retirado.** Action ya no usa naranja |
| Logo | Cuadrado naranja + CURRO | Logotipo real de Action (`assets/logo-tinta.png`, `assets/logo-papel.png`), sin tocar |
| Numeración 01/02/03 | En casi todas las listas | **Solo donde hay secuencia real:** pasos del proceso y pasos del formulario. Servicios y proyectos no se numeran |
| Formas | 8 formas por disciplina | 4 formas, una por servicio, sacadas del logo (ver §4) |
| Foco | Contorno naranja | Contorno tinta sobre claro y lima sobre tinta |

## 3. Tokens

### Color

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#121212` | Texto, filetes, bloques negros, botón secundario, tile seleccionado |
| `paper` | `#EDEAE3` | Fondo de toda la web |
| `grey` | `#D9D5CC` | Bloques neutros, separador de pantallas, servicio «Conectar programas» |
| `lime` | `#C8FF00` | **Solo superficies que se pulsan o que marcan algo:** CTA principal, barra fija, casilla marcada, paso 01, servicio «Apps», CTA final |
| `muted` | `#4A4741` | Etiquetas y texto secundario sobre papel, gris o lima |
| `muted-dark` | `#B9B5AC` | Etiquetas sobre tinta |
| `line-dark` | `#5A5750` | Filetes sobre tinta (decorativos) |

Reglas del lima:

- **Nunca es texto sobre papel** (1,02:1). Sobre papel, el lima solo existe como bloque con texto tinta encima.
- **Como texto, solo sobre tinta**: la cifra «×10» del resultado y el enlace activo del menú.
- **Tres superficies lima como máximo por pantalla de 844 px**, contando la barra fija. Si aparece una cuarta, se quita la menos importante.
- No hay degradados, transparencias ni tintes del lima (`rgba`, `/10`…). O está o no está.

### Contrastes comprobados (WCAG 2.2)

| Texto | Fondo | Ratio | AA texto normal |
|---|---|---|---|
| `ink` | `paper` | 15,59:1 | Sí |
| `ink` | `lime` | 15,84:1 | Sí |
| `ink` | `grey` | 12,79:1 | Sí |
| `paper` | `ink` | 15,59:1 | Sí |
| `lime` | `ink` | 15,84:1 | Sí |
| `muted` | `paper` | 7,70:1 | Sí |
| `muted` | `lime` | 7,83:1 | Sí |
| `muted` | `grey` | 6,32:1 | Sí |
| `muted-dark` | `ink` | 9,16:1 | Sí |
| Placeholder `#5A5750` | `paper` | 6,00:1 | Sí |
| `lime` | `paper` | 1,02:1 | **No. Prohibido como texto** |
| `line-dark` | `ink` | 2,60:1 | Solo filete decorativo, nunca borde de control ni texto |

Bordes de controles (inputs, tiles, botones de contorno) siempre en `ink` sobre claro: 15,6:1, por encima del 3:1 de 1.4.11.

### Tailwind v4 para `apps/mobile`

```css
@theme {
  --color-*: initial;
  --color-ink: #121212;
  --color-paper: #edeae3;
  --color-grey: #d9d5cc;
  --color-lime: #c8ff00;
  --color-muted: #4a4741;
  --color-muted-dark: #b9b5ac;
  --color-line-dark: #5a5750;
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
}
```

Igual que en Curro: se borra la paleta de Tailwind, el radio y las sombras, para que no se puedan usar por accidente.

## 4. Servicios: tono, forma e icono

Cada servicio se reconoce por tres cosas a la vez, para que nunca dependa solo del color.

| Servicio (nombre en la web) | Valor `LeadNeed` | Tono | Forma | Icono |
|---|---|---|---|---|
| Apps para móvil | `app` | `lime` | Círculo: el punto final de «development.» | `mobile_3` |
| Programas de gestión | `software` | `ink` | Cuadrado | `dashboard` |
| Conectar programas | `integration` | `grey` | Cruz (+) | `sync_alt` |
| Webs y tiendas online | `web` | `paper` | Semicírculo: la media esfera del logo | `web` |

- Las **formas** son decorativas (`aria-hidden`): en la fila de servicios, en los chips y en las portadas generativas.
- Los **iconos** son funcionales: en los tiles del formulario, donde ayudan a reconocer la opción.
- Ningún tono compite con el lima: los otros tres son neutros.

## 5. Tipografía

Google Fonts: **Saira Condensed** 600–900 (display y etiquetas, siempre en MAYÚSCULAS) y **Saira Semi Condensed** 400–700 (texto). En Next, con `next/font/google`, variables `--font-display` y `--font-body`.

| Rol | Familia | Peso | Tamaño / interlineado | Tracking | Dónde |
|---|---|---|---|---|---|
| Hero | Condensed | 900 | 66 / 0,84 | −0,02em | H1 de inicio y de Proyectos |
| H1 | Condensed | 900 | 56 / 0,86 | −0,02em | Formulario, ficha, CTA final |
| H2 | Condensed | 900 | 46 / 0,88 | −0,01em | Secciones. En landing, H1 a 42 |
| H3 | Condensed | 900 | 32 / 0,92 | −0,01em | Título de caso |
| H4 | Condensed | 900 | 24 / 0,95 | −0,01em | Servicio, paso, pregunta del formulario |
| Valor de celda | Condensed | 800 | 21 / 1,1 | 0 | Celdas etiqueta/valor, nombre en reseña |
| Botón | Condensed | 800–900 | 19–22, CTA hero 40 | 0,03–0,05em | Botones y barra fija |
| Pregunta FAQ | Condensed | 800 | 21 / 1,05 | 0 | `summary` |
| Etiqueta | Condensed | 600 | 12 / 1,2 | 0,1em | Encima de cada valor. Color `muted` |
| Entradilla | Semi Condensed | 500 | 19 / 1,4 | 0 | Bajo titulares, máx. 34ch |
| Cita de reseña | Semi Condensed | 500 | 20 / 1,38 | 0 | Máx. 34ch |
| Texto | Semi Condensed | 400 | 16–17 / 1,45 | 0 | Párrafos |
| Pequeño | Semi Condensed | 400–500 | 13–15 / 1,4 | 0 | Ayudas, RGPD |

- El texto corrido nunca baja de 16 px. Las etiquetas de 12 px son la única excepción y siempre van en `muted` con 7,7:1.
- Las opciones largas del formulario («Ya existe y hay que mejorarlo o conectarlo») van en Semi Condensed 600 sin mayúsculas: se leen mejor.
- Los importes del presupuesto se escriben tal cual, sin forzar mayúsculas: «Menos de 5k».
- `text-wrap: balance` en titulares.

## 6. Retícula de 390 px

- **Medianil lateral:** 16 px (`--g`). Todo el texto respeta ese margen.
- **Celdas a sangre:** los bloques ocupan los 390 px y se separan con filetes, no con huecos. Técnica de Curro: contenedor con `gap: 1px; background: ink` e hijos con su propio fondo.
- **Filetes:** 1 px dentro de un bloque y 2 px entre secciones.
- **Columnas:** 1 columna para texto; 2 de 195 px para celdas y tiles; 3 de 130 px para las opciones cortas (Llamada / WhatsApp / Email).
- **Columna fija de índice:** 72 px para el número de paso y la forma de servicio; 56–64 px para flechas y el «+» de las preguntas.
- **Ritmo vertical:** múltiplos de 4. Secciones con 48 px arriba y 16 px hasta el filete del titular.
- **Objetivos táctiles:** 44 px como mínimo, 56 px en botones y 64 px en la barra fija.
- **Barra fija:** 64 px más `env(safe-area-inset-bottom)`. El pie lleva ese mismo relleno abajo para que nada quede tapado.

## 7. Componentes

Cada uno está montado en las maquetas. El CSS de referencia está en el `<style>` de cualquiera de ellas: es el mismo bloque base.

**Cabecera** (`.hdr`). 60 px, filete inferior de 2 px. Logo de 34 px de alto | WhatsApp en una celda de 60 × 60 | botón **MENÚ** negro. No es fija: la barra inferior ya da acceso permanente. En landings de anuncios: logo y WhatsApp, sin menú.

**Menú a pantalla completa** (`.menu`). Fondo tinta, logo en papel y **CERRAR**. Enlaces en Condensed 900 de 54 px con flecha, separados por filetes `line-dark`: Inicio, Servicios, Proyectos, Reseñas, Blog y Contacto (Blog desde el 2026-10-09). La página activa va en lima. Debajo, el bloque lima «Contar mi proyecto» con WhatsApp al lado, y dirección, teléfono y email como texto seleccionable. En React: `<dialog>` modal, foco atrapado, Esc cierra y se bloquea el scroll (como `MobileMenu.tsx` de Curro).

**Hero de inicio.** H1 + entradilla → bloque lima a sangre con **CONTAR MI PROYECTO** a 40 px, flecha de 58 px y la frase «La primera reunión es gratis y sin compromiso. Te respondemos en 24 horas laborables.» → fila negra «Escribir por WhatsApp» con el número → celdas: reseñas, oficina y presupuesto. Todo cabe en los 844 px.

**Celda etiqueta/valor** (`.cell` en `.cells`). Etiqueta de 12 px arriba y valor abajo. Base flexible de 160 px: dos por fila a 390 px, y `.full` para la fila entera. Variantes de fondo: papel, gris, tinta y lima.

**Chip de servicio** (`.chip`). Rectángulo con borde de 1 px, Condensed 800 de 13 px en mayúsculas y forma de 12 px delante. Fondo con el tono del servicio.

**Tarjeta de caso** (`.case`). Portada a sangre: mockup 4:3, o 4:5 si es vertical → cabecera con título H3 y chips, más una celda de 64 px con la flecha que se pone lima al pulsar → dos celdas **Antes / Ahora** → banda negra de **Resultado**, solo si el repo tiene una cifra real (hoy, solo Autoescuela GTI: ×10). Si no hay imagen, **portada generativa**: bloque del tono del servicio, su forma y una frase corta en Condensed 900. Nunca una caja gris vacía.

**Tira de más proyectos** (`.strip`). Scroll horizontal con *snap*. Tarjetas de 232 px con imagen cuadrada, nombre y tipo.

**Banda de reseñas** (`.rating`). El elemento firma, heredero de la banda DISPONIBLE de Curro: fondo tinta, «5,0» a 132 px, cinco estrellas, «22 reseñas en Google», «Todas de 5 estrellas» y el enlace «Leerlas en Google» a la ficha real (`mapsUrl`).

**Reseña** (`.review`). Cinco estrellas, cita en Semi Condensed 500 de 20 px, y nombre y empresa o lugar. Sin avatar, sin foto y sin comillas decorativas.

**Servicios** (`.svc`). Cuatro filas a sangre con su tono: forma en una columna de 76 px | nombre H4 + una frase | flecha. Al pulsar se invierten a tinta, y la fila de tinta pasa a lima.

**Pasos del proceso** (`.steps`, `<ol>`). Número 01–04 en una columna de 72 px | título H4 + texto. El paso 01 lleva la celda del número en lima, porque es el gratuito.

**FAQ** (`.faq`, `<details>`). Pregunta en Condensed 800, con «+» o «−» en una celda de 56 px. Abierta: cabecera en tinta. Sin JS.

**CTA final** (`.cta-final`). Bloque lima, H1 con la pregunta, entradilla, botón tinta **Contar mi proyecto** y botón de contorno **Escribir por WhatsApp**.

**Barra fija inferior** (`.bar`). Botón lima **CONTAR MI PROYECTO** + cuadrado tinta de 64 px con WhatsApp. Aparece cuando el CTA del hero sale de pantalla y se oculta con el formulario a la vista, con la misma lógica de dos `IntersectionObserver` que `StickyCta.tsx` de desktop. Tampoco aparece con el banner de cookies abierto.

**Formulario por pasos** (`.lf`). Mismos datos, validación y envío que `LeadForm.tsx`. Cambia la piel, no la lógica.

- **Cabecera de paso:** «Paso 1 de 2» y dos barras de 8 px (rellena / contorno). En el paso 2, **Atrás** en una celda a la derecha.
- **Paso 1:** «¿Qué necesitas?» en tiles de 2 × 2 con icono, nombre y casilla, más «¿En qué punto estás?» en tres filas. Botón tinta **Siguiente** y enlace a WhatsApp.
- **Paso 2:** Nombre, Empresa (opcional), Teléfono y Email. Presupuesto en tiles: «Menos de 5k / 5-15k / 15-40k / Más de 40k / Aún no lo sé», sin símbolo de euro. Textarea opcional y «¿Cómo prefieres que te contactemos?» en tres tiles (WhatsApp marcado por defecto). Debajo, la primera capa RGPD literal, el botón lima **Enviar mi proyecto** y «Te respondemos en 24 horas laborables». En `/hablemos/*` (anuncios): la nota «Lee abajo la información básica sobre protección de datos.», el botón lima **Enviar mi proyecto**, «Te respondemos en 24 horas laborables» y la primera capa RGPD literal, con el título «Información básica sobre protección de datos».
- **Tiles** (`.tile`): `<label>` con un `<input type="radio">` real oculto; el estado se pinta con `:has(input:checked)`. **Seleccionado = fondo tinta, texto papel y casilla lima con check.** Sin selects en ningún sitio.
- **Campos:** caja de 56 px con borde de 2 px en tinta y radio 0. Valor en Condensed 800 de 22 px y textarea en Semi Condensed de 17 px. La etiqueta va arriba, siempre visible; el placeholder nunca hace de etiqueta.
- **Variante compacta** (landing): los tiles de necesidad pasan a horizontal (icono + nombre, casilla en la esquina, 76 px) para que el botón **Siguiente** quede dentro de la primera pantalla.

**Pie** (`.ftr`). Fondo tinta. Logo en papel a todo el ancho → celdas con oficina, teléfono y email → seis enlaces en rejilla 2 × 3 (Proyectos, Servicios, Reseñas, Blog, Google, Contacto; Reseñas y Blog desde el 2026-10-09, por paridad de enlaces con el Header de escritorio) → «Action Development es el nombre comercial de Alcasi Systems, S.L., CIF B72910664, inscrita en el Registro Mercantil de Pontevedra» y los enlaces legales. En landings de anuncios, versión mínima sin logo grande ni navegación.

## 8. Estados

| Estado | Regla |
|---|---|
| Reposo | Fondo plano. Sin sombra, radio, degradado ni transparencia |
| *Hover* (puntero fino) | Inversión seca: papel → tinta, tinta → lima, lima → tinta con texto lima. Sin transición |
| Pulsado (`:active`) | La misma inversión. Las cajas además bajan 1 px (`translateY(1px)`); el texto no se mueve |
| Foco (`:focus-visible`) | `outline: 3px solid ink; outline-offset: 2px`. Sobre tinta (`.on-ink`), el contorno pasa a lima. En tiles, contorno interior (`offset: -6px`) |
| Seleccionado | Tile en tinta con casilla lima y check. Filtro y menú: fondo tinta o texto lima, con `aria-pressed` o `aria-current` |
| Abierto (FAQ) | Cabecera en tinta y «−» |
| Error de campo | Borde de 3 px y, debajo, una caja tinta con un cuadrado lima «!» y el mensaje en papel: «Revisa el teléfono: necesitamos al menos 9 dígitos». Mensajes de `LeadForm.tsx`, que ya dicen qué falta y cómo arreglarlo. Sin rojo: el aviso se ve por forma y posición, no por color |
| Desactivado / enviando | Opacidad 0,5 y `aria-busy`. El botón dice «Enviando…» |

## 9. Movimiento

Mínimo y seco, como en Curro.

- Cambios de color **instantáneos** al pulsar o al pasar el puntero.
- Sin animaciones de entrada por sección, sin parallax, sin contadores que suben y sin *fade-up*. La página está completa nada más cargar.
- El menú y la barra fija aparecen sin transición. Como mucho, 120 ms de `transform` si producción lo pide, nunca de `opacity` desde 0.
- El único gesto que acompaña al usuario es el **foco**: al pasar al paso 2 va al campo Nombre, y al volver, a la necesidad elegida (ya lo hace `LeadForm.tsx`).
- `prefers-reduced-motion: reduce` anula cualquier transición o animación.

## 10. Reglas «anti-IA»

Prohibido, sin excepciones:

- Degradados de cualquier tipo, y en especial violetas o morados. Tampoco texto con degradado.
- Tarjetas con sombra y radio. Radio 0 en todo; solo el círculo y el semicírculo de las formas son curvos.
- Glassmorphism, `backdrop-filter` y brillos (*glow*).
- Iconos de línea fina tipo Lucide, Feather o Heroicons outline.
- Bloques de tres beneficios genéricos (icono + titular + frase, repetidos tres veces).
- Frases de agencia: «Transformamos tu visión», «Soluciones digitales a medida», «Llevamos tu negocio al siguiente nivel», «Innovación», «Experiencias únicas».
- Emojis, incluidos los de los textos de WhatsApp precargados.
- Estadísticas inventadas o redondeadas a ojo: «+100 proyectos», «98 % de clientes satisfechos». Las cifras salen del repo (§12).
- Un *eyebrow* en mayúsculas encima de cada titular. Las etiquetas pequeñas solo existen sobre un valor.
- Numeración decorativa: 01/02/03 solo en secuencias reales.
- Fotos de stock, avatares o personas generadas. No hay fotos del equipo ni huecos para ellas.
- Iconos de marca de colores (el verde de WhatsApp, por ejemplo): todo icono va en `currentColor`.
- Fuentes Inter, Roboto, Arial o Space Grotesk.

## 11. Voz y vocabulario

- Español de España, tuteo, frases cortas y verbos activos. Se habla de lo que el cliente reconoce (llamadas, Excel, citas, entradas), no de tecnología.
- Los nombres de las acciones no cambian en todo el recorrido: **Contar mi proyecto** (abre el formulario) → **Siguiente** → **Enviar mi proyecto**. **Escribir por WhatsApp**. **Leerlas en Google**.
- Cada caso se cuenta como **Antes / Ahora**, a partir del patrón problema → solución de `apps/pablo/src/data/work.ts`.
- **Sin el símbolo del euro ni cifras en euros** en ninguna pantalla (regla de la cuenta). Presupuesto: «Menos de 5k / 5-15k / 15-40k / Más de 40k / Aún no lo sé».
- La frase «La primera reunión es gratis y sin compromiso» está confirmada por el cliente y aparece en el hero, en el paso 01, en el menú y en el formulario.

## 12. Contenido y veracidad

| Dato | Fuente |
|---|---|
| Casos con mockup (8) | `apps/pablo/src/data/work.ts` + imágenes de `apps/pablo/public/projects/` |
| Casos con captura | `packages/shared/src/projects.ts` + `apps/desktop/public/projects/` |
| «×10 trámites sin pasar por secretaría» | `projects.ts` → `autoescuela-gti.resultEs`, también en `ads-landings.ts` |
| Reseñas | `apps/desktop/src/data/testimonials.ts`: 22 entradas, todas de 5/5. Citas literales en español (`quoteEs`) |
| Dirección, teléfono, email, ficha de Google | `packages/shared/src/seo.ts` → `BUSINESS` |
| Razón social, CIF y registro | `seo.ts` → `LEGAL_ENTITY` |
| Proceso, FAQ y textos de la landing de apps | `apps/desktop/src/data/ads-landings.ts`, en lenguaje más llano |
| Formulario, opciones y RGPD | `LeadForm.tsx` y `packages/shared/src/leads.ts` |

Cruce entre `work.ts` y `projects.ts` (sin duplicar casos):

| `work.ts` | `projects.ts` | Nombre en la web |
|---|---|---|
| `autoescuela` | `autoescuela-gti` | Autoescuela GTI (app de `work.ts` + ERP y ×10 de `projects.ts`) |
| `fase` | `fase` | Fasepower |
| `la-fabrica` | `ticketera-la-fabrica` | La Fábrica (Redondela) |
| `cliche` | `cliche` | Cliché |
| `patricia-avendano` | `patricia-avendano` | Patricia Avendaño |
| `true-trading` | `true-trading-app` | TrueTrading |
| `trading-app` | Sin equivalente claro (ver dudas) | Trading App |
| `biyoga` | Solo en `work.ts` | Biyoga |

No se usan: la cifra del +40 % de Musa (su descripción en `projects.ts` habla de «restaurante» y no cuadra con una sala de ocio), el «200 %» de la reseña de Sleepy ni los «multiplicó los pedidos» sin número de varios `resultEs`. No son comprobables.

## 13. Iconos

### Comparativa (`shots/iconos-comparativa.png`)

| | Material Symbols **Sharp 700** | Phosphor **Bold** | Tabler (stroke 2,5) | Iconoir (stroke 2) |
|---|---|---|---|---|
| Paquete | `@material-symbols/svg-700` 0.47.4 | `@phosphor-icons/react` 2.1.10 | `@tabler/icons-react` 3.48.0 | `iconoir-react` 7.12.1 |
| Licencia | Apache-2.0 | MIT | MIT | MIT |
| Remates y esquinas | **Rectos, ángulos de 90°, sin radio** | Redondos (caps y joins) | Redondos; forzar `square` deja los `rx` internos redondeados | Redondos |
| Grosor en 24 px | Relleno equivalente a ~2,4 px, uniforme | Grueso | Medio | Fino-medio |
| Tree-shaking | SVG sueltos: solo se copian los que se usan (19 iconos, 5,2 KB sin minificar) | Bueno, pero cada icono arrastra el *wrapper* de pesos | Bueno | Bueno |
| WhatsApp | No (Google no incluye marcas) | Sí | Sí | Sí |
| Encaje con radio 0 | **Total** | Bajo | Medio | Bajo |

**Elegido: Material Symbols Sharp, peso 700**, del paquete `@material-symbols/svg-700@0.47.4` (estilo `sharp/`). Es el único de los cuatro con remates rectos y esquinas vivas de serie, el mismo lenguaje que los filetes y las formas. Al ser formas rellenas, el grosor no depende de un `stroke-width` que alguien pueda bajar. Phosphor y Tabler tienen WhatsApp, pero sus terminaciones redondas son justo el aire SaaS que el cliente rechaza. Se fija la 0.47.4 (18 de septiembre de 2026), la versión de la que salen y con la que se han revisado estos SVG; la 0.47.5 y la 0.47.6 son posteriores.

**WhatsApp:** `icons/whatsapp.svg` está dibujado en la misma rejilla (`viewBox 0 -960 960 960`): anillo de 84 unidades (el grosor de Sharp 700), cola recta abajo a la izquierda y el auricular de `call-fill` de Material centrado. Una sola ruta, `currentColor`, coherente con el resto.

### Archivos en `icons/`

`arrow_outward` (flecha de marca ↗), `arrow_forward`, `arrow_back`, `arrow_downward`, `menu`, `close`, `check`, `add`, `remove`, `mobile_3` (apps), `dashboard` (programas de gestión), `sync_alt` (conectar programas), `web` (webs y tiendas), `location_on-fill`, `mail`, `call`, `schedule`, `star-fill` y `whatsapp`. Más `LICENSE-material-symbols.txt`.

Todos llevan `fill="currentColor"` y 24 × 24. Tamaños de uso: 18 (enlaces), 22–24 (UI), 26–30 (botones y celdas) y 58 (CTA del hero).

### Instalación en `apps/mobile`

```bash
pnpm --filter @actiondev/mobile add -D @material-symbols/svg-700@0.47.4
```

Como dependencia de desarrollo y solo como fuente: un script copia las rutas de los iconos usados a `src/components/icons/Icon.tsx` (un `Record<IconName, string>` con el `d` de cada uno y el `viewBox` común). Así el *bundle* solo lleva esos 19 iconos y no hace falta SVGR. `whatsapp` se añade a mano al mismo mapa. Todo icono es `aria-hidden`; el botón que lo contiene lleva `aria-label` si no tiene texto.

## 14. Archivos de esta carpeta

```
design/
├── DESIGN.md                 este documento
├── index.html                las 4 maquetas + el menú, en marcos de 390 × 844 con scroll propio
├── home.html                 inicio
├── landing-app.html          /hablemos/app, con el paso 1 del formulario en la primera pantalla
├── formulario.html           los dos pasos del formulario
├── proyectos.html            lista de casos con filtro + ficha de Autoescuela GTI
├── icons/                    19 SVG + licencia
├── assets/
│   ├── logo-tinta.png, logo-papel.png, isotipo-tinta.png, isotipo-papel.png
│   ├── casos/                8 mockups de apps/pablo/public/projects (reducidos a 1200 px)
│   └── capturas/             capturas de apps/desktop/public/projects (reducidas a 1000 px)
└── shots/                    capturas de Playwright a 390 × 844 (DPR 2): pantalla inicial, página completa, menú, barra fija, paso 2 y comparativa de iconos
```

Las maquetas cargan las imágenes con rutas relativas (`assets/…`) para que funcionen igual en local y publicadas. Los originales están en `~/actiondev/apps/pablo/public/projects/` y `~/actiondev/apps/desktop/public/`.

## 15. Dudas abiertas

1. **Trading App** (`work.ts`, 2026): no tiene equivalente seguro en `projects.ts`. Puede ser Lift o XauLabs. Hace falta saber qué cliente es y si se puede nombrar.
2. **Años que no cuadran:** `work.ts` dice 2026 para Autoescuela, Fasepower, La Fábrica, Cliché y TrueTrading, y `projects.ts` dice 2024. Las maquetas no muestran el año hasta que se aclare.
3. **Etiquetas del formulario:** propongo cambiar en `leads.ts` «Software de gestión o ERP» por «Programa de gestión o ERP» e «Integración entre programas» por «Conectar programas». Además, `LEAD_BUDGET_LABELS` lleva el símbolo del euro y cifras completas: hay que pasarlas a «Menos de 5k / 5-15k / 15-40k / Más de 40k / Aún no lo sé» o crear unas etiquetas solo para móvil. Los valores guardados (`lt5k`…) no cambian.
4. **Glifo de WhatsApp:** es un redibujo simplificado, no el archivo oficial de Meta. Sus normas de marca piden no alterar el logotipo. Si se quiere ir sobre seguro, se puede usar el glifo oficial monocromo con el mismo tamaño.
5. **Landings de programas, conexiones y webs:** las filas de servicios enlazan hoy a `#`. Solo existe `/hablemos/app` en esta entrega (y `/hablemos/software` en desktop).
6. **Timetracker y Nautirent** salen con portada generativa porque no tienen imagen. Si hay capturas autorizadas, se sustituyen.
