"use client";

import { useEffect, useState } from "react";
import { LiveClock } from "./LiveClock";
import { UnicornBlob } from "./UnicornBlob";
import { Player } from "./Player";
import { tracks } from "@/data/tracks";
import { useAudioAnalyser } from "@/hooks/use-audio-analyser";
import { useDeviceTilt } from "@/hooks/use-device-tilt";
import { PixelWipe } from "@/components/ui/PixelWipe";

/** Escala display: móvil manda. 13.5vw llena el ancho en un iPhone SE
 *  sin romper, y el tope de 12rem evita que reviente en 4K. */
/** Fondo a sangre del hero. */
const UNICORN_BG_ID = "Gj96FLSAmVfUY41tY6OK";
/** Pieza central, donde antes iba la esfera. */
const UNICORN_PIECE_ID = "8Fp7mSN6yRuw72QhJH1Z";

const DISPLAY = "display relative z-10 text-[clamp(2.6rem,11.4vw,11rem)]";

export function Hero() {
  const { audioRef, energyRef, playing, toggle } = useAudioAnalyser();
  const { tiltRef, request: requestTilt } = useDeviceTilt();
  const [current, setCurrent] = useState(0);

  /**
   * Único intento de permiso, al primer toque en cualquier parte. En
   * iOS el diálogo solo sale desde un gesto; en Android se concede en
   * silencio y engancha el sensor.
   *
   * Ya NO hay botón de reserva: la pieza se mueve sola con la deriva
   * autónoma de `UnicornBlob`, así que el giroscopio pasó de ser el
   * motor del efecto a ser una capa opcional encima. Un control cuya
   * única función es pedir un permiso del sistema no tiene sitio en el
   * primer pantallazo de una landing que vende.
   */
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const tryOnce = () => void requestTilt();
    document.addEventListener("touchend", tryOnce, { once: true, passive: true });
    return () => document.removeEventListener("touchend", tryOnce);
  }, [requestTilt]);

  const selectTrack = (index: number) => {
    setCurrent(index);
    const el = audioRef.current;
    if (el && playing) {
      el.load();
      void el.play();
    }
  };

  return (
    <section className="hero-90s relative flex min-h-lvh flex-col overflow-hidden px-[var(--gutter)] pt-[var(--content-top)] pb-[var(--gutter)] md:pb-[calc(var(--gutter)*1.5)]">
      {/* ── Cabecera ─────────────────────────────────────────────
          Landing: NO hay navegación. Un único destino posible desde
          arriba (#hablemos) para no repartir la atención entre seis
          anclas. La firma a la izquierda y el CTA a la derecha. */}
      <header className="body-type relative z-10 flex items-start justify-between gap-4 text-[0.98rem] sm:text-[1.02rem]">
        <p className="text-panel">Pablo Cabaleiro</p>

        <a
          href="#hablemos"
          className="flex items-center gap-2 transition-opacity duration-[--duration] hover:opacity-60"
        >
          <span className="text-panel">Hablemos ;)</span>
          <span aria-hidden="true" className="block h-2.5 w-2.5 bg-[var(--cyan)]" />
        </a>
      </header>

      <h1 className="sr-only">
        Pablo Cabaleiro — desarrollo de aplicaciones móviles en Vigo
      </h1>

      {/* ── Titular superior ─────────────────────────────────────── */}
      <p aria-hidden="true" className={`${DISPLAY} mt-3 md:mt-2`}>
        Mobile
      </p>

      {/* En móvil las dos palabras van JUNTAS, como un bloque de dos
          líneas pegado a la cabecera: separadas, la de abajo quedaba a
          merced de la barra de Safari. En md+ se apaga y manda la
          copia del final, que es donde el diseño original la quiere.
          Sin margen entre las dos cajas: cada <p> ya mide 0.84em de
          `line-height`, así que apiladas dan exactamente el mismo
          interlineado que un titular de dos líneas. Con margen negativo
          la mayúscula de abajo se comía el trazo morado de la de
          arriba — comprobado en captura a 390px. */}
      <p aria-hidden="true" className={`${DISPLAY} md:hidden`}>
        Development
      </p>

      {/* Blob — dos comportamientos deliberados:
          · Móvil: EN FLUJO, colocado aquí (tras el titular) para que no
            empuje la cabecera. Si se deja absoluto sobre el contenido, la
            lista de pistas cae encima del naranja y el contraste se va a
            cero — bug real detectado en captura.
          · md+: absoluto y centrado, con el texto negro pasando por encima
            como en la referencia. El orden en el DOM deja de importar. */}
      {/* Fondo a sangre: cubre TODO el hero, por debajo de todo. */}
      <UnicornBlob
        projectId={UNICORN_BG_ID}
        tiltRef={tiltRef}
        qualityScale={0.6}
        className="pointer-events-none absolute inset-0 z-0"
      />

      {/* Pieza central — ABSOLUTA en los dos tamaños.
          En flujo no cabe: el hueco libre de un iPhone 13 son 139px y
          la escena está compuesta en cuadrado, así que al meterla en un
          rectángulo apaisado el encuadre se comía la forma y quedaba un
          plano magenta liso (comprobado en captura). Absoluta puede ser
          cuadrada y grande sin empujar nada, y el hero sigue midiendo
          exactamente una pantalla.

          Que el texto le pase por encima ya no es un problema de
          contraste: en el hero cada línea lleva su propio panel morado
          (`.text-panel`), así que la tipografía nunca se lee sobre el
          degradado.

          La escena va absoluta DENTRO del hueco: el SDK de Unicorn fija
          el alto del <canvas> en línea al medir el contenedor, y ese
          alto realimentaba el layout.

          `maxQuality` la saca del perfil móvil degradado: es la pieza
          protagonista y se mira de cerca, así que va a resolución
          nativa. La de fondo se queda en 0.6 — dos escenas WebGL a tope
          en un teléfono sí se notan, y en el fondo no se ve. */}
      <div className="pointer-events-none absolute left-1/2 top-[46%] z-[1] aspect-square w-[88%] max-w-[24rem] -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:z-[2] md:w-[46%] md:max-w-[36rem]">
        <UnicornBlob
          projectId={UNICORN_PIECE_ID}
          energyRef={energyRef}
          tiltRef={tiltRef}
          maxQuality
          className="absolute inset-0"
        />
      </div>

      {/* Separador elástico: con la pieza fuera del flujo, es lo único
          que abre el hueco entre los titulares y los metadatos. */}
      <div className="flex-1" />

      {/* ── Reproductor ──────────────────────────────────────────── */}
      <div className="relative z-10 hidden md:mt-0 md:flex md:justify-end">
        <div className="relative w-full md:max-w-sm">
          {/* El punto azul vive anclado al reproductor pero FUERA de su
              caja, para no caer nunca encima de un título de pista. */}
          <span
            aria-hidden="true"
            className="absolute -top-7 right-1 block h-3.5 w-3.5 rounded-full bg-accent-2 md:-top-16 md:right-auto md:left-2 md:h-4 md:w-4"
          />
          <Player
            tracks={tracks}
            current={current}
            playing={playing}
            onToggle={toggle}
            onSelect={selectTrack}
          />
        </div>
      </div>

      {/* ── Metadatos ────────────────────────────────────────────
          Orden calcado del original a este ancho: etiqueta, fila de
          ubicación y hora, y el párrafo al final pegado al titular.
          En md+ vuelve a dos columnas. */}
      <div className="body-type relative z-10 mt-5 flex flex-col gap-4 text-[0.98rem] sm:text-[1.02rem] md:mt-10 md:flex-row md:items-end md:justify-between md:gap-12">
        <div className="flex flex-col gap-4 md:max-w-md md:gap-4">
          <p className="text-panel text-muted">Quién soy ¿¿¿???</p>

          <p className="flex items-center gap-5 text-muted md:hidden">
            <span className="text-panel">Ubicación:</span>
            <span className="text-panel text-foreground">Vigo</span>
            <span className="text-panel text-foreground">
              <LiveClock />
            </span>
          </p>

          {/* La frase carga la keyword ("aplicaciones móviles" + "Vigo")
              sin sonar a texto para robots: primero quién, luego dónde,
              luego qué hace por quien lee. */}
          <p className="text-panel">
            Diseño y desarrollo aplicaciones móviles en{" "}
            <a
              href="https://actiondev.es"
              className="underline decoration-[var(--cyan)] decoration-2 underline-offset-4 transition-opacity duration-[--duration] hover:opacity-60"
            >
              Action
            </a>
            , estudio digital de Vigo. Llevo tu idea de la primera
            pantalla a la App Store y a Google Play: producto que se abre
            todos los días, no una maqueta bonita.
          </p>

          {/* Prueba social y reducción de fricción juntas, justo bajo la
              promesa: el que llega en frío necesita saber que hablar no
              le compromete a nada. */}
          <p className="text-panel text-muted">
            +40 productos entregados · iOS, Android y web
          </p>
        </div>

        <p className="hidden items-center text-muted md:flex md:gap-10">
          <span className="flex items-center gap-3">
            <span className="text-panel">Ubicación:</span>
            <span className="text-panel text-foreground">Vigo</span>
          </span>
          <span className="text-panel text-foreground">
            <LiveClock />
          </span>
        </p>
      </div>

      {/* ── Titular inferior ─────────────────────────────────────── */}
      <p aria-hidden="true" className={`${DISPLAY} hidden md:mt-8 md:block`}>
        Development
      </p>

      {/* ── Salida hacia la siguiente sección ────────────────────
          El crema de Capacidades SUBE desde el borde inferior del hero
          en cuadros, sobre el propio fondo a sangre (`from` transparente:
          lo que se ve por los huecos es el dither, no un color plano).
          Antes entregaba al morado del manifiesto; con esa sección
          fuera, el hero empalma directo con el fondo claro y esta banda
          pasa a ser la ÚNICA transición entre las dos.

          TRES filas, no cuatro, y sin `mt`: de las tres, las dos
          exteriores van dentadas (ver `edge` en PixelWipe), así que
          solo UNA es maciza. Con cuatro macizas quedaban ~117px de
          crema liso entre el hero y la primera línea de Capacidades
          —medido en el móvil del usuario— y eso se lee como un hueco,
          no como una transición.
          Así el corte entre las dos secciones deja de ser una línea y
          pasa a ser el mismo motivo de retícula que gobierna la página.

          Va EN FLUJO y no absoluta: superpuesta caería sobre el titular
          "Development", que vive justo aquí. Los márgenes negativos la
          sacan del gutter y del padding para que sangre a los tres
          bordes, en calc() explícito.

          OJO al escribir comentarios aquí: Tailwind escanea el archivo
          entero como texto, comentarios incluidos, y genera una clase
          por cada patrón que reconoce. Citar una utilidad de ejemplo con
          puntos suspensivos dentro produjo CSS inválido y tumbó el
          servidor de desarrollo. */}
      <PixelWipe
        from="transparent"
        to="var(--paper)"
        direction="up"
        rows={3}
        className="mx-[calc(var(--gutter)*-1)] mb-[calc(var(--gutter)*-1)] mt-2 md:mb-[calc(var(--gutter)*-1.5)]"
      />

      <audio
        ref={audioRef}
        src={tracks[current].src}
        preload="none"
        crossOrigin="anonymous"
        onEnded={() => selectTrack((current + 1) % tracks.length)}
      />
    </section>
  );
}
