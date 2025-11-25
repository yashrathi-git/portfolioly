import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getThemeScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Portfolioly",
  description: "Your portfolio management platform",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme initialization script to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeScript(),
          }}
        />
        {/* Preconnect to media CDN for faster video loading on landing page */}
        <link
          rel="preconnect"
          href="https://media.portfolioly.app"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://media.portfolioly.app" />
      </head>
      <body className="min-h-dvh antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
