import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { CONSENT_STORAGE_KEY, LEAD_BUDGET_LABELS, LEAD_NEEDS } from "@actiondev/shared";
import { CallbackForm } from "@/components/contact/CallbackForm";
import { LeadForm } from "@/components/leads/LeadForm";
import { ADS_OFFER_LINE, CONTACT_EXPECTATION, FIRST_MEETING_OFFER } from "@/components/leads/copy";
import { LEAD_SUBMIT_TIMEOUT_MS, useLeadForm } from "@/components/leads/useLeadForm";
import { WhatsappClickTracking } from "@/components/leads/useWhatsappClickTracking";
import { CampaignLeadForm } from "@/components/m/campaign/CampaignLeadForm";
import { MobileLeadForm, MOBILE_NEED_LABELS } from "@/components/m/leads/MobileLeadForm";
import { GENERIC_WHATSAPP_TEXT, whatsappHref, whatsappTextForNeed } from "@/lib/leads/whatsapp";

// jsdom + Node reciente: sin `localStorage` utilizable (mismo shim que `leads.test.ts`).
const store = new Map<string, string>();
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  },
});

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

type Win = { dataLayer?: Record<string, unknown>[] };
const dataLayer = () => (window as unknown as Win).dataLayer ?? [];
const leadEvents = () => dataLayer().filter((entry) => entry.event === "generate_lead");
const eventsNamed = (name: string) => dataLayer().filter((entry) => entry.event === name);

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({ ok: status >= 200 && status < 300, status, json: async () => body });
}

const lastPayload = () => JSON.parse((fetchMock.mock.calls.at(-1)?.[1] as { body: string }).body);
const payloads = () => fetchMock.mock.calls.map((call) => JSON.parse((call[1] as { body: string }).body));

