# Hero — "La Grúa" (puerto de Vigo)

La home es un juego: el visitante maneja una grúa pórtico del puerto de Vigo,
engancha contenedores (TRABAJO / RESEÑAS / CONTACTO) y los suelta en la bodega
de un portacontenedores para navegar a cada página (`/projects`, `/resenas`,
`/contact` — la home es SOLO este juego, a viewport completo, sin scroll).
Estética cómic (toon
shading + contornos), con las Cíes, bateas y gaviotas al fondo.

Dos modos (`port/painted-backdrops.ts`, expuesto en `data-scene-mode`):

- **painted** — las CUATRO fases tienen fondo pintado (`public/hero/port-<fase>-vN.webp`,
  3200 px, `next/image` detrás del canvas transparente): la imagen lleva cielo
  sin nubes, sol (luna en `noche`), Cíes SIN faro, agua,
  bateas, muelle y contenedores de fondo — todo en buen estado, nada de
  óxido (decisión de marca: profesional, no pobreza). En 3D: la grúa entera
  con acabado pintado (`PaintedCranePieces.tsx`), las nubes de cómic
  (`ComicClouds`), el faro (`PaintedScenery.tsx`, sin haz), las balizas con secuencias
  (`beacon-patterns.ts`: una a una, juntas, alternas, llenado, rebote, fijas),
  las gaviotas (`Seagulls.tsx`, ala de dos tramos), el barco
  (`PaintedShip.tsx`), contenedores y la marca de carga. Muelle y ría siguen
  montados como física + oclusores invisibles (`colorWrite: false`).
- **procedural** — fallback si a una fase le quitan la imagen: todo en 3D,
  0 imágenes, 0 modelos. Hoy ninguna fase lo usa en producción.

Ni la imagen ni nada del 3D suspende el `<Suspense>` de GameScene.

---

## Árbol

```
GameScene (Canvas + overlays DOM + resolución de la fase del día)
└── GameWorld (UN solo useFrame con toda la lógica)
    ├── luces (hemisphere + directional) + fog  ← desde la paleta
    ├── port/PortSky      cielo shader + nubes de cómic
    ├── port/PortBay      agua shader, Cíes, Morrazo, faro, bateas, grúas lejanas
    └── Physics (Rapier, gravedad 20, dt 1/60)
        ├── topes laterales x = ±20.5
        ├── port/Seagulls     gaviotas en vuelo + una posada en la pluma
    ├── port/Quay           muelle (collider top y = -6)
        ├── port/Ship           bodega (suelo y = -6.6) + sensor de carga
        │   └── port/PaintedShip   casco, bodega y puente pintados (modo painted)
        ├── port/Crane          visual + spreader cinemático
        └── port/CargoContainer × 3 (datos: src/data/port-containers.ts)
```

## Fases del día

`port/time-of-day.ts` — `noche` (21:30–6:30), `amanecer` (6:30–9),
`dia` (9–19), `atardecer` (19–21:30), hora LOCAL del visitante.
Forzar una: `/?hora=noche|amanecer|dia|atardecer`.
Toda la escena lee de `PortPalette`; retocar colores = tocar solo ese archivo.
El contenedor raíz expone `data-time-of-day` para tests.

## Fondo pintado — cómo generar uno nuevo

1. Referencia de composición: el fondo de atardecer (job de Higgsfield
   `26bdeaa5-56ed-4c15-9b79-415c0a790fbb`) o, si cambia el encuadre,
   `/?hora=<fase>&plate` a 1920×1080 (solo lo estático).
2. Nano Banana 2, 16:9, 4K (3 créditos), pidiendo mantener cámara y posiciones
   y SIN grúa, nubes ni faro (van en 3D). Para otra FASE del mismo encuadre,
   pasar la imagen de atardecer como `image_references` y pedir "cambia SOLO
   la luz": así salieron noche (`955122cb`), amanecer (`81ec4147`) y día
   (`bc8422b0`) alineadas al píxel (2026-09-18, 9 créditos en total). Si se
   regenera atardecer, regenerar las otras tres a partir de la nueva.
