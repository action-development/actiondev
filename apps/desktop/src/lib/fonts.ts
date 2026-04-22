import { Geist, Geist_Mono, Syne } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display / heading font — geometric, editorial. Kept to 500 and 700 so the
// display scale stays premium-restrained (Apple-weight) instead of black 800/900.
export const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "700"],
});
