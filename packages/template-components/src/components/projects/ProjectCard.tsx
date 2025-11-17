"use client";

import { useRef } from "react";
import type { DisplayProject } from "portfolioly-schema";
import { Github, ExternalLink, Expand } from "lucide-react";
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
} from "../../lib/constants/animations";
import { cn } from "../../lib/utils";
import { isProjectExpandable, normalizeHighlights } from "./utils";

export interface ProjectCardProps {
  project: DisplayProject;
  index?: number;
  onExpand?: (rect: DOMRect) => void;
  variant?: "traditional" | "widget";
}

export function ProjectCard({
  project,
  index = 0,
  onExpand,
  variant = "traditional",
}: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
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

  const displayImageUrl = project.cardImageUrl;
  const expandable = isProjectExpandable(project);

  const handleClick = () => {
    if (expandable && onExpand && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      onExpand(rect);
    }
  };

  const CardComponent = (
    <Card
      ref={cardRef}
      className={cn(
        "flex flex-col overflow-hidden border hover:shadow-lg hover:shadow-foreground/5 hover:border-foreground/30 hover:scale-[1.02] hover:bg-accent/50 transition-all duration-300 ease-out h-full group relative",
        expandable && "cursor-pointer"
      )}
      onClick={handleClick}
    >
      {expandable && (
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-md">
            <Expand className="size-4 text-foreground" />
          </div>
        </div>
      )}
      {displayImageUrl && (
        <div className="block">
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
              <a
                href={link.href}
                key={idx}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
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

  if (variant === "traditional") {
    return (
      <BlurFade
        key={project.name || `project-${index}`}
        delay={BLUR_FADE_DELAY * SECTION_DELAYS.projects + index * 0.05}
      >
        {CardComponent}
      </BlurFade>
    );
  }

  return CardComponent;
}
