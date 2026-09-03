import type { Metadata, Viewport } from "next";

const PDF = "/guia/guia-usernames.pdf";

export const metadata: Metadata = {
  title: "Cómo conseguí @pabl en Instagram — Guía PDF",
  description:
    "La guía completa: dónde se mueven los usernames, por qué los encargos son estafa y cómo negociar con el perfil que te interesa.",
  alternates: { canonical: "/username" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "article",
    locale: "es_ES",
    title: "Cómo conseguí @pabl en Instagram",
    description: "Guía gratuita en PDF. Mercado, estafas, método y negociación.",
  },
};

/** Pantalla negra: la barra de estado del móvil también en negro. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

const btn =
  "flex min-h-14 w-full items-center justify-center rounded-2xl px-6 text-[17px] font-semibold transition active:scale-[0.98] sm:flex-1";

/**
 * Destino del DM del bot de Instagram: quien comenta en el reel recibe
 * este enlace. Sin formulario, sin registro — solo abrir o descargar.
 *
 * Va en `fixed inset-0 z-[45]` a propósito: tapa las cruces de
 * FrameMarks (z-40) y el body crema del layout raíz sin tocarlos; el
 * grano (z-50) sigue por encima, que es lo que queremos.
 */
export default function UsernamePage() {
  return (
    <main
      className="fixed inset-0 z-[45] flex flex-col items-center justify-between bg-black px-6 text-center text-white"
      style={{
        // El body va en Bootzy (display de la landing); aquí queremos una
        // sans neutra con todos los pesos (Inter solo carga el 900).
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        paddingTop: "max(28px, env(safe-area-inset-top))",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      }}
    >
      <a href="https://actiondev.es" aria-label="Action Development" className="block p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/guia/logo-action-blanco.png"
          alt="Action Development"
          width={1000}
          height={299}
          className="h-auto w-[132px] sm:w-[160px]"
        />
      </a>

      <section className="my-6 flex w-full max-w-[420px] flex-col items-center gap-[18px]">
        <p className="text-xs uppercase tracking-[0.14em] text-[#8a8a8a]">
          Guía gratuita · PDF · 11 páginas
        </p>
        <h1 className="mb-2 text-balance text-[clamp(28px,8vw,38px)] font-black leading-[1.1] tracking-tight">
          Cómo conseguí <span className="text-[#fe5100]">@pabl</span> en Instagram
        </h1>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <a
            href={PDF}
            target="_blank"
            rel="noopener"
            className={`${btn} bg-[#fe5100] text-white hover:bg-[#ff6a24]`}
          >
            Previsualizar
          </a>
          <a
            href={PDF}
            download="Guia_Usernames_Instagram.pdf"
            className={`${btn} border border-[#333] text-white hover:border-[#fe5100] hover:text-[#fe5100]`}
          >
            Descargar PDF
          </a>
        </div>
      </section>

      <footer className="text-xs text-[#666]">© {new Date().getFullYear()} Action Development</footer>
    </main>
  );
}
