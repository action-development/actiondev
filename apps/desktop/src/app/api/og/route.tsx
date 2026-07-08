import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/seo";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#080808",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid lines — decorative */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(200,255,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,255,0,0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            display: "flex",
          }}
        />

        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "560px",
            height: "560px",
            background:
              "radial-gradient(ellipse at center, rgba(200,255,0,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top row — brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#c8ff00",
              display: "flex",
            }}
          />
          <span
            style={{
              color: "#c8ff00",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            {BRAND.legalName}
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "88px",
              fontWeight: 700,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              color: "#ededed",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Desarrollo de</span>
            <span>aplicaciones y webs</span>
            <span style={{ color: "#c8ff00" }}>en Vigo.</span>
          </div>
        </div>

        {/* Bottom row — url + tagline */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: "#767676",
              fontSize: "15px",
              letterSpacing: "0.05em",
              fontFamily: "monospace",
            }}
          >
            actiondev.es
          </span>
          <span
            style={{
              color: "#767676",
              fontSize: "13px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {BRAND.tagline}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
