"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Media CDN base URL
const MEDIA_CDN = "https://media.portfolioly.app";

interface VideoSource {
  webm?: string;
  mp4: string;
}

interface DemoSlide {
  sources: VideoSource;
  alt: string;
  fallbackDuration: number;
  poster?: string;
}

const DEMO_SLIDES: DemoSlide[] = [
  {
    sources: {
      webm: `${MEDIA_CDN}/hero/traditional-demo/traditional_demo_webm.webm`,
      mp4: `${MEDIA_CDN}/hero/traditional-demo/traditional_demo_mp4.mp4`,
    },
    alt: "Traditional portfolio demo - upload your resume and get a beautiful portfolio",
    fallbackDuration: 17000,
  },
  {
    sources: {
      mp4: `${MEDIA_CDN}/hero/chat_demo/chat_final.mp4`,
    },
    alt: "Chat portfolio demo - interactive AI-powered portfolio experience",
    fallbackDuration: 10000,
  },
];

export function DemoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoDurations, setVideoDurations] = useState<Map<number, number>>(
    new Map()
  );
  const [videoReady, setVideoReady] = useState<Set<number>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<number | null>(null);

  const currentSlide = DEMO_SLIDES[currentIndex];

  // Get duration: use actual video duration if available, fallback to config
  const duration =
    videoDurations.get(currentIndex) || currentSlide.fallbackDuration;

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % DEMO_SLIDES.length;
    setCurrentIndex(nextIndex);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

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

  // Track when videos are ready to play
  const handleCanPlay = useCallback((index: number) => {
    setVideoReady((prev) => new Set(prev).add(index));
  }, []);

  // Handle video ended - advance to next slide
  const handleVideoEnded = useCallback(() => {
    goToNext();
  }, [goToNext]);

  // Control video playback based on current index
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === currentIndex) {
        // Reset to start and play
        video.currentTime = 0;
        video.play().catch(() => {
          // Autoplay failed, user interaction may be required
        });
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex]);

  // Progress animation synced to video duration
  useEffect(() => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      // Fallback advancement if video onEnded doesn't fire
      if (newProgress >= 100) {
        goToNext();
      }
    }, 16); // ~60fps

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentIndex, duration, goToNext]);

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border shadow-2xl bg-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="w-full h-full"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* Loading indicator while video buffers */}
            {!videoReady.has(currentIndex) && (
              <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
                <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <video
              ref={(el) => {
                videoRefs.current[currentIndex] = el;
              }}
              className="w-full h-full object-cover object-top"
              autoPlay
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={(e) => {
                handleVideoMetadata(currentIndex, e.currentTarget);
              }}
              onCanPlay={() => handleCanPlay(currentIndex)}
              onEnded={handleVideoEnded}
              aria-label={currentSlide.alt}
            >
              {/* WEBM source first (preferred - better compression, browser auto-selects) */}
              {currentSlide.sources.webm && (
                <source
                  src={currentSlide.sources.webm}
                  type="video/webm"
                />
              )}
              {/* MP4 fallback */}
              <source
                src={currentSlide.sources.mp4}
                type="video/mp4"
              />
            </video>
          </motion.div>
        </AnimatePresence>

        {/* Eagerly preload all videos for instant navigation */}
        {DEMO_SLIDES.map((slide, index) => {
          // Skip current video (it's already rendered above)
          if (index === currentIndex) return null;

          return (
            <video
              key={`preload-${index}`}
              ref={(el) => {
                videoRefs.current[index] = el;
              }}
              className="hidden"
              preload="auto"
              muted
              playsInline
              onLoadedMetadata={(e) => {
                handleVideoMetadata(index, e.currentTarget);
              }}
              onCanPlay={() => handleCanPlay(index)}
            >
              {/* WEBM source first (preferred) */}
              {slide.sources.webm && (
                <source src={slide.sources.webm} type="video/webm" />
              )}
              {/* MP4 fallback */}
              <source src={slide.sources.mp4} type="video/mp4" />
            </video>
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
                className="absolute inset-0 bg-foreground"
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
