"use client";

import type { DisplayProject } from "portfolioly-schema";
import { Github, ExternalLink } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
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

  // Use only card_image_url for the card image
  const displayImageUrl = project.cardImageUrl;

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
                  <Badge className="flex gap-1.5 px-2.5 py-1 text-[10px] !text-primary-foreground hover:bg-primary/90 transition-colors">
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
 * Used in the chat-based widget layout - uses same UI as traditional cards
 */
function WidgetProjectCard({ project }: { project: DisplayProject }) {
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

  // Use only card_image_url for the card image
  const displayImageUrl = project.cardImageUrl;

  return (
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
                <Badge className="flex gap-1.5 px-2.5 py-1 text-[10px] !text-primary-foreground hover:bg-primary/90 transition-colors">
                  {link.icon}
                  {link.type}
                </Badge>
              </a>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleItems.map((p, idx) => (
              <WidgetProjectCard key={p.name || `project-${idx}`} project={p} />
            ))}
          </div>
        </div>
      </div>
    </BlurFade>
  );
};
