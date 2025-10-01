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
      <div className="grid gap-5">
        {visibleItems.map((ed: EducationItem, idx: number) => (
          <article
            key={(ed.school || "") + idx}
            className="flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/20"
          >
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  {ed.school && (
                    <h3 className="text-base font-semibold leading-snug mb-0.5">
                      {ed.school}
                    </h3>
                  )}
                  {ed.degree && (
                    <p className="text-xs text-muted-foreground font-medium">
                      {ed.degree}
                    </p>
                  )}
                </div>
                {(ed.start || ed.end) && (
                  <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {[ed.start, ed.end].filter(Boolean).join(" — ")}
                  </div>
                )}
              </div>

              {ed.location && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {ed.location}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
