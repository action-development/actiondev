# Hero — "La Grúa" (puerto de Vigo)

La home es un juego: el visitante maneja una grúa pórtico del puerto de Vigo,
engancha contenedores (TRABAJO / RESEÑAS / CONTACTO) y los suelta en la bodega
de un portacontenedores para navegar a cada página (`/projects`, `/resenas`,
`/contact` — la home es SOLO este juego, a viewport completo, sin scroll).

El muelle tiene **TRES FILAS en profundidad** (`port/quay-rows.ts`,
`QUAY_ROWS = [3.2, 0, -3.2]`) y el pórtico ENTERO viaja de una a otra con ▲ ▼
(W / S): delante los proyectos, en medio la del barco (`SHIP_ROW`, z = 0, la
única desde la que se puede cargar la bodega) y al fondo el decorado jugable.
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
    ├── port/HookGuide    hilos + huella holográfica bajo el spreader
    ├── port/TargetMarker halo de hover + flecha que señala un contenedor
    └── Physics (Rapier, gravedad 20, dt 1/60)
        ├── topes laterales x = ±20.5
        ├── port/Seagulls     gaviotas patiamarillas: vuelan y se posan en grúa y contenedores
    ├── port/Quay           muelle (collider top y = -6)
        ├── port/Ship           bodega (suelo y = -6.6) + sensor de carga
        │   └── port/PaintedShip   casco, bodega y puente pintados (modo painted)
        ├── port/Crane          visual (grupo que viaja en z) + spreader cinemático
        └── port/CargoContainer × 11, repartidos en 3 filas
                                (datos: src/data/port-containers.ts, campo `row`)
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
  refilón), baja, engancha, sube, viaja a `SHIP_DROP_X` y suelta. Con filas, la
  maniobra manda TAMBIÉN en profundidad: fija `rowIndex` a la fila del
  contenedor (fase `pick`) o a `SHIP_ROW` (fase `drop`) y no baja el gancho ni
  suelta hasta que el pórtico ha llegado (`AUTO_ALIGN_Z` = 0.1 y `gantryVel`
  calmada). Cualquier tecla, el mando o una acción manual la cancelan. Hit-test
  del click: un `THREE.Plane` POR FILA (`ROW_PLANES`, de delante hacia atrás;
  gana el primer acierto porque es el que tapa a los demás) y
  `pickContainerAt` (AABB con margen `PICK_SLACK` + filtro de fila) sobre el
  plano de esa fila, en el mismo interceptor que las gaviotas — así el click no entra además en la cola
  de acciones. Cursor `pointer` al pasar por encima.
- Carro: A/D/←/→ o el mando, con velocidad y aceleración limitadas →
  alimenta el péndulo del spreader (`stepSway`). **El ratón NO mueve el
  carro** (decisión de accesibilidad: seguir al cursor exige puntería y pulso;
  el público senior se queda fuera). El ratón solo apunta: gaviotas, cursor y
  `disturbance`.
- Mando de radiocontrol (`overlays/RemoteControl.tsx`): overlay DOM abajo en el
  centro, HORIZONTAL tipo panel arcade (cruceta 2×2 | marca | BAJAR) para caber en
  la franja libre del muelle sin tapar contenedores; caja 3D en CSS (`RemoteControl.module.css`). Sus flechas y su botón
  escriben en `lib/hero-remote.ts` (`remoteInput`), que el `useFrame` lee como
  una tecla más (`left`/`right` se MANTIENEN; `rowDelta` y `actions` son colas
  de pulsos). La cruceta es 2×2: arriba ◀ ▶ (carro), abajo ▼ ▲ (fila del
  muelle); las tapas bajaron a 40 px para que el mando creciera de 312 a 324 px
  y siguiera siendo el mismo panel. Va FUERA del canvas a propósito: dentro, cada toque contaría
  además como click de acción y retrasaría `onReady`. El teclado físico hunde
  sus botones (solo visual: el teclado ya mueve la grúa, escribir en
  `remoteInput` duplicaría la acción).