/** `fetch` que no responde nunca: solo se rinde cuando el formulario aborta por tiempo. */
function hang() {
  fetchMock.mockImplementationOnce(
    (_url: string, init: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
  );
}

beforeEach(() => {
  (window as unknown as Win).dataLayer = [];
  window.localStorage.clear();
  window.history.replaceState({}, "", "/hablemos/app?utm_source=google&gclid=abc123");
  fetchMock.mockReset();
  push.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const PROPS = { defaultNeed: "app", source: "ads_landing", offer: "app" } as const;

/** Misma batería de comportamiento para las dos pieles: la lógica es la del hook. */
const SKINS = [
  {
    name: "LeadForm (escritorio)",
    prefix: "lead",
    mount: () => render(<LeadForm {...PROPS} />),
    chooseBudget: (value: string) => fireEvent.change(screen.getByTestId("lead-field-budget"), { target: { value } }),
  },
  {
    name: "MobileLeadForm",
    prefix: "m-lead",
    mount: () => render(<MobileLeadForm {...PROPS} />),
    chooseBudget: (value: string) => fireEvent.click(screen.getByTestId(`m-lead-field-budget-${value}`)),
  },
] as const;

describe.each(SKINS)("$name", ({ prefix, mount, chooseBudget }) => {
  const t = (name: string) => screen.getByTestId(`${prefix}-${name}`);
  const q = (name: string) => screen.queryByTestId(`${prefix}-${name}`);
  const change = (name: string, value: string) => fireEvent.change(t(name), { target: { value } });

  const toStep2 = () => {
    fireEvent.click(t("field-stage-idea"));
    fireEvent.click(t("next"));
  };
  const fillStep2 = () => {
    change("field-name", "  Ana Pérez ");
    change("field-phone", "600 123 456");
    change("field-email", "Ana@Empresa.es");
    chooseBudget("5k-15k");
  };

  it("paso 1: no avanza sin etapa y avanza con ella; la necesidad por defecto viene marcada", () => {
    mount();
    expect(t("field-need-app")).toBeChecked();
    fireEvent.click(t("next"));
    expect(t("error-stage")).toHaveTextContent("Elige en qué punto estás");
    expect(q("step-2")).toBeNull();
    toStep2();
    expect(t("step-2")).toBeInTheDocument();
    expect(t("field-name")).toHaveFocus();
    fireEvent.click(t("back"));
    expect(t("step-1")).toBeInTheDocument();
    expect(t("field-stage-idea")).toBeChecked();
  });

  it("paso 2: valida los cuatro campos y no llama a fetch", () => {
    mount();
    toStep2();
    fireEvent.click(t("submit"));
    expect(t("error-name")).toBeInTheDocument();
    expect(t("error-phone")).toHaveTextContent("Falta tu teléfono para poder llamarte");
    expect(t("error-email")).toHaveTextContent("Falta tu email para enviarte la propuesta");
    expect(t("error-budget")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(t("field-name")).toHaveFocus();

    change("field-phone", "12345");
    change("field-email", "ana@");
    fireEvent.click(t("submit"));
    expect(t("error-phone")).toHaveTextContent("al menos 9 dígitos");
    expect(t("error-email")).toHaveTextContent("Revisa el email");
  });

  it("el honeypot viaja en `website` y el 200 falso SIN id no es conversión ni redirige (silencioso)", async () => {
    // El cliente NO descarta el honeypot por su cuenta (un bot no ve el resultado): lo manda en `website`
    // y la API responde 200 falso sin `id`. Con consentimiento concedido, NO sale `generate_lead`, no se
    // visita /gracias y el formulario confirma en neutro (el bot no sabe que se le ha descartado).
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    mount();
    toStep2();
    fillStep2();
    change("field-website", "https://spam.example");
    respond(200, { ok: true });
    fireEvent.click(t("submit"));
    expect(await screen.findByTestId(`${prefix}-received`)).toHaveTextContent("Recibido. Te contactamos en 24 horas laborables.");
    expect(lastPayload().website).toBe("https://spam.example");
    expect(leadEvents()).toHaveLength(0);
    expect(eventsNamed("lead_submit_error")).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
    expect(q("submit")).toBeNull();
    expect(q("error")).toBeNull();
  });

  it("envía el payload exacto a /api/lead, mide tras el OK con consentimiento y redirige", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    mount();
    toStep2();
    fillStep2();
    expect(leadEvents()).toHaveLength(0);
    respond(200, { ok: true, id: "lead-xyz" });
    fireEvent.click(t("submit"));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/hablemos/gracias?tipo=app"));
    const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; headers: Record<string, string> }];
    expect(url).toBe("/api/lead");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });

    const { elapsedMs, submissionId, ...payload } = lastPayload();
    expect(typeof elapsedMs).toBe("number");
    expect(submissionId).toMatch(/^[A-Za-z0-9-]{32,64}$/);
    expect(payload).toEqual({
      source: "ads_landing",
      offer: "app",
      need: "app",
      stage: "idea",
      name: "Ana Pérez",
      phone: "600 123 456",
      email: "Ana@Empresa.es",
      budget: "5k-15k",
      contactPreference: "whatsapp",
      attribution: { utmSource: "google", gclid: "abc123", landingPath: "/hablemos/app" },
      consent: "granted",
      website: "",
    });

    expect(leadEvents()).toEqual([
      {
        event: "generate_lead",
        lead_id: "lead-xyz",
        transaction_id: "lead-xyz",
        lead_source: "ads_landing",
        lead_need: "app",
        lead_budget: "5k-15k",
        page_path: "/hablemos/app",
        user_data: { email: "ana@empresa.es", phone_number: "+34600123456" },
      },
    ]);
  });

  it("sin consentimiento envía el lead (consent: unknown) pero NO mide", async () => {
    mount();
    toStep2();
    fillStep2();
    respond(200, { ok: true, id: "lead-1" });
    fireEvent.click(t("submit"));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(lastPayload().consent).toBe("unknown");
    expect(leadEvents()).toHaveLength(0);
  });

  it("incluye empresa, notas y el canal elegido cuando se rellenan", async () => {
    mount();
    toStep2();
    fillStep2();
    change("field-company", " Acme ");
    change("field-notes", " Partes en la nave ");
    fireEvent.click(t("field-contact-email"));
    respond(200, { ok: true, id: "lead-2" });
    fireEvent.click(t("submit"));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(lastPayload()).toMatchObject({ company: "Acme", notes: "Partes en la nave", contactPreference: "email" });
  });

  it("con 502 muestra el error, la salida a WhatsApp, NO mide y NO redirige", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    mount();
    toStep2();
    fillStep2();
    respond(502, { ok: false });
    fireEvent.click(t("submit"));

    expect(await screen.findByTestId(`${prefix}-error`)).toHaveTextContent(
      "No se ha podido enviar. Lo que has escrito sigue aquí: vuelve a pulsar «Enviar mi proyecto» o escríbenos por WhatsApp y te atendemos igual.",
    );
    expect(eventsNamed("lead_submit_error")).toEqual([
      { event: "lead_submit_error", error_type: "server", lead_source: "ads_landing", lead_need: "app", page_path: "/hablemos/app" },
    ]);
    const href = t("whatsapp").getAttribute("href");
    expect(href).toBe(
      whatsappHref("Hola, vengo de vuestra web y quiero hablar de un proyecto de app móvil"),
    );
    expect(href).not.toBe(whatsappHref(GENERIC_WHATSAPP_TEXT));
    expect(leadEvents()).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
    expect(t("submit")).not.toBeDisabled();
  });

  it("un 200 sin ok:true también cuenta como fallo", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    mount();
    toStep2();
    fillStep2();
    respond(200, { ok: false });
    fireEvent.click(t("submit"));
    expect(await screen.findByTestId(`${prefix}-error`)).toBeInTheDocument();
    expect(leadEvents()).toHaveLength(0);
    expect(eventsNamed("lead_submit_error")[0]).toMatchObject({ error_type: "bad_response" });
  });

  it("sin red: lead_submit_error de tipo network; con 429, rate_limited", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    mount();
    toStep2();
    fillStep2();
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fireEvent.click(t("submit"));
    expect(await screen.findByTestId(`${prefix}-error`)).toBeInTheDocument();
    respond(429, { ok: false, error: "rate_limited" });
    fireEvent.click(t("submit"));
    await waitFor(() => expect(eventsNamed("lead_submit_error")).toHaveLength(2));
    expect(eventsNamed("lead_submit_error").map((e) => e.error_type)).toEqual(["network", "rate_limited"]);
  });

  it("sin respuesta en 20 s: error de reintento, conserva lo escrito y el reintento no duplica (mismo submissionId)", async () => {
    vi.useFakeTimers();
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
      mount();
      toStep2();
      fillStep2();
      hang();
      fireEvent.click(t("submit"));
      expect(t("submit")).toBeDisabled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(LEAD_SUBMIT_TIMEOUT_MS - 1);
      });
      expect(q("error")).toBeNull();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(t("error")).toHaveTextContent("Lo que has escrito sigue aquí");
      expect(t("submit")).not.toBeDisabled();
      expect(t("field-name")).toHaveValue("  Ana Pérez ");
      expect(t("field-email")).toHaveValue("Ana@Empresa.es");
      expect(eventsNamed("lead_submit_error")[0]).toMatchObject({ error_type: "timeout" });
      expect(leadEvents()).toHaveLength(0);

      respond(200, { ok: true, id: "lead-retry" });
      fireEvent.click(t("submit"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(push).toHaveBeenCalledWith("/hablemos/gracias?tipo=app");
      const [first, second] = payloads();
      expect(first.submissionId).toBeTruthy();
      expect(second.submissionId).toBe(first.submissionId);
      expect(leadEvents()).toHaveLength(1);
      expect((fetchMock.mock.calls[0][1] as { signal: AbortSignal }).signal).toBeInstanceOf(AbortSignal);
    } finally {
      vi.useRealTimers();
    }
  });

  it("embudo: lead_form_step al llegar al paso 2, una sola vez y sin datos personales", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    mount();
    fireEvent.click(t("next"));
    expect(eventsNamed("lead_form_step")).toHaveLength(0);
    toStep2();
    fireEvent.click(t("back"));
    fireEvent.click(t("next"));
    expect(eventsNamed("lead_form_step")).toEqual([
      {
        event: "lead_form_step",
        form_step: "2",
        lead_source: "ads_landing",
        lead_need: "app",
        lead_stage: "idea",
        page_path: "/hablemos/app",
      },
    ]);
  });

  it("embudo sin consentimiento: ni lead_form_step ni lead_submit_error", async () => {
    mount();
    toStep2();
    fillStep2();
    respond(502, { ok: false });
    fireEvent.click(t("submit"));
    await screen.findByTestId(`${prefix}-error`);
    expect(dataLayer()).toHaveLength(0);
  });

  it("whatsapp_click con link_location en la salida a WhatsApp del error", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    mount();
    toStep2();
    fillStep2();
    respond(502, { ok: false });
    fireEvent.click(t("submit"));
    fireEvent.click(await screen.findByTestId(`${prefix}-whatsapp`));
    expect(eventsNamed("whatsapp_click")).toEqual([
      { event: "whatsapp_click", link_location: `${prefix}-whatsapp`, page_path: "/hablemos/app" },
    ]);
  });

  it("primera capa RGPD con Supabase/CRM y enlace a privacidad en pestaña nueva", () => {
    mount();
    toStep2();
    expect(t("privacy")).toHaveTextContent("Google Firebase, Vercel, Supabase, one.com");
    const link = screen.getByRole("link", { name: "Política de privacidad" });
    expect(link).toHaveAttribute("href", "/legal/privacy");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText(/Primera reunión gratis y sin compromiso/)).toHaveTextContent(
      "Primera reunión gratis y sin compromiso. Te respondemos en 24 horas laborables.",
    );
  });

  it("textos de conversión: oferta y expectativa de contacto con el número público", () => {
    expect(FIRST_MEETING_OFFER).toBe("Primera reunión gratis, en Vigo o por videollamada.");
    expect(CONTACT_EXPECTATION).toBe("Te escribimos por WhatsApp o te llamamos desde el 614 02 74 10 (L-V).");
  });

  it("WhatsApp es el canal por defecto", () => {
    mount();
    toStep2();
    expect(t("field-contact-whatsapp")).toBeChecked();
  });
});

