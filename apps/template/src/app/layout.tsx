import type { Metadata } from "next";
import "./globals.css";
import "portfolioly-template-components/style.css";

export async function generateMetadata(): Promise<Metadata> {
  const username = process.env.NEXT_PUBLIC_USERNAME?.trim();
  const title = username && username.length > 0 ? username : "Portfolio";

  return {
    title,
    description: "Your Portfolioly-powered personal website",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      apple: "/favicon.svg",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
