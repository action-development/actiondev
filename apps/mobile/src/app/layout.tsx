import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { detectLocale } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { I18nProvider } from "@/lib/i18n/context";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = dictionaries[locale].metadata;

  return {
    title: t.title,
    description: t.description,
    openGraph: {
      title: t.title,
      description: t.description,
      locale: locale === "es" ? "es_ES" : "en_US",
      type: "website",
    },
    alternates: {
      canonical: "https://actiondev.es",
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
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
