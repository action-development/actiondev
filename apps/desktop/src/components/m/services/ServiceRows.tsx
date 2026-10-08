import { SERVICE_STYLE, Shape, type ServiceNeed } from "../Shape";

/**
 * Los cuatro servicios en lenguaje llano (DESIGN.md §4 y §7 `.svc`): forma en
 * una columna de 76 px + nombre H4 + una frase. Frases de la maqueta
 * `home.html`. No son enlaces: las landings con árbol móvil propio no existen
 * todavía y el enlazado real vive en los bloques «Por servicio» / «Por zona».
 */
const SERVICES: { need: ServiceNeed; text: string }[] = [
  { need: "app", text: "Tu propia app para iPhone y Android, publicada en App Store y Google Play." },
  { need: "software", text: "Un programa hecho a la medida de cómo trabajáis, para dejar atrás el Excel y el papel." },
  { need: "integration", text: "Que tu web, tu ERP y el resto de herramientas se pasen los datos solos." },
  { need: "web", text: "Que se entiendan a la primera, se vean bien en el móvil y puedas actualizarlas tú." },
];

export function ServiceRows() {
  return (
    <ul className="grid gap-px border-b-2 border-ink bg-ink" data-testid="m-service-rows">
      {SERVICES.map(({ need, text }) => {
        const service = SERVICE_STYLE[need];
        const ink = service.tone.includes("bg-ink");
        return (
          <li key={need} className={`grid min-h-[116px] grid-cols-[76px_1fr] ${service.tone}`}>
            <span className={`flex justify-center border-r pt-5 ${ink ? "border-line-dark" : "border-current"}`}>
              <Shape kind={service.shape} />
            </span>
            <span className="grid min-w-0 content-start gap-2 px-4 py-[18px]">
              <span className="font-display text-h4 uppercase">{service.name}</span>
              <span className="text-base leading-[1.4]">{text}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
