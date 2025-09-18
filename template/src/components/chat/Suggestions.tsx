"use client";

import { type Suggestion } from "./types";
import { cn } from "@/lib/utils";
import {
  type LucideIcon,
  User,
  FolderGit2,
  Wrench,
  Smile,
  Mail,
  Circle,
  Link as LinkIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  user: User,
  folderGit2: FolderGit2,
  wrench: Wrench,
  smile: Smile,
  mail: Mail,
  link: LinkIcon,
};

type SuggestionsProps = {
  items: Suggestion[];
  onPick: (s: Suggestion) => void;
  variant?: "initial" | "inline";
  maxVisible?: number; // for inline variant
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
  if (variant === "initial") {
    return (
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3", className)}>
        {items.slice(0, 5).map((s) => {
          const Icon = ICONS[s.icon] ?? Circle;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick(s)}
              className="group rounded-2xl p-2.5 sm:p-3 bg-[var(--card)]/70 border border-[color:var(--border)]/70 hover:bg-[var(--accent)] transition shadow-sm text-left flex flex-col items-center"
            >
              <div
                className={cn(
                  "size-9 sm:size-10 rounded-xl grid place-items-center text-white shadow",
                  s.color || "bg-[oklch(0.74_0.15_310)]"
                )}
              >
                <Icon className="size-4 sm:size-5" />
              </div>
              <span className="mt-2 sm:mt-2.5 text-[13px] sm:text-sm font-medium text-center">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const visible = items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;
  return (
    <div className={cn("flex flex-wrap items-center gap-2 sm:gap-3", className)}>
      {visible.map((s) => {
        const Icon = ICONS[s.icon] ?? Circle;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s)}
            className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/80 bg-[var(--card)]/70 backdrop-blur px-3.5 sm:px-4 py-2 text-sm sm:text-[15px] hover:bg-[var(--accent)] transition shadow-sm"
          >
            <Icon className="size-4 sm:size-5 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--secondary-foreground)]" />
            <span className="font-medium">{s.label}</span>
          </button>
        );
      })}
      {hasMore && (
        <button
          type="button"
          onClick={onShowMore}
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-[color:var(--border)]/80 bg-[var(--card)]/50 px-3.5 sm:px-4 py-2 text-sm sm:text-[15px] text-[color:var(--muted-foreground)] hover:bg-[var(--accent)] transition"
        >
          {showMoreLabel}
        </button>
      )}
    </div>
  );
};

export default Suggestions;