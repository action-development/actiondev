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
| `shared` | `packages/shared` | Código compartido (pendiente) | — |

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
| `/` | Home | Hero → Projects → Testimonials → Map |
| `/projects` | Projects | Grid de proyectos completo |
| `/contact` | Contact | Formulario de contacto |

Navegación: anchor links para secciones de home (`#projects`, `#testimonials`, `#map`), rutas completas para pages independientes.

Componente nav: `Header.tsx` con nav fija + CTA "Let's talk".

---

## [SEO] Metadata

- Título: `"Action — Digital Agency"` (home), `"[Page] — Action"` (subpages)
- Descripción por página en `metadata` export
- Lang: `en`
- Pendiente: Open Graph images, sitemap.ts, robots.ts, canonical domain

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

### MCPs — uso eficiente
- Supabase: agrupar queries con `Promise.all([...])` cuando sean independientes. Nunca secuencial si no hay dependencia.
- No usar `mcp__magic__*` para UI — usar skill `frontend-design`.
- No usar `mcp__ide__getDiagnostics` por defecto — solo si hay un error concreto que diagnosticar.

### Sesión nueva — lectura inicial máxima 3 archivos
Al iniciar trabajo en un feature sin contexto previo: leer `next.config.js` + `package.json` + el archivo de entry point afectado. No más.
