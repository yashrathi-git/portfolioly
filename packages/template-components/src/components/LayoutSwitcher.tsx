"use client";

import { motion } from "framer-motion";
import { MessageSquare, FileText } from "lucide-react";
import { cn } from "../lib/utils";

export type LayoutMode = "chat" | "traditional";

export interface LayoutSwitcherProps {
  currentLayout: LayoutMode;
  availableLayouts: LayoutMode[];
  onLayoutChange: (layout: LayoutMode) => void;
  className?: string;
}

export const LayoutSwitcher = ({
  currentLayout,
  availableLayouts,
  onLayoutChange,
  className,
}: LayoutSwitcherProps) => {
  // Don't render if only one layout is available
  if (availableLayouts.length <= 1) {
    return null;
  }

  const layoutConfig = {
    chat: {
      icon: MessageSquare,
      label: "Chat Mode",
      description: "Interactive conversation",
    },
    traditional: {
      icon: FileText,
      label: "Traditional",
      description: "Classic portfolio",
    },
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="inline-flex items-center rounded-full border border-[color:var(--border)]/60 bg-[var(--card)]/80 backdrop-blur p-1 shadow-sm">
        {availableLayouts.map((layout) => {
          const config = layoutConfig[layout];
          const Icon = config.icon;
          const isActive = currentLayout === layout;

          return (
            <button
              key={layout}
              onClick={() => onLayoutChange(layout)}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                "hover:bg-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/60",
                isActive
                  ? "text-[color:var(--primary-foreground)] shadow-sm"
                  : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-layout-bg"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[oklch(0.84_0.07_250)] to-[oklch(0.74_0.15_310)]"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2">
                <Icon className="size-4" />
                <span>{config.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LayoutSwitcher;
