import { ChatPortfolio } from "@portfolioly/template-components/src/client";
import type { Profile, Suggestion } from "@portfolioly/template-components";

export default function App() {
  const profile: Profile = {
    name: "Alex Chen",
    badge: "Chat Portfolio",
    links: [
      { type: "github", href: "#" },
      { type: "mail", href: "#" },
      { type: "link", href: "#" },
    ],
  };

  const suggestions = [
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
  ];

  const presets: Record<string, string> = {
    Me: "…",
    Projects: "…",
  };

  return (
    <ChatPortfolio
      profile={profile}
      suggestions={suggestions}
      presets={presets}
    />
  );
}