3. `magick … -resize 3200x -quality 86` → `public/hero/port-<fase>-vN.webp`.
   Cambiar el nombre en cada versión: `next/image` cachea por URL.

Alineación: imagen en `object-cover` + `PaintedFraming` (cierra el fov en
pantallas más anchas que 16:9, `fovForAspect`). Si se mueve la cámara, el
muelle, el barco o la grúa → regenerar la imagen.

Estilo 3D sobre la imagen: contenedores con texturas de canvas "pintadas"
(`container-textures.ts`: nervios con tinta, puertas, sin óxido); grúa, carro
y spreader en `PaintedCranePieces.tsx` con material básico (sin sombreado ni
sombras, volumen y remaches horneados, textura repetida por miembro para no
estirar remaches). El barco en `PaintedShip.tsx` + `ship-hull.ts`: se dibuja
DELANTE del barco de la imagen y lo tapa. El casco NO es una caja ni una
extrusión: se teje barriendo una cuaderna a lo largo de la eslora
(`buildHullSurface`), con manga que se cierra en la proa (`halfBeamAt`),
pantoque redondeado y astilla en el costado (`sectionPoints`), pie de roda que
sube hacia proa —eso es lo que lanza el tajamar— (`keelYAt`) y arrufo en la
cubierta (`deckYAt`). Reglas aprendidas a base de romperlo:

- Las UV del forro van en COORDENADA DE MUNDO (u = x, v = y), así la línea de
  flotación cae en `WATER_Y` sea cual sea la cuaderna.
- El degradado del forro tiene que ser CASI PLANO: uno de toda la altura
  aclara la proa (la parte más alta) y la desgaja del resto del casco.
- Las DOS bandas se rebajan sobre la bodega (`nearTopAt` / `farTopAt`), la de
  cámara más: si la opuesta se queda a la altura de la amurada, el barco
  vuelve a parecer un bloque macizo.
- El canto del costado se remata con una cinta VERTICAL (`buildSheerStrake`):
  el trancanil de `buildRail` es horizontal y a esta cámara se ve de canto, o
  sea que desaparece, y por proa el casco quedaba como un plano azul cortado
  contra el cielo. La cinta recorre toda la eslora y hace también de brazola
  sobre la bodega — no hace falta una brazola aparte, que además pisaba la
  amurada alta de proa.
- El pie de roda (`STEM_FOOT_Y`) tiene que quedar POR DEBAJO de `WATER_Y`: si
  el fondo del casco arranca sobre el agua, la proa se ve colgando en el aire.
- La amurada de proa baja en `FWD_CUT_X`, NO en `HOLD_MIN_X`: el barco del
  fondo pintado tiene un castillo de proa alto y si el 3D baja antes, ese
  castillo asoma por encima del canto y se ven DOS proas superpuestas.
- La entrada de la manga (`ENTRANCE` en `halfBeamAt`) tiene que ser CORTA: con
  una entrada larga todo el costado de proa queda casi en el plano x-y y a
  esta cámara es una pared frontal, un cartón pegado al puerto.
- Los herrajes del castillo se dimensionan con la manga LOCAL: con tamaño fijo
  asoman por fuera del forro donde el casco mide décimas.
- Sobre la bodega no se genera cubierta: el margen de la banda opuesta quedaba
  por encima del canto rebajado y asomaba como un alambre.
- Forro a dos caras (`DoubleSide`): por la escotilla y por el rebaje se ve el
  casco por dentro y con una sola cara esas zonas salen en NEGRO (lo que se
  ve es el contorno de tinta). El mismo síntoma, a lo bestia, aparece si el
  giro de los triángulos va invertido.

