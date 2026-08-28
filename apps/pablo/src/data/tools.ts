/**
 * Piezas del apartado de EFECTOS.
 *
 * Cada una tiene su clip en `public/effects/`: mp4 h264 recomprimido
 * (8,2 MB originales → 1,9 MB en total) más un póster .webp del primer
 * fotograma. El póster no es un adorno: sin él, entre que el <video>
 * monta y llega el primer fotograma, el panel parpadea en blanco.
 *
 * `bg` es el color del panel de cada clip, MUESTREADO del primer píxel
 * del propio vídeo (`ffmpeg -vf crop=8:8`), no elegido a ojo. Los cuatro
 * clips traen fondos distintos —negro, gris claro, casi blanco— y con un
 * panel de color fijo se veían bandas allí donde el vídeo, al ir en
 * `object-contain`, no llena el marco.
 */
export const tools = [
  {
    id: "chroma-warp",
    name: "Chroma Warp",
    src: "/effects/image-text.mp4",
    poster: "/effects/image-text.webp",
    bg: "#000000",
    body:
      "Estudio de movimiento entre imagen y tipografía viva. De aquí salen las portadas y los onboardings que hacen que una app se recuerde a los cinco segundos.",
  },
  {
    id: "split-mask",
    name: "Split Mask",
    src: "/effects/open.mp4",
    poster: "/effects/open.webp",
    bg: "#000000",
    body:
      "Abrir, enmascarar y revelar. Es la mecánica con la que una pantalla da paso a otra sin que el usuario sienta que ha esperado.",
  },
  {
    id: "text-maze",
    name: "Text Maze",
    src: "/effects/remix-maze.mp4",
    poster: "/effects/remix-maze.webp",
    bg: "#d5d5d5",
    body:
      "Layout procedural con reglas propias: mil variantes que nunca rompen el sistema. Lo mismo que sostiene una app cuando el contenido crece y el diseño no puede.",
  },
  {
    id: "whale",
    name: "Whale",
    src: "/effects/whale.mp4",
    poster: "/effects/whale.webp",
    bg: "#fefefe",
    body:
      "Peso, profundidad y atmósfera en tiempo real, con el coste de render medido. 3D dentro de un móvil sin fundir la batería: ahí está la gracia.",
  },
] as const;
