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
    legalPrivacy: string;
    legalTerms: string;
    legalCookies: string;
    madeIn: string;
    rights: string;
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
    jump: string;
    pickup: string;
    throw: string;
  };
  loading: {
    ariaLabel: string;
  };
  game: {
    scoreHint: string;
  };
}
