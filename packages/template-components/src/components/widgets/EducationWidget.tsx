"use client";

import type { DisplayEducation } from "@portfolioly/schema";
import { typography } from "../../lib/typography";
import { cn } from "../../lib/utils";
import BlurFade from "../magicui/blur-fade";
import { WIDGET_ANIMATION } from "../../lib/constants/animations";

export type EducationWidgetProps = {
  heading?: string;
  items: DisplayEducation[];
};

export const EducationWidget = ({
  heading = "Education",
  items,
}: EducationWidgetProps) => {
  const visibleItems = (items || []).filter((item) => {
    return Boolean(
      item.school || item.degree || item.start || item.end || item.location
    );
  });

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <BlurFade
      delay={WIDGET_ANIMATION.delay}
      duration={WIDGET_ANIMATION.duration}
      yOffset={WIDGET_ANIMATION.yOffset}
      blur={WIDGET_ANIMATION.blur}
    >
      <div className="relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm text-card-foreground shadow-sm">
        <div className="p-5 sm:p-6">
          <h3
            className={cn("font-semibold mb-4", typography.heading.secondary)}
          >
            {heading}
          </h3>
          <ol className="relative border-s pl-5 space-y-4">
            {visibleItems.map((ed, idx) => {
              return (
                <li key={(ed.school || "") + idx} className="ms-3">
                  <div className="absolute -start-[5px] mt-1 size-2 rounded-full bg-[var(--primary)]" />
                  <div className="rounded-xl border bg-[var(--secondary)]/70 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        {ed.school ? (
                          <div
                            className={cn(
                              "font-semibold leading-tight",
                              typography.heading.tertiary
                            )}
                          >
                            {ed.school}
                          </div>
                        ) : null}
                        {ed.degree && (
                          <div
                            className={cn(
                              "text-[color:var(--muted-foreground)]",
                              typography.label.small
                            )}
                          >
                            {ed.degree}
                          </div>
                        )}
                      </div>
                      {(ed.start || ed.end) && (
                        <div
                          className={cn(
                            "px-2 py-0.5 rounded-full bg-[var(--input)]/70 text-foreground/80",
                            typography.label.small
                          )}
                        >
                          {ed.start || "—"} — {ed.end || "—"}
                        </div>
                      )}
                    </div>

                    {ed.location && (
                      <div
                        className={cn(
                          "mt-2 text-[color:var(--muted-foreground)]",
                          typography.label.small
                        )}
                      >
                        {ed.location}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </BlurFade>
  );
};

export default EducationWidget;
