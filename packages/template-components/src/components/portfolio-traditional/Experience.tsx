import type { ExperienceItem } from "../../types/portfolio";
import { MarkdownContent } from "../../utils/markdown-parser";

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
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
        Experience
      </h2>
      <div className="grid gap-5">
        {visibleItems.map((e: ExperienceItem, idx: number) => (
          <article
            key={`${e.companyName || "experience"}-${idx}`}
            className="flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/20"
          >
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  {(e.role || e.companyName) && (
                    <h3 className="text-base font-semibold leading-snug mb-0.5">
                      {e.role && e.companyName
                        ? `${e.companyName}`
                        : e.companyName || e.role}
                    </h3>
                  )}
                  {e.companyName && e.role && (
                    <p className="text-xs text-muted-foreground font-medium">
                      {e.role}
                    </p>
                  )}
                </div>
                {(e.start || e.end) && (
                  <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {[e.start, e.end].filter(Boolean).join(" — ")}
                  </div>
                )}
              </div>

              {e.location && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {e.location}
                </p>
              )}

              {e.points?.length ? (
                <div className="mb-3">
                  <MarkdownContent content={e.points} />
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
