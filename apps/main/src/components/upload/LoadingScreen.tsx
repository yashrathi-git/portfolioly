"use client";

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  message?: string;
}

const loadingMessages = [
  "Reading your content",
  "Extracting information",
  "Organizing your experience",
  "Polishing the details",
  "Almost there",
];

export function LoadingScreen({ message }: LoadingScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);

    return () => {
      clearInterval(messageInterval);
    };
  }, []);

  const currentMessage = message || loadingMessages[currentMessageIndex];

  return (
    <div className="flex items-center justify-center min-h-[500px] p-4">
      <div className="w-full max-w-md">
        <div className="text-center space-y-10">
          {/* Spinner */}
          <div className="flex justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-[3px] border-border/40 rounded-full" />
              <div
                className="absolute inset-0 border-[3px] border-primary border-t-transparent rounded-full"
                style={{
                  animation: "spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                }}
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2
              className={`text-lg font-medium text-foreground transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              {currentMessage}
            </h2>

            <p className="text-sm text-muted-foreground/80">
              This usually takes 30-60 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