describe("LeadForm: específico", () => {
  it("la oferta va bajo «Siguiente» en el paso 1; sin `offerLine`, la de la primera reunión (landings SEO)", () => {
    render(<LeadForm {...PROPS} />);
    const next = screen.getByTestId("lead-next");
    const offer = screen.getByTestId("lead-offer");
    expect(offer.textContent).toBe(FIRST_MEETING_OFFER);
    expect(next.compareDocumentPosition(offer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("con `offerLine` (/hablemos/*), la oferta de los anuncios", () => {
    expect(ADS_OFFER_LINE).toBe("Para empresas de toda Galicia. Primera reunión gratis, en Vigo o por videollamada.");
    render(<LeadForm {...PROPS} offerLine={ADS_OFFER_LINE} />);
    expect(screen.getByTestId("lead-offer").textContent).toBe(ADS_OFFER_LINE);
  });
});

describe("whatsapp_click (link_location)", () => {
  it("el enlace del paso 1 del formulario móvil se identifica y cuenta UNA vez aunque la página también mida", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    render(
      <>
        <MobileLeadForm {...PROPS} />
        <WhatsappClickTracking />
        <a href="https://wa.me/34614027410?text=hola" data-testid="m-header-whatsapp">
          WhatsApp
        </a>
        <a href="mailto:hi@actiondev.es" data-testid="otro">
          Email
        </a>
      </>,
    );
    fireEvent.click(screen.getByTestId("m-lead-whatsapp-step-1"));
    fireEvent.click(screen.getByTestId("m-header-whatsapp"));
    fireEvent.click(screen.getByTestId("otro"));
    expect(eventsNamed("whatsapp_click")).toEqual([
      { event: "whatsapp_click", link_location: "m-lead-whatsapp-step-1", page_path: "/hablemos/app" },
      { event: "whatsapp_click", link_location: "m-header-whatsapp", page_path: "/hablemos/app" },
    ]);
  });

  it("solo el formulario: fuera de él no mide; sin consentimiento, nada; al desmontar, se retira", () => {
    const { unmount } = render(
      <>
        <MobileLeadForm {...PROPS} />
        <a href="https://wa.me/34614027410" data-testid="fuera">
          WhatsApp
        </a>
      </>,
    );
    fireEvent.click(screen.getByTestId("m-lead-whatsapp-step-1"));
    expect(eventsNamed("whatsapp_click")).toHaveLength(0);
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    fireEvent.click(screen.getByTestId("fuera"));
    expect(eventsNamed("whatsapp_click")).toHaveLength(0);
    fireEvent.click(screen.getByTestId("m-lead-whatsapp-step-1"));
    expect(eventsNamed("whatsapp_click")).toHaveLength(1);
    const link = screen.getByTestId("m-lead-whatsapp-step-1");
    unmount();
    document.body.appendChild(link);
    fireEvent.click(link);
    expect(eventsNamed("whatsapp_click")).toHaveLength(1);
    link.remove();
  });
});

describe("WhatsApp con el texto fijo de la landing (`whatsappText`)", () => {
  const LANDING_TEXT = "Hola, vengo de vuestra web y quiero hablar de una app a medida";
  const decodedHref = (el: HTMLElement) => decodeURIComponent(el.getAttribute("href") ?? "");
  /** Paso 1 → paso 2 → datos válidos → envío con `fetch` que falla: sale el error con WhatsApp. */
  const failSubmit = () => {
    fireEvent.click(screen.getByTestId("lead-field-stage-idea"));
    fireEvent.click(screen.getByTestId("lead-next"));
    fireEvent.change(screen.getByTestId("lead-field-name"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByTestId("lead-field-phone"), { target: { value: "600123456" } });
    fireEvent.change(screen.getByTestId("lead-field-email"), { target: { value: "ana@empresa.es" } });
    fireEvent.change(screen.getByTestId("lead-field-budget"), { target: { value: "lt5k" } });
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fireEvent.click(screen.getByTestId("lead-submit"));
  };

  it("LeadForm con `whatsappText`: la salida del error lleva ese texto", async () => {
    render(<LeadForm {...PROPS} whatsappText={LANDING_TEXT} />);
    failSubmit();
    expect(decodedHref(await screen.findByTestId("lead-whatsapp"))).toContain(LANDING_TEXT);
  });

  it("LeadForm sin la prop: el texto de la necesidad elegida", async () => {
    render(<LeadForm {...PROPS} />);
    failSubmit();
    expect(decodedHref(await screen.findByTestId("lead-whatsapp"))).toContain(whatsappTextForNeed("app"));
  });

  it("CampaignLeadForm la reenvía al enlace del paso 1 de MobileLeadForm", () => {
    render(<CampaignLeadForm id="proyecto" defaultNeed="app" source="ads_landing" offer="app" whatsappText={LANDING_TEXT} />);
    expect(decodedHref(screen.getByTestId("m-lead-whatsapp-step-1"))).toContain(LANDING_TEXT);
  });
});

describe("MobileLeadForm: específico", () => {
  it("usa nombres llanos sin cambiar los valores, y presupuesto con las etiquetas completas", () => {
    render(<MobileLeadForm {...PROPS} id="proyecto" />);
    expect(document.getElementById("proyecto")).toBe(screen.getByTestId("m-lead-form"));
    expect(MOBILE_NEED_LABELS).toEqual({
      app: "Una app",
      software: "Un programa de gestión",
      integration: "Conectar programas",
      web: "Una web",
      unsure: "Aún no lo sé",
    });
    expect(Object.keys(MOBILE_NEED_LABELS)).toEqual([...LEAD_NEEDS]);
    expect(screen.getByTestId("m-lead-field-need-integration")).toHaveAttribute("value", "integration");
    expect(screen.getByText("Conectar programas")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("m-lead-field-stage-idea"));
    fireEvent.click(screen.getByTestId("m-lead-next"));
    for (const [value, label] of Object.entries(LEAD_BUDGET_LABELS)) {
      const radio = screen.getByTestId(`m-lead-field-budget-${value}`);
      expect(radio).toHaveAttribute("value", value);
      expect(radio.closest("label")).toHaveTextContent(label);
    }
  });

  it("inputmode y autocomplete correctos; empresa y notas plegadas", () => {
    render(<MobileLeadForm {...PROPS} testIdPrefix="x" />);
    fireEvent.click(screen.getByTestId("x-field-stage-idea"));
    fireEvent.click(screen.getByTestId("x-next"));
    expect(screen.getByTestId("x-field-name")).toHaveAttribute("autocomplete", "name");
    expect(screen.getByTestId("x-field-phone")).toHaveAttribute("inputmode", "tel");
    expect(screen.getByTestId("x-field-phone")).toHaveAttribute("autocomplete", "tel");
    expect(screen.getByTestId("x-field-email")).toHaveAttribute("inputmode", "email");
    expect(screen.getByTestId("x-field-email")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByTestId("x-field-company")).toHaveAttribute("autocomplete", "organization");
    expect(screen.getByTestId("x-extras").tagName).toBe("DETAILS");
    expect(screen.getByTestId("x-extras")).not.toHaveAttribute("open");
  });

  it("error de presupuesto: foco en el primer tile", () => {
    render(<MobileLeadForm {...PROPS} />);
    fireEvent.click(screen.getByTestId("m-lead-field-stage-defined"));
    fireEvent.click(screen.getByTestId("m-lead-next"));
    fireEvent.change(screen.getByTestId("m-lead-field-name"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByTestId("m-lead-field-phone"), { target: { value: "600123456" } });
    fireEvent.change(screen.getByTestId("m-lead-field-email"), { target: { value: "ana@empresa.es" } });
    fireEvent.click(screen.getByTestId("m-lead-submit"));
    expect(screen.getByTestId("m-lead-error-budget")).toBeInTheDocument();
    expect(screen.getByTestId("m-lead-field-budget-lt5k")).toHaveFocus();
  });
});

describe("CallbackForm («llámame tú»)", () => {
  const sendPhone = () => {
    const { container } = render(<CallbackForm />);
    fireEvent.change(container.querySelector("#contact-callback-phone")!, { target: { value: "600 123 456" } });
    fireEvent.submit(screen.getByTestId("callback-form"));
  };

  it("un 200 sin id (descartado como bot) confirma, pero sin generate_lead ni id inventado", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    respond(200, { ok: true });
    sendPhone();
    expect(await screen.findByTestId("callback-success")).toBeInTheDocument();
    expect(lastPayload()).toMatchObject({ source: "callback_form", phone: "600 123 456" });
    expect(leadEvents()).toHaveLength(0);
  });

  it("un 200 con id: un generate_lead con ese id y el teléfono en user_data", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    respond(200, { ok: true, id: "cb-1" });
    sendPhone();
    await screen.findByTestId("callback-success");
    expect(leadEvents()).toEqual([
      {
        event: "generate_lead",
        lead_id: "cb-1",
        transaction_id: "cb-1",
        lead_source: "callback_form",
        lead_need: "not_asked",
        lead_budget: "not_asked",
        page_path: "/hablemos/app",
        user_data: { phone_number: "+34600123456" },
      },
    ]);
  });
});

describe("useLeadForm", () => {
  it("monta con la atribución de la URL y valida el paso 1 y el 2", async () => {
    const { result } = renderHook(() => useLeadForm({ defaultNeed: "software", source: "seo_landing", offer: "software" }));
    expect(result.current.need).toBe("software");
    expect(result.current.step).toBe(1);

    act(() => result.current.goNext());
    expect(result.current.errors.stage).toBe("Elige en qué punto estás");
    act(() => result.current.setStage("existing"));
    act(() => result.current.goNext());
    expect(result.current.step).toBe(2);
    expect(result.current.errors).toEqual({});

    await act(async () => {
      await result.current.onSubmit({ preventDefault() {} } as never);
    });
    expect(Object.keys(result.current.errors).sort()).toEqual(["budget", "email", "name", "phone"]);
    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      result.current.setName("Ana");
      result.current.setPhone("600123456");
      result.current.setEmail("ana@empresa.es");
      result.current.setBudget("unknown");
      result.current.setHoneypot("bot");
    });
    respond(200, { ok: true, id: "h-1" });
    await act(async () => {
      await result.current.onSubmit({ preventDefault() {} } as never);
    });
    expect(lastPayload()).toMatchObject({
      source: "seo_landing",
      offer: "software",
      need: "software",
      stage: "existing",
      budget: "unknown",
      website: "bot",
      attribution: { utmSource: "google", gclid: "abc123", landingPath: "/hablemos/app" },
    });
    expect(push).toHaveBeenCalledWith("/hablemos/gracias?tipo=software");
    expect(result.current.status).toBe("sent");
  });
});
