import BlurFade from "../magicui/blur-fade";
import { ResumeCard } from "../resume-card";
import type { DisplayWorkExperience } from "@portfolioly/schema";
import { cn } from "../../lib/utils";
import {
  BLUR_FADE_DELAY,
  SECTION_DELAYS,
  WIDGET_ANIMATION,
} from "../../lib/constants/animations";
import { typography } from "../../lib/typography";

export interface WorkExperienceSectionProps {
  items?: DisplayWorkExperience[];
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

function normalizeDescription(points?: string[] | string | null) {
  if (!points) {
    return undefined;
  }

  if (typeof points === "string") {
    return points;
  }

  const filtered = points
    .filter((point) => typeof point === "string" && point.trim().length > 0)
    .map((point) => point.trim());

  if (filtered.length === 0) {
    return undefined;
  }

  return filtered.join("\n");
}

function hasRequiredProps(item: DisplayWorkExperience) {
  return Boolean(
    item.companyName?.trim() &&
      (item.start?.trim() ||
        item.end?.trim() ||
        normalizeDescription(item.points))
  );
}

export function WorkExperienceSection({
  items = [],
  heading = "Work Experience",
  variant = "traditional",
  className,
}: WorkExperienceSectionProps) {
  const visibleItems = items.filter(hasRequiredProps);
  if (visibleItems.length === 0) {
    return null;
  }

  if (variant === "widget") {
    return (
      <BlurFade
        delay={WIDGET_ANIMATION.delay}
        duration={WIDGET_ANIMATION.duration}
        yOffset={WIDGET_ANIMATION.yOffset}
        blur={WIDGET_ANIMATION.blur}
      >
        <div
          className={cn(
            "rounded-2xl border bg-card/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm",
            className
          )}
        >
          <h3
            className={cn("font-semibold mb-4", typography.heading.secondary)}
          >
            {heading}
          </h3>
          <div className="space-y-3">
            {visibleItems.map((work, idx) => (
              <ResumeCard
                key={`${work.companyName ?? "experience"}-${idx}`}
                logoUrl={work.logoUrl ?? undefined}
                altText={work.companyName ?? "Company"}
                title={work.companyName ?? ""}
                subtitle={work.role ?? undefined}
                badges={work.technologies}
                period={formatPeriod(work.start, work.end)}
                description={normalizeDescription(work.points)}
              />
            ))}
          </div>
        </div>
      </BlurFade>
    );
  }

  // Traditional variant
  return (
    <section id="work" className={cn("px-6 pb-16", className)}>
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex min-h-0 flex-col gap-y-3">
          <BlurFade delay={BLUR_FADE_DELAY * SECTION_DELAYS.workExperience}>
            <h2 className="text-xl font-bold">{heading}</h2>
          </BlurFade>
          {visibleItems.map((work, idx) => (
            <BlurFade
              key={`${work.companyName ?? "experience"}-${idx}`}
              delay={
                BLUR_FADE_DELAY * (SECTION_DELAYS.workExperience + 1) +
                idx * 0.05
              }
            >
              <ResumeCard
                logoUrl={work.logoUrl ?? undefined}
                altText={work.companyName ?? "Company"}
                title={work.companyName ?? ""}
                subtitle={work.role ?? undefined}
                badges={work.technologies}
                period={formatPeriod(work.start, work.end)}
                description={normalizeDescription(work.points)}
              />
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
