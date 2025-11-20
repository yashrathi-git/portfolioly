"use client";

import { ArrowRight, Github } from "lucide-react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { motion } from "framer-motion";
import { LandingHeader } from "./LandingHeader";
import { DemoCarousel } from "./DemoCarousel";
import Link from "next/link";
import { useTheme } from "next-themes";

const ENTRY_VARIANTS = {
  hidden: {
    opacity: 0,
    y: 10,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};

export function Hero() {
  return (
    <div className="relative bg-background">
      <LandingHeader />
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-20 sm:py-24 lg:py-28">
          <div className="mb-6 flex justify-center gap-3">
            <motion.div
              className="rounded-full px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground"
              variants={ENTRY_VARIANTS}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.5,
                delay: 0.3,
                ease: "easeOut",
              }}
            >
              Free & Open Source
            </motion.div>
            <motion.div
              className="rounded-full px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground"
              variants={ENTRY_VARIANTS}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.5,
                delay: 0.5,
                ease: "easeOut",
              }}
            >
              ~2 minutes
            </motion.div>
          </div>
          <div className="text-center">
            <TextEffect
              className="text-balance text-5xl tracking-tight text-foreground sm:text-6xl font-bold"
              preset="fade-in-blur"
              as="h1"
              per="char"
              speedReveal={4}
              segmentTransition={{ duration: 0.5, ease: "easeOut" }}
            >
              Create a beautiful portfolio in two clicks
            </TextEffect>
            <TextEffect
              className="mt-6 text-pretty text-lg text-muted-foreground sm:text-lg/8"
              preset="blur"
              as="p"
              per="line"
              delay={0.5}
              speedReveal={0.8}
              segmentTransition={{ duration: 0.5, ease: "easeOut" }}
            >
              {`Upload your resume or connect your GitHub repository.
Our AI extracts your experience and builds a stunning portfolio.
Share it with the world in seconds.`}
            </TextEffect>
            <div className="mt-8 flex items-center justify-center gap-x-4">
              <motion.div
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{
                  duration: 0.5,
                  delay: 0.5,
                  ease: "easeOut",
                }}
              >
                <Link
                  href="/auth/sign-up"
                  className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-opacity"
                >
                  Start building
                </Link>
              </motion.div>
              <motion.div
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{
                  duration: 0.5,
                  delay: 0.6,
                  ease: "easeOut",
                }}
              >
                <Link
                  href="https://github.com/yourusername/portfolioly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <Github className="h-4 w-4" />
                  Star on GitHub
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Large Demo Section - Auto-rotating Carousel */}
        <motion.div
          className="mx-auto max-w-screen-xl px-3 pb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.8,
            ease: "easeOut",
          }}
        >
          <DemoCarousel />
        </motion.div>
      </div>
    </div>
  );
}
