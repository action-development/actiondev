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
| `@actiondev/shared` | `packages/shared` | Data compartida (proyectos) entre desktop y mobile | — |
| `@actiondev/pablo` | `apps/pablo` | Web personal en `pablo.actiondev.es` (proyecto Vercel propio, light-first, mobile-first) | 3002 |

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
- Muted: `#888888`, Border: `#222222`
- CSS custom properties en `:root` para colores base
- Transición global: `cubic-bezier(0.16, 1, 0.3, 1)` (var `--transition-smooth`)
- **NO** usar clases de color arbitrarias — siempre tokens semánticos: `text-foreground`, `text-muted`, `text-accent`, `bg-background`, `border-border`
- **NO** usar `!important`
- **NO** usar `@apply` — clases de Tailwind directamente en JSX
- Bordes redondeados con `rounded-2xl` o `rounded-full`

---

## [DISEÑO] Principios de diseño

- **Tipografía:** Geist Sans (principal) + Geist Mono (código/detalles). Títulos extra bold, tracking tight. Subtítulos en uppercase + tracking-widest + text-muted.
- **Espaciado:** Secciones con `py-32`. Contenido máximo `max-w-7xl`. Padding horizontal `px-6`.
- **Animaciones:** GSAP para scroll-triggered reveals, stagger en grids. Lenis para smooth scroll global. Three.js para experiencias 3D inmersivas (hero, backgrounds, transiciones).
- **Microinteracciones:** `hover:scale-105` en CTAs, `transition-colors duration-300` en links.
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
| `/projects` | Proyectos | Antigua sección `#projects` de la home tal cual (`Projects` carrusel 3D + `ProjectsIndex`), dentro de `SectionPage` |
| `/contact` | Contacto | Antigua sección `#contact` tal cual (`Contact`), dentro de `SectionPage` |
| `/reviews` | Reviews | Redirect a `/resenas` (la sección `Testimonials` de la home se retiró; el componente sigue en `sections/` sin ruta, por si se reutiliza) |
| `/resenas` | Plaza de reseñas | Sala 3D blanca estilo "sala de personajes de Wii": un muñeco procedural por testimonio; click → cámara enfoca + ficha. Es la entrada "Reseñas" del nav |
| `/servicios` | Hub SEO | Índice de landings locales (server, sin GSAP) |
| `/legal/aviso-legal` | Aviso legal | Titularidad LSSI art. 10 — Alcasi Systems, S.L. |
| `/legal/privacy` | Privacidad | RGPD/LOPDGDD |
| `/legal/terms` | Términos | Condiciones de contratación + sector público |
| `/legal/cookies` | Cookies | Sin cookies; solo almacenamiento técnico |
| `/desarrollo-de-aplicaciones-vigo` | Landing SEO | Keyword núcleo — máxima prioridad |
| `/desarrollo-web-vigo` | Landing SEO | Data en `src/data/landings.ts` |
| `/diseno-web-vigo` | Landing SEO | ídem |
| `/desarrollo-de-aplicaciones-pontevedra` | Landing SEO | ídem |
| `/desarrollo-web-pontevedra` | Landing SEO | ídem |
| `/desarrollo-de-aplicaciones-galicia` | Landing SEO | ídem |

Navegación: la home YA NO tiene secciones ni anchors. Header, Footer y contenedores del juego (`data/port-containers.ts`) apuntan a rutas reales (`/projects`, `/resenas`, `/contact`). Un `href` que empiece por `#` en un contenedor es un destino sin página todavía (p. ej. `EQUIPO`) y el juego lo ignora. `components/layout/SectionPage.tsx` = shell (Lenis + Header + Footer) para las páginas que antes eran secciones — la home no lo usa.

**Hero "La Grúa"** (`src/components/canvas/`, doc en `canvas/SCENE.md`): puerto de Vigo en estilo cómic 100 % procedural (toon + `<Outlines>`, shaders de cielo/agua, 0 assets de red). El cielo cambia según la **hora local** del visitante — noche / amanecer / día / atardecer — con paletas en `canvas/port/time-of-day.ts`; forzar con `/?hora=noche|amanecer|dia|atardecer`. Las cuatro fases tienen **fondo pintado IA** (`public/hero/port-<fase>-vN.webp`; noche/amanecer/día son ediciones "solo luz" de la de atardecer, misma composición al píxel): la imagen lleva cielo, sol/luna, Cíes, agua, bateas y muelle; grúa, barco (`PaintedShip.tsx`, delante del pintado y tapándolo), nubes, faro y todo lo móvil van en 3D, alineado con `fovForAspect`; `?plate` captura la referencia para generar fondos nuevos (ver `canvas/SCENE.md`). Clicks del juego por cola (`use-action-queue`) y solo sobre el canvas. Controles también por **mando de radiocontrol 3D** (`canvas/overlays/RemoteControl.tsx`, caja CSS 3D horizontal tipo panel arcade, abajo centro sobre el muelle): flechas + botón de gancho que escriben en `lib/hero-remote.ts`; vive FUERA del canvas a propósito (ver gotchas en `canvas/SCENE.md`). **Easter egg**: click sobre una gaviota → bala desde al lado del mando, impacto con sonido WebAudio (0 assets), plumas, caída con fundido y contador arriba a la derecha (`overlays/GullTally.tsx`, persistido en `localStorage`); hit-test en `port/gull-hunt-logic.ts`, render en `port/GullHunt.tsx` — sección "Easter egg" de `canvas/SCENE.md`. Segundo easter egg: click sobre el barco → bocina de zarpar (`playHornSfx` en `lib/hero-sfx.ts`, hit-test `pickShipAt` en `port/ship-hull.ts`), sin bajar el gancho.