- **Fila del muelle (profundidad)**: W / ↑ = ALEJAR (índice +1, hacia el
  fondo), S / ↓ = ACERCAR, o las flechas verticales del mando. Es un PULSO por
  flanco, no un "mantener": una pulsación = una fila. El pórtico la sigue con su
  propia inercia (`GANTRY_MAX_SPEED` 6 / `GANTRY_ACCEL` 14, contra 17 / 42 del
  carro: pesa mucho más). No hay péndulo en z en la v1 — el balanceo sigue
  siendo solo en x. `Crane.update(trolleyX, hookX, hookY, gantryZ)` recoloca el
  grupo raíz de la grúa y, aparte, el spreader.
- Acción (click SOBRE EL CANVAS, Espacio, E, botón del mando) — `use-action-queue`.
  **S y ↓ ya NO bajan el gancho**: ahora son "acercar la grúa".
  - `idle` sin carga → `lowering`
  - `lowering` → para al tocar techo de contenedor de SU FILA (`findGrabTarget`,
    con `hookZ` y tolerancia `GRAB_Z_TOL` = 1.2) o suelo
    (`groundTopAt`); si hay contenedor lo engancha (kinematic) → `raising`
  - `lowering` + acción → cancela → `raising`
  - `idle` con carga → suelta (dynamic, hereda velocidad carro + balanceo)
- Contenedor soltado (`thrownIds`) que entra en el sensor de bodega →
  `gameState.notifyCargo()` (aviso "RUMBO A …") + bocina (`playHornSfx`) y
  navega tras 900 ms (`page.tsx`: pantalla de carga + `router.push` a la ruta del
  `href`). Un `href` "#..." (destino aún sin página: EQUIPO, GALICIA, ALCASI,
  VIGO) se sigue pudiendo cargar, pero solo avisa "PRÓXIMAMENTE", sin bocina ni
  navegación. `gatedIds` evita doble disparo; sale de la bodega → se libera.
- Contenedor por debajo de y = -11 (a la ría) → reaparece en su `spawnX` y su
  `spawnZ` (su fila de origen, no la del pórtico).
- **Guía holográfica del gancho** (`port/HookGuide.tsx`): cuatro hilos
  verticales desde las esquinas del spreader (x = hookX ± `SPREADER_HALF_W`·0.85,
  z = hookZ ± 0.6) hasta la cota de aterrizaje, más una huella tumbada en esa
  superficie. Con presa, la huella salta AL CONTENEDOR (su x, z, techo y ancho)
  y sube de alfa (0.25 → 0.5); sin presa se queda en el suelo bajo el gancho.
  Solo con el gancho sobre el muelle (x ≤ `QUAY_EDGE_X`): sobre agua o barco
  no se pinta nada. Visible con el spreader vacío en `idle` y en `lowering` — subiendo o con carga
  ya no se elige presa. El objetivo lo calcula GameWorld con el MISMO
  `findGrabTarget` que engancha, así que la guía no puede mentir. Handle
  imperativo (`update()` una vez por frame), fuera de `<Physics>`: es luz, no
  materia. Cero reservas: caja y plano unitarios que solo se escalan.
- **Shader de holograma compartido** (`port/holo-material.ts`): la flecha de la
  bodega y la guía del gancho salen de `createHoloMaterial()`. Sus valores por
  defecto SON los de la flecha (barrido en y, escala 5, base 0.28, fresnel 0.6):
  tocarlos cambia el barco. La huella pide `base` alto y `fresnel` casi nulo —
  de canto, el fresnel de un plano horizontal vale 1 en toda su superficie y la
  convertía en un rectángulo macizo.
- Con carga fuera de `SHIP_ROW`, la flecha holográfica de la bodega se atenúa
  (`ShipHandle.setDimmed`, uniform `uAlpha` a 0.25): desde otra fila no se
  puede soltar dentro. Es un handle imperativo para no re-renderizar el barco.

## Ayudas para entender el juego (HUD)

Todo sale de la misma voz holográfica (shader `holo-material.ts` en 3D, clases
`holo` de `overlays/HeroHud.module.css` en DOM, calcadas del Header). GameWorld
NO re-renderiza nada: avisa por callbacks de `useGameState` solo al CAMBIAR
(`onHover`, `onHint`, `onRow`, `subscribeCargo`/`notifyCargo`) y escribe por
ref lo que se mueve a 60 fps.

