"use client";

import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { typography } from "../../lib/typography";

type ComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  layoutId?: string;
  className?: string;
  autoFocus?: boolean;
};

export const Composer = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask about my projects, skills, or say hi…",
  layoutId,
  className,
  autoFocus,
}: ComposerProps) => {
  return (
    <motion.div layoutId={layoutId} className={cn("w-full", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="relative"
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={1}
          autoFocus={autoFocus}
          className={cn(
            // Size - 48px mobile, 56px desktop
            "w-full resize-none h-12 md:h-14",
            "px-5 py-4 pr-14",
            // Shape
            "rounded-2xl",
            // Glass morphism background with backdrop blur
            "bg-white/60 dark:bg-white/[0.05]",
            "backdrop-blur-xl",
            // Border
            "border-[1.5px] border-black/[0.06] dark:border-white/10",
            // Multi-layered soft shadows
            "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]",
            // Focus state - professional neutral elevation
            "outline-none",
            "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            "focus:bg-white/70 dark:focus:bg-white/[0.08]",
            "focus:border-black/[0.12] dark:focus:border-white/[0.18]",
            "focus:shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.08)]",
            "dark:focus:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2)]",
            // Placeholder styling - only hide when there's text
            "placeholder:text-[color:var(--muted-foreground)]",
            "placeholder:opacity-50",
            typography.input.responsive
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center size-10 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm hover:opacity-95 transition active:scale-[0.98]"
          aria-label="Send message"
        >
          <ArrowUp className="size-5" />
        </button>
      </form>
    </motion.div>
  );
};

export default Composer;
