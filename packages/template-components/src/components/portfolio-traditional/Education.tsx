import BlurFade from "../magicui/blur-fade";
import { ResumeCard } from "../resume-card";
import type { DisplayEducation } from "@portfolioly/schema";
import { GraduationCap } from "lucide-react";

const BLUR_FADE_DELAY = 0.04;

export type EducationSectionProps = {
  items?: DisplayEducation[];
};

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

export function Education({ items = [] }: EducationSectionProps) {
  const visibleItems = items.filter(hasRequiredProps);

  if (visibleItems.length === 0) {
    return null;
  }
  console.log(visibleItems[0]);

  return (
    <section id="education" className="px-6 pb-16">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex min-h-0 flex-col gap-y-3">
          <BlurFade delay={BLUR_FADE_DELAY * 7}>
            <h2 className="text-xl font-bold">Education</h2>
          </BlurFade>
          {visibleItems.map((education, idx) => (
            <BlurFade
              key={`${education.school ?? "education"}-${idx}`}
              delay={BLUR_FADE_DELAY * 8 + idx * 0.05}
            >
              <ResumeCard
                logoUrl={""} // logoUrl removed from display schema
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
