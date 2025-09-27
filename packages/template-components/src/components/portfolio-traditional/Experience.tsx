import type { ExperienceItem } from "../../types/portfolio";

export type ExperienceProps = {
  items: ExperienceItem[];
};

export const Experience = ({ items }: ExperienceProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Experience</h2>
      <div className="mt-5 space-y-5">
        {items.map((e, idx) => (
          <div
            key={`${e.companyName}-${idx}`}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold leading-tight">
                  {e.role} · {e.companyName}
                </h3>
                {e.location && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {e.location}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {e.start} — {e.end}
              </p>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {e.points.map((p, i) => (
                <li key={i} className="leading-relaxed">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
