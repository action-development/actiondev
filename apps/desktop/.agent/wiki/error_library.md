# Error Library — actionnew/desktop

Registro de bugs visuales que escaparon a los tests unitarios. Cada entrada documenta qué pasó y la regla aprendida.

---

## ERR-001: GSAP + Tailwind transform conflict (headline Testimonials)

**Síntoma:** El titular animated saltaba de posición al hacer resize de la ventana.
**Causa raíz:** Tailwind `-translate-x-1/2` y `left-1/2` en la clase CSS conflictuaban con `xPercent`/`yPercent` de GSAP durante el scrub. GSAP y Tailwind escriben al mismo `transform` matrix — el último en escribir gana, causando posiciones inconsistentes.
**Fix aplicado:** Eliminar clases Tailwind de transform/position del elemento; mover posicionamiento a inline styles. GSAP posee el transform matrix exclusivamente.
**Regla:** Si GSAP anima `x/y/xPercent/yPercent/left/top` en un elemento, ese elemento NO debe tener clases Tailwind de transform o posición. Verificar con test visual en resize.

---

## ERR-002: Headline visible antes de GSAP init

**Síntoma:** En la primera carga, el titular de Testimonials aparecía brevemente en posición incorrecta (centrado en viewport) sobreponiendo otras secciones antes de que GSAP ejecutara la animación inicial.
**Causa raíz:** El elemento era visible por defecto; GSAP tarda algunos ms en inicializar y aplicar el estado FROM.
**Fix aplicado:** `style={{ visibility: 'hidden' }}` en el elemento; GSAP lo revela via `onEnter` callback de ScrollTrigger.
**Regla:** Cualquier elemento que GSAP va a posicionar desde un estado inicial diferente al DOM default debe tener `visibility:hidden` como inline style. NO usar `opacity:0` como sustituto (ocupa espacio pero puede causar otros flashes).

---

## ERR-003: Cubo pickup fuerza al personaje hacia atrás

**Síntoma:** Al pulsar E junto a un cubo, el personaje saltaba bruscamente hacia atrás en lugar de coger el cubo limpiamente.
**Causa raíz:** En el mismo frame del pickup, el bloque de kinematic-follow ya tenía `currentHeld` apuntando al cubo recién cogido. `setNextKinematicTranslation` en Rapier hace un *swept move* (con resolución de contactos) desde la posición actual del cubo (junto al personaje, a ras de suelo) hasta `holdY` (por encima de la cabeza). El barrido atravesaba la cápsula del personaje generando un gran impulso de contacto que lo lanzaba hacia atrás.
**Fix aplicado:** Añadir `rb.setTranslation(holdX, holdY, 0)` inmediatamente tras activar kinematic. `setTranslation` es un warp directo sin barrido — Rapier no genera contactos. El frame de follow ve delta=0 y el `setNextKinematicTranslation` no produce ningún impulso.
**Regla:** Cuando se cambia un RigidBody a kinematic y debe moverse a una posición distante en el mismo frame, usar `setTranslation` para teleportarlo primero. Reservar `setNextKinematicTranslation` para los frames de seguimiento suave posteriores.

## ERR-004: Cubo kinematic queda flotando tras pause/resume

**Síntoma:** El cubo "REVIEWS" (o cualquier cubo recogido) aparece flotando inmóvil en el centro de la hero al volver al viewport después de haber bajado la página.
**Causa raíz:** Cuando `paused=true` dispara en `useFrame`, el bloque de pause reseteaba `wasDown` e `isAiming` pero NO limpiaba `heldCubeRef`. Si el usuario soltaba el ratón MIENTRAS el juego estaba pausado, `justReleased` nunca se detectaba (`wasDown=false` → `!btnDown && wasDown = false`). El cubo permanecía kinematic indefinidamente.
**Fix aplicado:** Al entrar en el bloque `if (paused)` en `GameWorld.useFrame`, si `heldCubeRef.current` es non-null, se libera el cubo inmediatamente (`setBodyType(DYNAMIC)`, `setLinvel(0)`, `heldCubeRef=null`). La física (también pausada en ese momento) congela el cubo en su posición actual; al reanudar, cae al suelo normalmente.
**Regla:** Cualquier estado de input o de cuerpo kinematic derivado de input de usuario debe limpiarse en el bloque `if (paused)`, no solo al resumir. Un evento de "release" del ratón puede ocurrir fuera del frame loop y nunca detectarse al resumir.

## ERR-005: Footer (y toda la página bajo el hero) no recibe clicks

**Síntoma:** Ningún link/botón del footer respondía al click, aunque se veían y hacían hover normal.
**Causa raíz:** `FloatingCubeLite` renderiza un `<Canvas>` R3F decorativo (`aria-hidden`) en un wrapper `fixed inset-0 z-[1]` que cubre todo el viewport. El wrapper tenía `pointer-events-none` (intención correcta), pero R3F fuerza `pointer-events: auto` sobre su propio contenedor de canvas, anulando el `none` heredado. El canvas a pantalla completa interceptaba `elementFromPoint` sobre el footer → se comía todos los clicks.
**Fix aplicado:** Añadir `pointerEvents: "none"` al `style` del propio `<Canvas>` (no basta con el wrapper). El estilo inline gana sobre el default de R3F; el canvas hereda `none` y deja pasar los clicks.
**Regla:** Un `<Canvas>` R3F decorativo/full-screen debe llevar `pointerEvents: "none"` en su propio `style`, no solo `pointer-events-none` en un div padre — R3F re-habilita pointer-events en el contenedor del canvas. Diagnóstico: `document.elementsFromPoint(x,y)` sobre el elemento "muerto" revela qué canvas está encima.

<!-- Añadir nuevas entradas con formato: ERR-NNN: título, síntoma, causa, fix, regla -->
