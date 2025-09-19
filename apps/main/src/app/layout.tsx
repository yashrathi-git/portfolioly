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
      <body className="antialiased">
        <RootProviders>
          <HeaderBar />
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
