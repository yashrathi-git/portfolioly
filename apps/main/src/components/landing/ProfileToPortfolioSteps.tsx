"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: 1,
    title: "Import Data",
    description: "Import from LinkedIn, GitHub, or Resume.",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=3270&auto=format&fit=crop", // Placeholder
  },
  {
    id: 2,
    title: "Edit & Customize",
    description: "Refine your data and choose your style.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=3272&auto=format&fit=crop", // Placeholder
  },
  {
    id: 3,
    title: "Publish",
    description: "Deploy your portfolio with one click.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop", // Placeholder
  },
];

const DURATION = 5000; // 5 seconds per step

export function ProfileToPortfolioSteps() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, DURATION);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Profile to Portfolio in 3 Steps
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Turn your professional history into a stunning website in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Side: Steps */}
          <div className="space-y-4 lg:col-span-5">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "relative pl-6 py-3 pr-4 rounded-r-xl transition-all duration-500 cursor-pointer group",
                  activeStep === index ? "bg-muted/40" : "hover:bg-muted/20"
                )}
                onClick={() => setActiveStep(index)}
              >
                {/* Vertical Progress Bar Indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground/10 rounded-l-xl overflow-hidden">
                  {activeStep === index && (
                    <motion.div
                      layoutId="active-step-indicator"
                      initial={{ height: "0%" }}
                      animate={{ height: "100%" }}
                      transition={{ duration: DURATION / 1000, ease: "linear" }}
                      className="w-full bg-primary absolute top-0 left-0"
                    />
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors duration-300 mt-0.5",
                      activeStep === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                    )}
                  >
                    {step.id}
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3
                      className={cn(
                        "text-base font-semibold transition-colors duration-300",
                        activeStep === index ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                      )}
                    >
                      {step.title}
                    </h3>
                    
                    <AnimatePresence initial={false}>
                      {activeStep === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side: Carousel */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border bg-muted shadow-sm lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeStep}
                src={steps[activeStep].image}
                alt={steps[activeStep].title}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
