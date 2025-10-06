"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Suggestions } from "./Suggestions";
import { Composer } from "./Composer";
import type { Suggestion } from "./types";

type EmptyStateProps = {
  title?: string;
  subtitle?: string;
  description?: string;
  suggestions?: Suggestion[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  onPick?: (s: Suggestion) => void;
};

export const EmptyState = ({
  title,
  subtitle,
  description,
  suggestions,
  inputValue,
  onInputChange,
  onSubmit,
  onPick,
}: EmptyStateProps) => {
  return (
    <div className="absolute inset-0 grid place-items-center">
      {/* Use outer container padding from ChatPortfolio; avoid double padding here */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mx-auto w-full max-w-screen-2xl"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto size-20 md:size-24 rounded-2xl bg-gradient-to-br from-[oklch(0.84_0.07_250)] to-[oklch(0.74_0.15_310)] grid place-items-center text-white shadow-lg shadow-[oklch(0.74_0.15_310)]/20"
        >
          <Sparkles className="size-8 md:size-9" />
        </motion.div>
        {title ? (
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-[var(--foreground)] to-[var(--foreground)]/70 bg-clip-text"
          >
            {title}
          </motion.h1>
        ) : null}
        {subtitle ? (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 text-lg md:text-xl font-medium text-[color:var(--muted-foreground)]"
          >
            {subtitle}
          </motion.p>
        ) : null}
        {description ? (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-2 text-sm md:text-base text-[color:var(--muted-foreground)]/80"
          >
            {description}
          </motion.p>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Composer
            layoutId="composer"
            value={inputValue}
            onChange={onInputChange}
            onSubmit={onSubmit}
            className="mt-8 mx-auto w-full max-w-screen-2xl"
            autoFocus
          />
        </motion.div>

        {suggestions?.length ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Suggestions
              items={suggestions}
              onPick={
                onPick
                  ? onPick
                  : (s) =>
                      onSubmitFromSuggestion(
                        s,
                        inputValue,
                        onInputChange,
                        onSubmit
                      )
              }
              variant="initial"
              className="mt-6"
              // ensure only first five are shown initially
              maxVisible={5}
            />
          </motion.div>
        ) : null}

        {suggestions?.length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 text-[11px] md:text-xs text-[color:var(--muted-foreground)]"
          >
            Ask anything about this portfolio. If something is missing, I'll tap
            our AI assistant to help.
          </motion.div>
        ) : null}
      </motion.div>
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
