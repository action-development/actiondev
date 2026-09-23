# CLAUDE.md — Action (Digital Agency) — Monorepo

## SIEMPRE LEER (todos los prompts)

**Antes de escribir código:** entender el prompt exacto → leer los archivos afectados completos → diagnosticar causa raíz (bug) o qué existe ya (feature) → validar que la solución es robusta, sigue convenciones, usa patrones y componentes existentes, y es visualmente consistente. Duda → preguntar antes de actuar.

**Comunicación obligatoria — dos momentos fijos:**
1. **Antes de tocar código:** escribir al usuario en 2-4 líneas qué se entendió del prompt y qué se va a hacer exactamente. No empezar a codificar hasta haberlo escrito.
2. **Después de los cambios:** indicar qué archivos se modificaron, qué se cambió en cada uno y qué técnicas o patrones se usaron.

**Después de cada cambio:** actualizar `CLAUDE.md` (convención/stack/página nueva), `sitemap.ts` (página nueva/eliminada).

**Herramientas de calidad — usar proactivamente (disponibles en Bash):**
- `fallow dead-code` — detectar archivos/exports muertos antes y después de refactors
- `fallow dupes` — detectar duplicación antes de añadir código similar
- `fallow health` — score global; útil tras cambios grandes
- `pnpm --filter @actiondev/desktop screenshot` — captura visual con dev server corriendo (`pnpm --filter @actiondev/desktop dev`); guarda en `/tmp/screenshot.png`; leer con Read tool para verificar UI visualmente

**Testing UI — usar tras cambios de componentes o páginas:**
- `pnpm --filter @actiondev/desktop test:e2e` — smoke tests + regresión visual (requiere dev server corriendo)
- `pnpm --filter @actiondev/desktop test:e2e:update` — actualizar snapshots tras cambios visuales intencionales
- Tests en `apps/desktop/e2e/`: `smoke.spec.ts` (funcionalidad crítica) + `visual.spec.ts` (regresión visual)
- Al añadir una sección o componente nuevo → añadir test en `smoke.spec.ts`

**Performance — usar antes de deploy o tras cambios de bundle:**
- `pnpm --filter @actiondev/desktop analyze` — bundle analyzer visual (abre en browser); usar cuando se añadan dependencias nuevas o el bundle parezca crecer
- `pnpm --filter @actiondev/desktop perf:lh` — Lighthouse report completo (requiere dev server); genera `e2e/lighthouse-report.html`
- Targets mínimos: Performance ≥85, Accessibility ≥90, Best Practices ≥90, SEO ≥90

**Assets — verificar antes de cada deploy:**
- `pnpm --filter @actiondev/desktop assets:check` — lista assets con warnings si superan umbrales (vídeos >3MB, imágenes >200KB)
- `pnpm --filter @actiondev/desktop assets:optimize` — comprime GLBs con Draco + detecta assets pesados
- GLBs en `public/3d_models/` → optimizar con Draco antes de añadir nuevos modelos
- Vídeos en `public/projects_video/` → máximo 3MB por archivo; `musa-pot.webm` (6.5MB) necesita recomprimir

**Skills y MCPs — usar sin que te lo pidan:**

| Contexto detectado | Invocar |
|---|---|
| Crear/modificar componentes, páginas, UI, CSS, animaciones | skill `frontend-design` |
| Revisar UI existente, auditar accesibilidad, contraste | skill `web-design-guidelines` |
| Refactorizar componentes, props booleanas acumuladas | skill `vercel-composition-patterns` |
| Optimizar rendimiento React/Next.js | skill `vercel-react-best-practices` |
| Animaciones GSAP (core, tweens, easing) | skill `gsap-core` |
| Animaciones GSAP (scroll-linked, pins) | skill `gsap-scrolltrigger` |
| Animaciones GSAP en React (useGSAP, context) | skill `gsap-react` |
| Secuencias GSAP complejas | skill `gsap-timeline` |
| Plugins GSAP (ScrollSmoother, Flip, Draggable) | skill `gsap-plugins` |
| Optimización rendimiento GSAP | skill `gsap-performance` |
| Smooth scroll, Lenis | skill `implement_lenis_scroll` |
| Tailwind styling | skill `tailwind-css-patterns` |
| Escenas 3D, setup, cámaras, jerarquía | skill `threejs-fundamentals` |
| Shaders GLSL, ShaderMaterial, efectos custom | skill `threejs-shaders` |
| Animaciones 3D, keyframes, morph targets | skill `threejs-animation` |
| Geometrías, BufferGeometry, instancing | skill `threejs-geometry` |
| Materiales PBR, propiedades, texturas | skill `threejs-materials` |
| Interacción 3D, raycasting, controles | skill `threejs-interaction` |
| R3F best practices, Poimandres ecosystem | skill `r3f-best-practices` |
| Dudas sobre APIs del stack | MCP `context7` |

---

## Índice — leer solo las secciones del prompt

| Tipo de tarea | Leer |
|---------------|------|
| Cualquier tarea | `[CONTEXTO]` |
| Componentes | `[COMPONENTES]` + `PATTERNS.md` |
| Estilos, CSS, animaciones | `[ESTILOS]` `[DISEÑO]` |
| Páginas, routing | `[PÁGINAS]` `[SEO]` |
| API, base de datos | `[BACKEND]` |
| API routes, auth, env, deps | `[SECURITY]` |
| Deploy | `[DEPLOY]` |
| Rendimiento o bundle | `[PERFORMANCE]` |
| Refactorizar componentes | `[COMPOSICIÓN]` |
| Accesibilidad o auditoría UI | `[ACCESIBILIDAD]` |
| Librerías del stack | `[MCPS]` |
| Diseño frontend nuevo | `[DISEÑO]` `[ESTILOS]` `[FRONTEND-WORKFLOW]` |
| Al terminar CUALQUIER cambio | `[CHECKS]` |

---

## [CONTEXTO] Proyecto y stack

**Action** — Web corporativa para una agencia de desarrollo web. Diseño award-worthy orientado a ganar reconocimiento en Awwwards/FWA.

**Arquitectura:** Monorepo con Turborepo + pnpm workspaces.

| App | Ruta | Descripción | Puerto dev |
|-----|------|-------------|------------|
| `@actiondev/desktop` | `apps/desktop` | Web desktop-only (este CLAUDE.md) | 3001 |
| `@actiondev/mobile` | `apps/mobile` | Web mobile (Next.js 15) | 3000 |
| `@actiondev/shared` | `packages/shared` | Data compartida (proyectos, blog) entre desktop, mobile y admin | — |
| `@actiondev/pablo` | `apps/pablo` | Web personal en `pablo.actiondev.es` (proyecto Vercel propio, light-first, mobile-first) | 3002 |
| `@actiondev/admin` | `apps/admin` | Panel interno de gestión del blog (Firebase Auth, un solo usuario). App separada con deploy propio — cero impacto en el bundle/rendimiento del sitio público. Estética minimalista blanco y negro, SIN el lenguaje holográfico de desktop. Ver `[BACKEND]` | 3003 |

**Tono:** Premium, minimalista, dark-mode first, tipografía bold, animaciones fluidas, experiencias 3D inmersivas.

**Stack desktop (`apps/desktop`):**

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.3 |
| UI | React | 19.2.4 |
| Lenguaje | TypeScript | ^5 |
| Estilos | Tailwind CSS v4 | ^4 |
| Animaciones | GSAP + @gsap/react | 3.14.2 |
| 3D | Three.js + @react-three/fiber + @react-three/drei | 0.183.2 / 9.5.0 / 10.7.7 |
| Smooth Scroll | Lenis | 1.3.21 |
| Build | Turborepo | 2.4.0 |
| Package Manager | pnpm | 9.0.0 |

---

## [COMPONENTES] Convenciones de componentes
per
- Named exports siempre (`export function Component`)
- `"use client"` solo en componentes que usen hooks, GSAP, Lenis, Three.js o Canvas
- Secciones de la home → `src/components/sections/`
- Layout compartido (Header, Footer) → `src/components/layout/`
- Componentes reutilizables → `src/components/ui/`
- Wrappers de animación → `src/components/animations/`
- Escenas y objetos 3D → `src/components/three/`
- Datos estáticos → `src/data/`
- Hooks custom → `src/hooks/`
- Config libs → `src/lib/`

