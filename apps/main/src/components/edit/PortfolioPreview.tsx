"use client";

import { ChatPortfolio } from "@portfolioly/template-components";
import type {
  Profile,
  Suggestion,
  PortfolioData,
} from "@portfolioly/template-components";

// Import the compiled CSS styles to ensure they're loaded
import "@portfolioly/template-components/style.css";

export interface PortfolioPreviewProps {
  data: PortfolioData;
}

export function PortfolioPreview({ data }: PortfolioPreviewProps) {
  // Use constants as specified in requirements - will be replaced with dynamic data later
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
    { id: "me", label: "Me", icon: "user" },
    { id: "projects", label: "Projects", icon: "folderGit2" },
    { id: "skills", label: "Skills", icon: "wrench" },
    { id: "fun", label: "Fun", icon: "smile" },
    { id: "contact", label: "Contact", icon: "mail" },
  ];

  const presets: Record<string, string> = {
    Me: "I'm Alex Chen, a passionate software developer with expertise in React, TypeScript, and modern web technologies. I love building user-friendly applications and solving complex problems.",
    Projects:
      "I've worked on various projects including e-commerce platforms, portfolio websites, and mobile applications. Check out my GitHub for more details!",
    Skills:
      "My technical skills include React, TypeScript, Next.js, Node.js, Python, PostgreSQL, and cloud technologies like AWS and Firebase.",
    Fun: "When I'm not coding, I enjoy hiking, photography, and experimenting with new recipes. I'm also a coffee enthusiast and love exploring local cafes!",
    Contact:
      "Feel free to reach out via email or connect with me on LinkedIn. I'm always open to discussing new opportunities and interesting projects.",
  };

  return (
    <ChatPortfolio
      profile={profile}
      suggestions={suggestions}
      presets={presets}
      portfolioData={data}
    />
  );
}

export default PortfolioPreview;
