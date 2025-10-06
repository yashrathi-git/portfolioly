"use client";

import { Github, ExternalLink } from "lucide-react";
import type { PortfolioProject as SchemaProject } from "../../types/portfolio";
import { typography } from "../../lib/typography";
import { cn } from "../../lib/cn";
import { MarkdownContent } from "../../utils/markdown";

export type ProjectsWidgetProject = SchemaProject;

export type ProjectsWidgetProps = {
  heading?: string;
  projects: ProjectsWidgetProject[];
};

export const ProjectsWidget = ({
  heading = "Projects",
  projects,
}: ProjectsWidgetProps) => {
  const visibleProjects = projects.filter((project) =>
    Boolean(
      project.name ||
        project.role ||
        project.one_line_description ||
        project.highlights?.length ||
        project.technologies?.length ||
        project.github ||
        project.live_link
    )
  );

  if (visibleProjects.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground">
      {/* Glow */}
      <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.828_0.189_84.429)]" />
      <div className="p-5 sm:p-6">
        <h3 className={cn("font-semibold mb-4", typography.heading.secondary)}>
          {heading}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleProjects.map((p, idx) => (
            <div
              key={(p.github || p.live_link || p.name || "") + idx}
              className="group relative overflow-hidden rounded-xl border bg-[var(--secondary)]/70 hover:bg-[var(--secondary)] transition-colors"
            >
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {p.name ? (
                      <h4
                        className={cn(
                          "font-semibold leading-tight",
                          typography.heading.tertiary
                        )}
                      >
                        {p.name}
                      </h4>
                    ) : null}
                    {p.role && (
                      <p
                        className={cn(
                          "text-[color:var(--muted-foreground)] mt-1",
                          typography.label.small
                        )}
                      >
                        {p.role}
                      </p>
                    )}
                  </div>
                </div>

                {p.one_line_description && (
                  <p
                    className={cn(
                      "text-[color:var(--muted-foreground)]",
                      typography.label.base
                    )}
                  >
                    {p.one_line_description}
                  </p>
                )}

                {p.highlights?.length ? (
                  <MarkdownContent
                    content={p.highlights.slice(0, 3)}
                    className="mt-1 text-[color:var(--muted-foreground)]"
                  />
                ) : null}

                {p.technologies?.length ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.technologies.map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "px-2 py-0.5 rounded-full bg-[var(--input)]/70 text-foreground/80",
                          typography.label.tiny
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-2 flex items-center gap-2">
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 hover:bg-[var(--input)]/60 transition-colors",
                        typography.label.base
                      )}
                    >
                      <Github className="size-4" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {p.live_link && (
                    <a
                      href={p.live_link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 hover:bg-[var(--input)]/60 transition-colors",
                        typography.label.base
                      )}
                    >
                      <ExternalLink className="size-4" />
                      <span>Live</span>
                    </a>
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

export default ProjectsWidget;
