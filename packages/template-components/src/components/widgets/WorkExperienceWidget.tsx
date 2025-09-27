"use client";

import { Briefcase, MapPin, CalendarDays } from "lucide-react";

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

export const WorkExperienceWidget = ({ heading = "Work Experience", items = [] }: WorkExperienceWidgetProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground">
      {/* Glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-30 dark:opacity-15 bg-[oklch(0.646_0.222_41.116)]" />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="size-9 rounded-lg bg-[var(--secondary)] text-[color:var(--secondary-foreground)] grid place-items-center">
            <Briefcase className="size-4.5" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold leading-tight">{heading}</h3>
        </div>

        <div className="relative">
          {/* remove global full-height line */}

          <div className="space-y-6">
            {(items.length > 0 ? items : [{}]).map((item, idx, arr) => (
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
                          <div className="text-base sm:text-[17px] font-semibold leading-tight truncate">
                            {item.companyName}
                          </div>
                        )}
                        {item.role && (
                          <div className="text-sm text-[color:var(--muted-foreground)] truncate">{item.role}</div>
                        )}
                      </div>

                      <div className="flex flex-col items-end text-right gap-1.5 text-xs sm:text-[13px] text-[color:var(--muted-foreground)]">
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
                    {item.points && item.points.length > 0 && (
                      <ul className="mt-3.5 space-y-2.5">
                        {item.points.map((pt, i) => (
                          <li key={i} className="flex gap-2 text-[15px] leading-relaxed">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[oklch(0.74_0.15_310)]" />
                            <span className="text-[color:var(--foreground)]/90">{pt}</span>
                          </li>
                        ))}
                      </ul>
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