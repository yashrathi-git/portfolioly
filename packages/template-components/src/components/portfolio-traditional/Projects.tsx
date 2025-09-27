import type { PortfolioProject } from "../../types/portfolio";
import { Github, ExternalLink, Star, Tag } from "lucide-react";

export type ProjectsProps = {
  items: PortfolioProject[];
};

export const Projects = ({ items }: ProjectsProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {items.map((p) => (
          <article
            key={p.name}
            className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold leading-tight">
                  {p.name}
                </h3>
                {p.role && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.role}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400/80 text-yellow-500" />
                <span>Featured</span>
              </div>
            </div>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {p.one_line_description}
            </p>

            {p.technologies && p.technologies.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {p.technologies.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
                  >
                    <Tag className="h-3.5 w-3.5" /> {t}
                  </span>
                ))}
              </div>
            )}

            {p.highlights && p.highlights.length > 0 && (
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {p.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex items-center gap-3">
              {p.github && (
                <a
                  href={p.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                  <Github className="h-4 w-4" /> Code
                </a>
              )}
              {p.live_link && (
                <a
                  href={p.live_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                  <ExternalLink className="h-4 w-4" /> Live
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
