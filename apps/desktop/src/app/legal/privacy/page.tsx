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
 * Política de privacidad (RGPD + LOPDGDD).
 *
 * Describe el tratamiento REAL del sitio: el formulario de contacto no envía
 * datos a ningún servidor propio — compone un mensaje y abre WhatsApp. Hay
 * analítica (Google Tag Manager, solo tras consentimiento — ver
 * `/legal/cookies`) pero no base de datos propia de analítica. Mantener este
 * documento alineado con `components/sections/Contact.tsx` y
 * `components/analytics/GoogleTagManager.tsx` si eso cambia.
 */

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Política de privacidad de actiondev.es. Responsable: Alcasi Systems, S.L. (CIF B72910664), titular de la marca Action Development. Tratamiento de datos conforme al RGPD.",
  alternates: { canonical: "/legal/privacy" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/legal/privacy"),
    siteName: BUSINESS.name,
    title: "Política de privacidad — Action",
    description:
      "Qué datos personales trata Alcasi Systems, S.L. a través de actiondev.es, con qué base legal y cómo ejercer tus derechos.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": absoluteUrl("/legal/privacy"),
      url: absoluteUrl("/legal/privacy"),
      name: "Política de privacidad — Action",
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
          name: "Política de privacidad",
          item: absoluteUrl("/legal/privacy"),
        },
      ],
    },
  ],
};

