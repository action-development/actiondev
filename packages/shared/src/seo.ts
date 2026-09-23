/**
 * Datos de negocio compartidos (NAP — Name, Address, Phone).
 * Single source of truth para SEO local en desktop y mobile.
 *
 * IMPORTANTE: estos datos deben coincidir EXACTAMENTE con la ficha de
 * Google Business Profile. Si cambia la ficha, cambiar aquí también.
 */
export const BUSINESS = {
  name: "Action",
  /**
   * Denominación social REAL. Va a JSON-LD `legalName` y a los metadatos
   * author/creator/publisher. NO es un nombre de marketing — si aquí pones la
   * marca, un organismo público no puede cruzar el proveedor con el Registro
   * Mercantil. Ver LEGAL_ENTITY más abajo.
   */
  legalName: "Alcasi Systems, S.L.",
  /** Nombre largo de marca para usos visuales (OG image, firma de servicio). */
  displayName: "Action Digital Agency",
  alternateName: "Action Development",
  /** NIF/CIF del titular — JSON-LD `vatID` / `taxID`. */
  taxId: "B72910664",
  domain: "https://actiondev.es",
  email: "hi@actiondev.es",
  phoneE164: "+34614027410",
  phoneDisplay: "+34 614 02 74 10",
  whatsappUrl: "https://wa.me/34614027410",
  address: {
    // Formato EXACTO de la ficha GBP: "Rúa Colón, 20, 36201 Vigo, Pontevedra"
    street: "Rúa Colón, 20",
    locality: "Vigo",
    region: "Pontevedra",
    postalCode: "36201",
    country: "ES",
  },
  // Aproximadas a Rúa Colón 20 — verificar contra el pin exacto de la ficha GBP.
  geo: { latitude: 42.2372, longitude: -8.7203 },
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Action+Development+Vigo",
  foundingYear: 2020,
  social: {
    instagram: "https://instagram.com/action.dev",
    linkedin: "https://linkedin.com/company/action-development",
  },
  /** Catálogo de servicios — usado por el `hasOfferCatalog` del JSON-LD en desktop y mobile. */
  services: [
    "Desarrollo de aplicaciones móviles (iOS y Android)",
    "Desarrollo web a medida",
    "Diseño web premium",
    "Experiencias 3D interactivas",
    "Interfaces de producto y SaaS",
    "Estrategia y diseño",
  ],
} as const;

/**
 * Titular legal de la marca "Action Development".
 *
 * "Action" / "Action Development" es una MARCA COMERCIAL, no una persona
 * jurídica. La entidad que contrata, factura y responde es Alcasi Systems, S.L.
 *
 * Por qué existe este objeto: un organismo público que evalúe a Action cruza
 * el CIF contra el Registro Mercantil. Si la web solo muestra la marca, el
 * proveedor parece un proyecto fantasma. Estos datos hacen esa verificación
 * trivial desde el aviso legal y desde el JSON-LD (`legalName` + `vatID`).
 *
 * Fuente: Registro Mercantil de Pontevedra (verificado vía Iberinform,
 * eInforma e Infonif). Si cambian los datos registrales, cambiar AQUÍ.
 */
export const LEGAL_ENTITY = {
  /** Denominación social inscrita. */
  name: "Alcasi Systems, S.L.",
  /** Nombre comercial bajo el que opera. */
  tradeName: "Action Development",
  /** NIF/CIF de la sociedad. */
  taxId: "B72910664",
  /** Domicilio social registral — NO coincide con la oficina de Vigo. */
  registeredAddress: {
    street: "Lugar Puerto Pesquero Este, S/N, Nave 21",
    locality: "Marín",
    region: "Pontevedra",
    postalCode: "36900",
    country: "ES",
  },
  /** Fecha de constitución (ISO). */
  incorporationDate: "2022-12-22",
  registry: {
    office: "Registro Mercantil de Pontevedra",
    volume: "4428",
    folio: "200",
    section: "8",
    sheet: "PO-70894",
  },
  shareCapital: "3.000,00 €",
  /** CNAE principal inscrito. */
  cnae: "4321",
  contactEmail: "hi@actiondev.es",
} as const;

/** Domicilio social formateado en una línea, para aviso legal y JSON-LD. */
export const REGISTERED_ADDRESS_LINE = [
  LEGAL_ENTITY.registeredAddress.street,
  `${LEGAL_ENTITY.registeredAddress.postalCode} ${LEGAL_ENTITY.registeredAddress.locality}`,
  `(${LEGAL_ENTITY.registeredAddress.region})`,
].join(", ");

/** Oficina / establecimiento abierto al público (el NAP de Google Business). */
export const OFFICE_ADDRESS_LINE = [
  BUSINESS.address.street,
  `${BUSINESS.address.postalCode} ${BUSINESS.address.locality}`,
  `(${BUSINESS.address.region})`,
].join(", ");

/** Datos registrales en una línea, formato habitual de aviso legal. */
export const REGISTRY_LINE = `${LEGAL_ENTITY.registry.office}, Tomo ${LEGAL_ENTITY.registry.volume}, Folio ${LEGAL_ENTITY.registry.folio}, Sección ${LEGAL_ENTITY.registry.section}, Hoja ${LEGAL_ENTITY.registry.sheet}`;