**Landings SEO** (`src/app/[landing]/page.tsx` + `src/data/landings.ts`): NO se enlazan desde la navegación principal (decisión del cliente — no tocar el diseño original). Se descubren vía `sitemap.xml`, `/servicios`, `llms.txt` y enlazado entre ellas. Son server components estáticos, responsive, sin GSAP/Lenis. El middleware solo reescribe `/` a la zona mobile; el resto de rutas se sirven desde desktop en todos los dispositivos.

**Plaza de reseñas** (`src/app/resenas/` + `src/components/canvas/PlazaScene.tsx` + `canvas/plaza/*` + DOM en `src/components/plaza/*`): página CLARA a propósito (excepción al dark-first, decisión del cliente). Contrato compartido en `canvas/plaza/plaza-config.ts` (paleta, medidas `DOLL`, PRNG determinista por id → el mismo cliente tiene siempre el mismo muñeco, requisito para snapshots). 0 assets: caras, cielo y suelo son `CanvasTexture` en runtime. Copiamos el lenguaje visual (proporciones, plaza, comportamiento), nunca marcas/nombres/assets de Nintendo — no usar la palabra "Mii" en copy ni código público.

Componente nav: `layout/Header.tsx` + `Header.module.css` = **panel holográfico** a todo el ancho (`mx-6 mt-5`, 64px), mismo lenguaje que la flecha holográfica del barco (`port/Ship.tsx` HOLO_FRAG): lima translúcido con fondo `rgba(8,8,8,.28)` + blur, borde fresnel `#eaffb0`, barrido de franjas que sube (`holo-scan`), parpadeo con tartamudeo (`holo-flicker`), doble imagen desfasada (`::before`), haz difuminado abajo (`::after`) y corchetes en las esquinas. Sin degradado en la home (fuera, fundido corto). Marca con logo teñido en lima + telemetría mono (Vigo 42.24°N 8.72°W, hora local y fase del día vía `resolveTimeOfDay` + `?hora=`, solo en cliente); enlaces centrados con índice `01/02/03` y retícula al hover/activo; idioma segmentado; CTA "Hablemos" como prompt `>` con cursor que se solidifica en lima al hover.

**Persiana (carga + transición de ruta)** — `ui/Blinds.tsx` es la cortina: 10 lamas horizontales `bg-accent` con hueco de 3px, cierre 0→1 con origen arriba y apertura 1→0 con origen abajo, escalonadas de arriba abajo (transiciones CSS, sin GSAP; `blindsDuration()` devuelve 0 con `prefers-reduced-motion`). Dos consumidores: `ui/LoadingScreen.tsx` (cerrada desde SSR, se abre al llegar a 100 %) y `animations/PageTransition.tsx` (provider en el layout raíz). `PageTransition` intercepta en fase de CAPTURA cualquier `<a>` interno del documento — hay que ir por delante del `onClick` de `<Link>` de Next, que hace `preventDefault` y navega solo — cierra, hace `router.push`, y abre cuando cambia `location` (o a los 4 s como escotilla). Salta con modificadores, `target`, `download`, `data-no-transition`, externos y misma ruta. Navegación programática (juego de la home, logo del Header) → `usePageTransition().navigate(href)`. Estado observable en `[data-testid="page-blinds"][data-state]` para e2e.

---

## [SEO] Metadata

