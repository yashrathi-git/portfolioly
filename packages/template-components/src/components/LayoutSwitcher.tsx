"use client";

import { MessageSquare, FileText } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";

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
      label: "Chat",
    },
    traditional: {
      icon: FileText,
      label: "Traditional",
    },
  };

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-center",
        className
      )}
    >
      <div className="flex items-center p-1 bg-background/50 backdrop-blur-md border border-border/50 shadow-lg rounded-full">
        {availableLayouts.map((layout) => {
          const config = layoutConfig[layout];
          const Icon = config.icon;
          const isActive = currentLayout === layout;

          return (
            <button
              key={layout}
              type="button"
              onClick={() => onLayoutChange(layout)}
              aria-label={config.label}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors z-10",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-layout-pill"
                  className="absolute inset-0 bg-primary rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LayoutSwitcher;
