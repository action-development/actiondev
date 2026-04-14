"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface PreviewData {
	image: string;
	video?: string;
	videoElement?: HTMLVideoElement | null;
}

export function CardBackgroundPreview() {
	const [preview, setPreview] = useState<PreviewData | null>(null);
	const [visible, setVisible] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);

	const handleHover = useCallback((e: Event) => {
		const detail = (e as CustomEvent).detail as PreviewData | null;
		if (detail) {
			setPreview(detail);
			requestAnimationFrame(() => setVisible(true));
		} else {
			setVisible(false);
		}
	}, []);

	useEffect(() => {
		window.addEventListener("card-bg-preview", handleHover);
		return () => window.removeEventListener("card-bg-preview", handleHover);
	}, [handleHover]);

	// Sync background video with card video by copying currentTime
	useEffect(() => {
		if (!visible || !preview?.videoElement || !videoRef.current) return;

		const src = preview.videoElement;
		const bg = videoRef.current;

		// Set same source and sync time
		if (bg.src !== src.src) {
			bg.src = src.src;
		}
		bg.currentTime = src.currentTime;
		bg.play().catch(() => {});

		// Periodic sync (every 500ms instead of every frame)
		const interval = setInterval(() => {
			if (src && bg && Math.abs(bg.currentTime - src.currentTime) > 0.2) {
				bg.currentTime = src.currentTime;
			}
		}, 500);

		return () => clearInterval(interval);
	}, [visible, preview]);

	return (
		<div
			className="fixed inset-0 z-0 transition-opacity duration-300"
			style={{ opacity: visible ? 0.4 : 0, pointerEvents: "none" }}
			aria-hidden="true"
		>
			{preview?.video ? (
				<video ref={videoRef} muted loop playsInline className="w-full h-full object-cover" />
			) : preview?.image ? (
				<Image src={preview.image} alt="" fill className="object-cover" sizes="100vw" />
			) : null}
		</div>
	);
}
