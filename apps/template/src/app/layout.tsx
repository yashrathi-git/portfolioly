import type { Metadata } from "next";
import "./globals.css";
import "@portfolioly/template-components/styles.css";

export const metadata: Metadata = {
  title: "Portfolio Preview",
  description: "Preview your portfolio",
};

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
