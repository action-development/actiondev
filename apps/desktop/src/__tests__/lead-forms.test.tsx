import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { CONSENT_STORAGE_KEY, LEAD_BUDGET_LABELS, LEAD_NEEDS } from "@actiondev/shared";
import { LeadForm } from "@/components/leads/LeadForm";
import { useLeadForm } from "@/components/leads/useLeadForm";
import { MobileLeadForm, MOBILE_NEED_LABELS } from "@/components/m/leads/MobileLeadForm";
import { GENERIC_WHATSAPP_TEXT, whatsappHref } from "@/lib/leads/whatsapp";

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

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({ ok: status >= 200 && status < 300, status, json: async () => body });
}

const lastPayload = () => JSON.parse((fetchMock.mock.calls.at(-1)?.[1] as { body: string }).body);

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

  it("el honeypot viaja en `website` (el 200 falso de la API lo descarta) y no rompe el flujo", async () => {
    // El cliente NO descarta el honeypot por su cuenta (un bot no ve el resultado): lo manda en `website`
    // y la API responde 200 falso. Aquí se comprueba que va en el payload y que ese 200 falso no rompe el flujo.
    mount();
    toStep2();
    fillStep2();
    change("field-website", "https://spam.example");
    respond(200, { ok: true });
    fireEvent.click(t("submit"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(lastPayload().website).toBe("https://spam.example");
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

    const { elapsedMs, ...payload } = lastPayload();
    expect(typeof elapsedMs).toBe("number");
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

    expect(await screen.findByTestId(`${prefix}-error`)).toHaveTextContent("No se ha podido enviar");
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

  it("WhatsApp es el canal por defecto", () => {
    mount();
    toStep2();
    expect(t("field-contact-whatsapp")).toBeChecked();
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
