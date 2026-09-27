import type { Metadata, Viewport } from "next";

const PDF = "/guia/guia-entregables-desarrollo.pdf";

export const metadata: Metadata = {
  title: "Los 5 entregables de un desarrollo bien hecho — Guía PDF",
  description:
    "SRS, tareas en Kanban, desarrollo, MVP y código fuente: qué se entrega en un desarrollo profesional y cómo se conecta cada pieza.",
  alternates: { canonical: "/guia" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "article",
    locale: "es_ES",
    title: "Los 5 entregables de un desarrollo bien hecho",
    description: "Guía gratuita en PDF. SRS, Kanban, desarrollo, MVP y código fuente.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

const btn =
  "flex min-h-14 w-full items-center justify-center rounded-2xl px-6 text-[17px] font-semibold transition active:scale-[0.98] sm:flex-1";

/** Mismo patrón que /username: `fixed inset-0 z-[45]` tapa FrameMarks (z-40) y deja el grano (z-50) encima. */
export default function GuiaPage() {
  return (
    <main
      className="fixed inset-0 z-[45] flex flex-col items-center justify-between bg-black px-6 text-center text-white"
      style={{
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
          Guía gratuita · PDF · 9 páginas
        </p>
        <h1 className="mb-2 text-balance text-[clamp(28px,8vw,38px)] font-black leading-[1.1] tracking-tight">
          Los <span className="text-[#fe5100]">5 entregables</span> de un desarrollo bien hecho
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
            download="Guia_Entregables_Desarrollo.pdf"
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
