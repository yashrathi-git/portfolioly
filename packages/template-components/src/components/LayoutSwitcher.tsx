"use client";

import { motion } from "framer-motion";
import { MessageSquare, FileText } from "lucide-react";
import { cn } from "../lib/cn";

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
      shortLabel: "Chat",
      description: "Interactive AI conversation",
    },
    traditional: {
      icon: FileText,
      label: "Portfolio",
      shortLabel: "Portfolio", 
      description: "Classic portfolio view",
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-center justify-center", className)}
    >
      <div className="relative">
        {/* Enhanced background with glassmorphism */}
        <div className="absolute inset-0 bg-[var(--card)]/80 backdrop-blur-xl border border-[var(--border)]/50 rounded-2xl shadow-xl shadow-black/5"></div>
        
        {/* Subtle glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-2xl"></div>
        
        {/* Content */}
        <div className="relative inline-flex items-center p-1.5">
          {availableLayouts.map((layout) => {
            const config = layoutConfig[layout];
            const Icon = config.icon;
            const isActive = currentLayout === layout;

            return (
              <button
                key={layout}
                onClick={() => onLayoutChange(layout)}
                className={cn(
                  "relative inline-flex items-center gap-2 sm:gap-3 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base font-medium transition-all duration-200 min-h-[44px]",
                  "hover:bg-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/60 focus:ring-offset-2 focus:ring-offset-[var(--background)]",
                  isActive
                    ? "text-white"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                {/* Active background with enhanced animation */}
                {isActive && (
                  <motion.div
                    layoutId="active-layout-bg-enhanced"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                
                {/* Content */}
                <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                  {/* Enhanced icon */}
                  <span className={cn(
                    "inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg transition-all duration-200",
                    isActive ? "text-white" : "text-[var(--muted-foreground)]"
                  )}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  
                  {/* Responsive labels */}
                  <span className="hidden sm:block">{config.label}</span>
                  <span className="block sm:hidden text-xs">{config.shortLabel}</span>
                </div>

                {/* Mobile tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none sm:hidden">
                  <div className="bg-[var(--foreground)] text-[var(--background)] text-xs px-2 py-1 rounded-md whitespace-nowrap">
                    {config.description}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]"></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default LayoutSwitcher;