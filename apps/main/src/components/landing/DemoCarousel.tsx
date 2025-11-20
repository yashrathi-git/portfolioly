"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

interface DemoSlide {
  light: string;
  dark: string;
  alt: string;
  duration?: number;
}

const DEMO_SLIDES: DemoSlide[] = [
  {
    light: "/demo-1-light.png",
    dark: "/demo-1-dark.png",
    alt: "Portfolio upload interface",
    duration: 4000,
  },
  {
    light: "/demo-2-light.png",
    dark: "/demo-2-dark.png",
    alt: "AI processing your content",
    duration: 4000,
  },
  {
    light: "/demo-3-light.png",
    dark: "/demo-3-dark.png",
    alt: "Beautiful portfolio result",
    duration: 4000,
  },
];

const DEFAULT_DURATION = 4000;

export function DemoCarousel() {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentSlide = DEMO_SLIDES[currentIndex];
  const currentImage = isDark ? currentSlide.dark : currentSlide.light;
  const duration = currentSlide.duration || DEFAULT_DURATION;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % DEMO_SLIDES.length);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

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
          <motion.img
            key={currentImage}
            src={currentImage}
            alt={currentSlide.alt}
            className="w-full h-full object-cover object-top"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </AnimatePresence>
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
