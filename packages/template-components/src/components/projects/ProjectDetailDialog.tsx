"use client";

import { useState, useEffect } from "react";
import type { DisplayProject, ProjectImage } from "portfolioly-schema";
import { Github, ExternalLink, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "../ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { MarkdownContent } from "../../utils/markdown";
import { HeroVideoDialog } from "../magicui/demo-video";
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnail,
  getFallbackYouTubeThumbnail,
} from "../../utils/youtube";

export interface ProjectDetailDialogProps {
  project: DisplayProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardRect: DOMRect | null;
}

export function ProjectDetailDialog({
  project,
  open,
  onOpenChange,
  cardRect,
}: ProjectDetailDialogProps) {
  const sortedImages = project.images
    ? [...project.images].sort((a, b) => a.order - b.order)
    : [];

  const [videoThumbnail, setVideoThumbnail] = useState<string>("");
  const [thumbnailError, setThumbnailError] = useState(false);

  const embedUrl = project.demo_video
    ? getYouTubeEmbedUrl(project.demo_video)
    : "";

  useEffect(() => {
    if (!project.demo_video) return;

    const primaryThumbnail = getYouTubeThumbnail(project.demo_video);
    if (!primaryThumbnail) return;

    setVideoThumbnail(primaryThumbnail);
    setThumbnailError(false);

    const img = new Image();
    img.onload = () => {
      setVideoThumbnail(primaryThumbnail);
    };
    img.onerror = () => {
      const fallback = getFallbackYouTubeThumbnail(project.demo_video!);
      if (fallback) {
        setVideoThumbnail(fallback);
        setThumbnailError(true);
      }
    };
    img.src = primaryThumbnail;
  }, [project.demo_video]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    if (open) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={
              cardRect
                ? {
                    position: "fixed",
                    top: cardRect.top,
                    left: cardRect.left,
                    width: cardRect.width,
                    height: cardRect.height,
                    opacity: 0.8,
                  }
                : {
                    scale: 0.9,
                    opacity: 0,
                  }
            }
            animate={{
              position: "fixed",
              top: "50%",
              left: "50%",
              x: "-50%",
              y: "-50%",
              width: "min(90vw, 1200px)",
              height: "auto",
              maxHeight: "90vh",
              opacity: 1,
              scale: 1,
            }}
            exit={
              cardRect
                ? {
                    position: "fixed",
                    top: cardRect.top,
                    left: cardRect.left,
                    width: cardRect.width,
                    height: cardRect.height,
                    opacity: 0,
                    scale: 0.95,
                  }
                : {
                    scale: 0.9,
                    opacity: 0,
                  }
            }
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.8,
            }}
            className="z-50 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto max-h-[90vh] overscroll-contain">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="sticky top-0 z-10 bg-popover/95 backdrop-blur-md border-b border-border px-6 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-2xl font-bold text-foreground pr-8">
                    {project.name}
                  </h2>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="rounded-full p-2 hover:bg-accent transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <X className="size-5 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="p-6 space-y-8"
              >
                {embedUrl && videoThumbnail && (
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                      Demo Video
                    </h3>
                    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg">
                      <HeroVideoDialog
                        videoSrc={embedUrl}
                        thumbnailSrc={videoThumbnail}
                        thumbnailAlt={`${project.name} demo`}
                        animationStyle="from-center"
                        className="w-full h-full"
                      />
                    </div>
                  </section>
                )}

                {sortedImages.length > 0 && (
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                      Project Images
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {sortedImages.map(
                            (image: ProjectImage, idx: number) => (
                              <CarouselItem key={idx}>
                                <div className="space-y-3">
                                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                                    <img
                                      src={image.url}
                                      alt={
                                        image.caption ||
                                        `Project image ${idx + 1}`
                                      }
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                  {image.caption && (
                                    <p className="text-sm text-muted-foreground text-center font-medium">
                                      {image.caption}
                                    </p>
                                  )}
                                </div>
                              </CarouselItem>
                            )
                          )}
                        </CarouselContent>
                        {sortedImages.length > 1 && (
                          <>
                            <CarouselPrevious className="-left-4" />
                            <CarouselNext className="-right-4" />
                          </>
                        )}
                      </Carousel>
                    </div>
                  </section>
                )}

                {project.more_context && (
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                      Project Details
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/20 rounded-lg p-4">
                      <MarkdownContent
                        content={project.more_context}
                        className="text-foreground"
                      />
                    </div>
                  </section>
                )}

                {project.technologies && project.technologies.length > 0 && (
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                      Technologies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="px-3 py-1 text-xs font-medium"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {(project.github || project.live_link) && (
                  <section className="flex flex-wrap gap-3 pt-4 border-t border-border">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium shadow-sm hover:shadow-md"
                      >
                        <Github className="size-4" />
                        View Code
                      </a>
                    )}
                    {project.live_link && (
                      <a
                        href={project.live_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-border bg-background hover:bg-accent hover:border-foreground/20 transition-all font-medium shadow-sm hover:shadow-md"
                      >
                        <ExternalLink className="size-4" />
                        Live Demo
                      </a>
                    )}
                  </section>
                )}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
