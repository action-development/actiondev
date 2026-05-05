# Decisiones de Arquitectura — actionnew/desktop

## Stack

| Decisión | Por qué |
|---|---|
| Next.js 16 (App Router) | RSC para reducir JS client, layouts anidados sin prop drilling |
| React 19 | Concurrent features, useTransition para animaciones no bloqueantes |
| GSAP sobre Framer Motion | Control preciso de timelines, ScrollTrigger maduro, rendimiento superior en animaciones complejas scrub |
| Three.js / R3F / Drei | Escena 3D interactiva en hero — R3F integra con React lifecycle limpiamente |
| Lenis sobre native scroll | Suavizado de scroll necesario para que GSAP ScrollTrigger no salte en trackpad |
| Tailwind v4 | Sin config file, JIT nativo, CSS custom properties automáticas |
| Turborepo + pnpm workspaces | Monorepo con apps/desktop + apps/mobile — cache compartida de builds |
| Vitest + Testing Library | Más rápido que Jest para proyectos Vite/Next, compatible con React 19 |

## Decisiones de Diseño

| Decisión | Por qué |
|---|---|
| Dark mode first | Identidad premium, menor fatiga visual para demos en cliente |
| Paleta B/N + accent único | Evitar distracciones, máximo contraste, fácil de adaptar a cliente |
| `visibility:hidden` en headlines GSAP | Sin esto el elemento overlay otras secciones antes de que GSAP inicialice |
| GSAP owns transform matrix | Mezclar Tailwind `-translate-*` con GSAP `xPercent/yPercent` causa jumps en resize |
| `gsap.fromTo` en lugar de `gsap.to` | Con `invalidateOnRefresh:true`, `.to` re-lee FROM desde posición pintada post-resize (drift). `.fromTo` usa el FROM declarado siempre |
| `left` como función en fromTo | Un valor constante es stale después de resize — función se re-evalúa en cada `ScrollTrigger.refresh()` |
