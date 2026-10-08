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
 * Describe el tratamiento REAL del sitio: WhatsApp y email abren la app del
 * visitante sin formulario; lo que se guarda en un servidor nuestro son las
 * solicitudes de `/api/lead` (formulario de proyecto de `/hablemos/*`, de las
 * landings SEO y de `/contact` en la web móvil, y "llámame tú" de `/contact`) en Firestore `leads` (base de datos en `nam5` =
 * EE. UU.: de ahí la transferencia internacional del apartado 5), con su
 * atribución publicitaria (UTM, gclid, fbclid). Aviso interno por SMTP de
 * one.com y, si hay variables de entorno, Telegram. Copia en el CRM interno
 * (ActionERP, Supabase UE) vía `LEAD_ERP_URL`. Hay analítica y medición
 * de campañas (Google Tag Manager → GA4, Google Ads, Meta Pixel, solo tras
 * consentimiento — ver `/legal/cookies`) pero no base de datos propia de
 * analítica. Mantener este documento alineado con `packages/shared/src/leads.ts`,
 * `app/api/lead`, `components/contact/*` y `components/analytics/GoogleTagManager.tsx`
 * si eso cambia.
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
        lede={`Responsable del tratamiento: ${LEGAL_ENTITY.name}, titular de la marca ${BUSINESS.alternateName}. Recogemos lo mínimo para responderte; la analítica y la medición de campañas publicitarias solo se activan si las aceptas.`}
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
        <h3>2.1. Formulario de proyecto y solicitud de llamada</h3>
        <p>
          Puedes contarnos qué necesitas mediante un formulario de proyecto.
          Está en las páginas de contacto de proyecto (
          <code>/hablemos/*</code>), en las páginas de cada servicio (por
          ejemplo, <code>/desarrollo-de-aplicaciones-vigo</code>) y, en la
          versión para móvil de la web, en la página de contacto (
          <code>/contact</code>). Recoge tu{" "}
          <strong>nombre</strong>, tu <strong>teléfono</strong> y tu{" "}
          <strong>correo electrónico</strong>; opcionalmente, tu{" "}
          <strong>empresa</strong> y un <strong>mensaje</strong>; y, para que
          podamos preparar una respuesta útil, el{" "}
          <strong>tipo de necesidad</strong>, la <strong>etapa</strong> del
          proyecto, un <strong>presupuesto orientativo</strong> y tu{" "}
          <strong>canal preferido</strong> de contacto (llamada, WhatsApp o
          correo). Junto a la solicitud se guardan la fecha de envío, la
          decisión sobre cookies que tenías en ese momento y la versión de
          esta política vigente.
        </p>
        <p>
          En la página de contacto (<code>/contact</code>) puedes además
          pedirnos que te llamemos («¿Prefieres que te contactemos?»). Esa
          solicitud recoge tu <strong>teléfono</strong> y, si quieres, una{" "}
          <strong>nota</strong> sobre lo que necesitas.
        </p>
        <p>
          Ambas solicitudes se envían a un servicio propio del sitio, que las
          guarda en nuestra base de datos (<strong>Google Cloud Firestore</strong>
          ), solo accesible para el equipo de Action. Al recibirla, el sistema
          nos envía un aviso interno con los datos de la solicitud por correo
          electrónico (servidor de correo de one.com) y, si está activado, por
          un mensaje interno de Telegram, y copia la solicitud en nuestro
          sistema interno de gestión comercial (CRM propio, alojado en la Unión
          Europea), donde el equipo hace el seguimiento. No usamos estos datos
          para enviarte publicidad ni boletines.
        </p>
        <p>
          Los demás canales de la web (WhatsApp y correo electrónico) no pasan
          por ningún formulario: abren tu aplicación de mensajería o de correo,
          y eres tú quien envía el mensaje (ver el apartado 2.3).
        </p>

        <h3>2.2. Atribución publicitaria</h3>
        <p>
          Si llegas a una página de la web desde un anuncio (por ejemplo, de
          Google Ads o de Meta), la dirección web puede incluir parámetros de
          campaña (<code>utm_source</code>, <code>utm_medium</code>,{" "}
          <code>utm_campaign</code>, <code>utm_term</code>,{" "}
          <code>utm_content</code>) e identificadores de clic (
          <code>gclid</code>, <code>gbraid</code>, <code>wbraid</code> de
          Google; <code>fbclid</code> de Meta). Al enviar el formulario, estos
          datos y la ruta de la página donde lo enviaste se guardan con tu
          solicitud para saber qué campaña la generó. Se leen de la dirección
          web en el momento del envío; no se guardan en tu navegador.
        </p>
        <p>
          Los identificadores de clic de Google pueden comunicarse a Google
          Ads, de forma manual y solo para las solicitudes que acaben siendo un
          contacto cualificado o un cliente, como «conversión offline», para
          medir y mejorar la eficacia de nuestras propias campañas. Esa
          comunicación no incluye tu nombre, teléfono ni correo.
        </p>
        <p>
          Además, <strong>solo si has aceptado el banner de cookies</strong>,
          al enviar el formulario el sitio comunica el hecho de la solicitud
          (sin el contenido de tu mensaje) a Google Analytics, a Google Ads y a
          Meta Pixel como «conversión», para medir las campañas. En el caso de
          Google Ads, y con ese mismo consentimiento, se envían también tu
          correo electrónico y tu teléfono{" "}
          <strong>cifrados con un resumen criptográfico (hash SHA-256)</strong>{" "}
          para poder asociar la solicitud a tu interacción con el anuncio
          («conversiones mejoradas»). Si rechazas las cookies, nada de esto se
          envía; la solicitud se guarda igualmente en nuestra base de datos.
          Ver la <Link href="/legal/cookies">política de cookies</Link>.
        </p>

        <h3>2.3. Comunicaciones directas</h3>
        <p>
          Si nos escribes por correo electrónico, WhatsApp, teléfono o redes
          sociales, tratamos los datos que tú nos facilites en esa comunicación
          (identificativos, de contacto y los relativos al proyecto).
        </p>

        <h3>2.4. Datos de clientes</h3>
        <p>
          En la prestación del servicio tratamos datos identificativos,
          fiscales, de contacto y de facturación de clientes y de sus personas
          de contacto.
        </p>

        <h3>2.5. Datos técnicos de navegación, analítica y medición de campañas</h3>
        <p>
          El proveedor de alojamiento registra datos técnicos de acceso
          (dirección IP, agente de usuario, fecha y hora) en sus logs de
          servidor, por seguridad y estabilidad del servicio.
        </p>
        <p>
          Además, si aceptas el banner de cookies, tratamos datos de uso del
          sitio (páginas visitadas, procedencia, dispositivo, ubicación
          aproximada) a través de <strong>Google Tag Manager</strong> y las
          herramientas que cargue: <strong>Google Analytics 4</strong>{" "}
          (estadística de uso), <strong>Google Ads</strong> y{" "}
          <strong>Meta Pixel</strong> (medición de campañas publicitarias: qué
          anuncios llevan a una visita o a una solicitud). La analítica es
          agregada y estadística; no identificamos a personas individuales a
          partir de ella. Ver la{" "}
          <Link href="/legal/cookies">política de cookies</Link> para el
          detalle de cookies y cómo retirar el consentimiento.
        </p>

        <h2>3. Finalidades y base legal</h2>
        <ul>
          <li>
            <strong>
              Atender tu consulta, devolverte la llamada que nos pidas,
              valorar tu proyecto (formulario de proyecto de{" "}
              <code>/hablemos/*</code>, de las páginas de servicio y de{" "}
              <code>/contact</code> en la versión para móvil) y elaborar una
              propuesta
            </strong>{" "}
            — base
            legal: aplicación de medidas precontractuales a petición del
            interesado (art. 6.1.b RGPD). Los datos del formulario son
            necesarios para poder responderte; sin ellos no podemos atender la
            solicitud. No hay casilla de marketing porque no te enviamos
            comunicaciones comerciales por este motivo.
          </li>
          <li>
            <strong>
              Atribución publicitaria: saber qué campaña generó cada solicitud
              y, en su caso, comunicar la conversión a Google Ads
            </strong>{" "}
            — base legal: interés legítimo (art. 6.1.f RGPD) en medir la
            eficacia de nuestra propia publicidad, con un impacto mínimo sobre
            ti (solo identificadores de campaña, sin tu nombre ni contacto en
            la comunicación offline). Puedes oponerte en cualquier momento
            (apartado 6).
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
            <strong>
              Analítica de uso del sitio y medición de campañas publicitarias
            </strong>{" "}
            (Google Tag Manager, Google Analytics, Google Ads, Meta Pixel,
            incluido el envío cifrado de tu correo y teléfono a Google Ads
            tras enviar el formulario) — base legal: consentimiento expreso
            mediante el banner de cookies (art. 6.1.a RGPD), revocable en
            cualquier momento desde «Preferencias de cookies», en el pie de
            página, o desde «Cookies», abajo a la izquierda en las pantallas
            3D.
          </li>
        </ul>
        <p>
          No se realizan decisiones automatizadas ni elaboración de perfiles sobre
          ti con efectos jurídicos. No se envía publicidad comercial sin
          consentimiento previo.
        </p>

        <h2>4. Plazos de conservación</h2>
        <ul>
          <li>
            <strong>Solicitudes del formulario y del «llámame tú»</strong> (datos
            de contacto, datos del proyecto y atribución publicitaria):
            mientras dure la relación precontractual y, si no llega a
            contratarse, un máximo de 12 meses desde el último contacto; pasado
            ese plazo se suprimen o se anonimizan. Si se contrata, pasan a los
            datos contractuales.
          </li>
          <li>
            <strong>Otras consultas que no derivan en contrato:</strong> hasta
            12 meses desde el último contacto.
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
            <strong>Google Cloud (Google Firebase / Cloud Firestore)</strong> —
            encargado del tratamiento que almacena las solicitudes del
            apartado 2.1 (con su atribución publicitaria), en servidores de{" "}
            <strong>Estados Unidos</strong>.
          </li>
          <li>
            <strong>Vercel Inc.</strong> — alojamiento web y ejecución del
            servicio que recibe las solicitudes del formulario; encargado del
            tratamiento. Puede tratar datos en Estados Unidos.
          </li>
          <li>
            <strong>Supabase Inc.</strong> — base de datos de nuestro sistema
            interno de gestión comercial (CRM), al que se copian las solicitudes
            del apartado 2.1 para su seguimiento; encargado del tratamiento, con
            servidores en la Unión Europea (París). La aplicación se ejecuta en
            Vercel.
          </li>
          <li>
            <strong>one.com</strong> — proveedor de correo electrónico, con el
            que gestionamos la correspondencia y los avisos internos de nuevas
            solicitudes; infraestructura en la Unión Europea.
          </li>
          <li>
            <strong>Telegram</strong> — solo si está activado, para un mensaje
            de aviso interno de cada nueva solicitud con los datos que has
            enviado. Se trata conforme a las condiciones de Telegram y puede
            implicar tratamiento fuera del Espacio Económico Europeo.
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
            <strong>Google Ireland Limited</strong> (Google Tag Manager, Google
            Analytics y Google Ads) — solo si aceptas el banner de cookies (y,
            para las conversiones offline, con el identificador de clic que
            llegó en la dirección web de tu anuncio). Trata datos conforme a su
            propia política de privacidad; puede transferir datos a EE. UU.
            amparado en el Marco de Privacidad de Datos UE-EE. UU. y en las
            cláusulas contractuales tipo de la Comisión Europea. Ver la{" "}
            <Link href="/legal/cookies">política de cookies</Link>.
          </li>
          <li>
            <strong>Meta Platforms Ireland Ltd.</strong> (Meta Pixel) — solo si
            aceptas el banner de cookies. Recibe datos de navegación y el
            hecho de que se ha enviado una solicitud, para medir campañas; puede
            transferir datos a EE. UU. conforme a sus condiciones y a las
            cláusulas contractuales tipo.
          </li>
        </ul>
        <p>
          <strong>Transferencias internacionales:</strong> las solicitudes
          del apartado 2.1 se almacenan en Estados Unidos (ubicación{" "}
          <code>nam5</code>), en la infraestructura de Google Firebase. La transferencia se ampara en la decisión
          de adecuación del Marco de Privacidad de Datos UE-EE. UU. (Comisión
          Europea, 10 de julio de 2023), al que está adherida Google LLC, y en
          las cláusulas contractuales tipo de sus condiciones de tratamiento de
          datos. Lo mismo rige para Vercel en sus tratamientos en EE. UU. Cuando otro prestador realice transferencias fuera del Espacio
          Económico Europeo, se ampararán igualmente en decisiones de adecuación
          o en cláusulas contractuales tipo de la Comisión Europea.
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
          Tienes derecho a <strong>oponerte</strong> en particular al
          tratamiento basado en nuestro interés legítimo, como la atribución
          publicitaria del apartado 2.2: basta con que nos lo indiques y
          dejaremos de usar tus identificadores de clic para medir y comunicar
          conversiones, salvo que acreditemos motivos legítimos imperiosos.
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
