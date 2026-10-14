# Intro «empuje» — análisis de huyml.co para replicarla con la mascota

Fecha: 2026-10-14. Referencia: la intro de `https://huyml.co` (Huy Phan, Framer, Awwwards SOTD).

**Fuentes y fiabilidad.** Este documento NO es una estimación a ojo. Se cruzaron tres fuentes y casan al fotograma:

1. La grabación de pantalla del cliente (Safari, 3024×1964 a ~54 fps, viewport CSS de 1447×859 a DPR 2).
2. El código público del componente Framer que la pinta, `PushLoaderReveal` (GSAP 3.13 + lottie-web 5.12), con los props de la instancia de la home.
3. El Lottie del personaje (`lS6ID9P8uuYjO76b2j9eAbrilA.json`), renderizado fotograma a fotograma.

Las curvas medidas en el vídeo (posición del borde de la pared en cada fotograma) dan los mismos tiempos y easings que el código con error < 1 fotograma.

**Material de referencia** (local, NO al repo: es material de terceros y el repo es público):
`~/Documents/ActionDev/Marca/intro-empuje/referencia-huyml/` — grabación, hojas de contacto, fotogramas clave (`fotogramas/t<segundo>.png`, tiempos del vídeo), Lottie original y el código del componente legible. El Lottie y su dibujo son de Huy Phan: solo como referencia de acting, nunca se publican.

---

## 1. Qué se ve

1. **Negro** a pantalla completa mientras la página carga.
2. Un **muñeco** entra por la izquierda **empujando el borde de la pared negra** hacia la derecha. Detrás de él queda un **panel blanco**.
3. Empuja **a tirones**: avanza hasta el 30 % del ancho, **se queda clavado** (esfuerzo), avanza hasta el 60 %, **otra pausa**, y en el último tramo **arranca despacio y acelera** hasta sacar la pared por la derecha y salirse él también de pantalla.
4. Conforme se abre el panel aparece, ya en su sitio (no se mueve), el texto **«HUY / PHAN»** en rojo, centrado. La pared lo tapa; no lo empuja.
5. Medio segundo quieto con el nombre solo.
6. El panel blanco **baja como una persiana** y descubre la web; el texto **no baja con él**: se queda fijo y el borde superior del panel lo va recortando.
7. Debajo, la web ya está animándose (una tira 3D de imágenes que pasa rápida y frena en la imagen central) y al final entran los textos con desenfoque.

---

## 2. Capas (de abajo arriba)

Un contenedor `position: fixed; inset: 0; z-index: 2147483647; overflow: hidden; pointer-events: none` con una variable CSS `--push-progress` (de 0 a 1,28) que escribe GSAP en cada tick.

| z | Capa | CSS clave |
|---|------|-----------|
| 0 | **Panel** (blanco `#FFFFFF`) | `position:absolute; inset:0` |
| 1 | **Texto** | `position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); text-align:center; color:#FF4949; text-transform:uppercase`. Contenido: `huy<br>phan` |
| 2 | **Pared** (negro `#000000`) | `position:absolute; inset:0; left: calc(min(112%, max(0%, var(--push-progress) * 100%)))` |
| 3 | **Personaje** | ancla de 0×0 en `left: calc(var(--push-progress) * 100% - J px); top: calc(50% + centerOffsetY)`, y dentro una caja de `429·s × 451·s` px con `left: loaderOffsetX; transform: translate(-50%,-50%)` |
| 4 | Contador 0→100 | **Oculto** en esta web (`font-size: 0px`). Ver §8 |

- La pared es **un solo `div` negro plano**: sin textura, sin sombra, sin borde. Su borde izquierdo ES `--push-progress × 100 %` del ancho, con tope en 112 % (ya fuera de pantalla).
- El texto está **debajo de la pared y debajo del personaje**: el muñeco pasa por delante de las letras.
- Personaje y pared se mueven con `left` (no `transform`), con `will-change: left`.

---

## 3. Línea de tiempo exacta

