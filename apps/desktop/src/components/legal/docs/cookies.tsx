import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS, LEGAL_ENTITY, OG_IMAGE, absoluteUrl } from "@/lib/seo";
import type { LegalSlots } from "../LegalSlots";

/**
 * CONTENIDO del documento: fuente ÚNICA de la página de escritorio
 * (`app/(site)/legal/cookies`) y de la web móvil v2 (`app/(m)/m/legal/cookies`).
 * Cada árbol pinta el texto con su prosa (`Prose`).
 *
 * Política de cookies.
 *
 * Este sitio usa Google Tag Manager (`components/analytics/GoogleTagManager.tsx`,
 * ambas apps) para cargar analítica (GA4) y medición de campañas (Google Ads,
 * Meta Pixel) — SOLO tras consentimiento explícito vía el banner
 * (`ui/CookieConsent.tsx` en desktop, `components/CookieConsent.tsx` en
 * mobile). Sin aceptar, GTM no se carga y no se instala ninguna cookie
 * (Consent Mode v2 en modo básico). Duraciones: tabla de cookies de Google
 * (business.safety.google/adscookies) y documentación de Meta (fbp/fbc,
 * 90 días). Si cambia el contenedor GTM (tags), actualizar el apartado 3. La decisión se guarda en
 * `localStorage["action-cookie-consent"]` (`@actiondev/shared` → `analytics.ts`),
 * compartida entre desktop y mobile.
 *
 * Además del banner, el sitio usa claves de almacenamiento técnico exentas
 * de consentimiento (apartado 5: `locale`, `action-loaded`,
 * `action-contact-popup`, `action-contact-popup-shown`) y la cookie técnica
 * `mv2` de QA de la web móvil v2 (`lib/mobile-v2.ts` + `middleware.ts`): solo
 * existe con `MOBILE_V2=qa` y un enlace `?mv2=1`; ningún visitante normal la
 * recibe. Se declara igualmente porque en QA en producción es comportamiento
 * real del sitio.
 *
 * Fuentes en código: `lib/i18n/index.tsx`, `app/page.tsx`,
 * `components/analytics/GoogleTagManager.tsx`, `packages/shared/src/analytics.ts`.
 */

