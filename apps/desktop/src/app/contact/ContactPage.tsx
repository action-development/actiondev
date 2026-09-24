"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import type { HotspotId } from "@/components/canvas/street/street-config";
import { STREET_PALETTES, currentStreetMode, type StreetMode } from "@/components/canvas/street/street-mode";
import type { StreetLabels } from "@/components/canvas/street/StreetWorld";
import { ContactHud } from "@/components/contact/ContactHud";
import { Header } from "@/components/layout/Header";
import { SceneCurtain } from "@/components/ui/SceneCurtain";
import { buildMailtoUrl, buildWhatsappUrl } from "@/data/socials";
import { useT } from "@/lib/i18n";

// Escena Three.js siempre lazy + ssr:false (mismo patrón que la plaza y la recreativa).
const StreetScene = dynamic(() => import("@/components/canvas/StreetScene").then((m) => m.StreetScene), {
  ssr: false,
});

/** Nunca cambia dentro de una sesión: el modo se resuelve al cargar. */
const subscribeNever = () => () => {};

const NO_ACTIVATIONS: Record<HotspotId, number> = { whatsapp: 0, email: 0, callback: 0 };

/**
 * Client wrapper de /contact: el portal de C/ Colón 20 en 3D.
 *
 * Es lo que hay detrás de la puerta del fondo de la recreativa. Pantalla
 * completa sin scroll, con el Header y sin Footer ni Lenis, como /resenas y
 * /projects. Cada objeto de la calle es un canal: la cabina abre WhatsApp, el
 * buzón el email y el portero el "llámame tú". Los mismos canales están
 * SIEMPRE en el HUD (`contact/ContactHud`): la calle se puede jugar, pero no
 * hace falta para escribirnos.
 */
export function ContactPage() {
  const t = useT();
  const mode = useSyncExternalStore<StreetMode>(subscribeNever, currentStreetMode, () => "noche");
  const palette = STREET_PALETTES[mode];

  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<HotspotId | null>(null);
  const [hudHighlight, setHudHighlight] = useState<HotspotId | null>(null);
  const [activations, setActivations] = useState(NO_ACTIVATIONS);
  const [callbackOpen, setCallbackOpen] = useState(false);
  /** La pista no vuelve: con el primer objeto usado, el gesto está aprendido. */
  const [used, setUsed] = useState(false);

  const labels = useMemo<StreetLabels>(
    () => ({
      whatsapp: { tag: t.contact.street.whatsappTag, action: t.contact.street.whatsappAction },
      email: { tag: t.contact.street.emailTag, action: t.contact.street.emailAction },
      callback: { tag: t.contact.street.callbackTag, action: t.contact.street.callbackAction },
      booth: t.contact.street.booth,
      lcd: [t.contact.street.lcd1, t.contact.street.lcd2],
      postbox: t.contact.street.postbox,
      collection: t.contact.street.collection,
    }),
    [t]
  );

  const handleReady = useCallback(() => setReady(true), []);

  const markUsed = useCallback((id: HotspotId) => {
    setActivations((a) => ({ ...a, [id]: a[id] + 1 }));
    setUsed(true);
  }, []);

  // Un clic en la calle: el objeto se anima Y el canal se abre. Va síncrono
  // dentro del clic —`window.open` fuera de un gesto del usuario lo bloquea
  // el navegador como popup—.
  const handleActivate = useCallback(
    (id: HotspotId) => {
      markUsed(id);
      if (id === "whatsapp") {
        window.open(buildWhatsappUrl(t.contact.intro), "_blank", "noopener,noreferrer");
      } else if (id === "email") {
        window.location.href = buildMailtoUrl(t.contact.emailSubject, t.contact.intro);
      } else {
        setCallbackOpen(true);
      }
    },
    [markUsed, t]
  );

  return (
    <div className="fixed inset-0" style={{ background: palette.background }}>
      <Header />

      <main id="main-content">
        <StreetScene
          mode={mode}
          palette={palette}
          labels={labels}
          highlight={hovered ?? hudHighlight}
          activations={activations}
          onHoverChange={setHovered}
          onActivate={handleActivate}
          onReady={handleReady}
        />

        <ContactHud
          highlight={hovered ?? hudHighlight}
          onHighlight={setHudHighlight}
          onUse={markUsed}
          callbackOpen={callbackOpen}
          onCallbackOpenChange={setCallbackOpen}
          hintVisible={ready && !used && hovered === null}
        />
      </main>

      <SceneCurtain ready={ready} label={t.contact.street.loading} testId="street-curtain" />
    </div>
  );
}
