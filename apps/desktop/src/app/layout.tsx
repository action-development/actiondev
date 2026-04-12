import type { Metadata } from "next";
import { geistSans, geistMono } from "@/lib/fonts";
import { GameLayout } from "@/components/layout/GameLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Action — Digital Agency",
  description:
    "We craft digital experiences that matter. Strategy, design, and development for brands that refuse to blend in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <GameLayout>{children}</GameLayout>
      </body>
    </html>
  );
}
