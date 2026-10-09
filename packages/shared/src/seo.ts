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
  displayName: "Action Development",
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
  // Pin EXACTO de la ficha de Google Business Profile: coordenadas de la URL
  // a la que redirige `mapsUrl` (`/maps/place/Action+Development/@42.2372544,
  // -8.7206586`), comprobadas el 2026-10-09. Antes, 42.2372 / -8.7203
  // (aproximadas, a ~30 m del pin).
  geo: { latitude: 42.2372544, longitude: -8.7206586 },
  /**
   * Ficha REAL de Google Business Profile ("Action Development"), por CID.
   * Antes era una URL de búsqueda de Maps: podía enseñar a la competencia y
   * no ataba la web a la entidad de Google. Va a `hasMap`/`sameAs` del
   * JSON-LD y a los enlaces "ver reseñas".
   */
  mapsUrl: "https://maps.google.com/?cid=18162141466997281764",
  /** Enlace corto de GBP que abre directamente el formulario de reseña. */
  reviewUrl: "https://g.page/r/CeTTw-Rv4wz8EBM/review",
  foundingYear: 2020,
  /**
   * Fundador: el mismo `Person` que emite `pablo.actiondev.es` y que firma el
   * blog (`AUTHORS` de `authors.ts`, con el mismo `@id`). Va aquí y no se
   * importa de `authors.ts` porque ese módulo importa `ORGANIZATION_ID` de
   * este: el ciclo dejaría uno de los dos sin inicializar. Sin `jobTitle` en
   * el JSON-LD de la organización: el cargo está pendiente de confirmar
   * (plan AEO, §4.2) y el nodo completo vive en su web.
   */
  founder: {
    name: "Pablo Cabaleiro",
    url: "https://pablo.actiondev.es",
    schemaId: "https://pablo.actiondev.es/#person",
  },
  /** Idiomas de trabajo (BCP 47): español e inglés (`llms.txt`, «Bilingual operation»). */
  languages: ["es", "en"],
  /**
   * Temas que domina la entidad (`knowsAbout`). SOLO lo que respaldan los
   * proyectos (`technologies` de `projects.ts`, comprobadas en vivo el
   * 2026-10-09), las landings o esta misma web: React Native y Expo (Óscar
   * Soto, Tratum, XauLabs), React con Next.js (PBB) o Vite (Musa, Samoa…),
   * Node.js (Koopey, Timetracker), Shopify (Canelita, Cliché), Three.js y
   * TypeScript (actiondev.es). Sin Flutter, Swift, Kotlin, Supabase ni Stripe:
   * ningún proyecto publicado los usa.
   */
  knowsAbout: [
    "Desarrollo de aplicaciones móviles",
    "iOS",
    "Android",
    "React Native",
    "Expo",
    "Software a medida",
    "ERP a medida",
    "Control horario",
    "Integraciones de software",
    "Desarrollo web",
    "Next.js",
    "React",
    "Vite",
    "TypeScript",
    "Node.js",
    "Comercio electrónico",
    "Shopify",
    "Three.js",
    "Diseño web",
  ],
  social: {
    // `@action.dev` NO existe (el `sameAs` del JSON-LD apuntaba a un perfil
    // vacío): el perfil real es `@actiondev.es`.
    instagram: "https://www.instagram.com/actiondev.es/",
    linkedin: "https://www.linkedin.com/company/action-development/",
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

/**
 * Landings SEO locales (slug + rótulo) para el bloque indexable de la home de
 * la zona mobile, que no puede importar `apps/desktop/src/data/landings.ts`.
 * Mantener en sincronía con ese archivo al añadir/quitar una landing.
 */
export const SERVICE_LANDINGS = [
  { slug: "desarrollo-de-aplicaciones-vigo", label: "Desarrollo de aplicaciones en Vigo" },
  { slug: "desarrollo-web-vigo", label: "Desarrollo web en Vigo" },
  { slug: "diseno-web-vigo", label: "Diseño web en Vigo" },
  { slug: "tienda-online-vigo", label: "Tiendas online en Vigo" },
  { slug: "software-a-medida-vigo", label: "Software a medida en Vigo" },
  { slug: "desarrollo-de-aplicaciones-pontevedra", label: "Desarrollo de aplicaciones en Pontevedra" },
  { slug: "desarrollo-web-pontevedra", label: "Diseño y desarrollo web en Pontevedra" },
  { slug: "desarrollo-web-redondela", label: "Diseño y desarrollo web en Redondela" },
  { slug: "desarrollo-de-aplicaciones-galicia", label: "Desarrollo de aplicaciones en Galicia" },
  { slug: "agencia-desarrollo-web-galicia", label: "Agencia de desarrollo web en Galicia" },
] as const;

/** `@id` de la entidad de negocio. Desktop, mobile y landings apuntan aquí. */
export const ORGANIZATION_ID = `${BUSINESS.domain}/#organization`;

/**
 * Descripción de la entidad en el JSON-LD, la MISMA en escritorio, en la web
 * móvil v2 y en la zona mobile antigua. Empieza por «Action Development es…»:
 * con «Action es…» los motores de IA la mezclaban con la cadena de tiendas
 * Action (plan AEO, §4.1 y §4.3).
 */
export const ORGANIZATION_DESCRIPTION =
  "Action Development es un estudio de desarrollo de software con oficina en Vigo (Rúa Colón, 20) que diseña y programa apps para iOS y Android, software a medida y webs, con el mismo equipo interno de principio a fin.";

/** Qué NO es la entidad (`disambiguatingDescription`): la cadena de tiendas Action y otras «Action Development». */
export const ORGANIZATION_DISAMBIGUATION =
  "Estudio de desarrollo de software de Vigo (España). No tiene relación con la cadena de tiendas de descuento Action ni con otras empresas llamadas Action Development fuera de España.";

/**
 * JSON-LD de la entidad de negocio: UN solo nodo `Organization` +
 * `ProfessionalService`. Antes eran dos nodos con nombres distintos
 * ("Action" y "Action Digital Agency") y Google veía dos entidades en vez de
 * una ficha local consolidada. Lo emiten desktop y mobile (mobile-first
 * indexing: la home móvil es la que se indexa), así que vive aquí para que no
 * se desincronicen.
 *
 * SIN `aggregateRating` ni `review`: Google no muestra estrellas de reseñas
 * sobre el propio negocio (self-serving) y marcar reseñas que no están en el
 * HTML es "spammy structured markup". Las reseñas cuentan en la ficha de
 * Google Business Profile, no aquí.
 */
export function organizationSchema(description: string = ORGANIZATION_DESCRIPTION) {
  return {
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORGANIZATION_ID,
    // Nombre EXACTO de la ficha de Google Business Profile, para que Google
    // case la web con la ficha. "Action" (la marca corta) va de alias.
    name: BUSINESS.alternateName,
    alternateName: BUSINESS.name,
    // "Action" es marca; la persona jurídica es Alcasi Systems, S.L.
    // `legalName` + `vatID` permiten cruzar el proveedor con el Registro
    // Mercantil sin salir del JSON-LD.
    legalName: BUSINESS.legalName,
    vatID: BUSINESS.taxId,
    taxID: BUSINESS.taxId,
    url: BUSINESS.domain,
    logo: `${BUSINESS.domain}/logos/logo.webp`,
    image: `${BUSINESS.domain}/logos/logo.webp`,
    description,
    disambiguatingDescription: ORGANIZATION_DISAMBIGUATION,
    foundingDate: String(BUSINESS.foundingYear),
    founder: {
      "@type": "Person",
      "@id": BUSINESS.founder.schemaId,
      name: BUSINESS.founder.name,
      url: BUSINESS.founder.url,
    },
    knowsAbout: [...BUSINESS.knowsAbout],
    knowsLanguage: [...BUSINESS.languages],
    email: BUSINESS.email,
    telephone: BUSINESS.phoneE164,
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.street,
      postalCode: BUSINESS.address.postalCode,
      addressLocality: BUSINESS.address.locality,
      addressRegion: BUSINESS.address.region,
      addressCountry: BUSINESS.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    hasMap: BUSINESS.mapsUrl,
    // Contacto comercial: WhatsApp (el número solo atiende WhatsApp, pero el
    // E.164 es el mismo) y email, en los dos idiomas de trabajo.
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: BUSINESS.phoneE164,
        email: BUSINESS.email,
        url: `${BUSINESS.domain}/contact`,
        availableLanguage: [...BUSINESS.languages],
        areaServed: { "@type": "Country", name: "España" },
      },
    ],
    // De lo local a lo general: en persona en Vigo y la provincia, a
    // distancia en Galicia y España. Las ciudades sueltas de antes (A Coruña,
    // Santiago) caben en Galicia; cada landing declara la suya en su `Service`.
    areaServed: [
      { "@type": "City", name: "Vigo" },
      { "@type": "AdministrativeArea", name: "Provincia de Pontevedra" },
      { "@type": "AdministrativeArea", name: "Galicia" },
      // `name` es el nombre del país, no su código ISO (que ya va en
      // `addressCountry`): con "ES" el nodo decía que se sirve a un sitio
      // llamado «ES».
      { "@type": "Country", name: "España" },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Servicios de ${BUSINESS.alternateName}`,
      itemListElement: BUSINESS.services.map((service, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: service,
            provider: { "@id": ORGANIZATION_ID },
          },
        },
      })),
    },
    // Solo perfiles PROPIOS que resuelven y son de la marca (comprobado el
    // 2026-10-09: la ficha de Google redirige a «Action Development», el
    // LinkedIn es «Action Development | LinkedIn» con actiondev.es y Vigo, y
    // el Instagram es @actiondev.es). Ni el GitHub (es el repo del sitio, no
    // un perfil de marca) ni directorios sin reclamar: cada perfil de
    // directorio entra cuando esté reclamado y con datos correctos.
    sameAs: [BUSINESS.mapsUrl, BUSINESS.social.instagram, BUSINESS.social.linkedin],
  };
}

/** `@id` del sitio. Las páginas lo citan en `isPartOf`. */
export const WEBSITE_ID = `${BUSINESS.domain}/#website`;

/**
 * JSON-LD `WebSite`, el mismo en desktop y mobile. `name` es lo que Google
 * prefiere como nombre del sitio en los resultados: «Action Development», el
 * nombre de la ficha de Google y de la `Organization`, con «Action» de alias.
 * Con «Action» a secas competía con la cadena de tiendas Action (auditoría
 * SEO, §5.2).
 */
export function websiteSchema(description?: string) {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: BUSINESS.domain,
    name: BUSINESS.alternateName,
    alternateName: BUSINESS.name,
    ...(description && { description }),
    inLanguage: "es",
    publisher: { "@id": ORGANIZATION_ID },
  };
}
