/**
 * Datos de negocio compartidos (NAP — Name, Address, Phone).
 * Single source of truth para SEO local en desktop y mobile.
 *
 * IMPORTANTE: estos datos deben coincidir EXACTAMENTE con la ficha de
 * Google Business Profile. Si cambia la ficha, cambiar aquí también.
 */
export const BUSINESS = {
  name: "Action",
  legalName: "Action Digital Agency",
  alternateName: "Action Development",
  domain: "https://actiondev.es",
  email: "hi@actiondev.es",
  phoneE164: "+34614027410",
  phoneDisplay: "+34 614 02 74 10",
  whatsappUrl: "https://wa.me/34614027410",
  address: {
    // Formato EXACTO de la ficha GBP: "Rúa Colón, 20, 36201 Vigo, Pontevedra"
    street: "Rúa Colón, 20",
    locality: "Vigo",
    region: "Pontevedra",
    postalCode: "36201",
    country: "ES",
  },
  // Aproximadas a Rúa Colón 20 — verificar contra el pin exacto de la ficha GBP.
  geo: { latitude: 42.2372, longitude: -8.7203 },
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Action+Development+Vigo",
  foundingYear: 2020,
  social: {
    instagram: "https://instagram.com/action.dev",
    linkedin: "https://linkedin.com/company/action-development",
  },
} as const;
