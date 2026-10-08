import { WhatsappClickTracking } from "@/components/leads/useWhatsappClickTracking";

/**
 * Landings de campaña y gracias de la web móvil v2 (`/hablemos/*`): solo añade
 * la medición de `whatsapp_click` con `link_location` para TODOS los enlaces de
 * WhatsApp de la página (cabecera, formulario, cierre, barra fija, pie,
 * gracias). Sin marcado propio: cabecera y pie los pinta cada página.
 */
export default function MobileHablemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WhatsappClickTracking />
    </>
  );
}
