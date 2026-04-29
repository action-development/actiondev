import type { Metadata, Viewport } from "next";
import { geistSans, geistMono, syne } from "@/lib/fonts";
import { BRAND, SITE_URL, SOCIAL, OG_IMAGE } from "@/lib/seo";
import { StructuredData } from "@/components/seo/StructuredData";
import { LocaleProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description: BRAND.shortDescription,
  keywords: [...BRAND.keywords],
  applicationName: BRAND.name,
  authors: [{ name: BRAND.legalName, url: SITE_URL }],
  creator: BRAND.legalName,
  publisher: BRAND.legalName,
  category: "Digital Agency",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: BRAND.locale,
    url: SITE_URL,
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    images: [
      {
        url: OG_IMAGE.url,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    images: [OG_IMAGE.url],
    ...(SOCIAL.twitter && { creator: SOCIAL.twitter, site: SOCIAL.twitter }),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // icons and manifest are handled automatically by Next.js App Router
  // via src/app/favicon.ico, src/app/icon.svg, and src/app/manifest.ts
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={BRAND.language}
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-mono focus:text-background focus:outline-none"
        >
          Skip to content
        </a>
        <LocaleProvider>
          <StructuredData kind="organization" />
          <StructuredData kind="website" />
          <StructuredData kind="services" />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