**Estructura monorepo:**
```
actionnew/                          # Root monorepo
├── apps/
│   ├── desktop/                    # ← WEB DESKTOP (este proyecto)
│   │   ├── src/
│   │   │   ├── app/               # Next.js App Router pages
│   │   │   ├── components/        # React components
│   │   │   ├── data/              # Static data
│   │   │   ├── hooks/             # Custom hooks
│   │   │   └── lib/               # Config (GSAP, fonts)
│   │   ├── package.json           # @actiondev/desktop
│   │   └── tsconfig.json
│   └── mobile/                     # Web mobile (Next.js 15)
├── packages/shared/                # Código compartido
├── turbo.json                      # Turborepo config
└── pnpm-workspace.yaml            # Workspace definition
```

**Estructura desktop (`apps/desktop/src/`):**
```
src/
├── app/
│   ├── layout.tsx              # Root layout (server)
│   ├── page.tsx                # Home — Hero, Projects, Testimonials, Map
│   ├── globals.css             # Design tokens + Tailwind
│   ├── contact/page.tsx        # Contact page
│   └── projects/page.tsx       # Projects page
├── components/
│   ├── animations/             # SmoothScroll wrapper
│   ├── layout/                 # Header, Footer
│   ├── sections/               # Hero, Projects, Testimonials, Map, Contact
│   ├── three/                  # Escenas R3F, geometrías, materiales 3D
│   └── ui/                     # Buttons, cards, inputs (pendiente)
├── data/                       # navigation.ts, projects.ts, testimonials.ts
├── hooks/                      # use-lenis.ts
└── lib/                        # fonts.ts, gsap-config.ts
```

---

## [ESTILOS] CSS

- **Tailwind CSS v4** con `@theme inline` para design tokens
- Dark-mode FIRST (fondo `#0a0a0a`, texto `#ededed`)
- Accent color: `#c8ff00` (lima eléctrico)
- Muted: `#7e7e7e`, Border: `#1c1c1c`. **`--muted` no baja de `#7e7e7e`**: es el suelo que cumple AA (4,5:1) sobre las TRES superficies del sistema —`--background` 4,93, `--card` 4,72, `--card-hover` 4,54—, y `.micro-label` son 11px. Con el `#767676` anterior fallaban las tres (4,41 / 4,22 / 4,06) y arrastraban 36 nodos en `/legal`, `/[landing]`, `/servicios` y `/contact`.
- CSS custom properties en `:root` para colores base
- Transición global: `cubic-bezier(0.16, 1, 0.3, 1)` (var `--transition-smooth`)
- **NO** usar clases de color arbitrarias — siempre tokens semánticos: `text-foreground`, `text-muted`, `text-accent`, `bg-background`, `border-border`
- **NO** usar `!important`
- **NO** usar `@apply` — clases de Tailwind directamente en JSX
- **Esquinas vivas**: la UI está PROYECTADA, y un proyector no redondea. `border-radius: 0` en todo lo interactivo. El radio queda para pilotos y medallones (círculos completos), nunca para botones ni tarjetas. NO volver a `rounded-full` / `rounded-2xl` en un botón.

**Tipografía: Space Grotesk y nada más.** `--font-primary` en `:root` = `var(--font-space-grotesk), "Helvetica Neue", Helvetica, Arial, sans-serif`. `--font-space-grotesk` la inyecta `next/font/google` en `src/app/layout.tsx` (`variable: "--font-space-grotesk"`, pesos 300-700, `display: "swap"`) sobre el `<html>`: se autoaloja desde el propio dominio (sin llamada a Google en runtime) y con `swap` no reintroduce el FOUT que en su día hizo retirar `next/font` (Helvetica fue la solución anterior; ya no aplica esa restricción). Los tres roles históricos `font-sans` / `font-mono` / `font-display` apuntan todos a esta pila y se conservan por los ~75 usos del árbol: **`font-mono` significa "etiqueta troquelada" (caja alta + tracking), NO otra tipografía.** No reintroducir una segunda familia ni un fallback `monospace` (pintaba Courier hasta que cargaba la fuente). Space Grotesk no tiene 800: el tope es 700 (el rótulo canvas de `effects/carousel-3d.tsx` usa `700`, no `800`, y lee `--font-space-grotesk`). Nota: el subset local `public/fonts/SpaceGrotesk-Bold-subset.ttf` para los contenedores del muelle y la señalética del suelo (`canvas/port/container-textures.ts`, `canvas/port/QuayLettering.tsx`) es un pipeline WebGL aparte — mismo alias `LABEL_FONT` cargado con FontFace API, ahora tirando de la misma familia que el resto del sitio en vez de Poppins. Ver `[COMPLEJIDAD]`/errores prohibidos sobre `<Text>` de drei.

**Primitivas holográficas** (`globals.css`) — el lenguaje del hero disponible en toda la web:

| Clase | Para qué |
|---|---|
| `.holo-surface` | Superficie proyectada: franjas, fresnel, brillo interior. **Quieta** — no fija color de texto |
| `.holo-live` | Añade barrido + parpadeo. **Sólo chrome**: anima `background-position`, que repinta cada frame |
| `.holo-glass` | Añade `backdrop-filter`. Sólo si hay algo detrás (canvas 3D) |
| `.holo-solid` | Fondo opaco. Obligatorio si lleva texto largo sobre algo claro (plaza de día) |
| `.holo-corners` | Corchetes de esquina (8 degradados en un `::after`, sin nodos extra) |
| `.holo-tint` | Texto proyectado (lima + glow) |
| `.holo-link` | Superficie que es un enlace: se enfoca al apuntarla |
| `.holo-btn` | Botón: prompt que se solidifica barriendo. `-solid` / `-quiet` / `-sm` / `-data` / `-icon` |
| `.calm-surface` | El MISMO cuadrado con el proyector bajado. Para `/contact` |
| `.link-sweep` | Enlace de TEXTO (pies, migas, fichas de datos): filete de 1px que barre desde la izquierda. **No fija color** — el `hover:text-accent` sigue en el JSX |
| `.disclosure` | `<details>` que crece al abrirse (`::details-content` + `interpolate-size`). Sin JS: las landings son server components |

**`@layer components` es obligatorio** para estas primitivas. Fuera de capa, CSS sin capa gana a TODA utilidad de Tailwind (que vive en `@layer utilities`) y el componente se come al consumidor: durante el barrido eso rompió tres cosas — `display:block` se comió un `flex`, `position:relative` se comió un `absolute`, y `.micro-label{color}` se comió `text-accent`. Dentro de `components`, la utilidad manda siempre.

Componente de botón: `ui/HoloButton.tsx` (elige `<Link>` o `<a>` según el `href`). Barra superior de las páginas server-only: `layout/HoloBar.tsx`. **No volver a escribir un botón a mano.**

**Cartel de controles: `ui/ControlSign.tsx`** (+ su CSS module) — el letrero del cómic (tapas físicas | filete | acción en caja alta, con remaches y caída al entrar), en el lenguaje del mando RC y NO en el holográfico: de ahí su radio de esquina, que es un objeto de la escena y no UI proyectada. Lo usan el tutorial del hero y la pista de click de `/resenas`. Si hace falta otra pista de juego, sale de aquí — no copiar la chapa otra vez.

---

## [DISEÑO] Principios de diseño

- **Tipografía:** Geist Sans (principal) + Geist Mono (código/detalles). Títulos extra bold, tracking tight. Subtítulos en uppercase + tracking-widest + text-muted.
- **Espaciado:** Secciones con `py-32`. Contenido máximo `max-w-7xl`. Padding horizontal `px-6`.
- **Animaciones:** GSAP para scroll-triggered reveals, stagger en grids. Lenis para smooth scroll global. Three.js para experiencias 3D inmersivas (hero, backgrounds, transiciones).
- **Microinteracciones — tres estados, una curva.** Todo lo interactivo responde a **apuntar**, **pulsar** y **enfocar**, siempre con `var(--ease)` y `var(--duration)` (o `--duration-fast` + `--ease-snap` para el pulsado: un acuse de recibo que tarda 320 ms llega tarde). Lo que es una CAJA se hunde 1px al pulsarla (`.holo-btn`, `.calm-surface`, el CTA del Header) o se posa deshaciendo su elevación (`.holo-link`); lo que es TEXTO no se mueve, subraya (`.link-sweep`). Importa sobre todo en `mailto:` / `wa.me`, donde lo que se abre es otra app y la página no cambia: sin el pulsado, el clic no acusa nada. Animar `transform`, nunca `width` ni `height`. Una flecha `↗` se mueve arriba **y** a la derecha, en todas partes. NO `hover:scale-105` (rompe las esquinas vivas) ni duraciones a pelo tipo `duration-300`.
- **3D:** Cargar escenas R3F con `dynamic(() => import(...), { ssr: false })`. Canvas siempre `"use client"`. Mantener polycount bajo, usar `drei` helpers (Environment, Float, etc.).
- **NO** gradientes coloridos. Solo `from-transparent to-background/80` para overlays.
- **NO** sombras CSS. Usar bordes sutiles (`border-border`).
- **NO** colores saturados más allá del accent.
- **NO** stock imagery genérica. Placeholder → div con bg-border hasta tener assets reales.

