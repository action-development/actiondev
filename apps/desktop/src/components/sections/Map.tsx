"use client";

export function Map() {
  return (
    <section id="map" className="px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
          Find us
        </h2>
        <p className="mb-16 text-4xl font-bold tracking-tight md:text-6xl">
          Location
        </p>

        {/* Map embed placeholder - replace with Mapbox/Google Maps */}
        <div className="aspect-[16/7] overflow-hidden rounded-2xl bg-border">
          <div className="flex h-full items-center justify-center text-muted">
            Map embed goes here
          </div>
        </div>
      </div>
    </section>
  );
}
