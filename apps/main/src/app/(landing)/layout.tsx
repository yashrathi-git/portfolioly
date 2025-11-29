import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolioly.app"),
  title: {
    default:
      "Free AI Portfolio Builder | Create Portfolio from LinkedIn & GitHub in Seconds - Portfolioly",
    template: "%s | Portfolioly",
  },
  description:
    "Build your professional portfolio website free in 2 clicks. AI-powered portfolio builder that imports from LinkedIn PDF, GitHub, or resume. No coding needed. Deploy instantly to Vercel.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Free AI Portfolio Builder - Create in 2 Clicks | Portfolioly",
    description:
      "Turn your LinkedIn or GitHub into a stunning portfolio website. AI-powered, 100% free & open source. Deploy to Vercel instantly.",
    images: [
      {
        url: "https://media.portfolioly.app/hero/portfolioly-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Portfolioly - Free AI Portfolio Builder that creates stunning portfolios from LinkedIn and GitHub",
      },
    ],
    type: "website",
    siteName: "Portfolioly",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Portfolio Builder | Portfolioly",
    description:
      "Create your portfolio website in seconds. Import from LinkedIn or GitHub. 100% free & open source.",
    creator: "@YashRathi876371",
  },
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
  keywords: [
    // Primary low-difficulty keywords (target these!)
    "AI portfolio builder",
    "free portfolio builder",
    "portfolio website builder free",
    "LinkedIn to portfolio",
    "GitHub to portfolio",
    "resume to portfolio",
    // Secondary keywords
    "free portfolio website",
    "portfolio builder",
    "personal website builder",
    "free portfolio maker",
    "online portfolio creator",
    "developer portfolio",
    "programmer portfolio",
    "software engineer portfolio",
    // Long-tail keywords
    "create portfolio website free",
    "build personal website free",
    "portfolio website generator",
    "no code portfolio builder",
    "instant portfolio builder",
    "AI resume to website",
    "GitHub profile to portfolio",
    "LinkedIn PDF to portfolio",
    // Feature-specific
    "chat based portfolio",
    "interactive portfolio",
    "one click portfolio deploy",
    "vercel portfolio deployment",
    "open source portfolio builder",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Portfolioly",
  applicationCategory: "DesignApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  url: "https://portfolioly.app",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Free AI-powered portfolio builder. Create a professional portfolio website from your LinkedIn profile, GitHub, or resume in seconds. No coding required.",
  featureList: [
    "AI-powered portfolio generation",
    "Import from LinkedIn PDF",
    "Import from GitHub profile",
    "Upload resume PDF",
    "Multiple portfolio layouts",
    "One-click Vercel deployment",
    "Custom themes and colors",
    "Chat-based portfolio mode",
    "100% free and open source",
  ],
  screenshot: "https://media.portfolioly.app/hero/portfolioly-banner.jpg",
  author: {
    "@type": "Person",
    name: "Yash Rathi",
    url: "https://github.com/yashrathi-git",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    ratingCount: "1",
    bestRating: "5",
    worstRating: "1",
  },
};

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-dvh flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
