import {
  ChatPortfolio,
  examplePortfolioData,
} from "@portfolioly/template-components/src/client";
import type { Profile, Suggestion } from "@portfolioly/template-components";

export default function Home() {
  const profile: Profile = {
    name: "Alex Chen",
    badge: "Chat Portfolio",
    links: [
      { type: "github", href: "#" },
      { type: "mail", href: "#" },
      { type: "link", href: "#" },
    ],
  };

  const suggestions: Suggestion[] = [
    { id: "me", label: "Me", icon: "user", color: "bg-[oklch(0.74_0.15_310)]" },
    {
      id: "projects",
      label: "Projects",
      icon: "folderGit2",
      color: "bg-[oklch(0.646_0.222_41.116)]",
    },
    {
      id: "skills",
      label: "Skills",
      icon: "wrench",
      color: "bg-[oklch(0.6_0.118_184.704)]",
    },
    {
      id: "fun",
      label: "Fun",
      icon: "smile",
      color: "bg-[oklch(0.828_0.189_84.429)]",
    },
    {
      id: "contact",
      label: "Contact",
      icon: "mail",
      color: "bg-[oklch(0.769_0.188_70.08)]",
    },
    // add more to demonstrate inline "show more"
    { id: "stack", label: "Tech Stack", icon: "wrench" },
    { id: "latest", label: "Latest Work", icon: "folderGit2" },
    { id: "about", label: "About", icon: "user" },
    { id: "hobbies", label: "Hobbies", icon: "smile" },
    { id: "education", label: "Education", icon: "user" },
  ];

  const presets: Record<string, string> = {
    Me: `I'm Alex Chen — a product-focused frontend engineer crafting elegant, fast interfaces with React, Next.js, and motion. I obsess over micro-interactions, accessibility, and performance.`,
    Projects: `Recent work:\n• Aura — A minimalist AI notes app with semantic search.\n• Kino — Film discovery site with delightful transitions.\n• Loomis — A finance dashboard with realtime charts.\nAsk me about any project to see details and links.`,
    Skills: `Core: React, Next.js (App Router), TypeScript, Tailwind v4, Shadcn/UI\nTooling: Vite, Vitest, Playwright, Turborepo\nUX: Motion design, accessibility (WCAG), design systems`,
    Fun: `Outside of work: film photography, specialty coffee, and cycling. Always down for a coffee chat ☕️`,
    Contact: `Best ways to reach me:\n• Email: alex@example.com\n• GitHub: github.com/alexchen\n• Portfolio: alexchen.dev`,
    "Tech Stack": `React • Next.js • TypeScript • Tailwind v4 • Shadcn/UI • Framer Motion`,
    "Latest Work": `Recently shipped Aura 1.2 with faster sync and new semantic search. Want a demo?`,
    About: `I love building calm software with delightful motion and accessibility at the core.`,
    Hobbies: `Film photography, specialty coffee, cycling, and learning generative art.`,
    Education: `I studied Computer Science at University of Somewhere, graduating in 2019.`,
  };

  return (
    <ChatPortfolio
      profile={profile}
      suggestions={suggestions}
      presets={presets}
      portfolioData={examplePortfolioData}
    />
  );
}
