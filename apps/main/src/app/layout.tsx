import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import RootProviders from "@/components/RootProviders";
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
      </head>
      <body className="min-h-dvh antialiased bg-background text-foreground">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
