import type { Metadata } from "next";
import type { ReactNode } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Props = {
  params: Promise<{ username: string }>;
  children: ReactNode;
};

// Fetch basic portfolio info for metadata
async function getPortfolioMeta(username: string) {
  try {
    // First get public token
    const tokenRes = await fetch(`${API_BASE_URL}/public/ensure-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
      next: { revalidate: 3600 },
    });
    if (!tokenRes.ok) return null;
    const { token } = await tokenRes.json();

    // Fetch portfolio data
    const res = await fetch(
      `${API_BASE_URL}/public/portfolio/${encodeURIComponent(username)}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const portfolio = await getPortfolioMeta(username);

  if (!portfolio) {
    return {
      title: `${username}'s Portfolio`,
      description: `View ${username}'s professional portfolio on Portfolioly.`,
    };
  }

  const name = portfolio.name || username;
  const title = portfolio.headline
    ? `${name} - ${portfolio.headline}`
    : `${name}'s Portfolio`;
  const description =
    portfolio.summary ||
    `View ${name}'s professional portfolio, projects, and experience.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/p/${username}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      images: portfolio.avatar_url
        ? [{ url: portfolio.avatar_url, alt: `${name}'s profile photo` }]
        : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return children;
}