- **Hover sobre un contenedor** (o la grúa justo encima de uno: el objetivo de
  la guía del gancho, si el puntero no está sobre otro) → halo lima (`port/TargetMarker.tsx`, carcasa
  con fresnel alto) + etiqueta flotante DOM (`HoverTag`): nombre y
  "CLIC PARA VIAJAR" (i18n `game.hud.clickToGo`) o "PRÓXIMAMENTE". La etiqueta se ancla al techo del
  contenedor proyectándolo a pantalla cada frame (`gameState.hoverTagEl`, solo
  `style.transform`). Con carga colgando no hay hover: ahí el click significa
  "llévalo al barco".
- **Balizas de "clicable"** (`port/TargetMarker.tsx`, capa `beacons`): desde el
  primer frame, cada contenedor con destino real (`href` que empieza por `/`)
  lleva una carcasa holográfica lima que respira (desfasada por contenedor);
  los de decorado (`#…`) no. Siguen al contenedor por física (mismo `cand` que
  el hover) y se apagan con carga colgando, donde el click significa "llévalo al
  barco". La del contenedor bajo el puntero cede su sitio al halo de hover.
  GameWorld filtra la lista al registrar (`beaconCands`), sin trabajo por frame.
- **Tutorial de controles** (`overlays/TutorialOverlay.tsx`): siempre mover →
  fila → enganchar → soltar. NO enseña "haz clic en un contenedor": el clic
  lanza la maniobra automática (engancha, lleva al barco y navega) y el usuario
  se iba de la página sin ver los controles. El atajo del clic lo comunican las
  balizas y la etiqueta "Clic para viajar".
- **Con carga**: hueco fantasma en la bodega (`ShipHandle.setDrop`, caja
  holográfica del tamaño de la carga + aristas lima): tenue fuera de la fila del
  barco, medio en la fila, a tope y latiendo cuando el gancho está sobre la
  bodega (ahí sigue al gancho: es donde caerá). Pista DOM encima del mando
  (`CraneHintBar`): "vuelve a la fila del barco" / "llévalo hasta la flecha" /
  "¡suéltalo!". Durante la maniobra automática no hay pista.
- **Mando**: indicador de FILA (tres pilotos, el del medio con el barco) y la
  tecla impresa en cada tapa (W A S D, ESPACIO bajo BAJAR).
- **Demostración en reposo** (`DEMO_AFTER_S` = 8 s sin tocar nada y sin haber
  cargado aún): la grúa se planta sola sobre PROYECTOS y la flecha lo señala.
  No lo engancha. Una vez por visita; cualquier entrada la apaga.
- **Ir sin jugar** (`SkipMenu`, abajo a la derecha): desplegable con
  Proyectos / Reseñas / Contacto como `<Link>` (pasan por la pantalla de carga).

## Gaviotas — dónde se posan

`port/gull-behaviour.ts` (lógica pura, testeada) + `port/Seagulls.tsx` (render).

- Un posadero es una SUPERFICIE que existe en 3D en todas las fases, nunca un
  punto fijo: `crane` (cara de arriba de la pluma, `BOOM_TOP_Y`, o del
  travesaño del pórtico; z RELATIVA al pórtico, que viaja entre filas) o
  `container` (techo de un contenedor del juego, leído de la física cada frame;
  no vale si cuelga del gancho o tiene otro encima). El atrezo del muelle y el
  bolardo NO sirven: en modo pintado no se dibujan y las aves flotaban.
- `resolvePerch` da el punto de apoyo; el ave se coloca en `apoyo − FOOT_Y ×
  escala`, así la planta de las patas toca la superficie a cualquier escala.
- Posadas usan `PERCH_SCALE` (0.78); en vuelo, la de su órbita (más grande,
  porque vuelan lejos). Despegue y aterrizaje interpolan.
- Se van si: el spreader se acerca EN SU FILA, el cursor a < 2, el carro pasa
  por su tramo de pluma, el pórtico se pone en marcha (las de la grúa), el
  contenedor se mueve bajo sus patas, lo enganchan o hay un disparo.
- La aproximación recalcula el destino cada frame y aborta si el posadero
  desaparece.
- Modelo: cuerpo en huso (torno), pico ganchudo con mancha roja en el gonys y
  mandíbula articulada (grito con la cabeza atrás), ojo amarillo con anillo
  rojo, alas plegadas con primarias negras y espejos blancos sobre la cola,
  patas amarillas palmeadas (recogidas en vuelo, fuera al aterrizar).
  Geometrías compartidas entre todas las aves.

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
- `overlays/GullTally.tsx` — contador arriba a la derecha (silueta × N) +
  cuenta atrás + récord. No existe en el DOM hasta la primera baja. Escucha
  `gameState.onGullKill` y es el dueño del reloj de la ronda (ver abajo).

