import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Portfolio Demo - See AI Generated Portfolio Examples",
  description:
    "Explore interactive demos of AI-generated portfolio websites. See how Portfolioly transforms your LinkedIn or GitHub into a professional developer portfolio in seconds.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Portfolio Demo - AI Generated Examples | Portfolioly",
    description:
      "See AI-generated portfolio examples in action. Traditional and chat-based layouts available.",
    images: [
      {
        url: "https://media.portfolioly.app/hero/portfolioly-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Portfolioly Demo - AI Generated Portfolio Examples",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return children;
}