Las ventanas de los camarotes tienen VIDA PROPIA (`ship-lights.ts`): no es un
ciclo fijo sino una máquina de acciones con peso — se está quieto, se cambia un
par (dos se encienden y dos se apagan), parpadea una, se recorre el pasillo
encendiendo o apagando de una en una, se enciende todo, se apaga todo. Son
mallas con material propio, no textura horneada: el volumen sí se hornea, pero
lo que cambia no puede ir en el canvas. Dos reglas que hay que mantener:

- El fundido (`FADE`) no puede ser lento: el punto medio entre el azul del
  cristal y el amarillo de la lámpara es un gris sucio.
- Hay un tope de tiempo con todo apagado (`MAX_DARK`). Apagarlo todo se pide,
  pero un "all-off" seguido de un "sweep-off" dejaba el barco muerto 6-7 s.

Poco arrufo y poco vuelo de proa: pasarse rompe la silueta con un escalón.
Sin nombre en el casco (decisión del usuario). Colores muestreados del propio
`port-atardecer-v2.webp`. El carro lleva bogies de dos ruedas con pestaña,
buje y tornillos (`wheelTexture` en `PaintedCranePieces.tsx`). Sol del modo pintado detrás-derecha (`PAINTED_SUN`) para
que las sombras de los contenedores caigan hacia delante-izquierda como en el dibujo.

## Controles y máquina de estados

- **Click sobre un contenedor = maniobra completa automática** (`AutoRun` en
  `GameWorld`): el carro va a su x, espera a estar quieto y alineado
  (`AUTO_ALIGN_X` / `AUTO_CALM_VEL` — con el péndulo vivo engancharía de
  refilón), baja, engancha, sube, viaja a `SHIP_DROP_X` y suelta. Cualquier
  tecla, el mando o una acción manual la cancelan. Hit-test del click:
  `pickContainerAt` (AABB con margen `PICK_SLACK`) sobre el plano z = 0, en el
  mismo interceptor que las gaviotas — así el click no entra además en la cola
  de acciones. Cursor `pointer` al pasar por encima.
- Carro: A/D/flechas o el mando, con velocidad y aceleración limitadas →
  alimenta el péndulo del spreader (`stepSway`). **El ratón NO mueve el
  carro** (decisión de accesibilidad: seguir al cursor exige puntería y pulso;
  el público senior se queda fuera). El ratón solo apunta: gaviotas, cursor y
  `disturbance`.
- Mando de radiocontrol (`overlays/RemoteControl.tsx`): overlay DOM abajo en el
  centro, HORIZONTAL tipo panel arcade (flechas | marca | BAJAR) para caber en
  la franja libre del muelle sin tapar contenedores; caja 3D en CSS (`RemoteControl.module.css`). Sus flechas y su botón
  escriben en `lib/hero-remote.ts` (`remoteInput`), que el `useFrame` lee como
  una tecla más. Va FUERA del canvas a propósito: dentro, cada toque contaría
  además como click de acción y retrasaría `onReady`. El teclado físico hunde
  sus botones (solo visual: el teclado ya mueve la grúa, escribir en
  `remoteInput` duplicaría la acción).
- Acción (click SOBRE EL CANVAS, Espacio, E, S, ↓, botón del mando) — `use-action-queue`:
  - `idle` sin carga → `lowering`
  - `lowering` → para al tocar techo de contenedor (`findGrabTarget`) o suelo
    (`groundTopAt`); si hay contenedor lo engancha (kinematic) → `raising`
  - `lowering` + acción → cancela → `raising`
  - `idle` con carga → suelta (dynamic, hereda velocidad carro + balanceo)
- Contenedor soltado (`thrownIds`) que entra en el sensor de bodega → navega
  tras 900 ms (`page.tsx`: wipe radial + `router.push` a la ruta del `href`;
  un `href` "#..." sin página se ignora). `gatedIds` evita doble disparo;
  sale de la bodega → se libera.
- Contenedor por debajo de y = -11 (a la ría) → reaparece en su `spawnX`.

## Easter egg — caza de gaviotas

Un click SOBRE una gaviota no baja el gancho: dispara. Piezas:

