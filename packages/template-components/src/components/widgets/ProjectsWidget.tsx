"use client";

import { Github, ExternalLink, X } from "lucide-react";
import { useState, useEffect } from "react";
import type {
  PortfolioProject as LegacyProject,
  Project,
  ProjectImage,
} from "../../types/portfolio";
import { typography } from "../../lib/typography";
import { cn } from "../../lib/cn";
import { MarkdownContent } from "../../utils/markdown";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";

// Support both legacy and new schema
export type ProjectsWidgetProject = LegacyProject & Partial<Project>;

export type ProjectsWidgetProps = {
  heading?: string;
  projects: ProjectsWidgetProject[];
};

function ProjectOverlay({
  project,
  onClose,
}: {
  project: ProjectsWidgetProject;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const hasImages = project.images && project.images.length > 0;
  const hasVideo = Boolean(project.demo_video);
  const hasMoreContext = Boolean(project.more_context);

  // Extract YouTube video ID
  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return videoIdMatch
      ? `https://www.youtube.com/embed/${videoIdMatch[1]}`
      : null;
  };

  const embedUrl = hasVideo ? getYouTubeEmbedUrl(project.demo_video!) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--card)] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 size-8 rounded-full bg-[var(--background)]/80 backdrop-blur-sm border border-[var(--border)] flex items-center justify-center hover:bg-[var(--accent)] transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Project title */}
          <h2 className={cn("font-bold mb-6 pr-8", typography.heading.primary)}>
            {project.name}
          </h2>

          {/* Image Carousel */}
          {hasImages && (
            <div className="mb-8">
              <Carousel className="w-full">
                <CarouselContent>
                  {project.images!.map((image, idx) => (
                    <CarouselItem key={idx}>
                      <div className="space-y-3">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[var(--muted)]">
                          <img
                            src={image.url}
                            alt={image.caption || `Project image ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        {image.caption && (
                          <p
                            className={cn(
                              "text-center text-[color:var(--muted-foreground)] italic",
                              typography.label.base
                            )}
                          >
                            {image.caption}
                          </p>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {project.images!.length > 1 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
            </div>
          )}

          {/* Demo Video */}
          {hasVideo && embedUrl && (
            <div className="mb-8">
              <h3
                className={cn(
                  "font-semibold mb-3",
                  typography.heading.tertiary
                )}
              >
                Demo Video
              </h3>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[var(--muted)]">
                <iframe
                  src={embedUrl}
                  title="Project demo video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          )}

          {/* About The Project */}
          {hasMoreContext && (
            <div className="mb-6">
              <h3
                className={cn(
                  "font-semibold mb-3",
                  typography.heading.tertiary
                )}
              >
                About The Project
              </h3>
              <MarkdownContent
                content={project.more_context!}
                className="text-[color:var(--foreground)]"
                overrides={{
                  p: {
                    component: ({ className, ...props }) => (
                      <p
                        {...props}
                        className={cn(
                          "mb-3 leading-relaxed text-[color:var(--foreground)]/90",
                          typography.content.base,
                          className
                        )}
                      />
                    ),
                  },
                  ul: {
                    component: ({ className, ...props }) => (
                      <ul
                        {...props}
                        className={cn(
                          "ml-5 list-disc space-y-2 mb-3",
                          typography.content.base,
                          className
                        )}
                      />
                    ),
                  },
                  ol: {
                    component: ({ className, ...props }) => (
                      <ol
                        {...props}
                        className={cn(
                          "ml-5 list-decimal space-y-2 mb-3",
                          typography.content.base,
                          className
                        )}
                      />
                    ),
                  },
                }}
              />
            </div>
          )}

          {/* Technologies */}
          {project.technologies?.length ? (
            <div className="mb-6">
              <h3
                className={cn(
                  "font-semibold mb-3",
                  typography.heading.tertiary
                )}
              >
                Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((t) => (
                  <span
                    key={t}
                    className={cn(
                      "px-3 py-1.5 rounded-full bg-[var(--input)]/70 text-foreground/80",
                      typography.label.base
                    )}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Links */}
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer noopener"
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-4 py-2 hover:bg-[var(--accent)] transition-colors",
                  typography.label.base
                )}
              >
                <Github className="size-4" />
                <span>View Code</span>
              </a>
            )}
            {project.live_link && (
              <a
                href={project.live_link}
                target="_blank"
                rel="noreferrer noopener"
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-4 py-2 hover:bg-[var(--accent)] transition-colors",
                  typography.label.base
                )}
              >
                <ExternalLink className="size-4" />
                <span>Live Demo</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProjectsWidget = ({
  heading = "Projects",
  projects,
}: ProjectsWidgetProps) => {
  const [selectedProject, setSelectedProject] =
    useState<ProjectsWidgetProject | null>(null);

  const visibleProjects = projects.filter((project) =>
    Boolean(
      project.name ||
        project.role ||
        project.one_line_description ||
        project.highlights ||
        project.technologies?.length ||
        project.github ||
        project.live_link
    )
  );

  if (visibleProjects.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground">
        {/* Glow */}
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-[oklch(0.828_0.189_84.429)]" />
        <div className="p-5 sm:p-6">
          <h3
            className={cn("font-semibold mb-4", typography.heading.secondary)}
          >
            {heading}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleProjects.map((p, idx) => (
              <div
                key={(p.github || p.live_link || p.name || "") + idx}
                className="group relative overflow-hidden rounded-xl border bg-[var(--secondary)]/70 hover:bg-[var(--secondary)] transition-colors cursor-pointer"
                onClick={() => setSelectedProject(p)}
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

                  {p.highlights && typeof p.highlights === "string" ? (
                    <MarkdownContent
                      content={p.highlights}
                      className="mt-1 text-[color:var(--muted-foreground)]"
                    />
                  ) : p.highlights &&
                    Array.isArray(p.highlights) &&
                    p.highlights.length > 0 ? (
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
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
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

      {/* Project Overlay */}
      {selectedProject && (
        <ProjectOverlay
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
};

export default ProjectsWidget;
