"use client";

import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { LandingHeader } from "./LandingHeader";
import { DemoCarousel } from "./DemoCarousel";
import Link from "next/link";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

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

const FEATURES = [
  "100% Free",
  "One Click Deploy",
  "Custom Domain",
  "Open Source",
];

// Avatar colors for the user indicator (3 avatars)
const AVATAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-violet-500"];

export function Hero() {
  return (
    <div className="relative bg-background">
      <LandingHeader />
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-20 sm:py-24 lg:py-28">
          <div className="text-center">
            {/* User Indicator - Above Title */}
            <motion.div
              className="mb-6 flex items-center justify-center gap-2"
              variants={ENTRY_VARIANTS}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              <div className="flex -space-x-2">
                {AVATAR_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className={`h-7 w-7 rounded-full ${color} ring-2 ring-background flex items-center justify-center`}
                  >
                    <span className="text-[10px] font-medium text-white">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground ml-1">
                500+ portfolios created
              </span>
            </motion.div>

            {/* Headline with gradient on "two clicks" - responsive */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <span className="text-foreground">Beautiful portfolio in </span>
              <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                two clicks
              </span>
            </motion.h1>
            <motion.p
              className="mt-6 text-pretty text-base text-muted-foreground sm:text-lg/8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            >
              Use your LinkedIn, GitHub, or upload a resume. Our AI extracts
              your experience and builds a stunning portfolio. One click deploy.
              Share with the world.
            </motion.p>

            {/* Feature Ticks */}
            <motion.div
              className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
              variants={ENTRY_VARIANTS}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            >
              {FEATURES.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </motion.div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-opacity"
                >
                  Generate Portfolio
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
                  href="https://github.com/yashrathi-git/portfolioly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <GitHubLogoIcon className="h-4 w-4" />
                  Star on GitHub
                </Link>
              </motion.div>
              <motion.div
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{
                  duration: 0.5,
                  delay: 0.7,
                  ease: "easeOut",
                }}
              >
                <Link
                  href="/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Live Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Large Demo Section - Auto-rotating Carousel */}
        <motion.div
          className="mx-auto max-w-screen-xl px-0 sm:px-6 pb-16"
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
