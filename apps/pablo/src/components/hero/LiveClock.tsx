"use client";

import { useEffect, useState } from "react";

/**
 * Reloj de la ubicación. Se monta vacío y se rellena en el cliente:
 * renderizar la hora en el servidor provocaría un desajuste de hidratación
 * garantizado (el servidor y el navegador nunca coinciden al segundo).
 */
export function LiveClock({ timeZone = "Europe/Madrid" }: { timeZone?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone,
      }).format(new Date());

    setTime(format());
    const id = window.setInterval(() => setTime(format()), 1000);
    return () => window.clearInterval(id);
  }, [timeZone]);

  return (
    <time suppressHydrationWarning className="tabular-nums">
      {time ?? "--:--"}
    </time>
  );
}
