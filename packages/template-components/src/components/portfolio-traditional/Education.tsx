import type { EducationItem } from "../../types/portfolio";

export type EducationProps = {
  heading?: string;
  items: EducationItem[];
};

export const Education = ({ heading = "Education", items }: EducationProps) => {
  const visibleItems = (items || []).filter((item: EducationItem) =>
    Boolean(item.school || item.degree || item.start || item.end || item.location)
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground">
      {/* Glow */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.646_0.222_41.116)]" />
      <div className="p-5 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4">{heading}</h3>
        <ol className="relative border-s pl-5 space-y-4">
          {visibleItems.map((ed: EducationItem, idx: number) => {
            return (
              <li key={(ed.school || "") + idx} className="ms-3">
                <div className="absolute -start-[5px] mt-1 size-2 rounded-full bg-[var(--primary)]" />
                <div className="rounded-xl border bg-[var(--secondary)]/70 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      {ed.school ? (
                        <div className="text-base font-semibold leading-tight">
                          {ed.school}
                        </div>
                      ) : null}
                      {ed.degree && (
                        <div className="text-[13px] text-[color:var(--muted-foreground)]">
                          {ed.degree}
                        </div>
                      )}
                    </div>
                    {(ed.start || ed.end) && (
                      <div className="text-[12px] px-2 py-0.5 rounded-full bg-[var(--input)]/70 text-foreground/80">
                        {ed.start || "—"} — {ed.end || "—"}
                      </div>
                    )}
                  </div>

                  {ed.location && (
                    <div className="mt-2 text-[13px] text-[color:var(--muted-foreground)]">
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
  );
};
