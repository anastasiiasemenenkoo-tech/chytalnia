import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Literata } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/shell/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getDictionary, getLocale } from "@/i18n";
import { I18nProvider } from "@/i18n/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Literata was drawn for long-form reading and carries a full Cyrillic set,
// so headings stay in character for both locales.
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

/**
 * The bar at the top of the phone takes its colour from here, so in a
 * window with no browser chrome it is the app's own wall rather than a
 * white strip above it.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e6eafa" },
    { media: "(prefers-color-scheme: dark)", color: "#182031" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.brand,
    description: dict.landing.blurb,
    // Added to the home screen from Safari, this opens without the address
    // bar and keeps the name short enough to fit under the icon.
    appleWebApp: {
      capable: true,
      title: dict.brand,
      statusBarStyle: "default",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider dict={dict} locale={locale}>
            {children}
            <Toaster richColors closeButton />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
