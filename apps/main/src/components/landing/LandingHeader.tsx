"use client";

import { Sun, Moon, Github } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";
import { WandIcon } from "@/components/icons/PortfoliolyWandIcon";
import { DiscordIcon } from "@/components/icons/DiscordIcon";
import { useScroll } from "motion/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getDiscordLink, GITHUB_REPO_URL } from "@/lib/utils/links";

export function LandingHeader() {
  const { isDark, toggleTheme } = useTheme();
  const [hasScrolled, setHasScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setHasScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pt-4">
        <div
          className={cn(
            "flex w-full items-center justify-between rounded-full border transition-all duration-200 ease-out",
            hasScrolled
              ? "border-zinc-200 bg-white/80 px-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80"
              : "border-transparent bg-transparent px-0 backdrop-blur-0"
          )}
        >
          <div className="flex w-full items-center justify-between p-2">
            <Link href="/" className="flex items-center gap-2 p-1">
              <WandIcon className="h-8 w-auto text-zinc-950 dark:text-white" />
            </Link>

            <div className="flex items-center gap-x-2 sm:gap-x-3">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="View on GitHub"
              >
                <Github className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
              </a>
              <a
                href={getDiscordLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Join Discord"
              >
                <DiscordIcon className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
              </a>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                ) : (
                  <Moon className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                )}
              </button>
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <span>Build My Portfolio</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
