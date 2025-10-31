import BlurFade from "../magicui/blur-fade";
import { ResumeCard } from "../resume-card";
import type { DisplayWorkExperience } from "@portfolioly/schema";

const BLUR_FADE_DELAY = 0.04;

export type WorkExperienceProps = {
  items?: DisplayWorkExperience[];
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

export function WorkExperience({ items = [] }: WorkExperienceProps) {
  const visibleItems = items.filter(hasRequiredProps);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section id="work" className="px-6 pb-16">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex min-h-0 flex-col gap-y-3">
          <BlurFade delay={BLUR_FADE_DELAY * 5}>
            <h2 className="text-xl font-bold">Work Experience</h2>
          </BlurFade>
          {visibleItems.map((work, idx) => (
            <BlurFade
              key={`${work.companyName ?? "experience"}-${idx}`}
              delay={BLUR_FADE_DELAY * 6 + idx * 0.05}
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
