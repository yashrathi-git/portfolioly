import type { ExperienceItem } from "../../types/portfolio";

export type ExperienceProps = {
  items?: ExperienceItem[];
};

export const Experience = ({ items = [] }: ExperienceProps) => {
  const visibleItems = items.filter((item: ExperienceItem) =>
    Boolean(
      item.companyName ||
        item.role ||
        item.location ||
        item.start ||
        item.end ||
        item.points?.length
    )
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Experience</h2>
      <div className="mt-5 space-y-5">
        {visibleItems.map((e: ExperienceItem, idx: number) => (
          <div
            key={`${e.companyName || "experience"}-${idx}`}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                {(e.role || e.companyName) && (
                  <h3 className="text-base font-semibold leading-tight">
                    {[e.role, e.companyName].filter(Boolean).join(" · ")}
                  </h3>
                )}
                {e.location && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {e.location}
                  </p>
                )}
              </div>
              {(e.start || e.end) && (
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {[e.start, e.end].filter(Boolean).join(" — ")}
                </p>
              )}
            </div>
            {e.points?.length ? (
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {e.points.map((p: string, i: number) => (
                  <li key={`${p}-${i}`} className="leading-relaxed">
                    {p}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
