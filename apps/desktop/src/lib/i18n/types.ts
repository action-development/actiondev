export type Locale = "en" | "es";

export interface Translations {
  nav: {
    home: string;
    work: string;
    reviews: string;
    blog: string;
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
    /** Aclaración en pequeño bajo el titular: sin compromiso al escribir. */
    subtitle: string;
    whatsappLabel: string;
    emailLabel: string;
    emailSubject: string;
    /** Mensaje ya redactado que se abre en WhatsApp o en el cliente de correo. */
    intro: string;
    askAI: string;
    aiPrompt: string;
    /** Disclosure "¿Prefieres que te contactemos?" — deja un teléfono para que le llamen. */
    callbackLabel: string;
    callbackPlaceholder: string;
    /** Placeholder de la nota opcional que aparece al empezar a escribir el teléfono. */
    callbackNotesPlaceholder: string;
    callbackCta: string;
    /** Confirmación tras enviar el lead a Firestore. */
    callbackSuccess: string;
    /** La calle de /contact (C/ Colón 20 en 3D). Rótulos de las etiquetas de
     * cada objeto: canal + verbo que aparece al apuntarlo. En caja alta. */
    street: {
      address: string;
      loading: string;
      /** Pista de `ControlSign`, arriba. Corta: una sola línea. */
      hint: string;
      whatsappTag: string;
      whatsappAction: string;
      emailTag: string;
      emailAction: string;
      callbackTag: string;
      callbackAction: string;
      /** Caja de luz de la cabina, pantalla del teléfono (dos líneas), placa
       * del buzón y título de su placa de horarios (texturas). */
      booth: string;
      lcd1: string;
      lcd2: string;
      postbox: string;
      collection: string;
      /** Botón que cierra el campo de "llámame tú". */
      callbackClose: string;
    };
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
    /** Reabre el banner de consentimiento (`ui/CookieConsent.tsx`) para cambiar la decisión. */
    cookiePreferences: string;
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
    blog: string;
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
  /** Banner de consentimiento (`ui/CookieConsent.tsx`), condición para cargar GTM. */
  cookieConsent: {
    message: string;
    linkLabel: string;
    accept: string;
    reject: string;
    /** Nombre accesible del banner (`role="dialog"`). */
    ariaLabel: string;
  };
  /** Atajo de contacto (`ui/ContactPopup.tsx`): para quien no quiere jugar. */
  contactPopup: {
    eyebrow: string;
    title: string;
    lead: string;
    /** Leyenda del selector de servicio (solo lectores de pantalla). */
    servicesLegend: string;
    services: Record<"apps" | "webapp" | "web", { label: string; message: string }>;
    whatsappCta: string;
    emailPrefix: string;
    reassurance: string;
    askAI: string;
    close: string;
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
  /** Sala recreativa 3D — /projects (pasillo de máquinas, una por proyecto). */
  arcade: {
    /** h1 de la página: solo para lectores de pantalla y buscadores. */
    title: string;
    loading: string;
    /** Tutorial (`ControlSign`): paso 1, andar. Caja alta, una línea. */
    hintWalk: string;
    /** Paso 2: mirar a una fila y elegir máquina. */
    hintPick: string;
    /** Rótulo de neón sobre la puerta del fondo (lleva a /contact). */
    door: string;
    /** Acción de la ficha de la máquina enfocada. */
    play: string;
    /** Botón "Ver lista" y título del panel con todos los proyectos. */
    list: string;
    listTitle: string;
    close: string;
    /** Pantalla de la máquina acoplada (`arcade/ArcadeScreen`). */
    screen: {
      /** Botón de salida bajo la pantalla. */
      back: string;
      /** `aria-label` de las flechas laterales. */
      prev: string;
      next: string;
      /** Pista junto a la salida: ◀ ▶ pasan a la máquina de al lado. */
      neighbors: string;
      brief: string;
      result: string;
      site: string;
      /** Enlace a /projects/[slug]. */
      caseStudy: string;
    };
  };
}
