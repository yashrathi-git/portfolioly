import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getThemeScript } from "@/lib/theme";

const siteConfig = {
  name: "Portfolioly",
  url: "https://portfolioly.app",
  ogImage: "https://media.portfolioly.app/hero/portfolioly-banner.jpg",
  description:
    "Build your professional portfolio website free in 2 minutes. AI imports from LinkedIn, GitHub, or resume. No coding needed. Deploy instantly.",
  creator: "Yash Rathi",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default:
      "Free AI Portfolio Builder | Create Portfolio from LinkedIn & GitHub - Portfolioly",
    template: "%s | Portfolioly",
  },
  description: siteConfig.description,
  keywords: [
    // Primary low-difficulty keywords (highest priority)
    "AI portfolio builder",
    "free portfolio builder",
    "portfolio website builder free",
    "LinkedIn to portfolio",
    "GitHub to portfolio",
    "resume to portfolio",
    // For developers
    "developer portfolio",
    "programmer portfolio",
    "software engineer portfolio",
    "GitHub portfolio",
    // For non-tech users
    "personal website builder",
    "professional portfolio",
    "job seeker portfolio",
    "freelancer portfolio",
    "no code portfolio builder",
    // Long-tail
    "create portfolio website free",
    "portfolio generator",
    "instant portfolio builder",
    "open source portfolio builder",
  ],
  authors: [
    { name: siteConfig.creator, url: "https://github.com/yashrathi-git" },
  ],
  creator: siteConfig.creator,
  publisher: siteConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon-192.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: "Free AI Portfolio Builder - Create in 2 Minutes | Portfolioly",
    description:
      "Turn your LinkedIn or GitHub into a stunning portfolio website. AI-powered, 100% free & open source. No coding required.",
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "Portfolioly - Free AI Portfolio Builder that creates stunning portfolios from LinkedIn and GitHub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Portfolio Builder | Portfolioly",
    description:
      "Create your portfolio website in 2 minutes. Import from LinkedIn or GitHub. 100% free & open source.",
    images: [siteConfig.ogImage],
    creator: "@YashRathi876371",
  },
  alternates: {
    canonical: siteConfig.url,
  },
  category: "technology",
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
