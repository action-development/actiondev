import { describe, expect, it } from "vitest";
import { getAdsLanding } from "@/data/ads-landings";
import { resolveAdsLandingContent, resolveHeroReview } from "@/lib/ads-landing";

/**
 * Reseña del hero de escritorio en `/hablemos/*`: el recorte tiene que ser
 * literal de la reseña (si no, `resolveHeroReview` pinta la reseña entera sin
 * avisar) y la reseña no se repite en la lista de la página.
 */
describe("reseña del hero de /hablemos/*", () => {
  it.each([
    ["app", "Rapeal John", "Contratamos a Action Development para desarrollar nuestra app en Vigo y el resultado ha sido espectacular…"],
    ["software", "Pablo R.", "…Cumplieron todos los plazos acordados y destaca la atención al detalle."],
  ])("%s: %s, con el recorte literal", (slug, name, excerpt) => {
    const landing = getAdsLanding(slug)!;
    expect(resolveHeroReview(landing)).toEqual({ name, text: excerpt });
    expect(resolveAdsLandingContent(landing).quotes.map((t) => t.name)).not.toContain(name);
  });

  it("software: Julio Walker deja el hero y pasa a la lista de reseñas", () => {
    const { quotes } = resolveAdsLandingContent(getAdsLanding("software")!);
    expect(quotes.map((t) => t.name)).toContain("Julio Walker");
  });
});
