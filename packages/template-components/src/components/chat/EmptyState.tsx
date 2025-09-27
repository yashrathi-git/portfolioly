"use client";

import { Sparkles } from "lucide-react";
import { Suggestions } from "./Suggestions";
import { Composer } from "./Composer";
import type { Suggestion } from "./types";

type EmptyStateProps = {
  title: string;
  subtitle: string;
  suggestions: Suggestion[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  onPick?: (s: Suggestion) => void;
};

export const EmptyState = ({
  title,
  subtitle,
  suggestions,
  inputValue,
  onInputChange,
  onSubmit,
  onPick,
}: EmptyStateProps) => {
  return (
    <div className="absolute inset-0 grid place-items-center">
      {/* Use outer container padding from ChatPortfolio; avoid double padding here */}
      <div className="text-center mx-auto w-full max-w-screen-2xl">
        <div className="mx-auto size-20 md:size-24 rounded-2xl bg-[var(--secondary)] grid place-items-center text-[color:var(--secondary-foreground)] shadow-sm">
          <Sparkles className="size-8 md:size-9" />
        </div>
        <h1 className="mt-6 text-3xl md:text-5xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-base md:text-lg text-[color:var(--muted-foreground)]">
          {subtitle}
        </p>

        <Composer
          layoutId="composer"
          value={inputValue}
          onChange={onInputChange}
          onSubmit={onSubmit}
          className="mt-6 mx-auto w-full max-w-screen-2xl"
          autoFocus
        />

        <Suggestions
          items={suggestions}
          onPick={onPick ? onPick : (s) => onSubmitFromSuggestion(s, inputValue, onInputChange, onSubmit)}
          variant="initial"
          className="mt-6"
          // ensure only first five are shown initially
          maxVisible={5}
        />

        <div className="mt-8 text-[11px] md:text-xs text-[color:var(--muted-foreground)]">
          Built as a minimal, aesthetic chat portfolio. Future replies may include rich components.
        </div>
      </div>
    </div>
  );
};

function onSubmitFromSuggestion(
  s: Suggestion,
  _value: string,
  onInputChange: (v: string) => void,
  onSubmit: () => void
) {
  onInputChange(s.label);
  // submit immediately for snappy UX
  setTimeout(() => onSubmit(), 0);
}

export default EmptyState;