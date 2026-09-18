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
    selectedWork: string;
    loading: string;
    sectionLabel: string;
    columnLabel: string;
    dock: string;
    hint: string;
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
    move: string;
    pickup: string;
    throw: string;
  };
  loading: {
    ariaLabel: string;
  };
  game: {
    scoreHint: string;
    remote: {
      model: string;
      lower: string;
      left: string;
      right: string;
      hook: string;
    };
    /** Easter egg: contador de gaviotas abatidas (arriba a la derecha). */
    tally: {
      label: string;
      one: string;
      many: string;
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
