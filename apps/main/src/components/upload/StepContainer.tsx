"use client";

import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, SkipForward } from "lucide-react";

type StepContainerProps = {
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loadingText?: string | null;
};

export function StepContainer({
  title,
  description,
  children,
  onBack,
  onSkip,
  onNext,
  nextLabel = "Next",
  nextDisabled,
  loadingText,
}: StepContainerProps) {
  return (
    <Card className="rounded-xl shadow-sm border-border/80">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-base text-muted-foreground">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
      <CardFooter className="mt-2 border-t pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBack ? (
            <Button
              variant="outline"
              onClick={onBack}
              type="button"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}
        </div>
        <div className="flex items-center gap-2">
          {onSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              type="button"
              className="gap-2"
            >
              <SkipForward className="h-4 w-4" />
              Skip
            </Button>
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
      </CardFooter>
    </Card>
  );
}

export default StepContainer;
