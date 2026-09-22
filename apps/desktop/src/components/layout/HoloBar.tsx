import Link from "next/link";

/**
 * Barra superior de las páginas server-only (`/servicios` y las landings SEO).
 *
 * NO es el `Header` de la home: aquél es client component con GSAP, reloj local
 * y conmutador de idioma, y estas páginas existen para cargar instantáneamente.
 * Sí es la MISMA proyección — cápsula lima translúcida, corchetes en las
 * esquinas, barrido — para que el visitante que llega desde Google a una
 * landing vea la misma web que el que entra por el puerto.
 */

interface HoloBarProps {
  phone: string;
  phoneHref: string;
}

export function HoloBar({ phone, phoneHref }: HoloBarProps) {
  return (
    <header className="flex justify-center px-6 pt-3">
      <div className="holo-surface holo-corners holo-live holo-glass flex h-11 items-center gap-4 px-3">
        <Link
          href="/"
          className="holo-tint inline-flex items-center gap-2.5 text-[15px] font-bold tracking-tight"
        >
          <span className="holo-led" aria-hidden />
          Action
        </Link>

        <span
          aria-hidden
          className="h-5 w-px bg-gradient-to-b from-transparent via-[rgba(234,255,176,0.35)] to-transparent"
        />

        <a
          href={phoneHref}
          className="holo-btn holo-btn-sm holo-btn-data"
          aria-label={`Llamar o escribir a ${phone}`}
        >
          <span>{phone}</span>
        </a>
      </div>
    </header>
  );
}
