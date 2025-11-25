"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { WandIcon } from "@/components/icons/PortfoliolyWandIcon";
import { FileText, Sparkles } from "lucide-react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 border-border bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});
Circle.displayName = "Circle";

export function ImportDataBeamDemo({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linkedInRef = useRef<HTMLDivElement>(null);
  const githubRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden p-6",
        className
      )}
      ref={containerRef}
    >
      <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
        {/* Source icons column */}
        <div className="flex flex-col justify-center gap-4">
          <Circle ref={linkedInRef}>
            <LinkedInIcon className="size-6 text-[#0A66C2]" />
          </Circle>
          <Circle ref={githubRef}>
            <GitHubIcon className="size-6 text-black" />
          </Circle>
          <Circle ref={resumeRef}>
            <FileText className="size-6 text-red-500" />
          </Circle>
        </div>

        {/* AI Processing center */}
        <div className="flex flex-col justify-center">
          <Circle ref={aiRef} className="size-12">
            <Sparkles className="size-6 text-black" />
          </Circle>
        </div>

        {/* Portfolioly output */}
        <div className="flex flex-col justify-center">
          <Circle ref={portfolioRef} className="size-12">
            <WandIcon className="size-6 text-black" />
          </Circle>
        </div>
      </div>

      {/* Beams from sources to AI */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={linkedInRef}
        toRef={aiRef}
        curvature={-40}
        endXOffset={-24}
        gradientStartColor="#0A66C2"
        gradientStopColor="#8b5cf6"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={githubRef}
        toRef={aiRef}
        endXOffset={-24}
        gradientStartColor="#333"
        gradientStopColor="#8b5cf6"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={resumeRef}
        toRef={aiRef}
        curvature={40}
        endXOffset={-24}
        gradientStartColor="#ef4444"
        gradientStopColor="#8b5cf6"
      />

      {/* Beam from AI to Portfolio */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={aiRef}
        toRef={portfolioRef}
        startXOffset={24}
        endXOffset={-24}
        gradientStartColor="#8b5cf6"
        gradientStopColor="#6366f1"
      />
    </div>
  );
}
