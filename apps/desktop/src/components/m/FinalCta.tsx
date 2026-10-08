import { BUSINESS } from "@actiondev/shared";
import { whatsappHref } from "@/lib/leads/whatsapp";
import { Button } from "./Button";
import { PROJECT_CTA_HREF, PROJECT_CTA_LABEL } from "./nav";

/**
 * CTA final (DESIGN.md §7, `.cta-final`): bloque lima con la pregunta (H2 a
 * tamaño de H1), entradilla, «Contar mi proyecto» en tinta y WhatsApp de
 * contorno. Con `email`, debajo el correo como texto enlazado. Su `id` sirve
 * de `formId` a `StickyCta`: con el bloque a la vista la barra se esconde (no
 * salen dos «Contar mi proyecto» seguidos ni dos lima en la misma pantalla).
 * La usan la home y el blog.
 */
export function FinalCta({
  id,
  title,
  text,
  formHref = PROJECT_CTA_HREF,
  whatsappText,
  email = false,
  testIdPrefix = "m-final-cta",
  "data-testid": testId,
}: {
  id: string;
  title: string;
  text: string;
  formHref?: string;
  whatsappText: string;
  email?: boolean;
  /** Prefijo de los `data-testid` de los botones (`-form`, `-whatsapp`, `-email`). */
  testIdPrefix?: string;
  "data-testid"?: string;
}) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      data-testid={testId}
      className="grid gap-[18px] border-b-2 border-ink bg-lime px-4 pt-10 pb-7 text-ink"
    >
      <h2 id={titleId} className="font-display text-h1 uppercase">
        {title}
      </h2>
      <p className="max-w-[34ch] text-lead">{text}</p>
      <div className="mt-1.5 grid gap-2.5">
        <Button href={formHref} variant="ink" data-testid={`${testIdPrefix}-form`}>
          {PROJECT_CTA_LABEL}
        </Button>
        <Button href={whatsappHref(whatsappText)} variant="line" icon="whatsapp" data-testid={`${testIdPrefix}-whatsapp`}>
          Escribir por WhatsApp
        </Button>
      </div>
      {email && (
        <p className="text-[15px] leading-[1.4]">
          O escríbenos a{" "}
          <a
            href={`mailto:${BUSINESS.email}`}
            data-testid={`${testIdPrefix}-email`}
            className="inline-flex min-h-11 items-center font-semibold underline decoration-2 underline-offset-4 active:bg-ink active:text-lime"
          >
            {BUSINESS.email}
          </a>
        </p>
      )}
    </section>
  );
}
