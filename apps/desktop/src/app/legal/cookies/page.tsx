import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocHeader } from "@/components/legal/LegalDocHeader";
import { BUSINESS, LEGAL_ENTITY, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * Política de cookies.
 *
 * Este sitio NO instala cookies. Usa dos claves de almacenamiento local
 * (`locale` en localStorage, `action-loaded` en sessionStorage), ambas
 * técnicas y exentas de consentimiento. Si algún día se añade analítica,
 * este documento y un banner de consentimiento pasan a ser obligatorios.
 *
 * Fuentes en código: `lib/i18n/index.tsx` y `app/page.tsx`.
 */

export const metadata: Metadata = {
  title: "Política de cookies",
  description:
    "Política de cookies de actiondev.es. Este sitio no instala cookies de seguimiento ni usa herramientas de analítica. Titular: Alcasi Systems, S.L. (CIF B72910664).",
  alternates: { canonical: "/legal/cookies" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/legal/cookies"),
    siteName: BUSINESS.name,
    title: "Política de cookies — Action",
    description:
      "actiondev.es no instala cookies de seguimiento ni analítica. Qué almacenamiento técnico usa y por qué.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": absoluteUrl("/legal/cookies"),
      url: absoluteUrl("/legal/cookies"),
      name: "Política de cookies — Action",
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
          name: "Política de cookies",
          item: absoluteUrl("/legal/cookies"),
        },
      ],
    },
  ],
};

export default function CookiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LegalDocHeader
        eyebrow="Legal · LSSI art. 22.2"
        title="Política de cookies"
        lede="Este sitio no instala cookies. Sin analítica, sin píxeles, sin publicidad. Solo dos claves de almacenamiento local estrictamente técnicas — por eso no verás ningún banner de consentimiento."
      />

      <div className="legal-prose">
        <h2>1. Titular</h2>
        <p>
          {LEGAL_ENTITY.name} (CIF {LEGAL_ENTITY.taxId}), titular de la marca{" "}
          {BUSINESS.alternateName} y del sitio actiondev.es. Datos completos en
          el <Link href="/legal/aviso-legal">aviso legal</Link>.
        </p>

        <h2>2. Qué es una cookie</h2>
        <p>
          Una cookie es un pequeño archivo que un sitio web almacena en el
          navegador del usuario. El artículo 22.2 de la LSSI-CE exige el
          consentimiento informado del usuario para instalar cookies, salvo las
          estrictamente necesarias para prestar un servicio expresamente
          solicitado.
        </p>

        <h2>3. Cookies que usa este sitio</h2>
        <p>
          <strong>Ninguna.</strong> actiondev.es no instala cookies propias ni de
          terceros. En concreto, y a fecha de la última revisión de este
          documento, el sitio <strong>no</strong> utiliza:
        </p>
        <ul>
          <li>Google Analytics ni ninguna otra herramienta de analítica.</li>
          <li>Píxeles de seguimiento publicitario (Meta, LinkedIn, Google Ads).</li>
          <li>Cookies de personalización o de perfilado.</li>
          <li>Mapas de calor o grabación de sesiones.</li>
        </ul>
        <p>
          Las tipografías se sirven autoalojadas desde nuestro propio dominio
          mediante <code>next/font</code>, por lo que el navegador{" "}
          <strong>no realiza peticiones a servidores de Google</strong> al cargar
          la web.
        </p>

        <h2>4. Almacenamiento local técnico</h2>
        <p>
          El sitio sí guarda dos valores en el almacenamiento del navegador. No
          son cookies (no se envían al servidor en cada petición), son técnicos y
          están exentos de consentimiento conforme al artículo 22.2 LSSI-CE:
        </p>
        <ul>
          <li>
            <strong>
              <code>locale</code>
            </strong>{" "}
            (<code>localStorage</code>) — recuerda si prefieres ver el sitio en
            español o en inglés. Persiste hasta que borres los datos del
            navegador. No contiene datos personales.
          </li>
          <li>
            <strong>
              <code>action-loaded</code>
            </strong>{" "}
            (<code>sessionStorage</code>) — marca que ya has visto la pantalla de
            carga en esta sesión, para no repetirla al navegar. Se borra al
            cerrar la pestaña. No contiene datos personales.
          </li>
        </ul>

        <h2>5. Servicios de terceros</h2>
        <p>
          Si utilizas el formulario de contacto, al enviarlo se abre{" "}
          <strong>WhatsApp</strong> en una pestaña nueva. A partir de ese
          momento estás en un dominio de Meta Platforms, sujeto a sus propias
          cookies y política de privacidad, ajenas a nuestro control. Lo mismo
          aplica a los enlaces a redes sociales del pie de página.
        </p>
        <p>
          El proveedor de alojamiento puede registrar datos técnicos de acceso en
          sus logs de servidor por seguridad y estabilidad, sin instalar cookies
          en tu navegador.
        </p>

        <h2>6. Cómo controlar el almacenamiento</h2>
        <p>
          Puedes borrar el almacenamiento local de este sitio desde los ajustes
          de tu navegador (normalmente en «Privacidad y seguridad» → «Datos de
          sitios»), o navegar en modo incógnito. Hacerlo solo implica que el
          sitio olvidará tu idioma preferido y volverá a mostrar la pantalla de
          carga.
        </p>

        <h2>7. Cambios</h2>
        <p>
          Si en el futuro se incorpora analítica o cualquier tecnología que
          requiera consentimiento, se implementará un mecanismo de consentimiento
          previo y se actualizará este documento antes de activarla. La fecha de
          última revisión figura al inicio.
        </p>
        <p>
          Dudas sobre esta política:{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
        </p>
      </div>
    </>
  );
}