`T0` = arranque del timeline. En la grabación, `T0` = 1,92 s.

| Tramo | Desde → hasta (s desde T0) | Progreso | Duración | Ease GSAP | Equivalente |
|---|---|---|---|---|---|
| Empuje 1 | 0,000 → 0,650 | 0 → 0,30 | 0,65 | `power2.inOut` | cúbica in-out |
| Pausa 1 | 0,650 → 0,810 | 0,30 | 0,16 (`holdOne`) | — | personaje congelado |
| Empuje 2 | 0,810 → 1,530 | 0,30 → 0,60 | 0,72 | `power2.inOut` | cúbica in-out |
| Pausa 2 | 1,530 → 1,730 | 0,60 | 0,20 (`holdTwo`) | — | personaje congelado |
| Empuje final | 1,730 → 3,190 | 0,60 → 1,28 | 1,46 | `power3.in` | **cuártica** de entrada |
| — la pared sale de pantalla (p = 1,0) | 3,009 | | | | |
| Fin con el nombre solo | 3,190 → 3,690 | 1,28 | 0,50 (`finalHold`) | — | |
| **Evento `push-loader:complete`** | 3,690 | | | | arranca el hero (ver §6) |
| Espera antes de bajar | 3,690 → 4,290 | | 0,60 (`PANEL_EXIT_DELAY`) | — | |
| Bajada del panel | 4,290 → 5,620 | `y: 0 → 100vh` | 1,33 (`fadeDuration`) | `power2.inOut` | cúbica in-out |
| Contra-movimiento del texto | 4,290 → 5,620 | `y: 0 → −100vh` | 1,33 | `power2.inOut` | el texto queda quieto en pantalla |
| Desmontaje del componente | ≈ 5,62 | | | | |

**Total: 5,62 s** desde que arranca (más lo que tarde en cargar la página con la pantalla en negro).

Medido en el vídeo: pausa 1 de 2,57 a 2,73 s; pausa 2 de 3,44 a 3,65 s; pared fuera a 4,95 s; inicio de la bajada a 6,22 s; fin a 7,49 s. Todo cuadra con la tabla.

**Gotcha de nombres en GSAP:** `powerN` es de grado N+1. `power2` = cúbica, `power3` = cuártica. Las curvas medidas lo confirman (con cúbica en el último tramo no casaba; con cuártica casa en 4 puntos con el mismo inicio, 3,646 s). Si se implementa sin GSAP:

- `power2.inOut` ≈ `cubic-bezier(0.65, 0, 0.35, 1)`
- `power3.in` ≈ `cubic-bezier(0.5, 0, 0.75, 0)`

Nuestro stack ya trae GSAP 3.14: usar los mismos nombres de ease y no hace falta traducir nada.

---

## 4. Geometría (viewport de la grabación: 1447 × 859 CSS px, rango «1440»)

### Personaje

- Caja: `429 × 451` × `loaderScale` (1,14) = **489 × 514 px**. El Lottie es cuadrado (2000×2000) con `xMidYMid meet`: ocupa 489×489 centrado en la caja.
- Ancla: `x = p·vw − J + loaderOffsetX`, con `J = caja/2 = 244,5` y `loaderOffsetX = 60`. Como la caja se centra en el ancla, su borde izquierdo queda en `p·vw − 429`.
- **Las manos están SIEMPRE en el 88,5 % del ancho del Lottie** (medido en los 116 fotogramas: no se mueven). 0,885 × 489 = 432,8 → **las manos caen en `p·vw + 4 px`: exactamente sobre el borde de la pared**. Los 60 px de `loaderOffsetX` existen para eso. Es la clave del efecto: el contacto mano-pared no se despega nunca.
- Altura del dibujo: del 9,8 % al 93,8 % del Lottie = **411 px ≈ 48 % del alto de pantalla**, centrado en `50 % + 9 px`.
- El bloque de texto mide 392 px de alto y va de `50 % − 188` a `50 % + 204`: **personaje y nombre tienen la misma altura y la misma franja vertical**. Composición deliberada.
- En `p = 1,28` el borde izquierdo de la caja está en 1423 px de 1447, pero el dibujo empieza en el 20 % de la caja: el muñeco ya está fuera.