---

## [PÁGINAS] Routing y navegación

| Ruta | Página | Contenido |
|------|--------|-----------|
| `/` | Home | Pantalla de inicio "rollo videojuego": SOLO el hero "La Grúa" a viewport completo (`h-[100dvh]`), sin scroll, sin Lenis, sin footer. Cargar un contenedor en el barco → wipe radial → `router.push` a su ruta |
| `/projects` | Proyectos | Antigua sección `#projects` de la home (`Projects` carrusel 3D + `ProjectsIndex`), dentro de `SectionPage`. El índice es una lista de CUATRO calles con viñeta anclada a la fila — ver nota abajo |
| `/projects/[slug]` | Ficha de proyecto | Caso de estudio individual: hero a todo el ancho (vídeo si `project.video`, si no `project.image`) y debajo "Qué nos pidieron" / "Qué conseguimos" a dos columnas. Server component, FUERA del lenguaje holográfico a propósito (misma familia que `/blog/[slug]`: es para leer, no el juego de la home) — NO usa `SectionPage`. `brief`/`result` (+ `Es`) son opcionales en `Project` (`packages/shared/src/projects.ts`); sin contenido real cae en el placeholder genérico de `page.tsx`, pendiente de redactar caso a caso. Todas las filas del índice enlazan aquí, tengan o no `url` de cliente real (`"#"` si no la tiene); si `project.url !== "#"`, la ficha muestra un enlace "Ver web" (`target="_blank"`) hacia esa URL — el índice ya NO saca al visitante directamente al site del cliente |
| `/contact` | Contacto | **Sin formulario** (decisión del cliente): titular + dos tarjetas de canal — WhatsApp y email — y los chips "pregunta a la IA". **Calma deliberada** (`.calm-surface`, no `.holo-surface`): el visitante viene a coger un teléfono, y el brillo resta confianza. Ver nota abajo |
| `/reviews` | Reviews | Redirect a `/resenas` (la sección `Testimonials` de la home se retiró; el componente sigue en `sections/` sin ruta, por si se reutiliza) |
| `/resenas` | Plaza de reseñas | Parque 3D inspirado en **Castrelos (Vigo)**, con versión de **día y de noche**: un muñeco procedural por testimonio; click → cámara enfoca + ficha. Es la entrada "Reseñas" del nav |
| `/servicios` | Hub SEO | Índice de landings locales (server, sin GSAP) |
| `/legal/aviso-legal` | Aviso legal | Titularidad LSSI art. 10 — Alcasi Systems, S.L. **`/legal/*` queda FUERA del lenguaje holográfico** (decisión del cliente): son documentos para leer y verificar, no escaparate |
| `/legal/privacy` | Privacidad | RGPD/LOPDGDD |
| `/legal/terms` | Términos | Condiciones de contratación + sector público |
| `/legal/cookies` | Cookies | GTM detrás de consentimiento (banner global) + almacenamiento técnico — ver `[SECURITY]` |
| `/desarrollo-de-aplicaciones-vigo` | Landing SEO | Keyword núcleo — máxima prioridad |
| `/desarrollo-web-vigo` | Landing SEO | Data en `src/data/landings.ts` |
| `/diseno-web-vigo` | Landing SEO | ídem |
| `/desarrollo-de-aplicaciones-pontevedra` | Landing SEO | ídem |
| `/desarrollo-web-pontevedra` | Landing SEO | ídem |
| `/diseno-web-pontevedra` | Landing SEO | ídem |
| `/desarrollo-de-aplicaciones-galicia` | Landing SEO | ídem |

**Índice de proyectos** (`sections/ProjectsIndex.tsx` + `projects-hud.module.css`): lista **de borde a borde** (fuera del `container-editorial`, con `px-6 md:px-12`) de dos calles — **nombre │ tipo** — y SIN filetes de separación: a las filas las separa el aire de su `py`, y la única regla que aparece es la lima de la apuntada. Titular y botón van centrados sobre ella; en el titular sólo la PRIMERA palabra va en lima (`Todo` / `Every`).

**De entrada NO se ve ningún trabajo** (decisión del cliente): sólo el titular y, debajo, el botón que abre los 31. Es `ui/HoloButton` en variante `quiet` y SIN `href`, que es su modo `<button>` — se añadió para esto, y cualquier acción de página debe salir de ahí en vez de escribirse a mano. Lleva `aria-expanded` + `aria-controls` y `data-testid="projects-index-toggle"` (los selectores de e2e no pueden ir por rótulo: la web es bilingüe).

La **viñeta** del proyecto apuntado sigue al CURSOR, en `fixed` y fuera de la sección (`hidden md:block`). Cinco cosas que no son adorno:
- **El nodo que anima GSAP sólo lleva la posición del puntero.** El desplazamiento respecto a él (`-translate-y-1/2` + `marginLeft`) va en un HIJO: GSAP tiene que ser el único dueño de ese transform (ERR-001). Cerca del borde derecho ese `marginLeft` cambia de signo y la viñeta se voltea de lado, o se saldría de pantalla.
- **Con la viñeta apagada, el `mousemove` la PLANTA** (`gsap.set`) en vez de animarla; si no, al encenderse volaba desde la esquina.
- **El apagado va en la LISTA, no en cada fila.** Entre dos filas contiguas el `mouseleave` de una llega antes que el `mouseenter` de la otra: apagar ahí hacía parpadear la viñeta en cada salto. Las filas sólo notifican la entrada.
- **La lista entra con su propio tween AL ABRIRSE**, no por scroll: cuando la sección aparece no hay ninguna fila que revelar. Y al cerrar se devuelve la vista al arranque con `getLenis().scrollTo`, o el visitante se queda mirando el pie de una lista que acaba de encogerse.
- **El dim del resto se aplica a los HIJOS de la fila, no a la fila.** La opacidad de la fila es de GSAP y una transición CSS encima la arrastra frame a frame (ERR-001).

Se probaron y se retiraron, por este orden: seis trabajos de muestra antes del botón, la columna del AÑO, la lista entera monocroma en lima, la calle central vacía que anclaba la viñeta a la fila, los filetes entre filas y la coda «Esto es una selección.» — **no reponer nada de eso**. Metadatos en `--muted`, que es el suelo AA del sistema; por debajo de `lg` la fila sigue siendo nombre + tipo y la viñeta no se monta.

**Contacto** (`sections/Contact.tsx`): cero formulario y cero backend. Dos tarjetas (`[data-channel="whatsapp"|"email"]`, iconos locales en `icons/channel-icons.tsx`) que son enlaces `wa.me` y `mailto:` con el mensaje ya redactado (`buildWhatsappUrl` / `buildMailtoUrl` en `data/socials.ts`, texto en `t.contact.intro`): el visitante lo lee y lo edita en SU app antes de enviar. Lenguaje visual del sitio — `rounded-2xl border-border bg-card`, icono en `bg-accent/10 text-accent`, micro-label mono y el dato real como protagonista. El cliente fue retirando por minimalismo, en este orden: subtítulo, párrafo de transparencia, franja de reseñas ★5,0, línea bajo el titular y separador sobre los chips de IA — **no reponer nada de eso**. También se descartó la variante brutalista (tarjetas `aspect-square` sin radio): dejaba un hueco muerto en el centro y no casaba con la web.

Navegación: la home YA NO tiene secciones ni anchors. Header, Footer y contenedores del juego (`data/port-containers.ts`) apuntan a rutas reales (`/projects`, `/resenas`, `/contact`). Un `href` que empiece por `#` en un contenedor es un destino sin página todavía (p. ej. `EQUIPO`) y el juego lo ignora. `components/layout/SectionPage.tsx` = shell (Lenis + Header + Footer) para las páginas que antes eran secciones — la home no lo usa.

