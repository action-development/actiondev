/** Anclas de la landing. NO se pintan en la cabecera —el hero no lleva
 *  navegación a propósito, para que arriba solo exista un destino
 *  posible (#hablemos)—. Viven únicamente en el pie, como mapa de la
 *  página para quien ya ha bajado del todo. */
export const navigation = [
  { label: "Qué hago", href: "#capacidades" },
  { label: "Efectos", href: "#recursos" },
  { label: "Trabajos", href: "#trabajos" },
] as const;