### Ronda de 30 s y récord

La primera baja arranca una cuenta atrás de `ROUND_SECONDS` (30 s). El número
pasa a ser los PUNTOS DE ESA RONDA; al llegar a 0 se compara con el récord
(`localStorage` `action:gulls-record`, mejor ronda) y, si se bate, aparece
"Nuevo récord". Una baja tras el final arranca otra ronda. Lógica pura y con
tests en `port/gull-rush.ts`.

- `GameState.gullRush` (`{ active }`) lo escribe `GullTally` y lo leen las aves
  vía la prop `rush` de `Seagulls` — sin re-renders.
- Mientras `active`: entran 5 gaviotas EXTRA (`EXTRA_FLIGHTS`, 2 de noche),
  escalonadas por `rushStagger`, y las abatidas reaparecen en ~2-2,9 s
  (`rushRespawn`) en vez de 7-11 s.
- Las extra nacen `gone` con `alive = false` (no se pueden abatir hasta que
  entran). Al acabar la ronda las que vuelan pasan a modo `leave`: se
  desvanecen en el sitio (mismo `fadeAt` que la caída) y vuelven a `gone`.
- Durante la ronda, un click que no acierta a gaviota, contenedor, grúa ni
  barco se DESCARTA en el interceptor de `GameWorld` (antes caía a la cola y
  subía/bajaba el gancho al fallar un disparo). Para mover el gancho con el
  ratón hay que darle a un contenedor; Espacio/E no se ven afectados.
- **Racha y multiplicador** (`gull-rush.ts`: `registerStreakKill`, `streakAlive`,
  `multiplierFor`, con tests): bajas con ≤ 1,5 s entre una y la siguiente
  (`STREAK_WINDOW_MS`). Más de 1,5 s sin matar → la racha se pierde y el
  multiplicador vuelve a ×1 (lo detecta el `tick` de 100 ms de `GullTally`).
  Cada 5 de racha sube el multiplicador (×2 a las 5, ×3 a las 10…) y cada baja
  vale ×N PUNTOS: el contador y el récord son de puntos, no de bajas. Al subir
  sale un aviso central "×N / RACHA · 5 MUERTES" (banda + slam, crece con el
  nivel) y suena `playStreakSfx(level)` (arpegio que sube de tono con el nivel).
  Bajo el contador hay un chip de racha con una barra que se vacía en 1,5 s.
- **Los tutoriales se apartan durante la ronda**: `GullTally` abre/cierra la
  ronda con `gameState.setRush(bool)` (notifica a los oyentes DOM solo si
  cambia; hook `hooks/use-gull-rush.ts` con `useSyncExternalStore`). Mientras
  dura: el cartel del tutorial se funde y se PAUSA (sin escuchas, sin avanzar de
  paso, sin flecha) y vuelve donde estaba al acabar; `CraneHintBar` no se pinta;
  `GameWorld` apaga la flecha holográfica (tutorial y demo) y NO acumula el
  reposo (disparar a gaviotas no es "tocar la grúa", si no la demo movería la
  grúa sola a los 8 s). Las balizas de contenedor se quedan: en ronda son la
  única forma de mover el gancho con el ratón.
- La clave antigua `action:gulls-downed` (total acumulado) ya no se lee.

## Easter egg — alerta del faro

Un click SOBRE el faro de Cíes enfurece al puerto. NO es una mecánica de juego:
no puntúa, no abre ronda de caza y mientras dura **no se puede disparar** (el
interceptor de `GameWorld` devuelve `null` en vez de blanco, y el cursor deja de
ser una cruz). Es una escena, y dura lo que tarda una gaviota en estrellarse.

Guion, de principio a fin:

1. **Click** — hit-test `pickLighthouseAt` (`port/lighthouse-alert.ts`, con
   tests) con la misma tolerancia ANGULAR que la caza: el faro está a ~146 u y
   con su radio real la diana serían 18 px. Prioridad de click: gaviota >
   contenedor > grúa > **faro** > barco, así que una gaviota que pase por
   delante se queda el click. Suena `playAlarmSfx` (sirena de dos tonos).