### Texto

- Fuente: «BT Glyphius Regular» (serif display de pago), 220 px, `letter-spacing: −0.05em`, `line-height: 96%`, color `#FF4949` (Safari lo pinta como `rgb(253, 62, 62)`).
- Caja medida: 571 × 392 px, centrada. Altura de mayúscula ≈ 184 px (0,84 em); hueco entre líneas ≈ 26 px.

### Por tamaño de pantalla (puntos de corte de Framer de esa web)

| Rango | Fuente | `line-height` | `loaderScale` | `loaderOffsetX` |
|---|---|---|---|---|
| ≤ 1099 px («Phone») | 110 px | 100 % | 0,58 | 31 |
| 1100 – 2399 px («1440» y «Desktop») | 220 px | 96 % | 1,14 | 60 |
| ≥ 2400 px | 330 px | 96 % | 1,60 | 80 |

Además, con `innerWidth ≤ 767` el componente pasa a su variante «Mobile» de tiempos: empuje 1 dura 0,95 s (+0,3), el final 1,76 s (+0,3), el progreso final es 1,4 y la pared se topa en 140 %.

---

## 5. El personaje (Lottie)

- Vectorial (`renderer: "svg"`), 2000×2000, 30 fps, fotogramas 30 → 146 (**116 fotogramas**), 50 capas: cuerpo, cabeza en 6 piezas, gorra, 2 caras, manos, piernas, y **23 capas `elm-*` de marcas de esfuerzo** (gotas de sudor, chispas ✦, resoplidos) que aparecen cada una ~8-12 fotogramas en momentos distintos.
- El muñeco **no se desplaza dentro del Lottie**: anda en el sitio con las manos fijas. El avance lo pone la posición de la caja.
- **NO se reproduce por tiempo. Se arrastra con el progreso:**

  ```
  frame = (p × 116 × 1,08) mod 116      → anim.goToAndStop(frame, true)
  ```

  Consecuencias, todas visibles en el vídeo:
  - Los pasos van **en proporción a la distancia**: cuando el empuje acelera, las piernas aceleran; cuando frena, frenan. Cero patinaje.
  - **En las pausas el muñeco se congela** (medido: diferencia de píxeles ≈ 0 entre el principio y el final de cada pausa). La pausa se lee como «está apretando y no se mueve».
  - El Lottie da ~1,38 vueltas en todo el empuje (p de 0 a 1,28).
- Acting por tramos del ciclo: fotogramas ~0-36 de perfil con resoplidos; ~40-90 **cabeza gacha** empujando con la gorra por delante (el esfuerzo máximo); ~92-116 vuelve a perfil mirando arriba con chispas. Las pausas caen en `p = 0,30 → f 37,6` (empezando a agachar la cabeza) y `p = 0,60 → f 75,2` (cabeza gacha): **las dos pausas coinciden con poses de máximo esfuerzo**. No es casual: el ×1,08 está ajustado para eso.
- Pared fuera (`p = 1,0`) → f 9,3; final (`p = 1,28`) → f 44,4.

---

## 6. Arranque y relevo con la web

**Arranque (la pantalla negra ES el preloader).** El timeline espera, en cadena: montaje en cliente → `window.load` + `document.fonts.ready` + 2 `requestAnimationFrame` → JSON del Lottie descargado y `DOMLoaded` + 2 rAF → 2 rAF más → `play()`. Hasta entonces la pared (progreso 0) tapa todo.

**Relevo.** `push-loader:complete` se dispara al terminar el `finalHold`, **0,6 s ANTES de que el panel empiece a bajar**. El hero de esa web (`WebGLMagazineFramer`, three.js) lo escucha con `introSignalDelay: 0.24`, así que **cuando el panel empieza a bajar el hero ya lleva 0,36 s moviéndose detrás**. Por eso al abrirse la persiana se ve movimiento en vez de una web quieta.

