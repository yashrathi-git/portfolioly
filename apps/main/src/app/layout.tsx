import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getThemeScript } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolioly.app"),
  title: {
    default: "Portfolioly - Free AI Portfolio Builder",
    template: "%s | Portfolioly",
  },
  description:
    "Create a stunning portfolio website in seconds with AI. Import from LinkedIn or GitHub. 100% free, open source.",
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
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeScript(),
          }}
        />
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
