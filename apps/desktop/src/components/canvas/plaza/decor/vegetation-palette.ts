import type { PlazaMode } from "../plaza-mode";

/**
 * Paleta PROPIA de la vegetación, por modo. Sustituye a los campos
 * `leaf/leafDark/crown/crownDark` de `PlazaModePalette` y a
 * `PLAZA_DECOR_PALETTE.bark/palm`, que ya no se leen desde aquí.
 *
 * Los valores son albedo: el color que llega a pantalla sale de multiplicarlos
 * por la luz de la escena. Partida de día: lo cercano en el MISMO rango de
 * valor que el arbolado pintado (`arbolado.webp`, #85af6b–#93b265) y solo un
 * poco más saturado y contrastado. Antes la copa al sol era #356b2c y la
 * sombra #0c1c03: un 5:1 entre caras que se leía como un recorte negro.
 */
export interface VegetationPalette {
  /** Copa de árbol: base (abajo, en sombra propia) y punta (arriba, al sol),
   * en tres variantes de tono para que no sean once clones. */
  crownLow: string;
  crownHigh: ReadonlyArray<string>;
  /** Brillo cálido en las caras que miran al cielo. */
  crownWarm: string;
  bark: string;
  barkDark: string;
  /** Estípite de palmera: fibra seca, mucho más clara que una corteza. */
  palm: string;
  palmScar: string;
  /** Capitel verde bajo la corona. */
  palmCrownShaft: string;
  frondBase: string;
  frondTip: string;
  frondRib: string;
  /** Seto recortado (jardinera y parterres): más oscuro y frío que el césped. */
  hedgeLow: string;
  hedgeHigh: string;
  boxwood: string;
  gravel: string;
  gravelDark: string;
  bedSoil: string;
  flowers: ReadonlyArray<string>;
  /** Alcorque bajo árbol y palmera (mancha de tierra, suelo plano). */
  soil: string;
  soilOpacity: number;
}

export const VEGETATION_PALETTES: Record<PlazaMode, VegetationPalette> = {
  dia: {
    crownLow: "#3f6b36",
    crownHigh: ["#6c9e52", "#7aa956", "#5f9a60"],
    crownWarm: "#a9c25e",
    bark: "#6e4c36",
    barkDark: "#463021",
    palm: "#9d8460",
    palmScar: "#6f5a3e",
    palmCrownShaft: "#5a8248",
    frondBase: "#2c5c34",
    frondTip: "#5c9248",
    frondRib: "#86ad5c",
    hedgeLow: "#2c5632",
    hedgeHigh: "#477b42",
    boxwood: "#3a6b3a",
    gravel: "#cdb084",
    gravelDark: "#a98c63",
    bedSoil: "#5b6e3a",
    flowers: ["#e8668a", "#f2c744", "#f4efe2", "#a77bd6"],
    soil: "#8a7452",
    soilOpacity: 0.85,
  },
  noche: {
    crownLow: "#2f4934",
    crownHigh: ["#6f8b62", "#78946a", "#66896e"],
    crownWarm: "#8aa070",
    bark: "#5a4636",
    barkDark: "#33261c",
    palm: "#8a7a62",
    palmScar: "#5a4e3d",
    palmCrownShaft: "#4e6a48",
    frondBase: "#3b6044",
    frondTip: "#729a6c",
    frondRib: "#8aa874",
    hedgeLow: "#25402b",
    hedgeHigh: "#46684a",
    boxwood: "#335a3d",
    gravel: "#9a8a72",
    gravelDark: "#74685a",
    bedSoil: "#3a4d2f",
    flowers: ["#a04a66", "#b09437", "#a8a597", "#7a5ca0"],
    soil: "#2a2620",
    soilOpacity: 0.8,
  },
};
