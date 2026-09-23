"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, GTM_ID, readStoredConsent } from "@actiondev/shared";

/**
 * Carga Google Tag Manager SOLO tras consentimiento explícito (`ui/CookieConsent.tsx`).
 *
 * Esto es una desviación deliberada de la instrucción literal de Google ("pega
 * esto lo más arriba posible en <head>"): si el contenedor va a disparar tags
 * de analítica o publicidad, esas cookies no pueden instalarse antes de que el
 * visitante decida — LSSI art. 22.2. Mientras no hay consentimiento, este
 * componente no renderiza nada (ni siquiera el `<noscript>`, que en la versión
 * de Google es incondicional): sin JS no hay banner con el que consentir, así
 * que sin JS tampoco hay tracking.
 */
export function GoogleTagManager() {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const sync = () => setGranted(readStoredConsent() === "granted");
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!granted) return null;

  return (
    <>
      {/* Google Tag Manager */}
      <Script id="gtm-init" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
      {/* End Google Tag Manager */}
    </>
  );
}
