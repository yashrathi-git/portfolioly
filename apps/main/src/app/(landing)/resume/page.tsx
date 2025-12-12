"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Footer } from "@/components/landing/Footer";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

const ENTRY_VARIANTS = {
  hidden: { opacity: 0, y: 10, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const FEATURES = [
  "Open Source",
  "ATS-Friendly Format",
  "One-Click Export",
  "Free Forever",
];

export default function ResumeBuilderPage() {
  return (
    <div className="relative bg-background min-h-dvh flex flex-col">
      <LandingHeader />

      <main className="flex-1 flex items-center justify-center">
        <div className="relative isolate px-6 lg:px-8 w-full">
          <div className="mx-auto max-w-4xl py-16 sm:py-20 lg:py-24">
            <div className="flex flex-col items-center text-center">
              {/* Badge */}
              <motion.div
                className="mb-8"
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 hover:bg-primary/10 transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Build Your Portfolio
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                </Link>
              </motion.div>

              {/* Headline */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <span className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] bg-clip-text text-transparent">
                  LinkedIn
                </span>
                <span className="text-foreground"> → </span>
                <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                  Resume
                </span>
              </motion.h1>

              <motion.p
                className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Transform your LinkedIn profile or GitHub into a professional,
                ATS-friendly resume. AI extracts and formats your experience
                perfectly.
              </motion.p>

              {/* Feature Ticks */}
              <motion.div
                className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {FEATURES.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground"
                  >
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Link href="/resume-builder/list">
                  <ShimmerButton className="h-14 px-10 text-lg font-medium">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </ShimmerButton>
                </Link>
                <a
                  href="https://github.com/yashrathi-git/portfolioly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-14 px-6 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground font-medium"
                >
                  <GitHubLogoIcon className="h-5 w-5" />
                  <span>Star on GitHub</span>
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