El hero, para documentarlo (es contenido suyo, no parte del loader):

- La tira de páginas se desplaza 24 posiciones en 2 s con `1 − (1 − t)^4` (easeOutQuart), metiendo la velocidad en un uniform del shader (curvatura/estela).
- A los 1,06 s, y durante 1,1 s con `power2.out`, se separan las páginas y se endereza la central (`uCenterSpacing`, `uFocusRotationX/Y/Z`).
- Al acabar dispara `webgl-magazine:intro-complete` y entran los textos laterales con desenfoque → nitidez.
- Si la intro ya se completó en esa misma ruta hace < 30 s (`window.__framerIntroSignalState`), el hero no espera al loader.

---

## 7. Detalles que no se ven pero importan

- Todo el overlay es `pointer-events: none`: no bloquea nada, solo tapa.
- Sin `prefers-reduced-motion`: la original lo ignora. **La nuestra tiene que respetarlo** (ver `[ACCESIBILIDAD]` del CLAUDE.md).
- Guarda `sessionStorage['hide-after-delay:last-trigger-start']` al arrancar y el estado de la intro en `window.__framerIntroSignalState` (fase, ruta, timestamp) para que otros componentes sepan si ya pasó.
- Tope de la pared en 112 % (escritorio) para que su borde no se vea mientras el muñeco termina de salir hasta 128 %.
- Al terminar la bajada se desmonta (`return null`): cero coste después.

---

## 8. El contador (desactivado allí, disponible para nosotros)

El componente trae un contador de porcentaje pegado a la derecha, en la misma línea, que **el muñeco empuja** cuando lo alcanza (`translate3d(var(--counter-push), …)` = lo que el progreso invade su caja). Mapea el progreso a un 0-100 «honesto» por tramos: 0-0,3 → 0-30; 0,3-0,6 → 30-60; 0,6-1,28 → 60-100. En huyml está apagado con `font-size: 0`. Puede servirnos si queremos que la carga se lea como carga.

---

## 9. Adaptación a Action (propuesta)

### Lo que se replica tal cual

Capas, `--push-progress`, tramos, duraciones, eases, pausas, tope de la pared, regla «manos en el borde», contra-movimiento del texto en la bajada, evento de fin 0,6 s antes de bajar y desmontaje. Es una animación determinista de ~5,6 s: GSAP (ya en el stack) con un único timeline, como el original.

### Lo que cambia

| Pieza | huyml | Action (propuesta) |
|---|---|---|
| Personaje | Lottie de un chico con gorra (ilustración suya) | **La mascota**: círculo lima `#C8FF00` + dos ojos en píldora negra con brillo blanco (`~/Documents/ActionDev/Marca/mascota-favicon/mascota-master.svg`: círculo r 800 en 1600, ojos 132×264 con radio 66 en (644,136) y (920,136), brillos r 30). Los ojos ya miran arriba a la derecha = hacia la pared |
| Texto | «HUY / PHAN», BT Glyphius, `#FF4949` | Space Grotesk 700 (la única familia del sitio; tope 700), caja alta, `−0.05em`. Texto y color: decisión pendiente |
| Pared / panel | negro / blanco | ver decisión de paleta |
| Fuente del acting | Lottie scrubbeado | SVG en código scrubbeado con la misma regla `fase = (p × k) mod 1` |

### La mascota empujando — opciones

La mascota no tiene brazos ni piernas, y lo que vende la original es el **contacto con la pared** y las **pausas de esfuerzo**. Eso se puede conservar sin extremidades:

