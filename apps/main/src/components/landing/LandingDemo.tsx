"use client";

import { YouTubePlayer } from "@/components/landing/VideoPlayer";

const DEMO_VIDEO = {
  id: "dQw4w9WgXcQ", // Placeholder ID
  title: "Creating and deploying a portfolio in 1 minute",
  thumbnail: "/placeholder-video-thumb.jpg", // Placeholder
};

export function LandingDemo() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {DEMO_VIDEO.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how easy it is to get your portfolio up and running with Portfolioly.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <YouTubePlayer
            videoId={DEMO_VIDEO.id}
            // Title removed from player for cleaner look
            // customThumbnail={DEMO_VIDEO.thumbnail} // Uncomment when real thumbnail is available
            defaultExpanded={false}
            // Container styling
            className="mb-8"
            containerClassName="rounded-xl overflow-hidden shadow-2xl bg-card ring-1 ring-white/10"
            expandedClassName="shadow-2xl ring-0"
            // Thumbnail styling
            thumbnailClassName="bg-gradient-to-br from-primary/5 to-secondary/5"
            thumbnailImageClassName="opacity-90 transition-opacity hover:opacity-100"
            // Play button styling
            playButtonClassName="bg-background/90 hover:bg-background hover:scale-110 transition-all duration-300 border-0 shadow-xl backdrop-blur-md group/play"
            playIconClassName="text-primary fill-primary group-hover/play:scale-110 transition-transform duration-300"
            // Controls styling
            controlsClassName="right-4 top-4"
            expandButtonClassName="bg-background/50 hover:bg-background/70 border-0 text-foreground backdrop-blur-sm"
            // Modal styling
            backdropClassName="bg-background/90 backdrop-blur-xl"
            playerClassName="bg-black rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}
