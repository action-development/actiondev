"use client";

import type { Track } from "@/data/tracks";

export function Player({
  tracks,
  current,
  playing,
  onToggle,
  onSelect,
}: {
  tracks: Track[];
  current: number;
  playing: boolean;
  onToggle: () => void;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="body-type flex w-full flex-col gap-2 text-[0.98rem] sm:text-[1.02rem] md:max-w-sm">
      <div className="flex items-center gap-3">
        <span className="hidden h-px flex-1 bg-border md:block" />
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={playing}
          className="group flex items-center gap-2.5 transition-opacity duration-[--duration] hover:opacity-60"
        >
          <span className="block h-2.5 w-2.5 shrink-0 bg-accent" />
          {playing ? "Pausar" : "Dale al play"}
        </button>
      </div>

      <ul className="flex flex-col">
        {tracks.map((track, i) => (
          <li key={track.src} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === current}
              className={`w-full py-1.5 text-left transition-colors duration-[--duration] hover:text-accent ${
                i === current ? "text-accent" : "text-foreground"
              }`}
            >
              {track.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
