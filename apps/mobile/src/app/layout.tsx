import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { detectLocale } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { I18nProvider } from "@/lib/i18n/context";
import { StructuredData } from "@/components/StructuredData";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://actiondev.es";
const OG_IMAGE_URL = `${SITE_URL}/api/og`;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = dictionaries[locale].metadata;

  return {
    metadataBase: new URL(SITE_URL),
    title: t.title,
    description: t.description,
    keywords: [
      "desarrollo de aplicaciones Vigo",
      "desarrollo de apps Vigo",
      "desarrollo de aplicaciones móviles Vigo",
      "desarrollo web Vigo",
      "diseño web Vigo",
      "desarrollo de aplicaciones Pontevedra",
      "desarrollo web Pontevedra",
      "agencia desarrollo web Galicia",
    ],
    applicationName: "Action",
    authors: [{ name: "Action Digital Agency", url: SITE_URL }],
    creator: "Action Digital Agency",
    publisher: "Action Digital Agency",
    openGraph: {
      title: t.title,
      description: t.description,
      locale: locale === "es" ? "es_ES" : "en_US",
      type: "website",
      url: SITE_URL,
      siteName: "Action",
      images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: t.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
      images: [OG_IMAGE_URL],
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
    icons: {
      icon: [{ url: "/logos/action_globe.webp", type: "image/webp" }],
    },
    alternates: {
      // La zona mobile se sirve bajo actiondev.es vía rewrite del middleware
      // desktop. El canonical fijo evita que la URL directa de la zona
      // (proyecto Vercel de mobile) se indexe como contenido duplicado.
      canonical: SITE_URL,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await detectLocale();

  return (
    <html lang={locale}>
      <head>
        <meta name="theme-color" content="#ffffff" id="theme-color-meta" />
      </head>
      <body className={inter.className} style={{ background: "white" }}>
        <StructuredData />
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
