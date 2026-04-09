"use client";

import { useState, useRef, useEffect } from "react";

const VIDEOS = [
  "/video-hero/optimized-1.mp4",
  "/video-hero/optimized-2.mp4",
  "/video-hero/optimized-3.mp4"
];

export function Hero() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % VIDEOS.length);
  };

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

      <div className="relative z-20 max-w-5xl text-center">
        <p className="mb-4 text-sm uppercase tracking-widest text-white/80 font-medium">
          Digital Agency
        </p>
        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-8xl text-white">
          We craft digital
          <br />
          experiences that{" "}
          <span className="text-accent text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">matter</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
          Strategy, design, and development for brands that refuse to blend in.
        </p>
      </div>
    </section>
  );
}
