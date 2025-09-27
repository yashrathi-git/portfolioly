"use client";

import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

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
          className="w-full resize-none rounded-full border border-[color:var(--input)]/80 bg-[var(--card)]/80 backdrop-blur px-5 py-4 pr-14 text-base md:text-[17px] outline-none focus:ring-2 focus:ring-[color:var(--ring)]/60 shadow-sm"
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