import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import RootProviders from "@/components/RootProviders";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Portfolioly",
  description: "Authentication demo with Firebase and FastAPI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pre-paint theme sync to avoid FOUC */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              const ls = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const isDark = ls ? ls === 'dark' : prefersDark;
              const root = document.documentElement;
              if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
            } catch {}
          `}
        </Script>
      </head>
      <body className="antialiased">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
