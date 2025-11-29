"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  User,
  Briefcase,
  Sparkles,
  Wand2,
  Check,
} from "lucide-react";

interface LoadingScreenProps {
  hasResume?: boolean;
  message?: string;
}

interface ExtractionStep {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: number;
}

// Total ~45s before last step waits
const extractionSteps: ExtractionStep[] = [
  { id: 1, label: "Reading document", icon: FileText, duration: 3000 },
  { id: 2, label: "Extracting profile", icon: User, duration: 10000 },
  { id: 3, label: "Analyzing experience", icon: Briefcase, duration: 14000 },
  { id: 4, label: "Processing skills", icon: Sparkles, duration: 12000 },
  { id: 5, label: "Building portfolio", icon: Wand2, duration: 0 },
];

type StepStatus = "pending" | "active" | "complete";

function StepRow({
  step,
  status,
}: {
  step: ExtractionStep;
  status: StepStatus;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center text-xs
          transition-all duration-300
          ${status === "complete" ? "bg-primary text-primary-foreground" : ""}
          ${status === "active" ? "bg-primary/15 text-primary" : ""}
          ${status === "pending" ? "bg-muted/50 text-muted-foreground/40" : ""}
        `}
      >
        <AnimatePresence mode="wait">
          {status === "complete" ? (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Check className="w-3 h-3" strokeWidth={3} />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              animate={status === "active" ? { scale: [1, 1.1, 1] } : {}}
              transition={
                status === "active"
                  ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  : {}
              }
            >
              <Icon className="w-3 h-3" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span
        className={`
          text-sm transition-colors duration-200
          ${status === "complete" ? "text-muted-foreground" : ""}
          ${status === "active" ? "text-foreground font-medium" : ""}
          ${status === "pending" ? "text-muted-foreground/50" : ""}
        `}
      >
        {step.label}
        {status === "active" && (
          <motion.span
            className="inline-block ml-0.5 text-primary"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ...
          </motion.span>
        )}
      </span>
    </motion.div>
  );
}

function QuickLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center space-y-4">
        <motion.div
          className="relative w-10 h-10 mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
        <p className="text-sm text-muted-foreground">
          {message || "Creating portfolio..."}
        </p>
      </div>
    </div>
  );
}

export function LoadingScreen({
  hasResume = true,
  message,
}: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const getStatus = (stepId: number): StepStatus => {
    if (completedSteps.has(stepId)) return "complete";
    if (stepId === currentStep) return "active";
    return "pending";
  };

  useEffect(() => {
    if (!hasResume) return;

    const step = extractionSteps.find((s) => s.id === currentStep);
    if (!step || step.duration === 0) return;

    const timer = setTimeout(() => {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      if (currentStep < extractionSteps.length) {
        setCurrentStep((prev) => prev + 1);
      }
    }, step.duration);

    return () => clearTimeout(timer);
  }, [currentStep, hasResume]);

  if (!hasResume) {
    return <QuickLoader message={message} />;
  }

  return (
    <div className="flex items-center justify-center min-h-[350px] p-4">
      <motion.div
        className="w-full max-w-xs space-y-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 text-primary">
          <motion.div
            className="w-4 h-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          <span className="text-xs font-medium uppercase tracking-wide">
            AI Processing
          </span>
        </div>

        {/* Steps */}
        <div className="space-y-2.5">
          {extractionSteps.map((step) => (
            <StepRow key={step.id} step={step} status={getStatus(step.id)} />
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/70 pt-2">
          Usually takes 30-60 seconds
        </p>
      </motion.div>
    </div>
  );
}
