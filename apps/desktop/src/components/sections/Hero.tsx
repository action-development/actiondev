"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AccentWord } from "@/components/ui/AccentWord";

const VIDEOS = [
  "/video-hero/optimized-1.mp4",
  "/video-hero/optimized-2.mp4",
  "/video-hero/optimized-3.mp4"
];

export function Hero() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handleVideoEnded = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev + 1) % VIDEOS.length);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.5; // Ajustá este valor si lo querés más rápido o lento
    }
  }, [currentVideoIndex]);

  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        key={VIDEOS[currentVideoIndex]}
        className="absolute inset-0 z-0 h-full w-full object-cover opacity-60 pointer-events-none"
        src={VIDEOS[currentVideoIndex]}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 z-10 bg-black/40 pointer-events-none" />

      <div className="relative z-20 container-editorial text-center">
        <p className="micro-label mb-8 text-foreground/70">Digital Agency</p>
        <h1 className="display-xl text-foreground">
          We craft digital
          <br />
          experiences that <AccentWord>matter</AccentWord>
        </h1>
        <p className="lede mx-auto mt-10 text-foreground/80">
          Strategy, design, and development for brands that refuse to blend in.
        </p>
      </div>
    </section>
  );
}
