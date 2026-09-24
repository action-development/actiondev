import { SERVICE_LANDINGS } from "@actiondev/shared";

/**
 * Texto indexable de la home mobile. El hero es un juego de palabras sueltas:
 * sin esto la URL que Google indexa en móvil no tiene un H1 con keyword ni un
 * solo enlace a las landings. `<a>` y no `next/link`: las landings las sirve
 * la zona desktop (rewrite del middleware), no esta app. Solo se ve al recibir
 * foco de teclado, como el "Saltar al contenido" de desktop.
 */
export function SeoIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:left-4 focus-within:top-4 focus-within:z-50 focus-within:border focus-within:border-black focus-within:bg-white focus-within:p-4 focus-within:text-black">
      <h1>{title}</h1>
      <p>{description}</p>
      <nav aria-label="Servicios">
        <ul>
          <li>
            <a href="/servicios">Servicios</a>
          </li>
          {SERVICE_LANDINGS.map((l) => (
            <li key={l.slug}>
              <a href={`/${l.slug}`}>{l.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
