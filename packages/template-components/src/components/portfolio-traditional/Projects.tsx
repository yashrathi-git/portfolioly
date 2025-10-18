import type { DisplayProject } from "@portfolioly/schema";
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

const BLUR_FADE_DELAY = 0.04;

export type ProjectsProps = {
  items?: DisplayProject[];
};

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

export const Projects = ({ items = [] }: ProjectsProps) => {
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

  return (
    <section id="projects" className="px-6 pb-16">
      <div className="mx-auto w-full max-w-2xl space-y-12">
        <BlurFade delay={BLUR_FADE_DELAY * 11}>
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
                My Projects
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Check out my latest work
              </h2>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                I&apos;ve worked on a variety of projects, from simple websites
                to complex web applications. Here are a few of my favorites.
              </p>
            </div>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto">
          {visibleItems.map((project: DisplayProject, id: number) => {
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

            return (
              <BlurFade
                key={project.name || `project-${id}`}
                delay={BLUR_FADE_DELAY * 12 + id * 0.05}
              >
                <Card className="flex flex-col overflow-hidden border hover:shadow-lg hover:shadow-foreground/5 hover:border-foreground/30 hover:scale-[1.02] hover:bg-accent/50 transition-all duration-300 ease-out h-full group">
                  {project.images?.[0]?.url && (
                    <div className="block cursor-pointer">
                      <img
                        src={project.images[0].url}
                        alt={project.name || "Project"}
                        className="h-40 w-full overflow-hidden object-cover object-top"
                      />
                    </div>
                  )}
                  <CardHeader
                    className={
                      project.images?.[0]?.url
                        ? "px-4 pt-4 pb-3"
                        : "px-4 pt-6 pb-3"
                    }
                  >
                    <div className="space-y-2">
                      <CardTitle className="text-lg font-semibold leading-tight">
                        {project.name}
                      </CardTitle>
                      {description && (
                        <div className="pt-1">
                          <MarkdownContent
                            content={description}
                            className="prose max-w-full text-pretty font-sans text-sm text-muted-foreground dark:prose-invert"
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-col px-4 pb-3">
                    {project.technologies &&
                      project.technologies.length > 0 && (
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
                          >
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
          })}
        </div>
      </div>
    </section>
  );
};