- **Idioma indexable: español** (decisión de negocio — el mercado objetivo es Vigo/Galicia). `lang="es"`, metadata en ES en ambas apps. EN disponible vía toggle client-side (desktop) o Accept-Language (mobile).
- Título: `"Action — Desarrollo de Aplicaciones y Webs en Vigo"` (home), `"[Page] — Action"` (subpages)
- Dominio canónico: `https://actiondev.es`
- Fuente de verdad SEO: `apps/desktop/src/lib/seo.ts`. **NAP compartido** (dirección C/ Colón 20, teléfono, geo): `packages/shared/src/seo.ts` (`BUSINESS`) — debe coincidir SIEMPRE con la ficha de Google Business Profile.
- **Titularidad legal**: `LEGAL_ENTITY` en `packages/shared/src/seo.ts`. "Action / Action Development" es una MARCA; la persona jurídica es **Alcasi Systems, S.L.** (CIF B72910664, domicilio social en Marín, Reg. Mercantil de Pontevedra). `BUSINESS.legalName` lleva la denominación social real y `BUSINESS.displayName` el nombre de marca largo para usos visuales (OG image). No volver a poner un nombre de marketing en `legalName` — el JSON-LD emite `legalName` + `vatID` para que un organismo público pueda cruzar el proveedor con el Registro Mercantil.
- **Páginas legales** en `/legal/*` (desktop): ver `[PÁGINAS]`. Al tocar su contenido, actualizar `LEGAL_UPDATED` en `src/lib/seo.ts`. La política de cookies y la de privacidad describen el comportamiento REAL del sitio (sin analítica, formulario que abre WhatsApp sin servidor) — si se añade analítica, hay que actualizarlas Y añadir banner de consentimiento.
- Infraestructura: `sitemap.ts`, `robots.ts` (whitelist crawlers LLM), `manifest.ts`, `public/llms.txt` (AEO), OG image dinámica en `/api/og`.
- Structured data: `components/seo/StructuredData.tsx` (desktop) y `components/StructuredData.tsx` (mobile) — Organization + ProfessionalService con NAP/geo idénticos y mismos `@id`. Las landings añaden Service + FAQPage + BreadcrumbList.
- **Mobile-first indexing**: Google indexa la zona mobile para `/`. Cualquier cambio SEO en desktop debe replicarse en mobile (metadata + JSON-LD).
- Pendiente: favicon.ico real + PNGs 192/512 para manifest.

---

## [BACKEND] API y base de datos

- Sin backend por ahora. Datos estáticos en `src/data/`.
- Formulario de contacto: pendiente conectar a servicio externo (Resend, SendGrid, o API route).
- No hay base de datos. No hay auth.

---

## [SECURITY] Seguridad

- No hay `.env` todavía. Cuando se añada, **NUNCA** commitear archivos `.env`.
- Formulario de contacto: añadir rate limiting y honeypot antes de conectar a backend.
- Three.js assets: servir desde `/public`, no desde CDN externo sin verificar.

**Pendiente:** —

`pnpm audit --audit-level=high` → 0 high/critical es bloqueante.

---

## [DEPLOY] Deploy

- Plataforma: pendiente de definir (Vercel recomendado para Next.js)
- Entornos: pendiente
- Comandos monorepo: `turbo dev` (ambas apps), `turbo build` (ambas apps)
- Comandos desktop solo: `pnpm --filter @actiondev/desktop dev`, `pnpm --filter @actiondev/desktop build`

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
- Supabase: agrupar queries con `Promise.all([...])` cuando sean independientes. Nunca secuencial si no hay dependencia.
- No usar `mcp__magic__*` para UI — usar skill `frontend-design`.
- No usar `mcp__ide__getDiagnostics` por defecto — solo si hay un error concreto que diagnosticar.

### Sesión nueva — lectura inicial máxima 3 archivos
Al iniciar trabajo en un feature sin contexto previo: leer `next.config.js` + `package.json` + el archivo de entry point afectado. No más.

---

## [COMPLEJIDAD] Archivos complejos — contexto intencional

Antes de refactorizar cualquiera de estos archivos, leer esta sección. La complejidad es deliberada salvo que se indique lo contrario.

| Archivo | Función compleja | CRAP | Por qué existe así | Qué NO hacer |
|---|---|---|---|---|
| `effects/carousel-3d.tsx` | `Card3D` :72, `loadTexture` :128 | 600 | Pipeline de textura video→canvas→Three.js con fallback a imagen. La complejidad de `loadTexture` es la gestión de estados async (carga, error, video ready). Reescribirlo rompería la reproducción de vídeo en las cards. | No tocar el pipeline de texturas sin testear visualmente cada card con su vídeo. |
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
- **No usar `<Text>` de drei sin prop `font` local** — troika-three-text cae en `unicode-font-resolver` y baja la tipografía EN RUNTIME desde `cdn.jsdelivr.net` (2 JSON + 2 `.woff`). Usar `font="/fonts/Poppins-Bold-subset.ttf"` (subset Latin-1 de 13,9 KB, generado con `pyftsubset Poppins-Bold.ttf --output-file=Poppins-Bold-subset.ttf --unicodes="U+0020-007E,U+00A0-00FF" --layout-features='' --no-hinting --desubroutinize --drop-tables+=DSIG`). `carousel-3d.tsx` se quitó troika por esto mismo.
- **No montar el carrusel 3D sin gate de viewport** — su culling va por ángulo de card en `useFrame`, no por viewport DOM: al montar el canvas bajaba 4,8 MB de `.webm` con el usuario aún en el hero. El `IntersectionObserver` de `Projects.tsx` lo gatea con `rootMargin: "50% 0px"`; con 100% dispara desde scroll 0 y no sirve de nada.
- **No dejar que un asset remoto bloquee `onReady`** — todo lo que viva dentro del `<Suspense>` de `GameScene` retrasa el fin de la pantalla de carga. Assets nuevos → locales y precargados en paralelo, nunca en cascada.
- **No declarar "done"** sin ejecutar los tests
