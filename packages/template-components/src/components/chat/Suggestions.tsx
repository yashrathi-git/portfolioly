"use client";

import { type Suggestion } from "./types";
import { cn } from "../../lib/utils";
import {
  type LucideIcon,
  User,
  FolderGit2,
  Wrench,
  Briefcase,
  Mail,
  Circle,
  Link as LinkIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const ICONS: Record<string, LucideIcon> = {
  user: User,
  folderGit2: FolderGit2,
  wrench: Wrench,
  briefcase: Briefcase,
  mail: Mail,
  link: LinkIcon,
};

// Prompt expansion mapping: single word -> full prompt
const PROMPT_EXPANSION: Record<string, string> = {
  Me: "Tell me about yourself",
  Projects: "Show me your projects",
  Experience: "Tell me about your experience",
  Contact: "How can I contact you?",
  Skills: "What are your skills?",
};

type SuggestionsProps = {
  items: Suggestion[];
  onPick: (s: Suggestion) => void;
  variant?: "initial" | "inline";
  maxVisible?: number;
  onShowMore?: () => void;
  showMoreLabel?: string;
  className?: string;
};

export const Suggestions = ({
  items,
  onPick,
  variant = "inline",
  maxVisible = 5,
  onShowMore,
  showMoreLabel = "Show more",
  className,
}: SuggestionsProps) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (!items || items.length === 0) {
    return null;
  }

  // Extract single word from label for display
  const getSingleWord = (label: string): string => {
    // Check if label matches a known expansion pattern
    for (const [word, expansion] of Object.entries(PROMPT_EXPANSION)) {
      if (label.toLowerCase().includes(word.toLowerCase())) {
        return word;
      }
    }
    // Fallback: use first word
    return label.split(" ")[0];
  };

  // Get full prompt for submission
  const getFullPrompt = (label: string): string => {
    const singleWord = getSingleWord(label);
    return PROMPT_EXPANSION[singleWord] || label;
  };

  // Handle suggestion click with prompt expansion
  const handlePick = (s: Suggestion) => {
    const fullPrompt = getFullPrompt(s.label);
    onPick({ ...s, label: fullPrompt });
  };

  if (variant === "initial") {
    return (
      <div
        className={cn(
          "flex flex-wrap justify-center gap-2.5 mx-auto",
          className
        )}
      >
        {items.slice(0, 5).map((s, index) => {
          const Icon = ICONS[s.icon] ?? Circle;
          const singleWord = getSingleWord(s.label);

          return (
            <motion.button
              key={s.id}
              type="button"
              onClick={() => handlePick(s)}
              initial={
                prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.01 }
                  : {
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                      delay: index * 0.05,
                    }
              }
              whileHover={
                prefersReducedMotion
                  ? {}
                  : {
                      y: -2,
                      transition: { duration: 0.2 },
                    }
              }
              whileTap={
                prefersReducedMotion
                  ? {}
                  : {
                      scale: 0.98,
                      transition: { duration: 0.1 },
                    }
              }
              className="group flex flex-col items-center gap-2 rounded-2xl px-4 py-3 min-w-[90px] bg-white/40 dark:bg-white/5 backdrop-blur-[12px] border border-black/[0.05] dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02)] hover:bg-white/60 dark:hover:bg-white/[0.08] hover:border-black/10 dark:hover:border-white/15 hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              aria-label={getFullPrompt(s.label)}
            >
              <Icon className="size-5 text-[color:var(--muted-foreground)] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
              <span className="font-medium text-sm">{singleWord}</span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  const visible = items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 sm:gap-2.5", className)}
    >
      {visible.map((s) => {
        const Icon = ICONS[s.icon] ?? Circle;
        const singleWord = getSingleWord(s.label);

        return (
          <motion.button
            key={s.id}
            type="button"
            onClick={() => handlePick(s)}
            whileHover={
              prefersReducedMotion
                ? {}
                : {
                    y: -2,
                    transition: { duration: 0.2 },
                  }
            }
            whileTap={
              prefersReducedMotion
                ? {}
                : {
                    scale: 0.98,
                    transition: { duration: 0.1 },
                  }
            }
            className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-white/40 dark:bg-white/5 backdrop-blur-[12px] border border-black/[0.05] dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02)] hover:bg-white/60 dark:hover:bg-white/[0.08] hover:border-black/10 dark:hover:border-white/15 hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            aria-label={getFullPrompt(s.label)}
          >
            <Icon className="size-4 text-[color:var(--muted-foreground)] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
            <span className="font-medium">{singleWord}</span>
          </motion.button>
        );
      })}
      {hasMore && (
        <button
          type="button"
          onClick={onShowMore}
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-black/[0.05] dark:border-white/10 bg-white/30 dark:bg-white/[0.03] px-4 py-2 text-sm text-[color:var(--muted-foreground)] hover:bg-white/50 dark:hover:bg-white/[0.06]] transition-all duration-200"
          aria-label={showMoreLabel}
        >
          {showMoreLabel}
        </button>
      )}
    </div>
  );
};

export default Suggestions;
