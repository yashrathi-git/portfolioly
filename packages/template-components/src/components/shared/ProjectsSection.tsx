"use client";

import type { DisplayProject } from "@portfolioly/schema";
import { Github, ExternalLink, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { MarkdownContent } from "../../utils/markdown";
import BlurFade from "../magicui/blur-fade";
import {
  BLUR_FADE_DELAY,
  SECTION_DELAYS,
  WIDGET_ANIMATION,
} from "../../lib/constants/animations";
import { typography } from "../../lib/typography";
import { cn } from "../../lib/utils";

export interface ProjectsSectionProps {
  items: DisplayProject[];
  heading?: string;
  variant?: "traditional" | "widget";
  className?: string;
}

/**
 * Normalize highlights to a string format for rendering
 */
function normalizeHighlights(highlights?: string[] | string): string {
  if (!highlights) {
    return "";
  }

  if (typeof highlights === "string") {
    return highlights;
  }

  const filtered = highlights
    .filter((point) => typeof point === "string" && point.trim().length > 0)
    .map((point) => point.trim());

  if (filtered.length === 0) {
    return "";
  }

  return filtered.join("\n");
}

/**
 * Project Overlay Modal Component
 * Displays detailed project information including images, video, and full description
 */
function ProjectOverlay({
  project,
  onClose,
}: {
  project: DisplayProject;
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
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 size-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-accent transition-colors"
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
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                          <img
                            src={image.url}
                            alt={image.caption || `Project image ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        {image.caption && (
                          <p
                            className={cn(
                              "text-center text-muted-foreground italic",
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
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
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
                className="text-foreground"
                overrides={{
                  p: {
                    component: ({ className, ...props }) => (
                      <p
                        {...props}
                        className={cn(
                          "mb-3 leading-relaxed text-foreground/90",
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
                      "px-3 py-1.5 rounded-full bg-input/70 text-foreground/80",
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
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer noopener"
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-4 py-2 hover:bg-accent transition-colors",
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
                  "inline-flex items-center gap-2 rounded-md border px-4 py-2 hover:bg-accent transition-colors",
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

/**
 * Traditional Portfolio Project Card
 * Used in the traditional scrollable portfolio layout
 */
function TraditionalProjectCard({
  project,
  index,
}: {
  project: DisplayProject;
  index: number;
}) {
  const description = normalizeHighlights(project.highlights);
  const links = [];

  if (project.github) {
    links.push({
      icon: <Github className="size-3" />,
      type: "Code",
      href: project.github,
    });
  }

  if (project.live_link) {
    links.push({
      icon: <ExternalLink className="size-3" />,
      type: "Live",
      href: project.live_link,
    });
  }

  // Prioritize card_image_url over first project image
  const displayImageUrl = project.cardImageUrl || project.images?.[0]?.url;

  return (
    <BlurFade
      key={project.name || `project-${index}`}
      delay={BLUR_FADE_DELAY * SECTION_DELAYS.projects + index * 0.05}
    >
      <Card className="flex flex-col overflow-hidden border hover:shadow-lg hover:shadow-foreground/5 hover:border-foreground/30 hover:scale-[1.02] hover:bg-accent/50 transition-all duration-300 ease-out h-full group">
        {displayImageUrl && (
          <div className="block cursor-pointer">
            <img
              src={displayImageUrl}
              alt={project.name || "Project"}
              className="h-40 w-full overflow-hidden object-cover object-top"
            />
          </div>
        )}
        <CardHeader
          className={displayImageUrl ? "px-4 pt-4 pb-3" : "px-4 pt-6 pb-3"}
        >
          <div className="space-y-2">
            <CardTitle className="text-base sm:text-lg font-semibold leading-tight">
              {project.name}
            </CardTitle>
            {description && (
              <div className="pt-1">
                <MarkdownContent
                  content={description}
                  className="prose max-w-full text-pretty font-sans text-sm text-foreground dark:prose-invert prose-p:text-foreground prose-li:text-foreground"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="mt-auto flex flex-col px-4 pb-3">
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((tag) => (
                <Badge
                  className="px-2 py-0.5 text-[10px]"
                  variant="secondary"
                  key={tag}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        {links.length > 0 && (
          <CardFooter className="px-4 pb-4 pt-0">
            <div className="flex flex-row flex-wrap items-start gap-2">
              {links.map((link, idx) => (
                <a href={link.href} key={idx} target="_blank" rel="noreferrer">
                  <Badge className="flex gap-1.5 px-2.5 py-1 text-[10px] hover:bg-primary/90 transition-colors">
                    {link.icon}
                    {link.type}
                  </Badge>
                </a>
              ))}
            </div>
          </CardFooter>
        )}
      </Card>
    </BlurFade>
  );
}

/**
 * Widget Project Card
 * Used in the chat-based widget layout with glass theme
 */
function WidgetProjectCard({
  project,
  index,
  onClick,
}: {
  project: DisplayProject;
  index: number;
  onClick: () => void;
}) {
  return (
    <div
      key={(project.github || project.live_link || project.name || "") + index}
      className="group relative overflow-hidden rounded-xl border bg-card/80 backdrop-blur-sm hover:bg-card transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            {project.name ? (
              <h4
                className={cn(
                  "font-semibold leading-tight",
                  typography.heading.tertiary
                )}
              >
                {project.name}
              </h4>
            ) : null}
          </div>
        </div>

        {project.one_line_description && (
          <p className={cn("text-muted-foreground", typography.label.base)}>
            {project.one_line_description}
          </p>
        )}

        {project.highlights && typeof project.highlights === "string" ? (
          <MarkdownContent
            content={project.highlights}
            className="mt-1 text-muted-foreground"
          />
        ) : project.highlights &&
          Array.isArray(project.highlights) &&
          project.highlights.length > 0 ? (
          <MarkdownContent
            content={project.highlights.slice(0, 3)}
            className="mt-1 text-muted-foreground"
          />
        ) : null}

        {project.technologies?.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {project.technologies.map((t) => (
              <span
                key={t}
                className={cn(
                  "px-2 py-0.5 rounded-full bg-input/70 text-foreground/80",
                  typography.label.tiny
                )}
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-2">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 hover:bg-input/60 transition-colors",
                typography.label.base
              )}
            >
              <Github className="size-4" />
              <span>GitHub</span>
            </a>
          )}
          {project.live_link && (
            <a
              href={project.live_link}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 hover:bg-input/60 transition-colors",
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
  );
}

/**
 * Shared ProjectsSection Component
 * Supports both traditional portfolio and widget variants
 */
export const ProjectsSection = ({
  items = [],
  heading = "Projects",
  variant = "traditional",
  className,
}: ProjectsSectionProps) => {
  const [selectedProject, setSelectedProject] = useState<DisplayProject | null>(
    null
  );

  const visibleItems = items.filter((item: DisplayProject) =>
    Boolean(
      item.name ||
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

  // Traditional Portfolio Layout
  if (variant === "traditional") {
    return (
      <>
        <section id="projects" className={cn("px-6 pb-12", className)}>
          <div className="mx-auto w-full max-w-2xl space-y-12">
            <BlurFade delay={BLUR_FADE_DELAY * SECTION_DELAYS.projects}>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
                    My Projects
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    Check out my latest work
                  </h2>
                  <p className="text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    I&apos;ve worked on a variety of projects, from simple
                    websites to complex web applications. Here are a few of my
                    favorites.
                  </p>
                </div>
              </div>
            </BlurFade>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto">
              {visibleItems.map((project: DisplayProject, id: number) => (
                <TraditionalProjectCard
                  key={project.name || `project-${id}`}
                  project={project}
                  index={id}
                />
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  // Widget Layout (Chat Portfolio)
  return (
    <>
      <BlurFade
        delay={WIDGET_ANIMATION.delay}
        duration={WIDGET_ANIMATION.duration}
        yOffset={WIDGET_ANIMATION.yOffset}
        blur={WIDGET_ANIMATION.blur}
      >
        <div
          className={cn(
            "rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm",
            className
          )}
        >
          <div className="p-5 sm:p-6">
            <h3
              className={cn("font-semibold mb-4", typography.heading.secondary)}
            >
              {heading}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleItems.map((p, idx) => (
                <WidgetProjectCard
                  key={(p.github || p.live_link || p.name || "") + idx}
                  project={p}
                  index={idx}
                  onClick={() => setSelectedProject(p)}
                />
              ))}
            </div>
          </div>
        </div>
      </BlurFade>

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
