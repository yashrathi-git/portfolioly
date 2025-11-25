"use client";

import { Search, TrendingUp, ExternalLink } from "lucide-react";

export function SEOGraphic({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Central content */}
      <div className="relative flex flex-col items-center gap-4 w-full px-6">
        {/* Google-style search bar */}
        <div className="w-full max-w-[220px] flex items-center gap-2 rounded-full border border-border/50 bg-card/80 px-4 py-2.5 backdrop-blur-sm shadow-lg">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground truncate">
            software engineer portfolio
          </span>
        </div>

        {/* Search results */}
        <div className="w-full max-w-[240px] space-y-2">
          {/* Top result - highlighted */}
          <div className="relative rounded-lg border border-primary/30 bg-card/80 p-3 backdrop-blur-sm shadow-md">
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              1
            </div>
            <div className="ml-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-primary truncate">
                  yourname.portfolioly.app
                </span>
                <ExternalLink className="h-3 w-3 text-primary" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Full-stack developer with 5+ years...
              </p>
            </div>
          </div>

          {/* Other results - faded */}
          <div className="rounded-lg border border-border/30 bg-card/40 p-2.5 backdrop-blur-sm opacity-60">
            <div className="h-2 w-24 rounded bg-muted-foreground/20" />
            <div className="h-1.5 w-32 rounded bg-muted-foreground/10 mt-1.5" />
          </div>
          <div className="rounded-lg border border-border/30 bg-card/40 p-2.5 backdrop-blur-sm opacity-40">
            <div className="h-2 w-20 rounded bg-muted-foreground/20" />
            <div className="h-1.5 w-28 rounded bg-muted-foreground/10 mt-1.5" />
          </div>
        </div>

        {/* Ranking indicator */}
        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-xs font-medium text-muted-foreground">
            #1 Ranking
          </span>
        </div>
      </div>
    </div>
  );
}