- **A · Bola pura, en código (SVG + GSAP).** El lado derecho del círculo se **aplasta contra la pared** (achatado en el punto de contacto, que cae en `p·vw` como las manos del original); cada «empujón» es aplastar → soltar con un saltito; ojos que se entrecierran (escala Y de las píldoras) y pierden el brillo en el esfuerzo; gotas y chispas como formas sueltas. Ciclo `k = 10/3`: los picos de aplastamiento caen en p = 0,3 / 0,6 / 0,9 / 1,2 → **las dos pausas quedan congeladas en el máximo esfuerzo**, igual que en el original. Ventajas: marca intacta, color exacto, vectorial, ~2-3 KB, sin dependencias, ajuste fino trivial. Contra: no hay «andar»; el empuje se lee por aplastamiento, no por piernas.
- **B · Bola con brazos y piernas de tubo («rubber hose») en tinta, en código.** Brazos estirados con las manos en el borde de la pared y piernas que dan pasos (IK de dos huesos). Lectura idéntica a la original y encaja con el cómic de «La Grúa» y `ui/ControlSign`. Contra: le añade cuerpo a la mascota (decisión de marca) y bastante más trabajo de animación.
- **C · Lottie hecho por un animador** (After Effects + Bodymovin), como la original. Máximo acting. Contra: necesita animador y tiempo, y mete `lottie-web` (no está en el stack) en la home.
- **D · Vídeo de Higgsfield → secuencia de imágenes.** **No recomendado como asset final**: un círculo con dos ojos no se mantiene estable entre fotogramas en un modelo de vídeo (la forma y los ojos bailan), hay que recortar fondo fotograma a fotograma, pesa megas (contra el objetivo de Lighthouse) y no es vectorial. Para lo que SÍ sirve Higgsfield aquí: fotogramas clave de concepto (poses de esfuerzo, gotas, estilo de extremidades si vamos a B) para acordar el look antes de animar, y un vídeo de referencia de acting.

Recomendación: **A**. Es la que respeta la mascota tal como está (la decisión del favicon fue «círculo con ojos, sin nada más»), cuesta poco y deja la puerta abierta a B si el aplastamiento se queda corto.

### Paleta — opciones

El rojo funciona en la original porque es el único color y contrasta con el negro de la pared en el borde del recorte. Con lima como color de la mascota:

- **A · Pared tinta `#0a0a0a`, panel papel, texto tinta, mascota lima** (la mascota es el único color, como el rojo allí). Contra: en el borde, las letras negras tocan la pared negra y no se ve el «corte»; parecen salir de la pared.
- **B · Pared lima (el color de la persiana actual, continuidad de marca), panel tinta `#0a0a0a`, texto papel `#ededed`, mascota lima con filete de tinta** (sin filete, la mascota se funde con la pared justo en el contacto, que es el plano clave).

### Integración en el repo (propuesta, sin implementar)

- Componente cliente `components/intro/PushIntro.tsx` (+ módulo CSS en `@layer components`), SVG de la mascota inline, un único `gsap.timeline` con los tramos de §3. Sin Lottie, sin Lenis, sin Three.
- En la home de escritorio sustituiría a la persiana de `ui/LoadingScreen.tsx` con el **mismo contrato** que ya usa `app/(site)/page.tsx`: `ready` (la pared negra aguanta hasta que `GameScene` avisa con `onReady`, igual que el original espera a `window.load`) y `onComplete`. El juego se despausaría con el evento de fin (0,6 s antes de que baje el panel), para que al abrirse ya haya movimiento, como en huyml.
- Respetar `skipLoader` (llegar a `/` desde otra página de la sesión no repite la intro).
- `prefers-reduced-motion`: sin empuje; pared fuera y fundido corto.
- Overlay `aria-hidden="true"`; el `<h1>` indexable sigue siendo el de la página.
- El banner de cookies y `LegalDock` quedan debajo del overlay mientras dura (z-index máximo, sin eventos).
- `data-testid="push-intro"` con `data-state` (`waiting` / `pushing` / `exiting`) para e2e, como `page-blinds`.
- Web móvil v2: no lleva GSAP; si se quiere allí, el timeline es determinista y se puede hacer con `@keyframes` sobre una `@property --push-progress` y `mod()` para la fase de la mascota; el texto iría en Saira (la familia del móvil), no en Space Grotesk. Decidir aparte.

