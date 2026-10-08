import { Button } from "@/components/m/Button";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";

/**
 * 404 del árbol móvil: lo pintan los `notFound()` de sus páginas (p. ej. una
 * ficha `/projects/<slug>` que no existe). Next añade `noindex` solo. Las URLs
 * que no casan con ninguna ruta van a `app/global-not-found.tsx` (escritorio).
 */
export default function MobileNotFound() {
  return (
    <>
      <MobileHeader />
      <main id="main-content" className="grid gap-6 border-b-2 border-ink px-4 pt-12 pb-10">
        <h1 className="font-display text-h1 uppercase">Esta página no existe</h1>
        <p className="max-w-[34ch] text-lead">Puede que la dirección esté mal escrita o que la página se haya movido.</p>
        <div className="-mx-4 grid gap-px">
          <Button href="/" variant="ink">
            Ir al inicio
          </Button>
        </div>
      </main>
      <MobileFooter withBar={false} />
    </>
  );
}
