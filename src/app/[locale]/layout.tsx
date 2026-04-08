import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import "../globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "יזכור - לזכרם לעד",
    template: "%s | יזכור",
  },
  description: "אפליקציה לניהול יזכור ותזכורות זיכרון משפחתיות",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "יזכור",
  },
  formatDetection: { telephone: false },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "he" | "en")) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={heebo.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#1a56db" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Prevent FOUC for dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                const sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (t === 'dark' || (!t && sys)) {
                  document.documentElement.classList.add('dark');
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-[family-name:var(--font-heebo)] antialiased">
        {/* Skip navigation for keyboard users */}
        <a href="#main-content" className="skip-nav">
          דלג לתוכן הראשי
        </a>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
