import type { PortfolioProject } from "../../types/portfolio";
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
  items?: PortfolioProject[];
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
          {visibleItems.map((project: PortfolioProject, id: number) => {
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
                <Card className="flex flex-col overflow-hidden border hover:shadow-lg transition-all duration-300 ease-out h-full">
                  {project.primaryCardImage && (
                    <div className="block cursor-pointer">
                      <img
                        src={project.primaryCardImage}
                        alt={project.name || "Project"}
                        className="h-40 w-full overflow-hidden object-cover object-top"
                      />
                    </div>
                  )}
                  <CardHeader
                    className={project.primaryCardImage ? "px-2" : "px-2 pt-6"}
                  >
                    <div className="space-y-1">
                      <CardTitle className="mt-1 text-base">
                        {project.name}
                      </CardTitle>
                      {description && (
                        <MarkdownContent
                          content={description}
                          className="prose max-w-full text-pretty font-sans text-xs text-muted-foreground dark:prose-invert"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-col px-2">
                    {project.technologies &&
                      project.technologies.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {project.technologies.map((tag) => (
                            <Badge
                              className="px-1 py-0 text-[10px]"
                              variant="secondary"
                              key={tag}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                  </CardContent>
                  <CardFooter className="px-2 pb-2">
                    {links.length > 0 && (
                      <div className="flex flex-row flex-wrap items-start gap-1">
                        {links.map((link, idx) => (
                          <a
                            href={link.href}
                            key={idx}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Badge
                              key={idx}
                              className="flex gap-2 px-2 py-1 text-[10px]"
                            >
                              {link.icon}
                              {link.type}
                            </Badge>
                          </a>
                        ))}
                      </div>
                    )}
                  </CardFooter>
                </Card>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
};
