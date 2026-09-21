export type Locale = "en" | "es";

export interface Translations {
  nav: {
    home: string;
    work: string;
    reviews: string;
    contact: string;
    cta: string;
  };
  hero: {
    label: string;
    headline1: string;
    headline2: string;
    accent: string;
    sub: string;
  };
  projects: {
    transform: string;
    into: string;
    accent: string;
    loading: string;
    columnLabel: string;
    cargoTag: string;
  };
  testimonials: {
    trusted: string;
    visionaries: string;
  };
  contact: {
    headline1: string;
    headline2: string;
    accent: string;
    subtitle: string;
    emailLabel: string;
    askAI: string;
    aiPrompt: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    emailFieldLabel: string;
    emailPlaceholder: string;
    websiteLabel: string;
    websitePlaceholder: string;
    projectLabel: string;
    projectPlaceholder: string;
    required: string;
    submit: string;
    submitOpening: string;
    submitSuccess: string;
    submitSuccessHint: string;
    submitError: string;
    formAriaLabel: string;
    honeypotLabel: string;
    whatsappIntro: string;
    whatsappFallbackName: string;
  };
  footer: {
    available: string;
    tagline: string;
    workWithUs: string;
    workCTA: string;
    sitemapTitle: string;
    socialTitle: string;
    legalTitle: string;
    legalNotice: string;
    legalPrivacy: string;
    legalTerms: string;
    legalCookies: string;
    madeIn: string;
    rights: string;
    /**
     * Disclaimer de marca. Placeholders `{brand}`, `{legal}` y `{taxId}` — se
     * interpolan en Footer.tsx desde LEGAL_ENTITY para no duplicar los datos
     * registrales en cada traducción.
     */
    brandDisclaimer: string;
  };
  scroll: {
    hero: string;
    work: string;
    reviews: string;
    contact: string;
    goTo: string;
    ariaLabel: string;
  };
  tutorial: {
    /** Camino fácil: un click en un contenedor hace toda la maniobra. */
    click: string;
    move: string;
    /** Eje de profundidad: cambiar de fila del muelle (▲ ▼). */
    row: string;
    pickup: string;
    throw: string;
    /** Leyenda final del camino fácil: los controles manuales, opcionales. */
    manual: string;
  };
  loading: {
    ariaLabel: string;
  };
  game: {
    /** HUD de ayuda (`canvas/overlays/HeroHud.tsx`). */
    hud: {
      /** Etiqueta flotante: "clic → /projects". */
      clickToGo: string;
      /** Destino aún sin página. */
      soon: string;
      hintRow: string;
      hintCarry: string;
      hintRelease: string;
      /** Aviso al cargar: "Rumbo a". */
      heading: string;
      /** Menú para ir a las secciones sin jugar. */
      skip: string;
    };
    remote: {
      model: string;
      lower: string;
      left: string;
      right: string;
      /** Aleja la grúa una fila (hacia el fondo del muelle). */
      up: string;
      /** Acerca la grúa una fila (hacia la cámara). */
      down: string;
      hook: string;
      /** Rótulo del indicador de fila del mando. */
      row: string;
      /** Tecla de acción impresa bajo "BAJAR". */
      actionKey: string;
    };
    /** Easter egg: ronda de caza de gaviotas (contador arriba a la derecha). */
    tally: {
      label: string;
      /** Aria-label de la cuenta atrás. */
      timeLeft: string;
      /** Rótulo del récord de bajas en una ronda. */
      record: string;
      /** Aviso al batir el récord. */
      newRecord: string;
      /** Unidad accesible del reloj ("s"). */
      seconds: string;
      /** Aviso central al arrancar la cuenta atrás. */
      roundStart: string;
      /** Aviso central al acabarse el tiempo. */
      roundEnd: string;
      /** Aviso de racha: "RACHA · 5 MUERTES". */
      streak: string;
      streakKills: string;
    };
  };
  notFound: {
    subtitle: string;
    cta: string;
  };
  /** Sala 3D de reseñas — /resenas ("plaza de personajes"). */
  plaza: {
    title: string;
    subtitle: string;
    hint: string;
    /** Plantilla con placeholder `{count}` — se interpola en PlazaHud.tsx. */
    countLabel: string;
    back: string;
    backAriaLabel: string;
    loading: string;
    closeAriaLabel: string;
    /** Plantilla con placeholder `{name}` — se interpola en ReviewCard.tsx. */
    dialogAriaLabel: string;
  };
}
