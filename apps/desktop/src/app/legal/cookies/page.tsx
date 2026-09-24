import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocHeader } from "@/components/legal/LegalDocHeader";
import { BUSINESS, LEGAL_ENTITY, OG_IMAGE, absoluteUrl } from "@/lib/seo";

/**
 * Política de cookies.
 *
 * Este sitio usa Google Tag Manager (`components/analytics/GoogleTagManager.tsx`,
 * ambas apps) para cargar herramientas de analítica — SOLO tras consentimiento
 * explícito vía el banner (`ui/CookieConsent.tsx` en desktop,
 * `components/CookieConsent.tsx` en mobile). Sin aceptar, GTM no se carga y no
 * se instala ninguna cookie de analítica. La decisión se guarda en
 * `localStorage["action-cookie-consent"]` (`@actiondev/shared` → `analytics.ts`),
 * compartida entre desktop y mobile.
 *
 * Además del banner, el sitio usa dos claves de almacenamiento técnico exentas
 * de consentimiento: `locale` en localStorage, `action-loaded` en
 * sessionStorage.
 *
 * Fuentes en código: `lib/i18n/index.tsx`, `app/page.tsx`,
 * `components/analytics/GoogleTagManager.tsx`, `packages/shared/src/analytics.ts`.
 */

export const metadata: Metadata = {
  title: "Política de cookies",
  description:
    "Política de cookies de actiondev.es. Usamos Google Tag Manager para analítica, solo tras tu consentimiento. Titular: Alcasi Systems, S.L. (CIF B72910664).",
  alternates: { canonical: "/legal/cookies" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/legal/cookies"),
    siteName: BUSINESS.name,
    title: "Política de cookies — Action",
    description:
      "actiondev.es solo instala cookies de analítica si las aceptas en el banner. Qué cookies usa y cómo cambiar tu decisión.",
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
        lede="Este sitio no instala ninguna cookie de analítica hasta que la aceptas en el banner. Puedes cambiar tu decisión en cualquier momento desde el pie de página."
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
          actiondev.es usa <strong>Google Tag Manager</strong> (contenedor{" "}
          <code>GTM-PF295VK8</code>) para cargar herramientas de analítica —{" "}
          <strong>solo si aceptas el banner de cookies</strong>. Mientras no
          aceptas, el script de Google Tag Manager no se carga y no se instala
          ninguna cookie de analítica.
        </p>
        <p>Si aceptas, pueden instalarse cookies como:</p>
        <ul>
          <li>
            <strong>
              <code>_ga</code>, <code>_ga_*</code>
            </strong>{" "}
            (Google Analytics) — distinguen visitantes únicos y sesiones.
            Persisten hasta 2 años.
          </li>
          <li>
            <strong>
              <code>_gid</code>
            </strong>{" "}
            (Google Analytics) — distingue visitantes. Persiste 24 horas.
          </li>
        </ul>
        <p>
          Estas cookies son de <strong>terceros</strong> (Google Ireland
          Limited) y su finalidad es exclusivamente <strong>estadística</strong>
          : entender qué páginas se visitan y cómo. No usamos píxeles de
          publicidad (Meta, LinkedIn, Google Ads), cookies de perfilado ni
          mapas de calor o grabación de sesiones.
        </p>
        {/* Texto SIN la palabra "privacidad": el enlace "Privacidad" del pie
            (Footer.tsx) se busca por nombre accesible en e2e con
            `getByRole('link', { name: 'Privacidad' })`, sin `exact: true` —
            un segundo enlace cuyo nombre CONTENGA esa palabra rompe el
            selector con "strict mode violation" (dos coincidencias). */}
        <p>
          Más información sobre cómo trata tus datos Google en{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            policies.google.com/privacy
          </a>
          .
        </p>
        <p>
          Las tipografías se sirven autoalojadas desde nuestro propio dominio
          mediante <code>next/font</code>, por lo que cargarlas{" "}
          <strong>no</strong> genera peticiones a servidores de Google.
        </p>

        <h2>4. Cómo gestionar tu consentimiento</h2>
        <p>
          Al entrar por primera vez verás un banner con dos opciones,{" "}
          <strong>Aceptar</strong> y <strong>Rechazar</strong>. Tu decisión se
          guarda en el almacenamiento local del navegador (
          <code>localStorage</code>, clave{" "}
          <code>action-cookie-consent</code>) y no vuelve a preguntarse hasta
          que la borres o la cambies.
        </p>
        <p>
          Para cambiar tu decisión en cualquier momento, usa el enlace{" "}
          <strong>«Preferencias de cookies»</strong> del pie de página: vuelve
          a mostrar el banner sin recargar la web.
        </p>

        <h2>5. Almacenamiento local técnico</h2>
        <p>
          El sitio sí guarda cuatro valores en el almacenamiento del navegador. No
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
          <li>
            <strong>
              <code>action-contact-popup</code>
            </strong>{" "}
            (<code>localStorage</code>) — recuerda si ya nos has contactado o
            cuándo cerraste la ventana de contacto rápido, para no volver a
            mostrártela en 7 días. No contiene datos personales.
          </li>
          <li>
            <strong>
              <code>action-contact-popup-shown</code>
            </strong>{" "}
            (<code>sessionStorage</code>) — marca que la ventana de contacto
            rápido ya se mostró en esta sesión. Se borra al cerrar la pestaña.
            No contiene datos personales.
          </li>
        </ul>

        <h2>6. Servicios de terceros</h2>
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

        <h2>7. Cómo controlar el almacenamiento y las cookies</h2>
        <p>
          Además del enlace «Preferencias de cookies» del pie de página, puedes
          borrar el almacenamiento y las cookies de este sitio desde los
          ajustes de tu navegador (normalmente en «Privacidad y seguridad» →
          «Datos de sitios»), o navegar en modo incógnito. Borrar el
          almacenamiento hace que el sitio olvide tu idioma preferido, tu
          decisión de cookies (volverá a preguntarse) y vuelva a mostrar la
          pantalla de carga.
        </p>

        <h2>8. Cambios</h2>
        <p>
          Si en el futuro se incorpora otra tecnología que requiera
          consentimiento, se actualizará este documento antes de activarla. La
          fecha de última revisión figura al inicio.
        </p>
        <p>
          Dudas sobre esta política:{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
        </p>
      </div>
    </>
  );
}