**Hero "La Grúa"** (`src/components/canvas/`, doc en `canvas/SCENE.md`): puerto de Vigo en estilo cómic 100 % procedural (toon + `<Outlines>`, shaders de cielo/agua, 0 assets de red). El cielo cambia según la **hora local** del visitante — noche / amanecer / día / atardecer — con paletas en `canvas/port/time-of-day.ts`; forzar con `/?hora=noche|amanecer|dia|atardecer`. Las cuatro fases tienen **fondo pintado IA** (`public/hero/port-<fase>-vN.webp`; noche/amanecer/día son ediciones "solo luz" de la de atardecer, misma composición al píxel): la imagen lleva cielo, sol/luna, Cíes, agua, bateas y muelle; grúa, barco (`PaintedShip.tsx`, delante del pintado y tapándolo), nubes, faro y todo lo móvil van en 3D, alineado con `fovForAspect`; `?plate` captura la referencia para generar fondos nuevos (ver `canvas/SCENE.md`). El muelle tiene **tres filas en profundidad** (`canvas/port/quay-rows.ts`, z = 3.2 / 0 / -3.2) y el pórtico entero viaja de una a otra con ▲ ▼ (W / S) con su propia inercia, más lenta que la del carro: delante los proyectos, en medio la fila del barco (`SHIP_ROW`, z = 0 — la única desde la que se carga la bodega y navega) y al fondo el decorado. S y ↓ ya NO bajan el gancho (eso es Espacio / E); solo se engancha lo que está en la fila del pórtico. Clicks del juego por cola (`use-action-queue`) y solo sobre el canvas. La grúa también se **arrastra con el ratón** (agarrar carro/cabina/spreader: horizontal mueve el carro, vertical cambia de fila; ver `canvas/SCENE.md`). Controles también por **mando de radiocontrol 3D** (`canvas/overlays/RemoteControl.tsx`, caja CSS 3D horizontal tipo panel arcade, abajo centro sobre el muelle): flechas + botón de gancho que escriben en `lib/hero-remote.ts`; vive FUERA del canvas a propósito (ver gotchas en `canvas/SCENE.md`); lleva indicador de fila y las teclas impresas. **HUD de ayuda** (`canvas/overlays/HeroHud.tsx` + `port/TargetMarker.tsx`, sección "Ayudas" de `canvas/SCENE.md`): balizas lima pulsantes sobre todo contenedor clicable (`href` real; los `#…` no la llevan), etiqueta holográfica al pasar por un contenedor (nombre + ruta o "PRÓXIMAMENTE"), tutorial de controles (`overlays/TutorialOverlay.tsx`: mover → fila → enganchar → soltar; sin paso "haz clic", que navegaba antes de acabar; el cartel en sí es `ui/ControlSign`, compartido con la pista de `/resenas` — su módulo solo guarda ya los LEDs de progreso), hueco fantasma en la bodega y pista sobre el mando mientras se lleva carga, aviso "RUMBO A …" con bocina al cargar, demo en reposo a los 8 s y menú "Ir sin jugar". Los contenedores `#…` se pueden cargar y avisan "próximamente". **Easter egg**: click sobre una gaviota → bala desde al lado del mando, impacto con sonido WebAudio (0 assets), plumas, caída con fundido y contador arriba a la derecha (`overlays/GullTally.tsx`): la primera baja arranca una **ronda de 30 s** con cuenta atrás, más gaviotas (8 extra + reaparición rápida, `port/gull-rush.ts`) **racha** (bajas a ≤ 1,5 s; cada 5 sube el multiplicador ×2, ×3… con aviso central y sonido) y **récord** de puntos por ronda persistido en `localStorage`; hit-test en `port/gull-hunt-logic.ts`, render en `port/GullHunt.tsx` — sección "Easter egg" de `canvas/SCENE.md`. Segundo easter egg: click sobre el barco → bocina de zarpar (`playHornSfx` en `lib/hero-sfx.ts`, hit-test `pickShipAt` en `port/ship-hull.ts`), sin bajar el gancho. Tercer easter egg — **alerta del faro** (`port/lighthouse-alert.ts` + `overlays/AlertOverlay.tsx`, sección "Alerta del faro" de `canvas/SCENE.md`): click sobre el faro de Cíes → sirena, aviso "¡ALERTA!", viñeteado rojo, todas las gaviotas con ojos rojos, enjambre de 6 extra y el haz girando en rojo a triple velocidad; a los 3 s UNA sola se lanza contra la cámara y **agrieta la pantalla entera** (SVG sobre el canvas + sacudida), y con ese choque se acaba. NO es mecánica de juego: no puntúa, no abre ronda y mientras dura NO se puede disparar a las gaviotas. Prioridad de click: gaviota > contenedor > grúa > faro > barco.

**Landings SEO** (`src/app/[landing]/page.tsx` + `src/data/landings.ts`): NO se enlazan desde la navegación principal (decisión del cliente — no tocar el diseño original). Se descubren vía `sitemap.xml`, `/servicios`, `llms.txt` y enlazado entre ellas. Son server components estáticos, responsive, sin GSAP/Lenis. El middleware solo reescribe `/` a la zona mobile; el resto de rutas se sirven desde desktop en todos los dispositivos.

