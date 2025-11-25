"use client";

import { Github, Code2, Sparkles } from "lucide-react";

export function OpenSourceGraphic({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Central content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* GitHub icon with glow */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
            <Github className="h-10 w-10 text-foreground" />
          </div>
        </div>

        {/* Floating code elements */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              fork
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground">
              customize
            </span>
          </div>
        </div>

        {/* GitHub-style contribution dots */}
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-sm"
              style={{
                backgroundColor: `hsl(var(--primary) / ${0.2 + i * 0.12})`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
