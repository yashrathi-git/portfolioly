"use client";

import { Briefcase, MapPin, CalendarDays } from "lucide-react";
import { typography } from "../../lib/typography";
import { cn } from "../../lib/utils";
import { MarkdownContent } from "../../utils/markdown";

export type WorkExperienceItem = {
  companyName?: string;
  location?: string;
  start?: string;
  end?: string;
  role?: string;
  points?: string[];
};

export type WorkExperienceWidgetProps = {
  heading?: string;
  items?: WorkExperienceItem[];
};

export const WorkExperienceWidget = ({
  heading = "Work Experience",
  items = [],
}: WorkExperienceWidgetProps) => {
  const visibleItems = items.filter((item) => {
    return Boolean(
      item.companyName ||
        item.location ||
        item.role ||
        item.start ||
        item.end ||
        (item.points && item.points.length > 0)
    );
  });

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground">
      {/* Glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-30 dark:opacity-15 bg-[oklch(0.646_0.222_41.116)]" />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="size-9 rounded-lg bg-[var(--secondary)] text-[color:var(--secondary-foreground)] grid place-items-center">
            <Briefcase className="size-4.5" />
          </div>
          <h3
            className={cn(
              "font-semibold leading-tight",
              typography.heading.secondary
            )}
          >
            {heading}
          </h3>
        </div>

        <div className="relative">
          {/* remove global full-height line */}

          <div className="space-y-6">
            {visibleItems.map((item, idx, arr) => (
              <div key={idx} className="relative">
                <div className="flex gap-4 sm:gap-5">
                  {/* timeline gutter */}
                  <div className="relative w-8 sm:w-9">
                    {/* connector to next (not for last) */}
                    {idx < arr.length - 1 && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-[0.875rem] h-[calc(100%+1.5rem)] w-px bg-[var(--border)]" />
                    )}
                    {/* node */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-2 size-3 rounded-full bg-[oklch(0.74_0.15_310)] ring-4 ring-[color:var(--card)]" />
                  </div>

                  {/* card content */}
                  <div className="flex-1 rounded-xl border bg-[var(--card)] p-4 sm:p-5">
                    {/* Top row */}
                    <div className="flex flex-wrap items-start gap-2.5 justify-between">
                      <div className="min-w-0">
                        {item.companyName && (
                          <div
                            className={cn(
                              "font-semibold leading-tight truncate",
                              typography.heading.tertiary
                            )}
                          >
                            {item.companyName}
                          </div>
                        )}
                        {item.role && (
                          <div
                            className={cn(
                              "text-[color:var(--muted-foreground)] truncate",
                              typography.label.base
                            )}
                          >
                            {item.role}
                          </div>
                        )}
                      </div>

                      <div
                        className={cn(
                          "flex flex-col items-end text-right gap-1.5 text-[color:var(--muted-foreground)]",
                          typography.label.small
                        )}
                      >
                        {(item.start || item.end) && (
                          <div className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3.5" />
                            <span>
                              {item.start || ""}
                              {item.start && item.end ? " — " : ""}
                              {item.end || ""}
                            </span>
                          </div>
                        )}
                        {item.location && (
                          <div className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    {item.points &&
                      (typeof item.points === "string"
                        ? item.points
                        : item.points.length > 0) && (
                        <MarkdownContent
                          content={item.points}
                          className="mt-3.5"
                          overrides={{
                            ul: {
                              component: ({ className, ...props }) => (
                                <ul
                                  {...props}
                                  className={cn(
                                    "space-y-2.5 text-[color:var(--foreground)]/90",
                                    typography.content.base,
                                    className
                                  )}
                                />
                              ),
                            },
                            li: {
                              component: ({ className, ...props }) => (
                                <li
                                  {...props}
                                  className={cn(
                                    "flex gap-2 leading-relaxed",
                                    className
                                  )}
                                >
                                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[oklch(0.74_0.15_310)]" />
                                  <span className="flex-1">
                                    {props.children}
                                  </span>
                                </li>
                              ),
                            },
                            p: {
                              component: ({ className, ...props }) => (
                                <p
                                  {...props}
                                  className={cn(
                                    "m-0 text-[color:var(--foreground)]/90",
                                    typography.content.base,
                                    className
                                  )}
                                />
                              ),
                            },
                          }}
                        />
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkExperienceWidget;
