"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatHeader from "./chat/Header";
import { EmptyState } from "./chat/EmptyState";
import { Thread } from "./chat/Thread";
import { Composer } from "./chat/Composer";
import { Suggestions } from "./chat/Suggestions";
import type { Message, Profile, Suggestion } from "./chat/types";
import type { PortfolioData, examplePortfolioData } from "../types/portfolio";
import styles from "./portfolio-theme.module.css";
import PortfolioErrorBoundary from "./ErrorBoundary";
import {
  requiresExternalData,
  useComponentDataTracking,
} from "../utils/component-flags";

export type ChatPortfolioProps = {
  profile?: Profile;
  suggestions?: Suggestion[]; // full list
  presets?: Record<string, string>; // label -> assistant reply
  portfolioData?: PortfolioData | null;
  isLoading?: boolean;
  error?: string;
};

const ChatPortfolioComponent = ({
  profile,
  suggestions = [],
  presets = {},
  portfolioData,
  isLoading = false,
  error,
}: ChatPortfolioProps) => {
  // Track component data usage in development
  useComponentDataTracking("ChatPortfolio", portfolioData, {
    dataSource: "api",
    description:
      "Interactive chat-based portfolio requiring portfolio data for dynamic responses and widget content",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [inlineMax, setInlineMax] = useState(5);
  const listRef = useRef<HTMLDivElement>(null);

  const hasStarted = messages.length > 0;

  // Use provided data or fallback to example data
  const effectivePortfolioData = portfolioData || examplePortfolioData;
  const effectiveProfile = profile || {
    name: effectivePortfolioData.profile.name,
    title: effectivePortfolioData.profile.headline,
    avatarUrl:
      effectivePortfolioData.profile.profile_photo_url ||
      effectivePortfolioData.profile.avatarUrl,
  };

  // Show loading state
  if (isLoading && !portfolioData) {
    return (
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]`}
      >
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)]">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !portfolioData) {
    return (
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]`}
      >
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">
            Failed to Load Portfolio
          </h2>
          <p className="text-[var(--muted-foreground)] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Data for widgets (now using effective data)
  const aboutData = {
    name: effectiveProfile.name,
    title: effectiveProfile.title || effectivePortfolioData.profile.headline,
    summary:
      "I design and build elegant interfaces with React/Next.js, focusing on performance, accessibility, and delightful motion.",
    location: "San Francisco, CA · Remote-friendly",
    largeImage: true,
    paragraphs: [
      "I'm a product-focused engineer who sweats the details — from micro-interactions and tactile motion to crisp typography and thoughtful spacing.",
      "My process blends design intuition with engineering rigor: fast prototypes, accessibility-first reviews, and performance budgets to ship delightful, durable work.",
    ],
    strengths: [
      "Building design systems that scale across products",
      "Crafting smooth, meaningful motion with performance in mind",
      "Accessibility (WCAG) baked into the workflow",
      "Clear communication with design and product",
    ],
  };

  const projectsData = {
    heading: "Selected Projects",
    projects: (effectivePortfolioData.projects || []).map(
      (p: any, i: number) => ({
        // schema-based fields, plus dummy stars for now
        name: p.name,
        role: p.role,
        one_line_description: p.one_line_description,
        highlights: p.highlights,
        technologies: p.technologies,
        github: p.github,
        live_link: p.live_link,
        stars: 128 + i * 7, // dummy stars until API integration
      })
    ),
  } as const;

  const skillsData = {
    heading: "Skills",
    categories: [
      {
        title: "Core",
        items: [
          { name: "React", level: 90 },
          { name: "Next.js (App Router)", level: 88 },
          { name: "TypeScript", level: 85 },
          { name: "Tailwind v4", level: 86 },
        ],
      },
      {
        title: "UX & Motion",
        items: [
          { name: "Accessibility (WCAG)", level: 80 },
          { name: "Framer Motion", level: 82 },
          { name: "Design Systems", level: 84 },
        ],
      },
      {
        title: "Tooling",
        items: [
          { name: "Vite", chip: true },
          { name: "Vitest", chip: true },
          { name: "Playwright", chip: true },
          { name: "Turborepo", chip: true },
        ],
      },
      {
        title: "Cloud & Data",
        items: [
          { name: "Edge/RSC", chip: true },
          { name: "REST/GraphQL", chip: true },
          { name: "Charts", chip: true },
        ],
      },
    ],
  };

  const contactData = {
    heading: "Contact",
    items: [
      {
        id: "email",
        kind: "email",
        label: "alex@example.com",
        href: "mailto:alex@example.com",
        sub: "Email",
      },
      {
        id: "github",
        kind: "github",
        label: "github.com/alexchen",
        href: "#",
        sub: "GitHub",
      },
      {
        id: "site",
        kind: "website",
        label: "alexchen.dev",
        href: "#",
        sub: "Website",
      },
      {
        id: "linkedin",
        kind: "linkedin",
        label: "linkedin.com/in/alexchen",
        href: "#",
        sub: "LinkedIn",
      },
    ],
  } as const;

  const experienceData = {
    heading: "Work Experience",
    items: [
      {
        companyName: "Acme Inc.",
        role: "Senior Frontend Engineer",
        location: "San Francisco, CA (Hybrid)",
        start: "Jan 2022",
        end: "Present",
        points: [
          "Led migration to Next.js App Router and RSC, improving TTI by 38%",
          "Built design system components with Shadcn/UI + Tailwind v4",
          "Partnered with Design to craft micro-interactions using Framer Motion",
        ],
      },
      {
        companyName: "Nimbus Labs",
        role: "Frontend Engineer",
        location: "Remote",
        start: "Jul 2019",
        end: "Dec 2021",
        points: [
          "Shipped analytics dashboard with realtime charts and theming",
          "Improved accessibility scores to AA across core flows",
        ],
      },
    ],
  };

  const educationData = {
    heading: "Education",
    items: effectivePortfolioData.education || [],
  } as const;

  // Auto-scroll on new messages
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  const chooseWidget = (text: string) => {
    const t = text.toLowerCase();
    if (
      /(^|\b)(work experience|experience|employment|resume|career)(\b|$)/.test(
        t
      )
    ) {
      return { name: "experience" as const, props: experienceData };
    }
    if (/(^|\b)(me|about|yourself|who are you)(\b|$)/.test(t)) {
      return { name: "about" as const, props: aboutData };
    }
    if (
      t.includes("project") ||
      t.includes("work") ||
      t.includes("portfolio") ||
      t.includes("latest")
    ) {
      return { name: "projects" as const, props: projectsData };
    }
    if (t.includes("skill") || t.includes("stack") || t.includes("tech")) {
      return { name: "skills" as const, props: skillsData };
    }
    if (
      t.includes("education") ||
      t.includes("school") ||
      t.includes("university") ||
      t.includes("college") ||
      t.includes("degree")
    ) {
      return { name: "education" as const, props: educationData };
    }
    if (t.includes("contact") || t.includes("email") || t.includes("reach")) {
      return { name: "contact" as const, props: contactData };
    }
    // Match suggestion labels exact
    const hit = suggestions.find((s) => s.label.toLowerCase() === t);
    if (hit) {
      if (hit.id === "me" || hit.id === "about")
        return { name: "about" as const, props: aboutData };
      if (hit.id === "projects" || hit.id === "latest")
        return { name: "projects" as const, props: projectsData };
      if (hit.id === "skills" || hit.id === "stack")
        return { name: "skills" as const, props: skillsData };
      if (hit.id === "contact")
        return { name: "contact" as const, props: contactData };
      if (hit.id === "education")
        return { name: "education" as const, props: educationData };
    }
    return null;
  };

  const sendUserMessage = (text: string) => {
    const value = text.trim();
    if (!value) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: value,
    };
    setMessages((m) => [...m, userMsg]);

    // Simulate assistant thinking then reply with either widget or text
    setIsThinking(true);

    const widget = chooseWidget(value);
    const assistantContent =
      presets[value] ||
      "Thanks for your message! This portfolio uses rich UI replies. Try asking about projects, skills, or contact.";

    setTimeout(() => {
      const reply: Message = widget
        ? { id: crypto.randomUUID(), role: "assistant", content: "", widget }
        : {
            id: crypto.randomUUID(),
            role: "assistant",
            content: assistantContent,
          };
      setMessages((m) => [...m, reply]);
      setIsThinking(false);
    }, 600);
  };

  const onSubmit = () => {
    const text = input;
    setInput("");
    sendUserMessage(text);
  };

  const onPickSuggestion = (s: Suggestion) => sendUserMessage(s.label);

  return (
    <PortfolioErrorBoundary fallbackData={examplePortfolioData}>
      <div
        className={`${styles.portfolioTheme} min-h-[100svh] w-full relative overflow-hidden bg-[var(--background)] text-[var(--foreground)] flex flex-col px-3 sm:px-0`}
      >
        {/* Ambient gradient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full blur-3xl opacity-40 dark:opacity-20 bg-[oklch(0.84_0.07_250)]" />
          <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.74_0.15_310)]" />
          {/* subtle grid overlay */}
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(0,0,0,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.35)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.08]" />
        </div>

        {/* Full-width header (not boxed) */}
        <ChatHeader profile={effectiveProfile} showIdentity={hasStarted} />

        {/* Main content */}
        <div className="flex-1 min-h-0 flex flex-col text-[15px] sm:text-base">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 relative flex-1">
            {!hasStarted ? (
              <EmptyState
                title={`Hi, I'm ${effectiveProfile.name} — let's chat.`}
                subtitle="Ask about projects, skills, or anything you're curious about. Try a quick prompt below."
                suggestions={suggestions}
                inputValue={input}
                onInputChange={setInput}
                onSubmit={onSubmit}
                onPick={onPickSuggestion}
              />
            ) : (
              <div
                ref={listRef}
                className="absolute inset-0 overflow-y-auto pb-40 thin-scrollbar"
              >
                <div className="mx-auto w-full max-w-3xl">
                  <Thread messages={messages} isThinking={isThinking} />
                </div>
                <div className="h-4" />
              </div>
            )}
          </div>

          {/* Composer - transitions to bottom after first message */}
          <AnimatePresence>
            {hasStarted && (
              <motion.div
                key="bottom-composer"
                layoutId="composer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="sticky bottom-0 w-full py-4 bg-gradient-to-t from-transparent via-transparent to-transparent backdrop-blur supports-[backdrop-filter]:backdrop-blur outline-none"
              >
                <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                  {/* Inline suggestions just above input */}
                  <Suggestions
                    items={suggestions}
                    onPick={onPickSuggestion}
                    variant="inline"
                    maxVisible={inlineMax}
                    onShowMore={() => setInlineMax((v) => v + 5)}
                    showMoreLabel="⋯"
                    className="mb-3"
                  />

                  {/* Subtle loading animation */}
                  <AnimatePresence>
                    {isThinking && (
                      <motion.div
                        key="typing-bar"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mb-2 h-1 w-full overflow-hidden rounded-full bg-[var(--input)]"
                      >
                        <motion.div
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.2,
                            ease: "linear",
                          }}
                          className="h-full w-1/3 bg-[oklch(0.74_0.15_310)]/70"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Composer
                    value={input}
                    onChange={setInput}
                    onSubmit={onSubmit}
                    placeholder="Type your message…"
                  />
                  {/* Tech tags (subtle) */}
                  <div className="mt-3 flex items-center gap-3 text-xs sm:text-[13px] text-[color:var(--muted-foreground)]">
                    <span className="inline-flex items-center gap-1">
                      React • Next.js • TypeScript
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Tailwind v4 • Shadcn/UI
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PortfolioErrorBoundary>
  );
};

// Apply the external data requirement flag
export const ChatPortfolio = requiresExternalData({
  dataSource: "api",
  fallbackData: examplePortfolioData,
  description:
    "Interactive chat-based portfolio requiring portfolio data for dynamic responses and widget content",
})(ChatPortfolioComponent);

export default ChatPortfolio;
