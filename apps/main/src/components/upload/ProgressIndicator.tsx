"use client";

import { Progress } from "@/components/ui/progress";
import { ListChecks } from "lucide-react";

type ProgressIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  className?: string;
};

export function ProgressIndicator({
  currentStep,
  totalSteps,
  className,
}: ProgressIndicatorProps) {
  const percent = Math.round((currentStep / totalSteps) * 100);
  return (
    <div className={className}>
      <div className="mb-2 text-center">
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          Step {currentStep} of {totalSteps}
        </p>
      </div>
      <Progress value={percent} className="h-2 rounded-full" />
    </div>
  );
}

export default ProgressIndicator;
