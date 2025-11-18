"use client";

import { useState } from "react";
import type { DisplayProject } from "portfolioly-schema";
import BlurFade from "../magicui/blur-fade";
import {
  BLUR_FADE_DELAY,
  SECTION_DELAYS,
  WIDGET_ANIMATION,
} from "../../lib/constants/animations";
import { typography } from "../../lib/typography";
import { cn } from "../../lib/utils";
import {
  ProjectCard,
  ProjectDetailDialog,
  getVisibleProjects,
} from "../projects";

export interface ProjectsSectionProps {
  items: DisplayProject[];
  heading?: string;
  variant?: "traditional" | "widget";
  className?: string;
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
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);

  const visibleItems = getVisibleProjects(items);

  const handleExpand = (project: DisplayProject, rect: DOMRect) => {
    setCardRect(rect);
    setSelectedProject(project);
  };

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
            <BlurFade delay={BLUR_FADE_DELAY * 12}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto">
                {visibleItems.map((project: DisplayProject, id: number) => (
                  <ProjectCard
                    key={project.name || `project-${id}`}
                    project={project}
                    index={id}
                    variant="traditional"
                    onExpand={(rect) => handleExpand(project, rect)}
                  />
                ))}
              </div>
            </BlurFade>
          </div>
        </section>

        {selectedProject && (
          <ProjectDetailDialog
            project={selectedProject}
            open={!!selectedProject}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedProject(null);
                setCardRect(null);
              }
            }}
            cardRect={cardRect}
          />
        )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visibleItems.map((p, idx) => (
                <BlurFade
                  key={p.name || `project-${idx}`}
                  delay={
                    WIDGET_ANIMATION.delay +
                    (idx + 1) * WIDGET_ANIMATION.staggerDelay
                  }
                  duration={WIDGET_ANIMATION.duration}
                  yOffset={WIDGET_ANIMATION.yOffset}
                  blur={WIDGET_ANIMATION.blur}
                >
                  <ProjectCard
                    project={p}
                    variant="widget"
                    onExpand={(rect) => handleExpand(p, rect)}
                  />
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </BlurFade>

      {selectedProject && (
        <ProjectDetailDialog
          project={selectedProject}
          open={!!selectedProject}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProject(null);
              setCardRect(null);
            }
          }}
          cardRect={cardRect}
        />
      )}
    </>
  );
};
