import { Poppins } from "next/font/google";

// Body font — kept under the historical `--font-geist-sans` variable name so
// every consumer (globals.css `--font-sans`, Tailwind utilities) stays untouched.
export const geistSans = Poppins({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Mono / label font — Poppins has no monospace cut; kept under the historical
// `--font-geist-mono` variable name so `.micro-label` / `.accent-word` stay untouched.
export const geistMono = Poppins({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Display / heading font — kept under the historical `--font-syne` variable
// name so `.display-xl/l/m` stay untouched. Weighted 500/600/700 so the
// display scale can step down from Bold to SemiBold on smaller headings.
export const syne = Poppins({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});
