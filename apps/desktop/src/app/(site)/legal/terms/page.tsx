import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocHeader } from "@/components/legal/LegalDocHeader";
import {
  BUSINESS,
  LEGAL_ENTITY,
  OG_IMAGE,
  REGISTERED_ADDRESS_LINE,
  absoluteUrl,
} from "@/lib/seo";

/**
 * Términos y condiciones de contratación.
 *
 * Incluye una sección específica de contratación con el sector público: es el
 * motivo por el que estas páginas existen — que un órgano de contratación
 * pueda verificar quién contrata realmente bajo la marca Action.
 */

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Términos y condiciones de contratación de los servicios prestados bajo la marca Action Development por Alcasi Systems, S.L. (CIF B72910664).",
  alternates: { canonical: "/legal/terms" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/legal/terms"),
    siteName: BUSINESS.name,
    title: "Términos y condiciones — Action",
    description:
      "Condiciones de contratación de servicios de desarrollo con Alcasi Systems, S.L., titular de la marca Action Development.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": absoluteUrl("/legal/terms"),
      url: absoluteUrl("/legal/terms"),
      name: "Términos y condiciones — Action",
      inLanguage: "es",
      isPartOf: { "@id": absoluteUrl("#website") },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "Términos y condiciones",
          item: absoluteUrl("/legal/terms"),
        },
      ],
    },
  ],
};

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LegalDocHeader
        eyebrow="Legal · Contratación"
        title="Términos y condiciones"
        lede={`Condiciones bajo las que ${LEGAL_ENTITY.name} presta servicios de desarrollo y diseño digital a través de la marca ${BUSINESS.alternateName}.`}
      />

      <div className="legal-prose">
        <h2>1. Quién contrata</h2>
        <p>
          La parte prestadora del servicio es{" "}
          <strong>{LEGAL_ENTITY.name}</strong>, con CIF{" "}
          <strong>{LEGAL_ENTITY.taxId}</strong> y domicilio social en{" "}
          {REGISTERED_ADDRESS_LINE}, inscrita en el Registro Mercantil de
          Pontevedra.
        </p>
        <p>
          {BUSINESS.alternateName} es la marca comercial bajo la que se presta el
          servicio.{" "}
          <strong>
            Los contratos, propuestas y facturas se emiten siempre a nombre de{" "}
            {LEGAL_ENTITY.name} y con su CIF
          </strong>
          , con independencia de que la comunicación comercial se realice bajo la
          marca. Datos identificativos completos en el{" "}
          <Link href="/legal/aviso-legal">aviso legal</Link>.
        </p>

        <h2>2. Objeto</h2>
        <p>
          Prestación de servicios profesionales de desarrollo de aplicaciones
          móviles, desarrollo web a medida, diseño de interfaces, experiencias
          interactivas y mantenimiento evolutivo, según el alcance definido en
          cada propuesta aceptada.
        </p>

        <h2>3. Propuesta, aceptación y alcance</h2>
        <ul>
          <li>
            La información de esta web tiene carácter informativo y{" "}
            <strong>no constituye oferta vinculante</strong>.
          </li>
          <li>
            Cada encargo se formaliza mediante propuesta económica escrita, con
            alcance, entregables, calendario, precio y condiciones de pago.
          </li>
          <li>
            La propuesta tiene una validez de <strong>30 días naturales</strong>{" "}
            desde su emisión, salvo que en ella se indique otro plazo.
          </li>
          <li>
            La aceptación expresa de la propuesta, o el pago del primer hito,
            perfecciona el contrato y supone la aceptación de estas condiciones
            en lo no previsto expresamente en aquella.
          </li>
          <li>
            Todo trabajo no recogido en el alcance aceptado es una{" "}
            <strong>modificación de alcance</strong> y se presupuesta aparte
            antes de ejecutarse.
          </li>
        </ul>

        <h2>4. Precios, facturación y pagos</h2>
        <ul>
          <li>
            Los precios se expresan en euros y <strong>no incluyen IVA</strong>{" "}
            ni otros impuestos aplicables, que se repercuten en factura al tipo
            vigente.
          </li>
          <li>
            Salvo pacto distinto en la propuesta, el pago se estructura por
            hitos, con un primer pago a la aceptación y el resto según el
            calendario acordado.
          </li>
          <li>
            El plazo de pago de cada factura es de <strong>30 días</strong> desde
            su emisión, salvo pacto distinto y dentro de los límites de la Ley
            3/2004 de lucha contra la morosidad.
          </li>
          <li>
            El retraso en el pago devenga los intereses de demora legalmente
            previstos y faculta a suspender la prestación previo aviso, sin
            perjuicio del derecho a resolver el contrato.
          </li>
          <li>
            Los costes de licencias, servicios de terceros, dominios,
            alojamiento, APIs de pago y assets adquiridos para el proyecto son
            por cuenta del cliente, salvo que la propuesta diga otra cosa.
          </li>
        </ul>

        <h2>5. Obligaciones del cliente</h2>
        <ul>
          <li>
            Facilitar en plazo los contenidos, accesos, credenciales y
            validaciones necesarios. Los retrasos por esta causa desplazan el
            calendario en la misma medida.
          </li>
          <li>
            Garantizar que dispone de los derechos sobre los materiales que
            aporta (textos, imágenes, marcas, datos), y responder frente a
            reclamaciones de terceros derivadas de ellos.
          </li>
          <li>
            Designar un interlocutor con capacidad de decisión para validar
            entregables.
          </li>
        </ul>

        <h2>6. Entrega, revisiones y aceptación</h2>
        <p>
          Cada entregable se somete a validación del cliente. Salvo que la
          propuesta indique otra cosa, se incluyen{" "}
          <strong>dos rondas de revisión</strong> por entregable; las adicionales
          se facturan aparte.
        </p>
        <p>
          Si el cliente no comunica objeciones en el plazo de{" "}
          <strong>10 días hábiles</strong> desde la entrega, el entregable se
          considera aceptado.
        </p>

        <h2>7. Propiedad intelectual</h2>
        <ul>
          <li>
            Abonado íntegramente el precio, el cliente adquiere los derechos de
            explotación sobre el código y los diseños desarrollados
            específicamente para el proyecto, en los términos pactados en la
            propuesta.
          </li>
          <li>
            Quedan excluidos de esa cesión el{" "}
            <strong>know-how, las librerías, componentes y herramientas
            preexistentes o de uso general</strong>, sobre los que el cliente
            recibe una licencia de uso no exclusiva, perpetua e intransferible
            para el proyecto.
          </li>
          <li>
            Los componentes de terceros y software libre se rigen por sus
            respectivas licencias.
          </li>
          <li>
            Hasta el pago íntegro, la cesión de derechos queda en suspenso y el
            uso del entregable no está autorizado.
          </li>
        </ul>

        <h2>8. Portfolio y referencias</h2>
        <p>
          Salvo pacto de confidencialidad en contrario, {LEGAL_ENTITY.name} puede
          mencionar al cliente como referencia y mostrar el trabajo realizado en
          su portfolio. El cliente puede oponerse en cualquier momento
          comunicándolo a{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
        </p>

        <h2>9. Garantía y soporte</h2>
        <p>
          Se garantiza la corrección sin coste de los defectos de programación
          imputables al desarrollo durante{" "}
          <strong>30 días naturales</strong> desde la entrega final. Quedan
          fuera de garantía: cambios de alcance, fallos derivados de
          modificaciones realizadas por terceros, cambios en servicios externos o
          en sistemas operativos y navegadores posteriores a la entrega.
        </p>

        <h2>10. Responsabilidad</h2>
        <p>
          La responsabilidad de {LEGAL_ENTITY.name} por los daños derivados del
          contrato se limita, salvo dolo o negligencia grave, al importe total
          efectivamente abonado por el cliente por el encargo del que traiga
          causa la reclamación. No se responde del lucro cesante ni de daños
          indirectos.
        </p>

        <h2>11. Confidencialidad y protección de datos</h2>
        <p>
          Ambas partes se obligan a mantener la confidencialidad de la
          información a la que accedan con ocasión del contrato. Cuando la
          prestación implique acceso a datos personales responsabilidad del
          cliente, se suscribirá el contrato de encargo del tratamiento del
          artículo 28 del RGPD. El tratamiento de datos por parte de{" "}
          {LEGAL_ENTITY.name} se describe en la{" "}
          <Link href="/legal/privacy">política de privacidad</Link>.
        </p>

        <h2>12. Contratación con el sector público</h2>
        <p>
          Cuando el cliente sea una entidad del sector público, la relación se
          rige por la <strong>Ley 9/2017 de Contratos del Sector Público</strong>{" "}
          y por los pliegos del procedimiento correspondiente, que prevalecen
          sobre estas condiciones generales en lo que resulten incompatibles.
        </p>
        <p>
          A efectos de licitación y de verificación de la personalidad y
          capacidad de obrar, el licitador y adjudicatario es{" "}
          <strong>
            {LEGAL_ENTITY.name}, CIF {LEGAL_ENTITY.taxId}
          </strong>
          , no la marca comercial. Los datos registrales completos están en el{" "}
          <Link href="/legal/aviso-legal">aviso legal</Link>, y la documentación
          acreditativa (escritura de constitución, poderes, certificados de estar
          al corriente con AEAT y Seguridad Social, alta en ROLECE) se facilita a
          requerimiento del órgano de contratación en{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
        </p>

        <h2>13. Resolución</h2>
        <p>
          Cualquiera de las partes puede resolver el contrato por incumplimiento
          grave de la otra, previo requerimiento escrito con 15 días para
          subsanar. En caso de resolución, el cliente abonará el trabajo
          efectivamente realizado hasta la fecha.
        </p>

        <h2>14. Legislación y jurisdicción</h2>
        <p>
          Estas condiciones se rigen por la legislación española. Las partes se
          someten a los Juzgados y Tribunales de Pontevedra, salvo fuero
          imperativo distinto aplicable a consumidores o a la contratación
          pública.
        </p>
      </div>
    </>
  );
}
