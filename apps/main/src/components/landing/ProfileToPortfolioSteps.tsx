"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FileText,
  Github,
  Linkedin,
  Rocket,
  Check,
  Upload,
  Sparkles,
  PartyPopper,
  Loader2,
} from "lucide-react";
import Image from "next/image";

const steps = [
  {
    id: 1,
    title: "Import Your Data",
    description: "Upload your resume, connect GitHub, or import from LinkedIn",
    icon: Upload,
  },
  {
    id: 2,
    title: "AI Extracts & Formats",
    description: "Our AI structures your experience into a beautiful layout",
    icon: Sparkles,
  },
  {
    id: 3,
    title: "One Click Deploy",
    description: "Deploy instantly with your custom domain - yourname.com",
    icon: Rocket,
  },
];

const DURATION = 4000;

function StepOneContent() {
  const [animState, setAnimState] = useState<
    "initial" | "clicked" | "uploading" | "uploaded"
  >("initial");

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimState("clicked"), 600);
    const timer2 = setTimeout(() => setAnimState("uploading"), 1200);
    const timer3 = setTimeout(() => setAnimState("uploaded"), 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const sources = [
    { icon: FileText, label: "Resume", color: "text-blue-500" },
    { icon: Github, label: "GitHub", color: "text-foreground" },
    { icon: Linkedin, label: "LinkedIn", color: "text-blue-600" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6 sm:p-10">
      <div className="text-center mb-2">
        <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Choose Your Source
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          Import from any of these sources
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-lg">
        {sources.map((source, i) => {
          const isResume = source.label === "Resume";
          const isSelected = isResume && animState !== "initial";

          return (
            <motion.div
              key={source.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isSelected ? 1.05 : 1,
              }}
              transition={{ delay: i * 0.15 }}
              className={cn(
                "flex flex-col items-center gap-3 p-5 sm:p-8 rounded-xl border transition-colors cursor-pointer group relative",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "p-4 rounded-full bg-muted group-hover:scale-110 transition-transform",
                  source.color
                )}
              >
                <source.icon className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <span className="text-sm sm:text-base font-medium text-foreground">
                {source.label}
              </span>

              {/* PDF upload animation for Resume */}
              <AnimatePresence>
                {isResume && animState === "uploading" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full"
                  >
                    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Uploading...
                      </span>
                    </div>
                  </motion.div>
                )}
                {isResume && animState === "uploaded" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full"
                  >
                    <div className="flex items-center gap-2 bg-card border border-primary/30 rounded-lg px-3 py-2 shadow-lg">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-xs text-foreground whitespace-nowrap">
                        Jake_Resume.pdf
                      </span>
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StepTwoContent() {
  const items = [
    "Extracting work experience...",
    "Parsing skills & technologies...",
    "Formatting projects...",
    "Generating portfolio layout...",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-6 sm:p-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="p-5 rounded-full bg-primary/10">
          <Sparkles className="h-12 w-12 sm:h-14 sm:w-14 text-primary" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      <div className="space-y-4 w-full max-w-sm">
        {items.map((item, i) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.3 }}
            className="flex items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.3 + 0.2 }}
            >
              <Check className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="text-sm sm:text-base text-muted-foreground">
              {item}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StepThreeContent() {
  const [deployState, setDeployState] = useState<
    "idle" | "menu" | "deploying" | "deployed"
  >("idle");

  // Auto-play the deploy animation (fits within 4s step duration)
  useEffect(() => {
    const timer1 = setTimeout(() => setDeployState("menu"), 500);
    const timer2 = setTimeout(() => setDeployState("deploying"), 1400);
    const timer3 = setTimeout(() => setDeployState("deployed"), 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleDeploy = () => {
    if (deployState === "idle") {
      setDeployState("menu");
      setTimeout(() => setDeployState("deploying"), 1200);
      setTimeout(() => setDeployState("deployed"), 2700);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6">
      <div className="relative w-full max-w-2xl">
        {/* Browser Frame */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
          {/* Browser Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-background rounded-md px-3 py-1.5 text-xs text-muted-foreground text-center">
                {deployState === "deployed"
                  ? "jake.vercel.app"
                  : "portfolioly.app/edit"}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="relative aspect-[16/10] bg-background">
            {/* Portfolio Screenshot */}
            <Image
              src="https://media.portfolioly.app/hero/traditional_ss.png"
              alt="Portfolio preview"
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 700px"
              loading="eager"
              priority={false}
              fetchPriority="low"
            />

            {/* Deploy Button Overlay */}
            <AnimatePresence>
              {deployState === "idle" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center"
                >
                  <motion.button
                    onClick={handleDeploy}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-2 shadow-lg"
                  >
                    <Rocket className="h-5 w-5" />
                    Deploy to Web
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deploy Menu */}
            <AnimatePresence>
              {deployState === "menu" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-card rounded-xl border border-border p-6 shadow-2xl max-w-xs w-full mx-4"
                  >
                    <h4 className="font-semibold text-foreground mb-4 text-center">
                      Deploy Options
                    </h4>
                    <div className="space-y-3">
                      <motion.div
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{
                          duration: 0.5,
                          repeat: 2,
                          repeatType: "reverse",
                        }}
                        className="p-3 rounded-lg bg-primary/10 border-2 border-primary flex items-center gap-3 cursor-pointer"
                      >
                        <Rocket className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            One-Click Deploy
                          </p>
                          <p className="text-xs text-muted-foreground">
                            jake.vercel.app
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deploying State */}
            <AnimatePresence>
              {deployState === "deploying" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      Deploying...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deployed Success */}
            <AnimatePresence>
              {deployState === "deployed" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", damping: 10 }}
                      className="mb-4"
                    >
                      <PartyPopper className="h-12 w-12 text-primary mx-auto" />
                    </motion.div>
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p className="text-lg font-semibold text-foreground mb-1">
                        Deployed! 🎉
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Live at{" "}
                        <span className="text-primary font-medium">
                          jake.vercel.app
                        </span>
                      </p>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Caption */}
        <p className="text-xs sm:text-sm text-muted-foreground text-center mt-4">
          Free hosting • Custom domain • SSL included
        </p>
      </div>
    </div>
  );
}

export function ProfileToPortfolioSteps() {
  const [activeStep, setActiveStep] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    setActiveStep(0);
    setAnimationKey((prev) => prev + 1);

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, DURATION);

    return () => clearInterval(interval);
  }, [isInView]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <StepOneContent />;
      case 1:
        return <StepTwoContent />;
      case 2:
        return <StepThreeContent />;
      default:
        return <StepOneContent />;
    }
  };

  return (
    <section
      id="steps"
      ref={sectionRef}
      className="py-20 sm:py-28 bg-background overflow-hidden scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Profile to Portfolio in 3 Steps
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Turn your professional history into a stunning website in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Side: Steps */}
          <div className="space-y-3 lg:col-span-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "relative pl-4 py-4 pr-4 rounded-xl transition-all duration-300 cursor-pointer group border",
                    activeStep === index
                      ? "bg-muted/50 border-border"
                      : "border-transparent hover:bg-muted/30"
                  )}
                  onClick={() => setActiveStep(index)}
                >
                  {/* Progress indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-border rounded-full overflow-hidden">
                    {activeStep === index && isInView && (
                      <motion.div
                        key={`progress-${animationKey}-${index}`}
                        initial={{ height: "0%" }}
                        animate={{ height: "100%" }}
                        transition={{
                          duration: DURATION / 1000,
                          ease: "linear",
                        }}
                        className="w-full bg-primary"
                      />
                    )}
                    {activeStep > index && (
                      <div className="w-full h-full bg-primary" />
                    )}
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                        activeStep === index
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          "text-sm font-semibold transition-colors duration-300",
                          activeStep === index
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground/80"
                        )}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={cn(
                          "text-xs mt-1 transition-colors duration-300",
                          activeStep === index
                            ? "text-muted-foreground"
                            : "text-muted-foreground/60"
                        )}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side: Interactive UI - Bigger */}
          <div className="lg:col-span-9">
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden min-h-[400px] sm:min-h-[480px] lg:min-h-[520px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full min-h-[400px] sm:min-h-[480px] lg:min-h-[520px]"
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
