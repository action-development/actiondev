/** Los cinco bloques de la sección de capacidades. Sin numeración: el
 *  orden del array es el orden en pantalla.
 *
 *  ORDEN DELIBERADO (venta, no capricho): primero lo que el visitante
 *  vino a buscar —la app móvil—, y solo después el resto. Cada `body`
 *  dice el BENEFICIO antes que la técnica: quien contrata una app no
 *  compra React Native, compra que su gente la use. */
export const capabilities = [
  {
    id: "apps-moviles",
    title: "Apps móviles iOS y Android",
    body:
      "Una sola base de código, dos tiendas. De la primera pantalla a la publicación en App Store y Google Play, con las revisiones de Apple resueltas por mí, no por ti.",
  },
  {
    id: "producto",
    title: "Producto, no pantallas sueltas",
    body:
      "Antes de dibujar nada decidimos qué hace ganar a tu app: qué se abre el primer día, qué se abre el día treinta y qué sobra. La mitad del trabajo es quitar.",
  },
  {
    id: "movimiento",
    title: "Interfaces que se sienten rápidas",
    body:
      "Movimiento con intención y respuesta inmediata al dedo. Es lo que separa una app que parece nativa de una que parece una web metida en un marco.",
  },
  {
    id: "datos",
    title: "Datos en tiempo real y backend",
    body:
      "Login, pagos, notificaciones, sincronización y paneles de administración. Tú entras a tu app y ves lo que pasa; no dependes de nadie para mirar tus propios números.",
  },
  {
    id: "despues",
    title: "Y después del lanzamiento",
    body:
      "Publicar es el principio. Medimos uso, corregimos lo que frena y añadimos lo siguiente. Con el equipo de Action detrás, tu producto no se queda huérfano en la versión 1.0.",
  },
] as const;