export const COOKIES_METADATA: Metadata = {
  title: "Política de cookies",
  description:
    "Política de cookies de actiondev.es. Usamos Google Tag Manager para analítica y medición de campañas (Google Analytics, Google Ads, Meta Pixel), solo tras tu consentimiento. Titular: Alcasi Systems, S.L. (CIF B72910664).",
  alternates: { canonical: "/legal/cookies" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/legal/cookies"),
    siteName: BUSINESS.name,
    title: "Política de cookies — Action",
    description:
      "actiondev.es solo instala cookies de analítica y de medición de campañas si las aceptas en el banner. Qué cookies usa y cómo cambiar tu decisión.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

export const COOKIES_JSON_LD = {
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

/** Cabecera del documento (eyebrow, H1 y entradilla). */
export const COOKIES_HEADER = {
  eyebrow: "Legal · LSSI art. 22.2",
  title: "Política de cookies",
  lede: "Este sitio no instala ninguna cookie de analítica ni de medición de campañas hasta que las aceptas en el banner. Puedes cambiar tu decisión en cualquier momento desde «Preferencias de cookies», en el pie de página, o desde «Cookies», abajo a la izquierda en las pantallas 3D.",
} as const;

export function CookiesBody({ Prose }: Pick<LegalSlots, "Prose">) {
  return (
    <>
      <Prose>
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
          <code>GTM-T9766P5S</code>) para cargar herramientas de analítica y de
          medición de campañas publicitarias —{" "}
          <strong>solo si aceptas el banner de cookies</strong>. Mientras no
          aceptas, el script de Google Tag Manager no se carga y no se instala
          ninguna de las cookies de esta sección.
        </p>
        <p>
          Si aceptas, Google Tag Manager puede cargar las tres herramientas
          siguientes. Las duraciones son aproximadas y las fija el proveedor.
        </p>

        <h3>3.1. Google Analytics 4 (analítica)</h3>
        <ul>
          <li>
            <strong>
              <code>_ga</code>, <code>_ga_*</code>
            </strong>{" "}
            — distinguen visitantes únicos y sesiones para estadísticas de uso
            del sitio (páginas vistas, procedencia, dispositivo).
          </li>
          <li>
            <strong>Titular:</strong> Google Ireland Limited (cookies de
            terceros gestionadas desde nuestro dominio).{" "}
            <strong>Duración:</strong> hasta 2 años.{" "}
            <strong>Transferencias:</strong> puede enviar datos a Google LLC en
            EE. UU., amparado en el Marco de Privacidad de Datos UE-EE. UU. y
            en las cláusulas contractuales tipo.
          </li>
        </ul>

        <h3>3.2. Google Ads (medición de conversiones)</h3>
        <ul>
          <li>
            <strong>
              <code>_gcl_au</code>, <code>_gcl_aw</code>, <code>_gcl_gb</code>
            </strong>{" "}
            — guardan que llegaste desde un anuncio de Google (identificador
            de clic) para poder medir si después nos contactas, y qué campaña
            lo originó. No muestran publicidad personalizada por sí mismas: no
            hacemos remarketing.
          </li>
          <li>
            <strong>Titular:</strong> Google Ireland Limited.{" "}
            <strong>Duración:</strong> hasta 90 días.{" "}
            <strong>Transferencias:</strong> como en Google Analytics (EE. UU.,
            Marco de Privacidad de Datos y cláusulas contractuales tipo).
          </li>
          <li>
            Cuando envías el formulario de proyecto, con tu consentimiento,
            Google Ads recibe además tu correo y tu teléfono{" "}
            <strong>cifrados con un resumen criptográfico (hash)</strong> para
            asociar la solicitud al anuncio (conversiones mejoradas). Detalle
            en la <Link href="/legal/privacy">política de privacidad</Link>.
          </li>
        </ul>

        <h3>3.3. Meta Pixel (medición de campañas)</h3>
        <ul>
          <li>
            <strong>
              <code>_fbp</code>, <code>_fbc</code>
            </strong>{" "}
            — <code>_fbp</code> identifica el navegador y <code>_fbc</code>{" "}
            guarda el identificador de clic de un anuncio de Facebook o
            Instagram (<code>fbclid</code>), para medir qué anuncios llevan a
            una visita o a una solicitud.
          </li>
          <li>
            <strong>Titular:</strong> Meta Platforms Ireland Ltd.{" "}
            <strong>Duración:</strong> hasta 90 días.{" "}
            <strong>Transferencias:</strong> puede enviar datos a Meta
            Platforms, Inc. en EE. UU., conforme a sus condiciones y a las
            cláusulas contractuales tipo.
          </li>
        </ul>

        <p>
          Estas cookies son de <strong>terceros</strong> (aunque algunas se
          guarden en nuestro dominio) y su finalidad es la{" "}
          <strong>estadística y la medición de campañas</strong>. No usamos
          cookies de perfilado propias, remarketing, mapas de calor ni
          grabación de sesiones, ni píxeles de otras redes (como LinkedIn).
        </p>
        <h3>3.4. Consent Mode v2 (cómo respeta tu decisión)</h3>
        <p>
          El sitio aplica el <strong>Modo de consentimiento v2</strong> de
          Google en su modalidad <strong>básica</strong>: hasta que aceptas, los
          cuatro permisos (<code>ad_storage</code>,{" "}
          <code>ad_user_data</code>, <code>ad_personalization</code> y{" "}
          <code>analytics_storage</code>) están denegados y{" "}
          <strong>no se carga ninguna etiqueta ni se envía ninguna señal</strong>
          , ni siquiera «anónima» o sin cookies. Al aceptar, se conceden y se
          cargan las etiquetas; si después revocas tu decisión, se vuelven a
          denegar.
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
          </a>{" "}
          y Meta en{" "}
          <a
            href="https://www.facebook.com/privacy/policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            facebook.com/privacy/policy
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
          Si rechazas, no se carga nada de la sección 3. Para cambiar tu decisión en cualquier momento, usa el enlace{" "}
          <strong>«Preferencias de cookies»</strong> del pie de página o, en
          las pantallas 3D (inicio, proyectos, reseñas y contacto),{" "}
          <strong>«Cookies»</strong> abajo a la izquierda: vuelve a mostrar el
          banner sin recargar la web.
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
        <p>
          Además, hay una cookie técnica,{" "}
          <strong>
            <code>mv2</code>
          </strong>
          , que solo usa el equipo de Action para probar la nueva versión de la
          web para móvil antes de publicarla. Solo se instala al abrir un enlace
          de prueba con el parámetro <code>?mv2=1</code> mientras esa versión
          está en pruebas: a quien visita la web con normalidad no se le
          instala. Guarda el valor <code>1</code> para mostrar la versión de
          prueba, no contiene datos personales ni sirve para seguirte, no es
          accesible desde JavaScript y caduca a los 30 días o al abrir un
          enlace con <code>?mv2=0</code>. Es técnica y necesaria para esas
          pruebas internas, por lo que está exenta de consentimiento (artículo
          22.2 LSSI-CE).
        </p>

        <h2>6. Servicios de terceros</h2>
        <p>
          Si eliges <strong>WhatsApp</strong> como canal de contacto, se abre
          en una pestaña nueva o en la aplicación. A partir de ese momento
          estás en un servicio de Meta Platforms, sujeto a sus propias cookies
          y política de privacidad, ajenas a nuestro control. Lo mismo aplica a
          los enlaces a nuestras redes sociales.
        </p>
        <p>
          El proveedor de alojamiento puede registrar datos técnicos de acceso en
          sus logs de servidor por seguridad y estabilidad, sin instalar cookies
          en tu navegador.
        </p>

        <h2>7. Cómo controlar el almacenamiento y las cookies</h2>
        <p>
          Además de «Preferencias de cookies» (o «Cookies» en las pantallas
          3D), puedes
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
      </Prose>
    </>
  );
}
