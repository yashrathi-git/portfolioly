"use client";

import { Github, ExternalLink, Star } from "lucide-react";
import type { PortfolioProject as SchemaProject } from "../../types/portfolio";

export type ProjectsWidgetProject = SchemaProject & { stars?: number };

export type ProjectsWidgetProps = {
  heading?: string;
  projects: ProjectsWidgetProject[];
};

export const ProjectsWidget = ({
  heading = "Featured Projects",
  projects,
}: ProjectsWidgetProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground">
      {/* Glow */}
      <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.828_0.189_84.429)]" />
      <div className="p-5 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4">{heading}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p, idx) => (
            <div
              key={(p.github || p.live_link || p.name || "") + idx}
              className="group relative overflow-hidden rounded-xl border bg-[var(--secondary)]/70 hover:bg-[var(--secondary)] transition-colors"
            >
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold leading-tight">
                      {p.name || "Untitled Project"}
                    </h4>
                    {p.role && (
                      <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                        {p.role}
                      </p>
                    )}
                  </div>
                  {typeof p.stars === "number" && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-[var(--accent)] text-[color:var(--accent-foreground)]">
                      <Star className="size-3 fill-current" /> {p.stars}
                    </span>
                  )}
                </div>

                {p.one_line_description && (
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    {p.one_line_description}
                  </p>
                )}

                {p.highlights && p.highlights.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-[13px] text-[color:var(--muted-foreground)] space-y-1">
                    {p.highlights.slice(0, 3).map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}

                {p.technologies && p.technologies.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.technologies.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--input)]/70 text-foreground/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-2">
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm hover:bg-[var(--input)]/60 transition-colors"
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
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm hover:bg-[var(--input)]/60 transition-colors"
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
