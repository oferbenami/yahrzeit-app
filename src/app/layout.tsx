import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = "https://yzcor-reminder-community-app.vercel.app";

export const metadata: Metadata = {
  title: "יזכור — אזכרות וזיכרון משפחתי",
  description: "ניהול אזכרות, ימי זיכרון, תפילות וקברי משפחה — הכל במקום אחד",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "יזכור — אזכרות וזיכרון משפחתי",
    description: "ניהול אזכרות, ימי זיכרון, תפילות וקברי משפחה",
    url: APP_URL,
    siteName: "יזכור",
    images: [
      {
        url: "/open.png",
        width: 512,
        height: 512,
        alt: "יזכור — נר נשמה",
      },
    ],
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "יזכור — אזכרות וזיכרון משפחתי",
    description: "ניהול אזכרות, ימי זיכרון, תפילות וקברי משפחה",
    images: ["/open.png"],
  },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
