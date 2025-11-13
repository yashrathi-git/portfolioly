import BlurFade from "../magicui/blur-fade";
import { ResumeCard } from "../resume-card";
import type { DisplayEducation } from "portfolioly-schema";
import { GraduationCap } from "lucide-react";
import {
  BLUR_FADE_DELAY,
  SECTION_DELAYS,
  WIDGET_ANIMATION,
} from "../../lib/constants/animations";
import { cn } from "../../lib/utils";
import { typography } from "../../lib/typography";

type EducationItem = DisplayEducation & { logoUrl?: string };

export interface EducationSectionProps {
  items?: EducationItem[];
  heading?: string;
  variant?: "traditional" | "widget";
  className?: string;
}

function formatPeriod(start?: string | null, end?: string | null) {
  const sanitizedStart = start?.trim();
  const sanitizedEnd = end?.trim();
  const hasStart = Boolean(sanitizedStart);
  const hasEnd = Boolean(sanitizedEnd);
  const isCurrent = sanitizedEnd?.toLowerCase() === "present";

  if (!hasStart && !hasEnd) {
    return "";
  }

  if (isCurrent || !hasEnd) {
    return `${sanitizedStart ?? ""}${hasStart ? " - " : ""}Present`;
  }

  if (!hasStart) {
    return sanitizedEnd ?? "";
  }

  return `${sanitizedStart} - ${sanitizedEnd}`;
}

function formatDescription(item: DisplayEducation) {
  if (!item.grade?.trim()) {
    return undefined;
  }

  return `Grade: ${item.grade.trim()}`;
}

function hasRequiredProps(item: DisplayEducation) {
  return Boolean(
    item.school?.trim() && (item.start?.trim() || item.end?.trim())
  );
}

export function EducationSection({
  items = [],
  heading = "Education",
  variant = "traditional",
  className,
}: EducationSectionProps) {
  const visibleItems = items.filter(hasRequiredProps);

  if (visibleItems.length === 0) {
    return null;
  }

  // Traditional variant - full section layout
  if (variant === "traditional") {
    return (
      <section id="education" className={cn("px-6 pb-12", className)}>
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <div className="flex min-h-0 flex-col gap-y-3">
            <BlurFade delay={BLUR_FADE_DELAY * SECTION_DELAYS.education}>
              <h2 className="text-2xl font-bold">{heading}</h2>
            </BlurFade>
            {visibleItems.map((education, idx) => (
              <BlurFade
                key={`${education.school ?? "education"}-${idx}`}
                delay={
                  BLUR_FADE_DELAY * (SECTION_DELAYS.education + 1) + idx * 0.05
                }
              >
                <ResumeCard
                  logoUrl={education.logoUrl ?? undefined}
                  altText={education.school ?? "Education"}
                  title={education.school ?? ""}
                  subtitle={education.degree ?? undefined}
                  period={formatPeriod(education.start, education.end)}
                  description={formatDescription(education)}
                  fallbackIcon={
                    <GraduationCap className="size-6 text-muted-foreground" />
                  }
                />
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Widget variant - glass-themed card layout
  return (
    <BlurFade
      delay={WIDGET_ANIMATION.delay}
      duration={WIDGET_ANIMATION.duration}
      yOffset={WIDGET_ANIMATION.yOffset}
      blur={WIDGET_ANIMATION.blur}
    >
      <div
        className={cn(
          "rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm",
          className
        )}
      >
        <div className="p-5 sm:p-6">
          <h3
            className={cn("font-semibold mb-4", typography.heading.secondary)}
          >
            {heading}
          </h3>
          <div className="flex flex-col gap-y-3">
            {visibleItems.map((education, idx) => (
              <BlurFade
                key={`${education.school ?? "education"}-${idx}`}
                delay={
                  WIDGET_ANIMATION.delay +
                  (idx + 1) * WIDGET_ANIMATION.staggerDelay
                }
              >
                <ResumeCard
                  logoUrl={education.logoUrl ?? undefined}
                  altText={education.school ?? "Education"}
                  title={education.school ?? ""}
                  subtitle={education.degree ?? undefined}
                  period={formatPeriod(education.start, education.end)}
                  description={formatDescription(education)}
                  fallbackIcon={
                    <GraduationCap className="size-6 text-muted-foreground" />
                  }
                />
              </BlurFade>
            ))}
          </div>
        </div>
      </div>
    </BlurFade>
  );
}
