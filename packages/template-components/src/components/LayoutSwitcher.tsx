"use client";

import { MessageSquare, FileText } from "lucide-react";
import { cn } from "../lib/utils";
import { Dock, DockIcon } from "./magicui/dock";

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
    },
    traditional: {
      icon: FileText,
      label: "Traditional",
    },
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Dock className="bg-background/80 backdrop-blur-sm border-border/50">
        {availableLayouts.map((layout) => {
          const config = layoutConfig[layout];
          const Icon = config.icon;
          const isActive = currentLayout === layout;

          return (
            <DockIcon key={layout}>
              <button
                type="button"
                onClick={() => onLayoutChange(layout)}
                aria-label={config.label}
                className={cn(
                  "flex h-full w-full items-center justify-center rounded-full transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </button>
            </DockIcon>
          );
        })}
      </Dock>
    </div>
  );
};

export default LayoutSwitcher;
