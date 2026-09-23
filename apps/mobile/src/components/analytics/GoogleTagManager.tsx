"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, GTM_ID, readStoredConsent } from "@actiondev/shared";

/**
 * Carga Google Tag Manager SOLO tras consentimiento explícito
 * (`components/CookieConsent.tsx`). Ver el gemelo de desktop
 * (`apps/desktop/src/components/analytics/GoogleTagManager.tsx`) para el
 * razonamiento completo — misma clave de consentimiento vía `@actiondev/shared`,
 * así que aceptar/rechazar aquí es la misma decisión que en desktop.
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
