"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: 1,
    title: "Import Data",
    description: "Import from LinkedIn, GitHub, or Resume.",
    image: "https://media.portfolioly.app/hero/steps/import-data.webp",
  },
  {
    id: 2,
    title: "Edit & Customize",
    description: "Refine your data and choose your style.",
    image: "https://media.portfolioly.app/hero/steps/edit-portfolio.webp",
  },
  {
    id: 3,
    title: "Publish",
    description: "Deploy your portfolio with one click.",
    image: "https://media.portfolioly.app/hero/steps/deploy-to-vercel.webp",
  },
];

const DURATION = 5000;

export function ProfileToPortfolioSteps() {
  const [activeStep, setActiveStep] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    // Reset to first step and restart animation when section comes into view
    setActiveStep(0);
    setAnimationKey((prev) => prev + 1);

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, DURATION);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section ref={sectionRef} className="py-24 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Profile to Portfolio in 3 Steps
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Turn your professional history into a stunning website in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Side: Steps */}
          <div className="space-y-2 lg:col-span-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "relative pl-4 py-3 pr-3 rounded-lg transition-all duration-300 cursor-pointer group",
                  activeStep === index ? "bg-muted/50" : "hover:bg-muted/30"
                )}
                onClick={() => setActiveStep(index)}
              >
                {/* Progress indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border rounded-full overflow-hidden">
                  {activeStep === index && isInView && (
                    <motion.div
                      key={`progress-${animationKey}-${index}`}
                      initial={{ height: "0%" }}
                      animate={{ height: "100%" }}
                      transition={{ duration: DURATION / 1000, ease: "linear" }}
                      className="w-full bg-primary"
                    />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors duration-300",
                      activeStep === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                    )}
                  >
                    {step.id}
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        activeStep === index
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground/80"
                      )}
                    >
                      {step.title}
                    </h3>
                    <AnimatePresence initial={false}>
                      {activeStep === index && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-xs text-muted-foreground mt-0.5 overflow-hidden"
                        >
                          {step.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side: Image */}
          <div className="flex items-center justify-center lg:col-span-8 h-[400px] lg:h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-xl border bg-muted/30 shadow-lg max-h-full"
              >
                <img
                  src={steps[activeStep].image}
                  alt={steps[activeStep].title}
                  className="w-auto h-auto max-w-full max-h-[400px] lg:max-h-[500px] object-contain"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
