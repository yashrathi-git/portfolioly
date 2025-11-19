"use client";

import { motion } from "framer-motion";
import { Suggestions } from "./Suggestions";
import { Composer } from "./Composer";
import type { Suggestion } from "./types";
import { useState, useEffect } from "react";
import { User } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  subtitle?: string;
  description?: string;
  suggestions?: Suggestion[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  onPick?: (s: Suggestion) => void;
  avatarUrl?: string;
  disabled?: boolean;
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
  avatarUrl,
  disabled = false,
}: EmptyStateProps) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Character-by-character animation for greeting
  const greetingText = title ? `Hi I'm ${title} 👋` : "";
  const subtitleText = "Let's chat";

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    const timer = setTimeout(() => setAnimationComplete(true), 1000);
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div className="absolute inset-0 grid place-items-center py-[10vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center mx-auto w-full px-4"
      >
        {/* Avatar */}
        <motion.div
          initial={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 0, scale: 0.8, rotate: -2 }
          }
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : {
                  duration: 0.6,
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0,
                }
          }
          onAnimationComplete={() => setAnimationComplete(true)}
          style={{
            willChange: animationComplete ? "auto" : "transform, opacity",
          }}
          className="mx-auto w-24 h-24 md:w-32 md:h-32 rounded-full border-[3px] border-black/[0.06] dark:border-white/10 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.04)] overflow-hidden relative"
          role="img"
          aria-label={`${title || "Profile"} avatar`}
        >
          {/* Placeholder - shown when no image or while loading */}
          {(!avatarUrl || !imageLoaded) && (
            <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.84_0.07_250)] to-[oklch(0.74_0.15_310)] flex items-center justify-center">
              <User
                className="w-12 h-12 md:w-16 md:h-16 text-white/80"
                strokeWidth={1.5}
              />
            </div>
          )}

          {/* Actual image */}
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={title || "Profile"}
              loading="eager"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </motion.div>

        {/* Greeting Text */}
        <div className="mt-8 space-y-1">
          <motion.h1
            initial={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : {
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                    delay: 0.1,
                  }
            }
            className="text-2xl md:text-4xl font-medium tracking-tight leading-tight"
          >
            {prefersReducedMotion ? (
              <span>
                Hi I'm <span className="font-semibold">{title}</span> 👋
              </span>
            ) : (
              greetingText.split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1],
                    delay: 0.1 + i * 0.02,
                  }}
                  className={
                    title &&
                    greetingText.indexOf(title) <= i &&
                    i < greetingText.indexOf(title) + title.length
                      ? "font-semibold"
                      : ""
                  }
                >
                  {char}
                </motion.span>
              ))
            )}
          </motion.h1>
          <motion.p
            initial={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : {
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                    delay: 0.2,
                  }
            }
            className="text-xl md:text-2xl font-light text-[color:var(--muted-foreground)]/80"
          >
            {subtitleText}
          </motion.p>
        </div>

        {/* Input Field - Constrained width */}
        <motion.div
          initial={
            prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : {
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.3,
                }
          }
          className="mt-10 mx-auto max-w-[650px]"
        >
          <Composer
            layoutId="composer"
            value={inputValue}
            onChange={onInputChange}
            onSubmit={onSubmit}
            className="w-full"
            disabled={disabled}
          />
        </motion.div>

        {/* Suggestions - Can overflow composer, centered */}
        {suggestions?.length ? (
          <motion.div
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
                    delay: 0.4,
                  }
            }
            className="mt-6 flex justify-center"
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
              maxVisible={5}
              disabled={disabled}
            />
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
  setTimeout(() => onSubmit(), 0);
}

export default EmptyState;
