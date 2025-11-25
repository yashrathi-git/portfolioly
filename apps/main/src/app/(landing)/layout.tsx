import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolioly.app"),
  title: {
    default:
      "Portfolioly - Free AI Portfolio Builder | Create Your Portfolio in Seconds",
    template: "%s | Portfolioly",
  },
  description:
    "Build a stunning portfolio website for free. Import from LinkedIn or GitHub and let AI create your professional portfolio in seconds. No coding required.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Portfolioly - Free AI Portfolio Builder",
    description:
      "Turn your LinkedIn or GitHub into a beautiful portfolio website in seconds. 100% free, no coding required.",
    images: ["https://media.portfolioly.app/hero/portfolioly-banner.jpg"],
    type: "website",
    siteName: "Portfolioly",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolioly - Free AI Portfolio Builder",
    description:
      "Create your portfolio website in seconds. Import from LinkedIn or GitHub. 100% free.",
    creator: "@portfolioly",
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
    "free portfolio website",
    "portfolio builder",
    "personal website builder",
    "free portfolio maker",
    "online portfolio",
    "professional portfolio",
    "career portfolio",
    "work portfolio",
    "developer portfolio",
    "github portfolio",
    "programmer portfolio",
    "designer portfolio",
    "tech portfolio",
    "AI portfolio builder",
    "linkedin to portfolio",
    "resume to website",
    "github to portfolio",
    "create portfolio website free",
    "build personal website free",
    "portfolio website generator",
    "online portfolio creator",
    "free personal website",
    "software engineer portfolio",
    "frontend developer portfolio",
    "backend developer portfolio",
    "full stack developer portfolio",
    "student portfolio",
    "no code portfolio builder",
    "no code website builder",
    "resume website builder",
    "cv to portfolio",
    "interactive resume",
    "instant portfolio",
    "fast portfolio builder",
    "AI resume builder",
    "chat based portfolio",
    "GPT portfolio builder",
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
    "Free AI-powered portfolio builder. Create a professional portfolio website from your LinkedIn profile or GitHub in seconds.",
  featureList: [
    "Import from LinkedIn PDF",
    "Import from GitHub",
    "AI-powered content generation",
    "Multiple portfolio layouts",
    "One-click deployment",
    "Custom themes",
  ],
  screenshot: "https://media.portfolioly.app/hero/portfolioly-banner.jpg",
  author: {
    "@type": "Organization",
    name: "Portfolioly",
    url: "https://portfolioly.app",
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
