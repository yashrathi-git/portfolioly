import type { PortfolioProject } from "../../types/portfolio";
import { Github, ExternalLink, Star, Calendar } from "lucide-react";
import { MarkdownContent } from "../../utils/markdown-parser";

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
      {/* Enhanced section header */}
      <div className="mb-8 sm:mb-10 lg:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
          Featured Projects
        </h2>
        <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
        <p className="text-[var(--muted-foreground)] mt-4 text-sm sm:text-base max-w-2xl">
          A collection of projects that showcase my skills and passion for building great software.
        </p>
      </div>

      {/* Enhanced projects grid with better mobile support */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        {visibleItems.map((project: PortfolioProject, index: number) => (
          <article
            key={project.name || `${project.github || project.live_link || "project"}-${index}`}
            className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all duration-300 hover:border-[var(--foreground)]/20 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-2"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* Project header with enhanced design */}
            <div className="relative p-6 sm:p-7 lg:p-8">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="relative">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    {project.name && (
                      <h3 className="text-xl sm:text-2xl font-bold leading-tight mb-2 text-[var(--foreground)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {project.name}
                      </h3>
                    )}
                    {project.role && (
                      <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--muted-foreground)] font-medium bg-[var(--muted)]/50 px-3 py-1 rounded-full">
                        <Star className="h-3 w-3" />
                        {project.role}
                      </div>
                    )}
                  </div>
                </div>

                {project.one_line_description && (
                  <p className="text-[var(--muted-foreground)] leading-relaxed mb-4 text-sm sm:text-base">
                    {project.one_line_description}
                  </p>
                )}

                {project.highlights?.length ? (
                  <div className="mb-6 prose prose-sm sm:prose prose-slate dark:prose-invert max-w-none">
                    <MarkdownContent content={project.highlights} />
                  </div>
                ) : null}

                {/* Enhanced technologies display */}
                {project.technologies?.length ? (
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
                      Technologies Used
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech: string, techIndex: number) => (
                        <span
                          key={tech}
                          className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:bg-[var(--muted)]/50 hover:scale-105"
                          style={{
                            animationDelay: `${(index * 100) + (techIndex * 50)}ms`,
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Enhanced project links section */}
            {(project.github || project.live_link) && (
              <div className="mt-auto border-t border-[var(--border)]/50 bg-[var(--card)]/50 p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs sm:text-sm text-[var(--muted-foreground)] font-medium">
                    Project Links
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noreferrer"
                        className="group/link inline-flex items-center gap-2 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-[var(--muted-foreground)] transition-all duration-200 hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 border border-transparent hover:border-[var(--border)] min-h-[44px]"
                        aria-label="View source code"
                      >
                        <Github className="h-4 w-4 group-hover/link:scale-110 transition-transform duration-200" />
                        <span className="hidden sm:inline">Code</span>
                      </a>
                    )}
                    {project.live_link && (
                      <a
                        href={project.live_link}
                        target="_blank"
                        rel="noreferrer"
                        className="group/link inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-white transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 min-h-[44px]"
                        aria-label="View live project"
                      >
                        <ExternalLink className="h-4 w-4 group-hover/link:scale-110 transition-transform duration-200" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Projects count indicator */}
      <div className="mt-8 sm:mt-10 text-center">
        <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--muted-foreground)] bg-[var(--card)]/50 border border-[var(--border)]/50 rounded-full px-4 py-2">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
          {visibleItems.length} featured project{visibleItems.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};