---

## 10. Decisiones (cliente, 2026-10-14) y estado

1. Mascota: **A**, bola pura que va botando, se aplasta contra la pared, entrecierra los ojos y suda.
2. Paleta: **A**, pared tinta, panel claro, rótulo en tinta, la mascota lima es el único color.
3. Rótulo: ~~«ActionDev»~~ → **el logo «action development.»** (cambio del cliente, mismo día), vectorizado y sin su punto final: ese hueco lo ocupa la mascota, que vuelve de un salto y guiña un ojo («jeje, soy yo»).
4. Dónde: **escritorio y web móvil v2**, primero escritorio.

**Escritorio: hecho.** `components/intro/PushIntro.tsx` (+ `PushIntro.module.css`), lógica pura en `lib/push-intro.ts` y tests en `src/__tests__/push-intro.test.ts`. Sustituye a `ui/LoadingScreen.tsx` (borrado) en `app/(site)/page.tsx`. Línea de tiempo idéntica al original; diferencias deliberadas:

- Hace de pantalla de carga: arranca con las fuentes y la escena lista (o a los 0,8 s) y, si la escena no ha terminado al llegar a la pausa del 60 %, la mascota se queda ahí apretando, temblando y sudando hasta que termina. Con la escena ya lista, la pausa dura sus 0,2 s exactos. Escotilla a los 25 s, como la antigua persiana.
- Pose por progreso con `PUSHES_PER_WIDTH = 10/3`: picos de esfuerzo en p = 0,3, 0,6, 0,9 y 1,2, de modo que las dos pausas la congelan aplastada.
- El progreso final se alarga solo si la mascota no saliera del todo (pantallas estrechas).
- `prefers-reduced-motion`: sin empuje, fundido de 300 ms.
- Más enérgica que el original (pedido del cliente): bola más pequeña (`min(14vw, 25vh)`), rebotes en parábola altos con mortal alterno, carrerilla y embestida; la pared solo avanza en el golpe. Esfuerzo = vena 💢 en la nuca (las tres rayitas sobre la cabeza se descartaron: parecían pelo).
- Vuelta al logo: `ARRIVAL` = 0,55 s entre el fin del empuje y el `FINAL_HOLD`, que retrasa aviso y bajada del panel esos 0,55 s respecto al original.

**Cambios posteriores del cliente (2026-10-14, misma tarde)**:

- **«Va a golpes»**: se probó un empuje continuo (un solo tramo con `sine.in`, mascota pegada a la pared) y el cliente pidió volver a las embestidas. La causa real eran los tirones: medido con la caché de shaders fría, el arranque de la escena 3D (montaje, contexto WebGL, enlace de shaders en el primer render) bloqueaba el hilo principal 0,1-0,9 s varias veces EN PLENO EMPUJE. Arreglo: la home usa `SceneWarmup` y el empuje no arranca hasta que la escena está compilada y con su primer frame pintado (la pared espera quieta, como el original con `window.load`). Resultado: 0 tareas largas durante el empuje, ~117 fps en frío y 120 en caliente (Chromium headless, M-series, 2x).
- **Panel de cristal**: en vez del gris opaco, gris piedra al 55 % con `backdrop-filter: blur(22px)`: la web se adivina detrás.
- **Logo en relieve**: tinta con canto, bisel y sombra (filtro SVG).
- **Salida por fundido** de 0,7 s en vez de la persiana que bajaba con contra-movimiento.

Vídeos de prueba (arnés Vite + Chromium headless) en `~/Documents/ActionDev/Marca/intro-empuje/`, incluida la comparativa sincronizada original/nuestra.

**Web móvil v2: pendiente.** Falta montarlo en `app/(m)/m/page.tsx` con Saira y los tokens de `mobile.css`, y decidir la frecuencia. «Una vez por sesión» sin parpadeo exige un `<script>` en línea antes del primer paint: React 19 avisa de un `<script>` creado en cliente, no de uno hidratado desde el SSR.