2. **Alerta** — aviso central "¡ALERTA!", viñeteado rojo pulsante, TODAS las
   gaviotas con los ojos rojos (`EYE_IRIS` → `ALERT_RED`, un material por iris
   que sólo se reescribe al cambiar) y entra el enjambre `ALERT_FLIGHTS` (6
   aves, cerca y bajas, escalonadas por `alertStagger`; aquí NO se recorta de
   noche). El haz del faro gira ×`ALERT_BEAM_SPIN` en rojo y la linterna late.
3. **Embestida** — a los `DIVE_FIRST` s, UNA gaviota en crucero se queda el
   turno (`claimDive`, que hace de semáforo entre aves y luego cierra la puerta
   con `Infinity`) y pica hacia la cámara en modo `dive`. Se le puede disparar…
   no: durante la alerta no hay disparos, así que llega siempre.
4. **Impacto** — `onScreenHit(ndc)` → `playCrashSfx`, sacudida de pantalla y
   **grieta a pantalla completa**. Y ahí acaba: el choque cierra la alerta.
   `ALERT_SECONDS` (10 s) es sólo la red de seguridad por si ninguna embistió.

Piezas: lógica pura y testeada en `port/lighthouse-alert.ts`; ojos y picado en
`port/Seagulls.tsx`; haz en `port/LighthouseBeam.tsx` y linterna en
`port/PaintedScenery.tsx` / `port/PortBay.tsx`; el resto —reloj, aviso,
viñeteado y grieta— en `overlays/AlertOverlay.tsx`.

### Gotchas de la alerta

- **El respawn planta la posición en el MISMO frame.** La cadena de modos de
  `Seagulls.tsx` es un `else if` y `cruise` va por delante de `gone`, así que el
  frame en el que un ave vuelve a escena ya no pasa por el lerp de la órbita:
  hay que hacer `g.position.copy(c.from)` junto al `g.visible = true`. Sin eso
  la gaviota se hacía visible un frame entero **donde la dejó su vida anterior**
  —el origen (0,0,0), en mitad del encuadre, la primera vez; el punto del choque
  contra el cristal o su última órbita después— y saltaba al lateral al
  siguiente. Era el *popping* del enjambre al pinchar el faro: seis parpadeos
  escalonados en un segundo. Afecta igual a las abatidas y a las extra de la
  ronda, sólo que ahí la posición vieja es plausible y no cantaba.
- **La grieta se escala, no se redibuja.** `crackPaths` devuelve trazos
  normalizados a radio `CRACK_RADIUS` (100) y el overlay los planta en el punto
  del impacto con `translate(...) scale(diagonal/100)`, así que llega a las
  cuatro esquinas desde donde sea. El grosor va DIVIDIDO por esa escala
  (`STROKE_INK / k`) o la grieta engordaría con el tamaño de la pantalla. Cada
  trazo lleva su grosor relativo (`w`): gruesa en el golpe, fina en las puntas,
  y los aros son ARCOS sueltos — con anillos cerrados el dibujo se leía como
  una telaraña.
- **La sacudida NO puede ir en el div raíz de `GameScene`.** Ese div lleva
  `animate-fade-in` y las dos clases escriben la propiedad `animation`: al
  quitar `.hero-shake`, `animation-name` volvía a `fade-in` y **la animación se
  reiniciaba** — 0,3 s de retardo a opacidad 0 más el fundido, es decir un
  fogonazo NEGRO justo después de la grieta. Va en una capa propia que envuelve
  fondo pintado + canvas (tienen que temblar juntos o el 3D se despega).
- **Los overlays dependen de las PIEZAS de `gameState`, no del objeto.**
  `useGameState()` devuelve un objeto nuevo en cada render de `GameScene`, así
  que con `[gameState]` los efectos se remontaban a media partida y su limpieza
  apagaba la alerta (y la ronda de caza en `GullTally`) antes de tiempo. Los
  callbacks son `useCallback([])` y lo demás refs: estables de por vida.
- **Los ojos NO se pintan por flanco.** Cada frame se compara el color REAL del
  material del iris con el que toca (`m.color.equals(eye)`) y se copia si
  difiere. Un "ha cambiado la alerta, píntalos" se pierde si el estado de React
  se reinicia sin que se reinicie el material —lo que pasa con la recarga en
  caliente— y la gaviota se queda con los ojos rojos para siempre. Así converge
  sola. Son dos comparaciones por ave y frame: no cuesta nada.
