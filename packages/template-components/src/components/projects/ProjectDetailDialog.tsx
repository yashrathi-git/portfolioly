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
  type CarouselApi,
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

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

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    onSelect();

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

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
                className="sticky top-0 z-10 bg-popover/95 backdrop-blur-md px-6 py-4"
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
                className="flex flex-col h-full"
              >
                {/* Main Content - Scrollable */}
                <div className="flex-1 px-6 py-6 space-y-10 overflow-y-auto">
                  {/* Demo Video Section */}
                  {embedUrl && videoThumbnail && (
                    <section className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground tracking-tight">
                        Demo Video
                      </h3>
                      <div className="w-full max-w-5xl mx-auto aspect-video rounded-lg overflow-hidden shadow-md ring-1 ring-border/50">
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

                  {/* Project Images Carousel */}
                  {sortedImages.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground tracking-tight">
                        Project Gallery
                      </h3>
                      <div className="relative max-w-5xl mx-auto group">
                        <Carousel className="w-full" setApi={setCarouselApi}>
                          <CarouselContent>
                            {sortedImages.map(
                              (image: ProjectImage, idx: number) => (
                                <CarouselItem key={idx}>
                                  <div className="space-y-3">
                                    <div className="relative w-full flex items-center justify-center overflow-hidden rounded-lg border border-border/50 shadow-sm">
                                      <img
                                        src={image.url}
                                        alt={
                                          image.caption ||
                                          `Project image ${idx + 1}`
                                        }
                                        className="object-contain w-full h-auto max-h-[60vh]"
                                      />
                                    </div>
                                    {image.caption && (
                                      <p className="text-sm text-muted-foreground text-center font-medium leading-relaxed">
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
                              {currentSlide > 0 && (
                                <CarouselPrevious className="-left-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/95 backdrop-blur-sm border border-border hover:bg-background shadow-lg" />
                              )}
                              {currentSlide < sortedImages.length - 1 && (
                                <CarouselNext className="-right-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/95 backdrop-blur-sm border border-border hover:bg-background shadow-lg" />
                              )}
                            </>
                          )}
                        </Carousel>
                        {/* Interactive Carousel Indicators */}
                        {sortedImages.length > 1 && (
                          <div className="flex justify-center mt-5 gap-2">
                            {sortedImages.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => carouselApi?.scrollTo(idx)}
                                className={`h-2 rounded-full transition-all duration-200 hover:scale-125 ${
                                  idx === currentSlide
                                    ? "w-8 bg-foreground"
                                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                }`}
                                aria-label={`Go to image ${idx + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Project Details with Technologies */}
                  {project.more_context && (
                    <section className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground tracking-tight">
                        About This Project
                      </h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownContent
                          content={project.more_context}
                          className="text-foreground leading-relaxed"
                        />
                      </div>
                      {/* Technologies inline at bottom of About */}
                      {project.technologies &&
                        project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {project.technologies.map((tech) => (
                              <Badge
                                key={tech}
                                variant="secondary"
                                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-white dark:bg-white text-black"
                              >
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                    </section>
                  )}
                </div>

                {/* Fixed Footer with Action Buttons */}
                {(project.github || project.live_link) && (
                  <div className="border-t border-border bg-background/95 backdrop-blur-sm px-6 py-3">
                    <div className="flex justify-end flex-wrap gap-2">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-all font-medium text-xs shadow-sm hover:shadow-md"
                        >
                          <Github className="size-3.5" />
                          View Code
                        </a>
                      )}
                      {project.live_link && (
                        <a
                          href={project.live_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-accent transition-all font-medium text-xs shadow-sm hover:shadow-md"
                        >
                          <ExternalLink className="size-3.5" />
                          Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
