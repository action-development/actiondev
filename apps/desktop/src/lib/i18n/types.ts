export type Locale = "en" | "es";

export interface Translations {
  nav: {
    home: string;
    work: string;
    reviews: string;
    contact: string;
    cta: string;
    /** Nombre accesible del `<nav>` del Header. */
    ariaLabel: string;
    /** Nombre accesible del enlace del logo (la telemetría no lo nombra). */
    brandHome: string;
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
    cargoTag: string;
  };
  testimonials: {
    trusted: string;
    visionaries: string;
  };
  contact: {
    headline: string;
    accent: string;
    whatsappLabel: string;
    emailLabel: string;
    emailSubject: string;
    /** Mensaje ya redactado que se abre en WhatsApp o en el cliente de correo. */
    intro: string;
    askAI: string;
    aiPrompt: string;
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
    /** Eje de profundidad: cambiar de fila del muelle (▲ ▼). */
    row: string;
    pickup: string;
    throw: string;
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
      /** Alerta del faro: aviso central y chip del contador. */
      alert: string;
      /** Subtítulo del aviso de alerta. */
      alertSub: string;
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
    /** Texto del enlace a la ficha de Google, abajo a la derecha del HUD. */
    googleCta: string;
    /** Pista de click de la placa inferior (`PlazaHint`), que se retira al
     * abrir la primera ficha. Corta y en imperativo: se pinta en caja alta y
     * no debe partirse en dos líneas. La plaza sigue SIN leyenda de controles
     * de arrastre (decisión del cliente). */
    hint: string;
    /** Plantilla con placeholder `{count}` — se interpola en PlazaHud.tsx. */
    countLabel: string;
    loading: string;
    closeAriaLabel: string;
    /** Plantilla con placeholder `{name}` — se interpola en ReviewCard.tsx. */
    dialogAriaLabel: string;
    /** Plantilla con placeholder `{rating}` — aria-label de las estrellas en
     * ReviewCard.tsx (el SVG de estrellas es decorativo, `aria-hidden`). */
    ratingAriaLabel: string;
    /** Texto junto al icono de Google en la ficha de reseña. */
    googleSource: string;
  };
}
