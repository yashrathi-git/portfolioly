"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type StepContainerProps = {
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  onAddAnother?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loadingText?: string | null;
};

export function StepContainer({
  title,
  description,
  children,
  onNext,
  onAddAnother,
  nextLabel = "Save & Continue",
  nextDisabled,
  loadingText,
}: StepContainerProps) {
  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-base text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="px-1 sm:px-0">{children}</div>

      <div className="mt-2 border-t pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 order-2 sm:order-1">
          {/* Empty space for alignment */}
        </div>
        <div className="flex items-center gap-2 order-1 sm:order-2 justify-end">
          {onAddAnother && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={onAddAnother}
                    type="button"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add more sources
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Import data from additional sources like LinkedIn, GitHub,
                    or Resume
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            onClick={onNext}
            disabled={!!nextDisabled}
            type="button"
            className="gap-2"
          >
            {loadingText ? (
              loadingText
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

export default StepContainer;
