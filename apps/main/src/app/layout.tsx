import type { Metadata } from "next";
import "./globals.css";
import RootProviders from "@/components/RootProviders";
import HeaderBar from "@/components/HeaderBar";
import { getThemeScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Portfolioly",
  description: "Your portfolio management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
      <body className="min-h-dvh antialiased grid grid-rows-[auto_1fr]">
        <RootProviders>
          <HeaderBar />
          <main className="min-h-0">{children}</main>
        </RootProviders>
      </body>
    </html>
  );
}
