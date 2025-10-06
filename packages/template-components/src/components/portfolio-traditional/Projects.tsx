import type { PortfolioProject } from "../../types/portfolio";
import { Github, ExternalLink } from "lucide-react";
import { MarkdownContent } from "../../utils/markdown";

export type ProjectsProps = {
  items?: PortfolioProject[];
};

export const Projects = ({ items = [] }: ProjectsProps) => {
  const visibleItems = items.filter((item: PortfolioProject) =>
    Boolean(
      item.name ||
        item.role ||
        item.one_line_description ||
        item.highlights?.length ||
        item.technologies?.length ||
        item.github ||
        item.live_link
    )
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
        Projects
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {visibleItems.map((p: PortfolioProject, index: number) => (
          <article
            key={p.name || `${p.github || p.live_link || "project"}-${index}`}
            className="flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/20"
          >
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  {p.name && (
                    <h3 className="text-base font-semibold leading-snug mb-0.5">
                      {p.name}
                    </h3>
                  )}
                  {p.role && (
                    <p className="text-xs text-muted-foreground font-medium">
                      {p.role}
                    </p>
                  )}
                </div>
              </div>

              {p.one_line_description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {p.one_line_description}
                </p>
              )}

              {p.highlights?.length ? (
                <div className="mb-3">
                  <MarkdownContent
                    content={p.highlights}
                    className="text-muted-foreground"
                  />
                </div>
              ) : null}

              {p.technologies?.length ? (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.technologies.map((t: string) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {(p.github || p.live_link) && (
              <div className="flex items-center gap-2 pt-3 mt-2 border-t border-border">
                {p.github && (
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                  >
                    <Github className="h-3.5 w-3.5" />
                    Code
                  </a>
                )}
                {p.live_link && (
                  <a
                    href={p.live_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Live
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