export default function PrivacyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LegalDocHeader
        eyebrow="Legal · RGPD"
        title="Política de privacidad"
        lede={`Responsable del tratamiento: ${LEGAL_ENTITY.name}, titular de la marca ${BUSINESS.alternateName}. Recogemos lo mínimo para responderte; la analítica del sitio solo se activa si la aceptas.`}
      />

      <div className="legal-prose">
        <h2>1. Responsable del tratamiento</h2>
        <ul>
          <li>
            <strong>Responsable:</strong> {LEGAL_ENTITY.name} (marca comercial{" "}
            {BUSINESS.alternateName}).
          </li>
          <li>
            <strong>CIF:</strong> {LEGAL_ENTITY.taxId}
          </li>
          <li>
            <strong>Domicilio social:</strong> {REGISTERED_ADDRESS_LINE}, España.
          </li>
          <li>
            <strong>Oficina:</strong> {BUSINESS.address.street},{" "}
            {BUSINESS.address.postalCode} {BUSINESS.address.locality} (
            {BUSINESS.address.region}), España.
          </li>
          <li>
            <strong>Correo de contacto en materia de protección de datos:</strong>{" "}
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
          </li>
        </ul>
        <p>
          Los datos identificativos completos, incluidos los registrales, están
          en el <Link href="/legal/aviso-legal">aviso legal</Link>.
        </p>
        <p>
          No se ha designado Delegado de Protección de Datos (DPD) por no
          concurrir ninguno de los supuestos del artículo 37 del RGPD. Las
          consultas se atienden en la dirección de correo indicada.
        </p>

        <h2>2. Qué datos tratamos y de dónde salen</h2>
        <h3>2.1. Formulario de contacto</h3>
        <p>
          El formulario de la web recoge: <strong>nombre</strong>,{" "}
          <strong>correo electrónico</strong>, y opcionalmente{" "}
          <strong>teléfono</strong>, <strong>sitio web</strong> y la{" "}
          <strong>descripción del proyecto</strong> que escribas.
        </p>
        <p>
          <strong>
            Importante: el formulario no envía esos datos a ningún servidor
            nuestro.
          </strong>{" "}
          Al enviarlo, el navegador compone un mensaje con lo que has escrito y
          abre WhatsApp para que seas tú quien lo envíe. Hasta que pulsas enviar
          en WhatsApp, los datos no salen de tu dispositivo. No existe base de
          datos, ni almacenamiento en servidor, ni registro de envíos por nuestra
          parte.
        </p>
        <p>
          El formulario incluye un campo oculto anti-spam (honeypot) que no es
          visible ni rellenable por una persona; su único uso es descartar envíos
          automatizados.
        </p>

        <h3>2.2. Comunicaciones directas</h3>
        <p>
          Si nos escribes por correo electrónico, WhatsApp, teléfono o redes
          sociales, tratamos los datos que tú nos facilites en esa comunicación
          (identificativos, de contacto y los relativos al proyecto).
        </p>

        <h3>2.3. Datos de clientes</h3>
        <p>
          En la prestación del servicio tratamos datos identificativos,
          fiscales, de contacto y de facturación de clientes y de sus personas
          de contacto.
        </p>

        <h3>2.4. Datos técnicos de navegación y analítica</h3>
        <p>
          El proveedor de alojamiento registra datos técnicos de acceso
          (dirección IP, agente de usuario, fecha y hora) en sus logs de
          servidor, por seguridad y estabilidad del servicio.
        </p>
        <p>
          Además, si aceptas el banner de cookies, tratamos datos de uso del
          sitio (páginas visitadas, procedencia, dispositivo, ubicación
          aproximada) a través de <strong>Google Tag Manager</strong> y las
          herramientas de analítica que cargue (típicamente Google Analytics),
          de forma agregada y estadística — no identificamos a personas
          individuales a partir de esos datos. Ver la{" "}
          <Link href="/legal/cookies">política de cookies</Link> para el
          detalle de cookies y cómo retirar el consentimiento.
        </p>

        <h2>3. Finalidades y base legal</h2>
        <ul>
          <li>
            <strong>Atender tu consulta y elaborar una propuesta</strong> — base
            legal: aplicación de medidas precontractuales a petición del
            interesado (art. 6.1.b RGPD).
          </li>
          <li>
            <strong>Prestar el servicio contratado, facturar y dar soporte</strong>{" "}
            — base legal: ejecución del contrato (art. 6.1.b RGPD).
          </li>
          <li>
            <strong>Cumplir obligaciones fiscales, contables y mercantiles</strong>{" "}
            — base legal: obligación legal (art. 6.1.c RGPD).
          </li>
          <li>
            <strong>
              Garantizar la seguridad del sitio y prevenir envíos fraudulentos
            </strong>{" "}
            — base legal: interés legítimo (art. 6.1.f RGPD).
          </li>
          <li>
            <strong>Publicar un proyecto en el portfolio</strong> — base legal:
            consentimiento expreso del cliente (art. 6.1.a RGPD), revocable en
            cualquier momento.
          </li>
          <li>
            <strong>Analítica de uso del sitio</strong> (Google Tag Manager /
            Google Analytics) — base legal: consentimiento expreso mediante el
            banner de cookies (art. 6.1.a RGPD), revocable en cualquier
            momento desde «Preferencias de cookies» en el pie de página.
          </li>
        </ul>
        <p>
          No se realizan decisiones automatizadas ni elaboración de perfiles. No
          se envía publicidad comercial sin consentimiento previo.
        </p>

        <h2>4. Plazos de conservación</h2>
        <ul>
          <li>
            <strong>Consultas que no derivan en contrato:</strong> hasta 12 meses
            desde el último contacto.
          </li>
          <li>
            <strong>Datos contractuales y de facturación:</strong> durante la
            relación y, después, el plazo de prescripción de las obligaciones
            legales — 6 años (art. 30 Código de Comercio) y 4 años a efectos
            fiscales (Ley General Tributaria).
          </li>
          <li>
            <strong>Logs técnicos del proveedor de alojamiento:</strong> según la
            política de retención del proveedor.
          </li>
        </ul>

        <h2>5. Destinatarios y encargados del tratamiento</h2>
        <p>
          No se ceden datos a terceros salvo obligación legal. Sí intervienen
          prestadores de servicio que actúan como encargados del tratamiento o
          responsables independientes:
        </p>
        <ul>
          <li>
            <strong>Proveedor de alojamiento web</strong> — servido desde
            infraestructura en la Unión Europea siempre que la plataforma lo
            permite.
          </li>
          <li>
            <strong>WhatsApp (Meta Platforms Ireland Ltd.)</strong> — si eliges
            contactar por esa vía, el mensaje se trata conforme a las condiciones
            y la política de privacidad de Meta, ajenas a nuestro control.
          </li>
          <li>
            <strong>Proveedor de correo electrónico</strong> — para gestionar la
            correspondencia.
          </li>
          <li>
            <strong>Asesoría fiscal y contable</strong> — para el cumplimiento de
            obligaciones legales.
          </li>
          <li>
            <strong>Google Fonts</strong> — las tipografías se sirven
            autoalojadas desde nuestro propio dominio mediante{" "}
            <code>next/font</code>, por lo que{" "}
            <strong>no se realizan peticiones del navegador a Google</strong> al
            cargar la web.
          </li>
          <li>
            <strong>Google Ireland Limited</strong> (Google Tag Manager /
            Google Analytics) — solo si aceptas el banner de cookies. Trata
            datos de uso del sitio conforme a su propia política de
            privacidad; puede transferir datos a EE. UU. amparado en las
            cláusulas contractuales tipo de la Comisión Europea. Ver la{" "}
            <Link href="/legal/cookies">política de cookies</Link>.
          </li>
        </ul>
        <p>
          No se realizan transferencias internacionales de datos fuera del
          Espacio Económico Europeo por iniciativa nuestra. Cuando un prestador
          las realice, se ampararán en decisiones de adecuación o en cláusulas
          contractuales tipo de la Comisión Europea.
        </p>

        <h2>6. Tus derechos</h2>
        <p>
          Puedes ejercer los derechos de <strong>acceso</strong>,{" "}
          <strong>rectificación</strong>, <strong>supresión</strong>,{" "}
          <strong>oposición</strong>, <strong>limitación del tratamiento</strong>,{" "}
          <strong>portabilidad</strong> y a{" "}
          <strong>
            no ser objeto de decisiones individuales automatizadas
          </strong>
          , así como retirar el consentimiento prestado en cualquier momento.
        </p>
        <p>
          Escribe a <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>{" "}
          indicando el derecho que ejerces y acompañando copia de un documento
          que acredite tu identidad. Responderemos en el plazo máximo de un mes.
        </p>
        <p>
          Si consideras que el tratamiento no se ajusta a la normativa, puedes
          reclamar ante la <strong>Agencia Española de Protección de Datos</strong>{" "}
          (
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.aepd.es
          </a>
          ), C/ Jorge Juan 6, 28001 Madrid.
        </p>

        <h2>7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas apropiadas al riesgo:
          cifrado en tránsito (HTTPS/TLS) en todo el sitio, acceso a la
          información limitado al personal necesario, y minimización — no
          recogemos datos que no necesitemos para responderte o prestar el
          servicio.
        </p>

        <h2>8. Cambios en esta política</h2>
        <p>
          Esta política puede actualizarse para adaptarse a cambios legales o en
          el servicio. La fecha de última revisión figura al inicio del
          documento.
        </p>
      </div>
    </>
  );
}
