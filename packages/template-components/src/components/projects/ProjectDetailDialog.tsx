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
            className="z-50 bg-background/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full max-h-[90vh]">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="shrink-0 z-10 flex items-start justify-between gap-4 px-8 py-6 bg-background/50 backdrop-blur-sm"
              >
                <h2 className="text-3xl font-bold text-foreground pr-8 tracking-tight">
                  {project.name}
                </h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-full p-2 bg-muted/50 hover:bg-accent transition-all hover:rotate-90 duration-300 shrink-0"
                  aria-label="Close"
                >
                  <X className="size-5 text-foreground/70" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col min-h-0 flex-1"
              >
                {/* Main Content - Scrollable */}
                <div className="flex-1 px-8 pb-8 space-y-12 overflow-y-auto custom-scrollbar">
                  {/* Demo Video Section */}
                  {embedUrl && videoThumbnail && (
                    <section className="space-y-6">
                      <h3 className="text-xl font-semibold text-foreground/90 tracking-tight flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary rounded-full inline-block" />
                        Demo Video
                      </h3>
                      <div className="w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10">
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
                    <section className="space-y-6">
                      <h3 className="text-xl font-semibold text-foreground/90 tracking-tight flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary rounded-full inline-block" />
                        Gallery
                      </h3>
                      <div className="relative max-w-5xl mx-auto group px-12">
                        <Carousel
                          className="w-full"
                          setApi={setCarouselApi}
                          opts={{
                            align: "center",
                            loop: true,
                          }}
                        >
                          <CarouselContent className="-ml-4">
                            {sortedImages.map(
                              (image: ProjectImage, idx: number) => (
                                <CarouselItem
                                  key={idx}
                                  className="pl-4 basis-full"
                                >
                                  <div className="space-y-4">
                                    <div className="relative w-full flex items-center justify-center overflow-hidden rounded-2xl bg-muted/10">
                                      <img
                                        src={image.url}
                                        alt={
                                          image.caption ||
                                          `Project image ${idx + 1}`
                                        }
                                        className="object-contain w-full h-auto max-h-[60vh] shadow-sm"
                                      />
                                    </div>
                                    {image.caption && (
                                      <p className="text-sm text-muted-foreground text-center font-medium leading-relaxed px-4">
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
                              <CarouselPrevious className="left-0 bg-background/80 backdrop-blur hover:bg-background border-0 shadow-md h-10 w-10 text-foreground/80" />
                              <CarouselNext className="right-0 bg-background/80 backdrop-blur hover:bg-background border-0 shadow-md h-10 w-10 text-foreground/80" />
                            </>
                          )}
                        </Carousel>
                        {/* Interactive Carousel Indicators */}
                        {sortedImages.length > 1 && (
                          <div className="flex justify-center mt-6 gap-2">
                            {sortedImages.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => carouselApi?.scrollTo(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  idx === currentSlide
                                    ? "w-8 bg-primary"
                                    : "w-2 bg-primary/20 hover:bg-primary/40"
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
                    <section className="space-y-6">
                      <h3 className="text-xl font-semibold text-foreground/90 tracking-tight flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary rounded-full inline-block" />
                        About This Project
                      </h3>
                      <div className="prose prose-zinc dark:prose-invert max-w-none">
                        <MarkdownContent
                          content={project.more_context}
                          className="text-foreground/80 leading-loose text-base"
                        />
                      </div>
                      {/* Technologies inline at bottom of About */}
                      {project.technologies &&
                        project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-4">
                            {project.technologies.map((tech) => (
                              <Badge
                                key={tech}
                                variant="secondary"
                                className="px-3 py-1 text-xs font-medium rounded-full bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 transition-colors border border-transparent"
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
                  <div className="shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-md px-8 py-4">
                    <div className="flex justify-end flex-wrap gap-3">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all font-medium text-sm shadow-lg hover:shadow-xl"
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
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/50 bg-background hover:bg-accent/50 hover:scale-105 transition-all font-medium text-sm shadow-sm hover:shadow-md"
                        >
                          <ExternalLink className="size-4" />
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