- **El viñeteado rojo va en estilo EN LÍNEA**, no en `globals.css`: Lightning
  CSS descarta `rgb(var(--x) / α)` al compilar y la regla se quedaba sin fondo.
  Y nada de `color-mix(…, transparent)`, que interpola hacia el negro y tiñe de
  gris; los degradados CSS sí interpolan premultiplicado.

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

- **Arrastrar la grúa**: la grúa es 3D (no vídeo), así que se agarra. Un
  `mousedown` sobre la columna carro + cabina + spreader (`pickCraneAt` en
  `crane-logic.ts`) inicia el arrastre; el interceptor de `use-action-queue` se
  queda con el click, así que NO baja el gancho. Prioridad de click: gaviota >
  contenedor > grúa > barco. Horizontal: solo se mueve `targetX` (la inercia y el
  péndulo de siempre); vertical: un paso de fila cada `DRAG_ROW_PX` (90 px), arriba
  = alejarse. Se suelta con `mouseup`/`blur` en `window`. Cursor `grab`/`grabbing`.
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
- **El barco NO cambia de fila**: está en z = 0 y ahí se queda. La profundidad
  es del muelle, no de la ría.
- **Dos contenedores de la MISMA fila necesitan 3,2 de paso en x** (ancho del
  spreader); dos de filas distintas pueden compartir x tranquilamente.
- **Patas de la grúa en z = -2 RELATIVO al carro**: viajan con el pórtico. El
  atrezo del muelle (`PROP_STACKS`) se fue a z = -7.5 porque en -3.4 se metía
  dentro de la fila del fondo (-3.2). Ojo: la losa del muelle llega a
  `Z_BACK` = -4, así que en modo PROCEDURAL esas pilas quedan justo fuera de
  ella. No se ven en producción (ninguna fase usa ese modo); si algún día se
  usa, hay que acercarlas y encogerlas, no estirar la losa (el encuadre del
  fondo pintado depende de ella).
- **El spreader va FUERA del grupo que viaja en z**, aunque sea parte de la
  grúa: `@react-three/rapier` fotografía la inversa de la matriz del padre UNA
  vez, al crear el cuerpo, y no la recalcula. Dentro del grupo móvil el
  spreader se pintaría a 2 × `gantryZ`. Su posición se escribe en MUNDO.
- **El bloqueo de z de los contenedores no hay que tocarlo** (`CargoContainer`,
  `enabledTranslations [true, true, false]`). Comprobado contra Rapier 0.19:
  un cuerpo `kinematicPosition` IGNORA el bloqueo (por eso la carga colgada sí
  cambia de fila), `setTranslation` también (por eso el respawn funciona), y en
  dinámico el bloqueo detiene contactos e impulsos (por eso nada se cuela entre
  filas). El ÚNICO agujero: una `setLinvel` con z ≠ 0 SÍ mueve el cuerpo aunque
  el eje esté bloqueado — por eso `release()` pone la z de la velocidad a 0.
- **Física del muelle y topes a z ∈ [-5, 5]**: con la banda antigua (±3) los
  contenedores de las filas 0 y 2 caían al vacío.
- **Cíes aplastadas con `CIES_SCALE`**: con proporción real de dibujo salían
  pirámides.
- **`antialias: true`**: los contornos de `<Outlines>` sin MSAA hacen sierra.
- Lógica pura testeada en `src/__tests__/canvas/port-logic.test.ts`.

- **Agarrar de refilón NO teletransporta**: `findGrabTarget` engancha hasta el 85 % del semiancho, así que el contenedor no queda centrado bajo el spreader. Centrarlo de golpe lo metía dentro del vecino (huecos de 0,6) y Rapier lo expulsaba a 4-5 u/s. `GameWorld` guarda el desfase en `grab` y lo consume a `GRAB_GLIDE_SPEED`; mientras tanto el contenedor va en modo fantasma (`setCollisionGroups(0)`) y solo recupera la colisión cuando está centrado y `overlapsAny` da falso. Soltar siempre restaura los grupos (un dinámico fantasma atravesaría el suelo).
