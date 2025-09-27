import type { EducationItem } from "../../types/portfolio";

export type EducationProps = {
  items: EducationItem[];
};

export const Education = ({ items }: EducationProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Education</h2>
      <div className="mt-5 space-y-4">
        {items.map((ed, idx) => (
          <div
            key={`${ed.school}-${idx}`}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold leading-tight">
                  {ed.school}
                </h3>
                <p className="text-sm text-muted-foreground">{ed.degree}</p>
                {ed.location && (
                  <p className="text-xs text-muted-foreground/80 mt-0.5">
                    {ed.location}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {ed.start} — {ed.end}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
