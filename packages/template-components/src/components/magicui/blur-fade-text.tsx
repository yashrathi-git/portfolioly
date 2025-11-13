"use client";

import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import { useMemo } from "react";

interface BlurFadeTextProps {
  text: string;
  className?: string;
  variant?: {
    hidden: { y: number };
    visible: { y: number };
  };
  duration?: number;
  characterDelay?: number;
  delay?: number;
  yOffset?: number;
  animateByCharacter?: boolean;
}
const BlurFadeText = ({
  text,
  className,
  variant,
  characterDelay = 0.03,
  delay = 0,
  yOffset = 8,
  animateByCharacter = false,
}: BlurFadeTextProps) => {
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: "blur(8px)" },
    visible: { y: -yOffset, opacity: 1, filter: "blur(0px)" },
  };
  const combinedVariants = variant || defaultVariants;
  const characters = useMemo(() => Array.from(text), [text]);

  const baseTransition = {
    delay,
    ease: "easeOut",
    duration: 0.5,
  };

  if (animateByCharacter) {
    return (
      <div className="flex flex-wrap">
        {characters.map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            initial="hidden"
            animate="visible"
            variants={combinedVariants}
            transition={{
              ...baseTransition,
              delay: delay + i * characterDelay,
            }}
            className={cn("inline-block", className)}
            style={{ width: char.trim() === "" ? "0.2em" : "auto" }}
          >
            {char}
          </motion.span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex">
      <motion.span
        initial="hidden"
        animate="visible"
        variants={combinedVariants}
        transition={baseTransition}
        className={cn("inline-block", className)}
      >
        {text}
      </motion.span>
    </div>
  );
};

export default BlurFadeText;
