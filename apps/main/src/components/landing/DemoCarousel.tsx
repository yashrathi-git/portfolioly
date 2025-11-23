"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DemoSlide {
  video: string;
  alt: string;
  fallbackDuration?: number;
  poster?: string;
}

const DEMO_SLIDES: DemoSlide[] = [
  {
    video:
      "https://pub-2d848092fcca45dda1fe493291d9cb04.r2.dev/hero/traditional_portfolio_demo.webm",
    alt: "Portfolio upload interface",
    fallbackDuration: 16000,
    poster: "/demo-1-poster.jpg",
  },
  {
    video: "/demo-2.mp4",
    alt: "AI processing your content",
    fallbackDuration: 10000,
  },
  {
    video: "/demo-3.mp4",
    alt: "Beautiful portfolio result",
    fallbackDuration: 10000,
  },
];

const DEFAULT_FALLBACK_DURATION = 10000;

export function DemoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set([0]));
  const [videoDurations, setVideoDurations] = useState<Map<number, number>>(
    new Map()
  );
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  const currentSlide = DEMO_SLIDES[currentIndex];
  const currentVideo = currentSlide.video;
  const currentPoster = currentSlide.poster;

  // Get duration: use actual video duration if available, fallback to config
  const duration =
    videoDurations.get(currentIndex) ||
    currentSlide.fallbackDuration ||
    DEFAULT_FALLBACK_DURATION;

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % DEMO_SLIDES.length;
    setCurrentIndex(nextIndex);
    setProgress(0);
    startTimeRef.current = Date.now();

    // Preload next video
    if (!loadedVideos.has(nextIndex)) {
      setLoadedVideos((prev) => new Set(prev).add(nextIndex));
    }
  }, [currentIndex, loadedVideos]);

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      setProgress(0);
      startTimeRef.current = Date.now();

      // Preload selected video
      if (!loadedVideos.has(index)) {
        setLoadedVideos((prev) => new Set(prev).add(index));
      }
    },
    [loadedVideos]
  );

  // Handle video metadata loaded - extract duration
  const handleVideoMetadata = useCallback(
    (index: number, video: HTMLVideoElement) => {
      if (
        video.duration &&
        !isNaN(video.duration) &&
        isFinite(video.duration)
      ) {
        const durationMs = Math.floor(video.duration * 1000);
        setVideoDurations((prev) => {
          const newMap = new Map(prev);
          newMap.set(index, durationMs);
          return newMap;
        });
      }
    },
    []
  );

  // Control video playback based on current index
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === currentIndex) {
        video.play().catch(() => {
          // Autoplay failed, user interaction required
        });
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex]);

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        goToNext();
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [currentIndex, duration, goToNext]);

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border shadow-2xl bg-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="w-full h-full"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <video
              ref={(el) => {
                videoRefs.current[currentIndex] = el;
              }}
              src={currentVideo}
              poster={currentPoster}
              className="w-full h-full object-cover object-top"
              autoPlay
              loop
              muted
              playsInline
              preload={currentIndex === 0 ? "auto" : "metadata"}
              onLoadedMetadata={(e) => {
                handleVideoMetadata(currentIndex, e.currentTarget);
              }}
              onLoadedData={() => {
                if (!loadedVideos.has(currentIndex)) {
                  setLoadedVideos((prev) => new Set(prev).add(currentIndex));
                }
              }}
              aria-label={currentSlide.alt}
            />
          </motion.div>
        </AnimatePresence>

        {/* Preload other videos in background */}
        {DEMO_SLIDES.map((slide, index) => {
          if (index === currentIndex) return null;
          const shouldLoad = loadedVideos.has(index);

          return (
            <video
              key={`preload-${index}`}
              ref={(el) => {
                videoRefs.current[index] = el;
              }}
              src={slide.video}
              className="hidden"
              preload={shouldLoad ? "metadata" : "none"}
              muted
              playsInline
              onLoadedMetadata={(e) => {
                handleVideoMetadata(index, e.currentTarget);
              }}
              onLoadedData={() => {
                if (!loadedVideos.has(index)) {
                  setLoadedVideos((prev) => new Set(prev).add(index));
                }
              }}
            />
          );
        })}
      </div>

      {/* Animated Progress Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {DEMO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="relative h-1.5 w-12 rounded-full bg-muted overflow-hidden cursor-pointer transition-all hover:bg-muted/80"
            aria-label={`Go to slide ${index + 1}`}
          >
            {/* Filled background for completed slides */}
            {index < currentIndex && (
              <div className="absolute inset-0 bg-foreground" />
            )}

            {/* Animated progress for current slide */}
            {index === currentIndex && (
              <div
                className="absolute inset-0 bg-foreground transition-all"
                style={{
                  width: `${progress}%`,
                  transition: "width 16ms linear",
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