**Plaza de reseñas** (`src/app/resenas/` + `src/components/canvas/PlazaScene.tsx` + `canvas/plaza/*` + DOM en `src/components/plaza/*`): de noche, el fondo oscuro del sitio (`--background` #080808, acento lima); de día, el parque con cielo claro (ver "Día y noche" más abajo). DOM con tokens semánticos. **Arrastrar — DOS EJES, nunca altura** (decisión del cliente): click mantenido (> 6 px de movimiento o > 400 ms) agarra al muñeco — estado `held` en `PlazaDoll` (brazos en alto agitándose, piernas colgando) y sigue al puntero por un plano HORIZONTAL que pasa por el punto agarrado (`PlazaWorld`, listeners en `window`): izquierda/derecha = lado, arriba/abajo = PROFUNDIDAD (más lejos / más cerca). El muñeco no se despega del suelo: no hay eje de altura, ni gravedad al soltar, ni `liftRef`. Con el plano del suelo el puntero da por sí solo los dos ejes, así que NO hay controles extra de profundidad (había rueda, ↑↓/WS y Mayús cuando el plano era vertical y el puntero gastaba su eje vertical en la altura; se retiraron con ella — no reintroducirlos). Lo único que queda en `canvas/plaza/drag-depth.ts` es `clampDepth`: cerca del horizonte el rayo corta el plano a cientos de unidades, así que se acota entre `DEPTH_RANGE` (y `MAX_RADIUS` para el radio de la plaza). Acota la distancia CON SIGNO sobre el eje de vista, no el radio: con el radio, un corte por detrás de la cámara reaparecía como muñeco a la espalda del visitante. Al soltarlo se queda donde esté y ese sitio pasa a ser su nueva casa (`DollRuntime.home`). Un click sin arrastre abre la ficha al SOLTAR, no al pulsar. El HUD NO lleva leyenda de controles al arrastrar (se retiró por decisión del cliente — no reponerla). Sí lleva la **pista de click** (`plaza/PlazaHint.tsx`): es el MISMO cartel del tutorial del hero (`ui/ControlSign`, ver `[COMPONENTES]`) con una sola tapa —el cursor— y `t.plaza.hint`, arriba y centrado a la misma altura que allí (`top-[max(12vh,104px)]`, bajo la cápsula del Header). Sin LEDs de progreso: aquí el gesto es uno solo. Es solo lectura, hereda `pointer-events-none` del HUD y se desvanece (`data-visible`, testid `plaza-hint`) mientras se lleva un muñeco en la mano (consumidor de `onHoldChange`) y **para siempre al abrir la PRIMERA ficha** (`hintDone` en `PlazaPage`, que es quien compone `hintVisible`; el HUD solo lo pinta): el gesto ya está aprendido y la placa solo taparía plaza — no hacerla volver al cerrar la ficha. Abajo a la DERECHA va el enlace a la ficha de Google: en reposo solo la "G" (`ui/GoogleIcon`) en un botón circular de 44px y al hover/foco se despliega la etiqueta `t.plaza.googleCta` — el ancho se anima con una columna de grid de `0fr` a `1fr` (`width:auto` no es animable) y el texto NO sale del DOM, que lo dejaría fuera del nombre accesible del enlace. `href` = `BUSINESS.mapsUrl` de `packages/shared/src/seo.ts` — cambiar ahí la URL la cambia también en las landings; hoy es una URL de BÚSQUEDA de Maps, no la ficha real (pendiente el `g.page/r/…` o el `place_id` del perfil). Se desvanece con `ctaVisible` cuando hay una ficha abierta (la taparía). **Legibilidad del arrastre** (el fondo es plano y la cámara va casi a ras): anillos concéntricos en el suelo (`FloorGrid` en `PlazaRoom`, se apagan con la niebla) y la sombra de contacto, que se encoge con el pequeño `HELD_LIFT` de llevarlo en la mano. Los anillos guía ya SOLO van fuera del pavimento: dentro, esa referencia la da el despiece radial, y el lima sobre las losas se leía como aros de neón. `/resenas?quieto=1` congela paseo y vaivén de cámara (patrón `?hora=` del hero): la plaza viva no se puede apuntar desde un test —R3F solo recalcula el hover al mover el puntero, así que el cursor "grab" se queda obsoleto cuando el muñeco se aparta— ni da dos capturas iguales. Úsalo en e2e y en snapshots. Contrato compartido en `canvas/plaza/plaza-config.ts` (medidas `DOLL`, layout del mobiliario, PRNG determinista por id → el mismo cliente tiene siempre el mismo muñeco, requisito para snapshots).

**El parque (Castrelos).** La referencia es el jardín francés del Pazo de Castrelos: pavimento de granito con **despiece RADIAL** (anillos + sectores, medallón con rosa de los vientos y bordillo perimetral, todo en `getPavingTexture`, polar y no tileable para que la cámara no delate una rejilla), **césped** hasta la niebla, **parterres de seto bajo recortado**, **palmeras**, arbolado, y **fuente central** en el medallón (los muñecos tienen prohibido pasear por dentro: `FOUNTAIN_KEEP_OUT`). Mobiliario en `canvas/plaza/PlazaDecor.tsx`: farolas de farol de cuatro caras con charco de luz, bancos con brazos, papeleras, setos en jardinera y arbolado. Va en **anillos regulares y mirando al centro** (`DECOR_RINGS`), al revés que los muñecos: el mobiliario urbano alineado es lo que hace que un espacio se lea como diseñado. Todo se **fusiona en una geometría por material, ya en coordenadas de mundo** (`buildFurniture`) — pieza a pieza eran ~145 draw calls; si alguna vez una pieza tiene que animarse, sale de ahí y se monta suelta. Al fusionar, normalizar SIEMPRE a `toNonIndexed()`: three mezcla primitivas indexadas (esfera, toro, cono) y no indexadas (icosaedro) y `mergeGeometries` las rechaza.

**Luz y suelo del parque.** El escenario se apoya en tres cosas que NO son decorado y conviene no deshacer:
- **Sombras proyectadas de verdad** (`<Canvas shadows="percentage">`). El sol de la paleta se recoloca a `SUN.distance` = 60 en la misma dirección solo para proyectar (la intensidad de una direccional no depende de la distancia, pero la cámara de sombra sí: desde los ~12 de la paleta, el arbolado a 16.8 quedaba detrás de la luz y no proyectaba nada). La ortográfica hay que recalcularla A MANO con `shadow.camera.updateProjectionMatrix()` — R3F escribe `shadow-camera-left` y compañía como propiedades sueltas y la cámara no se entera; el síntoma es configurar el sol y no ver NI UNA sombra. Como el suelo y el pavimento son `MeshBasicMaterial` (su color tiene que llegar al píxel sin pasar por la luz, que es lo que los hace casar con el horizonte) no pueden recibir sombra: la recibe una capa aparte con `ShadowMaterial`, una sola para pavimento y césped, que además evita el doble oscurecido. Los muñecos se marcan recorriendo `bodyRef` (~20 mallas), no una a una. Usar `shadows="percentage"`, no `"soft"`: three deprecó `PCFSoftShadowMap` en 0.183 y avisa por consola en cada carga.
- **Césped con teja procedural** (`getGrassTexture`): manchas de tono en blanco y negro a baja opacidad sobre un `MeshStandardMaterial` blanco — el verde lo pone la teja, no el `color`, o se multiplicarían. La teja mide `GRASS_TILE_WORLD` = 7 unidades: a 3 se repetía cien veces de un lado al otro del parque y en la distancia media se leía como un rayado en diagonal, sobre todo de noche.
- **Sotobosque** (`PlazaBackdrop`): cilindro opaco medio metro POR DETRÁS de la franja de arbolado. A partir de `fog.far` el suelo ya es 100 % color de horizonte, y eso asomaba por el hueco que la imagen deja entre copas y troncos como calvas blancas dentadas. Geométricamente no se puede cerrar —el suelo se vuelve blanco antes de que las copas lleguen a taparlo— así que se tapa el SUELO, con lo que de verdad hay bajo una masa de árboles: sombra.

**`camera.near` = 0.6, no el 0.1 por defecto.** El suelo llega a `FLOOR_RADIUS` = 150 y con `near` = 0.1 el z-buffer a 50 unidades no distingue dos planos separados 1 mm: el césped y el disco de suelo se peleaban y salían cuñas blancas dentadas sobre la pradera (eran, literalmente, los 256 sectores del `RingGeometry`). Con 0.6 la precisión es seis veces mejor y nada se recorta — lo más cerca que llega la cámara es a 3,4 de un muñeco. El disco de suelo lleva además `polygonOffset`.

**`?quieto=1&angulo=` todavía NO da capturas deterministas** (dos ejecuciones idénticas quedan ~35 px desplazadas en vertical: la cámara congela el vaivén pero no converge al mismo sitio). Por eso `/resenas` sigue sin regresión visual en e2e — un snapshot ahí sería flaky. Arreglarlo es el paso previo a añadirlo.

**Día y noche** (`canvas/plaza/plaza-mode.ts`): dos paletas completas —cielo, suelo, pavimento, césped, verdes, niebla, luces y farolas encendidas/apagadas— resueltas por la **hora local** del visitante con `resolveTimeOfDay` del hero y forzables con `/resenas?hora=dia|noche`. Es la ÚNICA pantalla del sitio que no es dark-mode cuando es de día, a propósito; el chrome (título y pista de `PlazaHud`) se invierte a tinta oscura en ese modo. El modo se resuelve una vez al cargar (`currentPlazaMode`), no cambia en caliente. Lo único del mobiliario que cambia de color con el modo es la piedra: el resto son los mismos materiales bajo otra luz.

**Cámara: vaivén, no órbita.** En reposo hace un vaivén de ±22° centrado enfrente del telón (`ORBIT.center` = `PLAZA_FRONT_ANGLE` + 180°), no la vuelta completa. Da la misma sensación de espacio (el parallax) y a cambio el horizonte que se ve es siempre el mismo arco, que es lo que permite decorarlo. Al enfocar un muñeco, la cámara se planta SIEMPRE por el lado abierto (no en la línea centro-muñeco), para que la ficha se lea con el parque de fondo. `/resenas?quieto=1&angulo=<grados>` congela el vaivén en un ángulo concreto: sirve para revisar un lado del parque o para capturas deterministas.

**Assets: tres, y solo de fondo** (`public/plaza/`, ~210 KB): `pazo-dia.webp`, `pazo-noche.webp` y `arbolado.webp`, generados con IA en el mismo lenguaje low-poly mate de la escena. Es la excepción a la regla de "0 assets" de esta página y está acotada al HORIZONTE, donde no hay paralaje: el Pazo es un plano recortado y el arbolado un cilindro con la franja repetida **en espejo** (`MirroredRepeatWrapping`), que es lo que evita costuras con la cámara en movimiento; sus copias se calculan con el aspecto de la imagen (`treelineRepeat`), nunca a ojo, o los árboles salen deformados. NO pasar a imagen nada que la cámara rodee de cerca (mobiliario, vegetación cercana): ahí el cartón se ve y se pierde el día/noche automático. Las texturas se cargan FUERA del `<Suspense>` de la escena (`useBackdropTexture`), para no retrasar el final de la pantalla de carga. El resto sigue siendo 0 assets: caras, cielo, suelo y pavimento son `CanvasTexture` en runtime. Copiamos el lenguaje visual (proporciones, plaza, comportamiento), nunca marcas/nombres/assets de Nintendo — no usar la palabra "Mii" en copy ni código público.

Componente nav: `layout/Header.tsx` + `Header.module.css` = **cápsula holográfica** compacta: NO ocupa el ancho de la pantalla, se ajusta a su contenido y queda centrada arriba (`mx-auto mt-3 w-fit`, 44px de alto; antes era un panel a todo el ancho de 64px y resultaba invasivo — decisión del cliente, no volver a estirarla). Así la franja superior queda libre: en la home los clicks del juego pasan al canvas fuera de la cápsula (el `<header>` sigue siendo `pointer-events-none` y solo la cápsula recibe eventos). Mismo lenguaje que la flecha holográfica del barco (`port/Ship.tsx` HOLO_FRAG) pero más apagado: lima translúcido con fondo `rgba(8,8,8,.30)` + blur, borde fresnel `#eaffb0`, barrido de franjas que sube (`holo-scan`), parpadeo con tartamudeo (`holo-flicker`), doble imagen desfasada (`::before`), haz difuminado abajo (`::after`) y corchetes en las esquinas. Sin degradado en la home (fuera, fundido corto de `h-20`). Marca con logo teñido en lima (20px) + telemetría mono en UNA sola línea (era la que forzaba los 64px): led, `VIGO`, hora local y fase del día vía `resolveTimeOfDay` + `?hora=` (solo en cliente), con las coordenadas 42.24°N 8.72°W únicamente a partir de `2xl`; enlaces con retícula al hover/activo; idioma segmentado; CTA "Hablemos" como prompt `>` con cursor que se solidifica en lima al hover.

**Persiana (carga + transición de ruta)** — `ui/Blinds.tsx` es la cortina: 10 lamas horizontales `bg-accent` con hueco de 3px, cierre 0→1 con origen arriba y apertura 1→0 con origen abajo, escalonadas de arriba abajo (transiciones CSS, sin GSAP; `blindsDuration()` devuelve 0 con `prefers-reduced-motion`). Dos consumidores: `ui/LoadingScreen.tsx` (cerrada desde SSR, se abre al llegar a 100 %) y `animations/PageTransition.tsx` (provider en el layout raíz). `PageTransition` intercepta en fase de CAPTURA cualquier `<a>` interno del documento — hay que ir por delante del `onClick` de `<Link>` de Next, que hace `preventDefault` y navega solo — cierra, hace `router.push`, y abre cuando cambia `location` (o a los 4 s como escotilla). Salta con modificadores, `target`, `download`, `data-no-transition`, externos y misma ruta. Navegación programática (juego de la home, logo del Header) → `usePageTransition().navigate(href)`. Estado observable en `[data-testid="page-blinds"][data-state]` para e2e. **Una sola cortina por navegación:** la home solo monta `LoadingScreen` si llega DESTAPADA (carga directa de `/`, recarga, back/forward). Si se aterriza por un link y la escena ya se cargó en esta sesión (`skipLoader` en `app/page.tsx` = `usePageTransition().busy` en el primer render + `sessionStorage`), la persiana de `PageTransition` ya está cubriendo y la de carga NO se monta: encadenar las dos hacía que volver a `/` tardase ~5 s frente a ~1,9 s de cualquier otra ruta. La escena 3D arranca detrás de la persiana de transición mientras se recoge y acaba de entrar con su `animate-fade-in`.

---

## [SEO] Metadata

- **Idioma indexable: español** (decisión de negocio — el mercado objetivo es Vigo/Galicia). `lang="es"`, metadata en ES en ambas apps. EN disponible vía toggle client-side (desktop) o Accept-Language (mobile).
- Título: `"Action — Desarrollo de Aplicaciones y Webs en Vigo"` (home), `"[Page] — Action"` (subpages). El `template` del layout raíz YA añade `" — Action"`: el `title` de una página va **sin marca**, o la pestaña acaba en "Contacto — Action — Action" (pasó en `/contact`, `/projects` y `/resenas`). El `openGraph.title` sí la lleva escrita — ahí el template no se aplica.
- **Favicon = el globo de marca** (`/logos/action_globe-64.png`, 2,2 KB, declarado en `icons` de `layout.tsx`). Pisa a propósito el `src/app/icon.svg` de convención, que es un símbolo dibujado a mano y NO el logo. Lo que no se repone es el webp de 1024×1024: eran 35 KB descargados en cada página para pintar 16px de pestaña.
- Dominio canónico: `https://actiondev.es`
- Fuente de verdad SEO: `apps/desktop/src/lib/seo.ts`. **NAP compartido** (dirección C/ Colón 20, teléfono, geo): `packages/shared/src/seo.ts` (`BUSINESS`) — debe coincidir SIEMPRE con la ficha de Google Business Profile.
- **Titularidad legal**: `LEGAL_ENTITY` en `packages/shared/src/seo.ts`. "Action / Action Development" es una MARCA; la persona jurídica es **Alcasi Systems, S.L.** (CIF B72910664, domicilio social en Marín, Reg. Mercantil de Pontevedra). `BUSINESS.legalName` lleva la denominación social real y `BUSINESS.displayName` el nombre de marca largo para usos visuales (OG image). No volver a poner un nombre de marketing en `legalName` — el JSON-LD emite `legalName` + `vatID` para que un organismo público pueda cruzar el proveedor con el Registro Mercantil.
- **Páginas legales** en `/legal/*` (desktop): ver `[PÁGINAS]`. Al tocar su contenido, actualizar `LEGAL_UPDATED` en `src/lib/seo.ts`. La política de cookies y la de privacidad describen el comportamiento REAL del sitio (formulario que abre WhatsApp sin servidor, analítica vía Google Tag Manager detrás de consentimiento — ver `[SECURITY]`) — al añadir un tag nuevo dentro del contenedor GTM, actualizarlas de nuevo.
- Infraestructura: `sitemap.ts`, `robots.ts` (whitelist crawlers LLM), `manifest.ts`, `public/llms.txt` (AEO), OG image dinámica en `/api/og`.
- Structured data: `components/seo/StructuredData.tsx` (desktop) y `components/StructuredData.tsx` (mobile) — Organization + ProfessionalService con NAP/geo idénticos y mismos `@id`. Las landings añaden Service + FAQPage + BreadcrumbList.
- **Mobile-first indexing**: Google indexa la zona mobile SOLO para `/` (`middleware.ts` solo reescribe esa ruta en dispositivo móvil); `/resenas`, `/projects`, `/contact`, landings y legales sirven SIEMPRE el código de desktop, en cualquier dispositivo. Por eso el JSON-LD `reviews`/`projects` (que vive en esas rutas) no hace falta replicarlo en `apps/mobile/src/components/StructuredData.tsx` — solo Organization/WebSite/ProfessionalService, que sí son los que monta la home en ambas zonas. Cualquier cambio a ESOS tres schemas (o al NAP/`hasOfferCatalog` que llevan) sí debe replicarse en mobile.
- Iconos PWA del manifest: `/icons/icon-192.png` y `/icons/icon-512.png` (generados desde `/logos/action_globe.webp`, `apps/desktop/public/icons/`). Pendiente: favicon.ico real y una variante `purpose: "maskable"` con zona de seguridad (los actuales son `purpose: "any"`).
- `apps/desktop/src/app/api/og/route.tsx` acepta `?title=` (usado por `[landing]/page.tsx` con `landing.h1`) para que cada landing tenga su propia imagen OG en vez de compartir la genérica de home.

---

## [BACKEND] API y base de datos

- **Blog + leads en Firebase** (proyecto `action-dev-1a531`) — única pieza con backend real. El resto sigue siendo datos estáticos en `src/data/`.
  - **Firestore, no SQL**: colecciones `posts` y `leads`, documentos camelCase que calcan directamente `BlogPost`/`Lead` de `packages/shared` (sin capa de conversión snake_case — el `id` es el ID del documento, no un campo). Reglas de seguridad en `firestore.rules` (raíz del monorepo), desplegadas con `firebase deploy --only firestore`.
  - `posts`: lectura pública (`get`/`list`) solo si `status == 'published'` — la usa `apps/desktop`. Lectura/escritura completa solo si `request.auth.token.email == 'hi@actiondev.es'` — allowlist a nivel de regla, no solo de código.
  - `leads`: `create` público sin sesión (el propio visitante escribe su lead) — nunca puede leer ni tocar los existentes. Lectura/escritura completa con el mismo allowlist de email que `posts`.
  - Tipos compartidos `BlogPost`/`BlogContentBlock` (`packages/shared/src/blog.ts`) y `Lead` (`packages/shared/src/leads.ts`) — misma fuente para `apps/admin` y `apps/desktop`, no duplicar.
  - `apps/desktop`: SDK web de Firebase (`src/lib/firebase/client.ts`, solo `NEXT_PUBLIC_*`, sin sesión — las reglas ya limitan lo que puede hacer). `src/lib/blog.ts` (`getPosts`/`getPost`) lee `posts` directo; `src/lib/callback-request.ts` (`Contact.tsx`) hace `addDoc` en `leads`. `/blog` y `/blog/[slug]` llevan `revalidate = 3600` como red de seguridad; la publicación instantánea la dispara el webhook `POST /api/revalidate` (secreto compartido `REVALIDATE_SECRET`), llamado por las server actions de `apps/admin` tras cada guardado. `dynamicParams` es `true` (default) en `/blog/[slug]` — un slug nuevo se sirve on-demand aunque el webhook falle.
  - `apps/admin` (puerto 3003): panel de gestión, **Admin SDK** (`src/lib/firebase/admin.ts`), nunca el navegador. En local usa las credenciales de usuario de `firebase login` (`applicationDefault()`); en producción, una cuenta de servicio propia vía `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`. Como el Admin SDK **ignora** `firestore.rules`, la única puerta es `requireSessionUser()`/`getSessionUser()` (`src/lib/firebase/session.ts`) — verifica la cookie de sesión contra el mismo allowlist de email. CRUD de posts vía server actions (`src/app/(protected)/posts/actions.ts`).
  - **Login: Firebase Auth solo puede firmar con email/password desde el navegador**, no desde una server action — `src/app/login/page.tsx` es un client component que llama `signInWithEmailAndPassword` con el SDK web y canjea el `idToken` resultante por una cookie de sesión httpOnly en `POST /api/session` (`src/app/api/session/route.ts`, verificada con el Admin SDK — `createSessionCookie`/`verifySessionCookie`). Un único usuario en Firebase Auth (`hi@actiondev.es`), sin auto-registro — coincide con el allowlist de `firestore.rules` y de `lib/firebase/session.ts`; si cambia el email, actualizar los dos sitios.
  - Seed de los 3 posts placeholder originales: `scripts/seed-blog-posts.ts` (Admin SDK, mismo patrón de credenciales que `apps/admin`, solo local, un único uso).
- **Contacto sin formulario de proyecto, por decisión de producto** (ver `[PÁGINAS]` → `/contact`): no hay formulario de "cuéntanos tu proyecto" ni backend genérico de contacto — la única excepción es el campo de teléfono de "llámame tú" de arriba. No reintroducir un formulario más amplio ni conectar Resend/SendGrid/API route sin que el cliente lo pida.
- No hay más base de datos ni auth fuera del blog y los leads.

---

## [SECURITY] Seguridad

- **Variables de entorno** (`.env.local`, nunca commiteado — `.env.example` sí, sin valores reales):
  - `apps/desktop`: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `REVALIDATE_SECRET`.
  - `apps/admin`: los mismos tres `NEXT_PUBLIC_FIREBASE_*` (firman el login en el navegador) + `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` (Admin SDK, solo en producción — en local basta `firebase login`) + `DESKTOP_SITE_URL`, `REVALIDATE_SECRET`.
  - Cuenta de servicio de Firebase (`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`): **NUNCA** en `apps/desktop`, solo en el runtime de `apps/admin` (Admin SDK) y en `scripts/seed-blog-posts.ts`.
- Sin formulario de contacto público → sin superficie de spam: no hacen falta rate limiting ni honeypot ahí. `apps/admin` sí necesita su login protegido (Firebase Auth, un único usuario, sin auto-registro) por ser superficie de escritura.
- `apps/admin` fuera de índice: `robots.ts` con `disallow: "/"` + `X-Robots-Tag: noindex, nofollow` en todas las respuestas (`next.config.ts`).
- Three.js assets: servir desde `/public`, no desde CDN externo sin verificar.
- **Google Tag Manager (`GTM-PF295VK8`) — SIEMPRE detrás de consentimiento.** `components/analytics/GoogleTagManager.tsx` (desktop y mobile, idéntico salvo el doc comment) no renderiza nada — ni el `<script>` ni el `<noscript>`— hasta que hay una decisión `"granted"` guardada. Consentimiento gestionado por `packages/shared/src/analytics.ts` (`GTM_ID`, `CONSENT_STORAGE_KEY = "action-cookie-consent"`, `readStoredConsent`/`storeConsent`/`resetConsent`), leído/escrito en `localStorage` y compartido entre ambas apps. El banner (`ui/CookieConsent.tsx` en desktop, `components/CookieConsent.tsx` en mobile) es la única superficie que llama `storeConsent`; el enlace «Preferencias de cookies» del Footer llama `resetConsent()` para reabrirlo sin recargar. **No** pegar el snippet de Google literal en el `<head>` — eso instalaría cookies antes de que el visitante decida (LSSI art. 22.2). Al añadir un tag nuevo dentro del contenedor (Ads, Meta Pixel...), actualizar `/legal/cookies` y `LEGAL_UPDATED` en `lib/seo.ts` — ver `[PÁGINAS]`.

**Pendiente:** —

`pnpm audit --audit-level=high` → 0 high/critical es bloqueante.

---

## [DEPLOY] Deploy

- Plataforma: pendiente de definir (Vercel recomendado para Next.js)
- Entornos: pendiente
- Comandos monorepo: `turbo dev` (todas las apps), `turbo build` (todas las apps)
- Comandos desktop solo: `pnpm --filter @actiondev/desktop dev`, `pnpm --filter @actiondev/desktop build`
- Comandos admin solo: `pnpm --filter @actiondev/admin dev`, `pnpm --filter @actiondev/admin build`
- `apps/admin` se despliega como proyecto Vercel propio (mismo patrón que `apps/pablo`) — deploy independiente del sitio público, para que un fallo o un pico de tráfico del admin no afecte a `apps/desktop`.

---

## [CHECKS] Validación al terminar

```
npx tsc --noEmit   → 0 errores (bloqueante)
pnpm lint          → 0 errores
pnpm build         → exitoso
```

---

## [PERFORMANCE] Rendimiento

**`vercel-react-best-practices`** — invocar con Skill tool.

| Prioridad | Regla |
|-----------|-------|
| CRÍTICO | Sin barrel imports · `dynamic()` para componentes pesados y escenas 3D · `Promise.all()` para fetches paralelos |
| ALTO | Server Components por defecto · `"use client"` solo donde sea necesario · Three.js Canvas siempre lazy-loaded con `dynamic({ ssr: false })` |
| MEDIO | `next/image` para todas las imágenes · `next/font` para tipografías · Dispose geometrías/materiales en cleanup de R3F |

---

## [COMPOSICIÓN] Patrones de composición

**`vercel-composition-patterns`** — invocar cuando un componente acumule props booleanas. Cubre compound components, render props, context providers, React 19.

---

## [ACCESIBILIDAD] Auditoría UI

**`web-design-guidelines`** — invocar al revisar UI existente. Verifica: contraste WCAG AA (4.5:1), targets táctiles, `alt` en imágenes, `aria-label` en botones sin texto visible. Canvas 3D: añadir `role="img"` + `aria-label` descriptivo.

**Medir, no estimar.** No hay Chrome en esta máquina, solo Brave: Lighthouse necesita
`CHROME_PATH="$HOME/Library/Caches/ms-playwright/chromium-<v>/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"`.
La categoría *accessibility* es axe-core y vale contra el dev server; la de *performance* NO
— hay que medirla contra `NEXT_DIST_DIR=.next-perf pnpm build` + `pnpm start` (y borrar el
dist al acabar: Next añade su ruta a `include` de `tsconfig.json` y ya hay seis muertas ahí).
Referencia de septiembre de 2026, build de producción, preset desktop: **a11y / best-practices /
SEO = 100 en las siete rutas**; rendimiento 100 salvo la home (90, LCP 1,9 s — la paga el hero 3D).
Si algo baja de ahí, es una regresión.

**Reglas que el auditor da por hechas:**

| Regla | Por qué |
|---|---|
| **`<main id="main-content">` en TODA ruta nueva** | Es el destino del "saltar al contenido" de `app/layout.tsx`. Sin él axe marca *skip link not focusable* — pasó en `/servicios`, `/[landing]` y `/resenas` |
| **GSAP respeta `prefers-reduced-motion` desde `lib/gsap-config.ts`** | `globalTimeline.timeScale(200)`. La media query de `globals.css` solo alcanza al CSS, y los reveals son GSAP con estilos en línea. Deja el estado FINAL aplicado, así que nada se queda en `opacity: 0`. No desactivar tweens a mano |
| **Nombre accesible ⊇ texto visible** (WCAG 2.5.3) | axe compara contra lo que se VE, y `aria-hidden` NO exime: cuenta igual. De ahí que la telemetría salga fuera del `<a>` del logo y que `t.game.remote.hook` empiece por "BAJAR ESPACIO" |
| **Selectores de e2e por `data-testid`, no por `aria-label`** | El sitio es bilingüe: el `aria-label` cambia con el idioma. La cápsula del Header es `data-testid="main-nav"` |
| **Nada de `font-weight` > 700 ni `font-black`** | Space Grotesk tope 700 → el navegador sintetiza la negrita |
| **Logos por `next/image`, nunca `<img>` crudo** | `logo.webp` son 1563×625 / 68 KB; en el Header se pintan 20px. En crudo iban los 68 KB en cada página |

**Hipótesis descartadas** (medidas, no ciertas — no volver a "optimizarlas"): el peso 300 de
Space Grotesk no cuesta nada (es fuente VARIABLE, next/font sirve un solo woff2 de 22 KB para
300-700); y el grano de película (`body::before`, `mix-blend-mode: overlay`) no tiene coste
medible en los FPS del hero — la varianza entre pasadas iguales supera la diferencia entre
tenerlo y quitarlo.

**Abierto, no arreglado:** por debajo de `md` el Header se queda SOLO con el logo (enlaces,
idioma y CTA son `hidden md:*`) y no hay menú alternativo. El middleware solo manda `/` a la
zona mobile, así que un móvil en `/contact`, `/projects`, `/resenas` o `/legal/*` se queda sin
navegación. Pide decisión de producto, no es un parche.

---

## [FRONTEND-WORKFLOW] Workflow diseño frontend

1. Leer skill `frontend-design`.
2. Leer skill `web-design-guidelines` si se audita UI existente.
3. Leer skills `threejs-*` relevantes si se trabaja con 3D.
4. Analizar código existente antes de cambiar nada.
5. Aplicar `vercel-react-best-practices` en componentes nuevos.
6. Mejoras incrementales — no reescrituras.

---

## [MCPS] MCPs

**`context7`** — dudas sobre APIs del stack (Next.js, React, Three.js, GSAP, Tailwind, Lenis, R3F, Drei). Añadir `use context7` al prompt.

---

## [TOKEN-OPT] Optimizaciones de eficiencia (v2)

### Skills — jerarquía de invocación
- UI general: `frontend-design` cubre accesibilidad, composición y Tailwind. No invocar `web-design-guidelines`, `vercel-composition-patterns` ni `tailwind-css-patterns` a menos que el prompt sea específicamente una auditoría o refactor de props.
- Dudas de API: `context7` primero. Solo WebSearch si context7 no tiene la respuesta.

### Skills (Auto-load)

| Context | Skill |
|---------|-------|
| GSAP animations, timelines, ScrollTrigger | `gsap`, `gsap-scrolltrigger`, `gsap-timeline` |
| GSAP + React (`useGSAP`, context) | `gsap-react` |
| GSAP performance, will-change, GPU | `gsap-performance` |
| GSAP plugins (SplitText, Draggable…) | `gsap-plugins` |
| Three.js / R3F scenes, materials, hooks | `r3f-best-practices` |

### MCPs — uso eficiente
- Firebase (Firestore): agrupar lecturas con `Promise.all([...])` cuando sean independientes. Nunca secuencial si no hay dependencia.
- No usar `mcp__magic__*` para UI — usar skill `frontend-design`.
- No usar `mcp__ide__getDiagnostics` por defecto — solo si hay un error concreto que diagnosticar.

### Sesión nueva — lectura inicial máxima 3 archivos
Al iniciar trabajo en un feature sin contexto previo: leer `next.config.js` + `package.json` + el archivo de entry point afectado. No más.

---

## [COMPLEJIDAD] Archivos complejos — contexto intencional

Antes de refactorizar cualquiera de estos archivos, leer esta sección. La complejidad es deliberada salvo que se indique lo contrario.

| Archivo | Función compleja | CRAP | Por qué existe así | Qué NO hacer |
|---|---|---|---|---|
| `effects/carousel-3d.tsx` | `Card3D` :220, `loadTexture` :315 | 600 | Pipeline de textura video→canvas→Three.js con fallback a imagen. La complejidad de `loadTexture` es la gestión de estados async (carga, error, video ready). Reescribirlo rompería la reproducción de vídeo en las cards. El rótulo del hover (`createOverlayTexture`) y su `renderOrder` están documentados en `effects/CAROUSEL.md`. | No tocar el pipeline de texturas sin testear visualmente cada card con su vídeo. No quitar el `renderOrder` de la pila frontal: el rótulo no está centrado en la card y se pinta debajo de la imagen. |
| `canvas/GameWorld.tsx` | `useFrame` | — | Hero "La Grúa": carro con inercia + péndulo, máquina de estados del spreader (idle → lowering → raising), enganche kinematic, respawn desde la ría. Un único bucle que empuja a `Crane.update()`. Ver `canvas/SCENE.md`. | No repartir la lógica en `useFrame` de cada componente de `port/` — son visuales a propósito. |
| `ui/LoadingScreen.tsx` | `tick` :80 | 156 | Phase machine rAF: loading → stall → sprint → opening. Reescrito deliberadamente así para evitar bugs de reconciliación React + GSAP. Versiones más simples fallaron. Visual = SOLO la persiana `ui/Blinds.tsx` (sin logo ni contador, decisión del cliente). | No simplificar. La complejidad es el diseño. |
| `seo/StructuredData.tsx` | `buildSchema` :30 | 132 | Switch con JSON-LD schemas por tipo (`projects`, `reviews`). Alta ciclomática por los objetos anidados, no por lógica real. | Aceptable. No dividir en archivos separados. |

**Regla general:** si fallow marca algo como CRITICAL pero el archivo lleva >3 commits sin bugs, la complejidad es dominio, no deuda. Verificar historial con `git log -- <archivo>` antes de proponer refactor.

---

## Criterio de DONE

No marcar ninguna tarea como finalizada sin haber ejecutado `pnpm test:e2e` desde `apps/desktop/`. Si los tests no pasan (incluido visual regression), la tarea no está done.

Para actualizar snapshots tras cambios visuales intencionales: `pnpm test:e2e:update`.

## Errores prohibidos

- **No unit testear parámetros internos de GSAP** (valores de `fromTo`, callbacks de ScrollTrigger) — esos se testean con visual regression en e2e, no con mocks en Vitest
- **No poner clases Tailwind de transform/posición en elementos que GSAP anima** — GSAP debe ser el único dueño del transform matrix (ver ERR-001 en `.agent/wiki/error_library.md`)
- **No olvidar `visibility:hidden` en elementos que GSAP posiciona desde estado inicial diferente** — evita flash antes de init (ver ERR-002)
- **No shallow rendering** en ningún test — Testing Library monta componentes completos
- **No usar `<Environment preset="…">` ni `files=` de drei** — descarga un HDR de 1,75 MB desde `raw.githack.com` (CDN de terceros, con redirect 301) y suspende el `<Suspense>` que envuelve `GameWorld`, dejando el `LoadingScreen` clavado en 85-95 %. El hero actual ("La Grúa") no usa IBL: toon shading con hemisphere + directional desde la paleta. Lo mismo aplica a cualquier helper de drei que cargue assets remotos por defecto.
- **No usar `<Text>` de drei sin prop `font` local** — troika-three-text cae en `unicode-font-resolver` y baja la tipografía EN RUNTIME desde `cdn.jsdelivr.net` (2 JSON + 2 `.woff`). Usar `font="/fonts/SpaceGrotesk-Bold-subset.ttf"` (subset Latin-1 de ~15 KB, instanciado a peso 700 desde el variable font oficial y generado con `pyftsubset SpaceGrotesk-Bold.ttf --output-file=SpaceGrotesk-Bold-subset.ttf --unicodes="U+0020-007E,U+00A0-00FF" --layout-features='' --no-hinting --desubroutinize --drop-tables+=DSIG`). `carousel-3d.tsx` se quitó troika por esto mismo.
- **No montar el carrusel 3D sin gate de viewport** — su culling va por ángulo de card en `useFrame`, no por viewport DOM: al montar el canvas bajaba 4,8 MB de `.webm` con el usuario aún en el hero. El `IntersectionObserver` de `Projects.tsx` lo gatea con `rootMargin: "50% 0px"`; con 100% dispara desde scroll 0 y no sirve de nada.
- **No dejar que un asset remoto bloquee `onReady`** — todo lo que viva dentro del `<Suspense>` de `GameScene` retrasa el fin de la pantalla de carga. Assets nuevos → locales y precargados en paralelo, nunca en cascada.
- **No declarar "done"** sin ejecutar los tests