- `port/gull-hunt-logic.ts` — hit-test rayo/esfera con TOLERANCIA ANGULAR
  (`AIM_SLACK`): las lejanas son 3 px y con su radio real no se acertaría
  nunca. Caída (`fallOffset`), fundido (`fadeAt`) y velocidad de bala. Con tests.
- `GameWorld` — `use-action-queue` acepta un `intercept`: si el click acierta
  a una gaviota se lo queda y NO entra en la cola de acciones. Cursor en cruz
  al pasar por encima (pista). El tiro sube `disturbance.pulse` → las posadas
  se espantan.
- `port/GullHunt.tsx` — bala trazadora (lima + contorno de tinta + estela) que
  sale de la "otra mano" (NDC `HAND_NDC`, a 4 u de la cámara, al lado del
  mando) y PERSIGUE al blanco leyendo su posición cada frame. Fogonazo estrella
  de cómic, nube blanca y 12 plumas por impacto. Pools, cero allocations.
- `port/Seagulls.tsx` — cada ave se registra en `targets` (`GullTarget`).
  Modos nuevos: `shot` (respingo, cae dando vueltas panza arriba, alas
  plegadas, fundido de opacidad sobre TODOS sus materiales, contornos incluidos)
  y `gone` (invisible; reaparece a los ~7-11 s entrando desde x = ±(rx+40)).
- `lib/hero-sfx.ts` — disparo e impacto sintetizados con WebAudio (0 assets).
  El `AudioContext` nace en el primer disparo (gesto de usuario).
- `overlays/GullTally.tsx` — contador arriba a la derecha (silueta × N). No
  existe en el DOM hasta la primera baja; persiste en `localStorage`
  (`action:gulls-downed`). Escucha `gameState.onGullKill`.

## Easter egg — bocina del barco

Un click SOBRE el barco hace sonar la bocina de zarpar y NO baja el gancho
(mismo interceptor que gaviotas y contenedores; se comprueba DESPUÉS de los
contenedores, así que en la bodega gana el contenedor). Hit-test puro en
`port/ship-hull.ts` (`pickShipAt`): casco de `BOW_X` a `STERN_X` hasta la
amurada + caja del puente; con tests en `port-logic.test.ts`. Cursor `pointer`
al pasar por encima. Sonido en `lib/hero-sfx.ts` (`playHornSfx`): una pitada
larga (~1,6 s) con cuatro osciladores por paso bajo, sin apilar — si ya suena,
el click se ignora.

## Gotchas

- **Clicks por cola, no por estado**: un click rápido cabe entre dos frames.
  Leer "¿botón pulsado?" frame a frame lo perdía (verificado con Playwright).
- **Mando: nada de `transform-style: preserve-3d` en el panel frontal**. Con él,
  Chrome deja de acertar el hit-test de los hijos (`elementFromPoint` devuelve
  el contenedor) y los botones no reciben NINGÚN pointer event. El `preserve-3d`
  va solo en `.body`.
- **Mando: el `<button>` no se mueve al pulsarlo**, se hunde la tapa interior
  (`.key`). Moviendo el botón dentro de un padre en perspectiva, el cursor
  se queda fuera de su zona proyectada → `pointerleave` cancelaba la pulsación
  en el frame siguiente. Además se hace `setPointerCapture`, así arrastrar
  fuera no deja el carro corriendo.
- **Encuadre**: el canvas muestra aprox. y ∈ [-10, 10] en z = 0, con el borde
  derecho en x ≈ 15 a 16:10. La marca de carga está en `MARKER_X = 10.6` por eso.
- **Patas de la grúa en z = -2** y atrezo en z = -3.4: los contenedores (z ±0.75)
  pasan por delante sin chocar. No mover patas al plano de juego.
- **Cíes aplastadas con `CIES_SCALE`**: con proporción real de dibujo salían
  pirámides.
- **`antialias: true`**: los contornos de `<Outlines>` sin MSAA hacen sierra.
- Lógica pura testeada en `src/__tests__/canvas/port-logic.test.ts`.
