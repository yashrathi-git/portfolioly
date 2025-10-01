import type { EducationItem } from "../../types/portfolio";

export type EducationProps = {
  heading?: string;
  items: EducationItem[];
};

export const Education = ({ heading = "Education", items }: EducationProps) => {
  const visibleItems = (items || []).filter((item: EducationItem) =>
    Boolean(
      item.school || item.degree || item.start || item.end || item.location
    )
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
        {heading}
      </h2>
      <div className="relative">
        {/* Vertical timeline line - simplified */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border" />

        <div className="space-y-6 pl-8 sm:pl-10">
          {visibleItems.map((ed: EducationItem, idx: number) => (
            <div key={(ed.school || "") + idx} className="relative">
              {/* Timeline dot - simplified, no animation */}
              <div className="absolute -left-8 sm:-left-10 top-1.5 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full border-2 border-background bg-foreground shadow-sm" />
              </div>

              {/* Content card - cleaner design */}
              <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    {ed.school && (
                      <h3 className="text-base font-semibold leading-snug mb-1">
                        {ed.school}
                      </h3>
                    )}
                    {ed.degree && (
                      <p className="text-sm font-medium text-foreground/70 mb-1">
                        {ed.degree}
                      </p>
                    )}
                    {ed.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <svg
                          className="h-3 w-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {ed.location}
                      </p>
                    )}
                  </div>
                  {(ed.start || ed.end) && (
                    <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-muted text-muted-foreground whitespace-nowrap">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {[ed.start, ed.end].filter(Boolean).join(" — ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
