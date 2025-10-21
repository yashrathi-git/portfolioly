"use client";

import type { LucideIcon } from "lucide-react";
import type { PortfolioData } from "@portfolioly/schema";
import { cn } from "@/lib/utils";

export interface NavigationSection {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
  hasData: (data: PortfolioData) => boolean;
}

export interface NavigationSidebarProps {
  sections: NavigationSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  portfolioData: PortfolioData;
}

export function NavigationSidebar({
  sections,
  activeSection,
  onSectionChange,
  portfolioData,
}: NavigationSidebarProps) {
  return (
    <nav
      className="rounded-lg border bg-card p-3 space-y-1"
      aria-label="Portfolio sections"
      role="navigation"
    >
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const hasData = section.hasData(portfolioData);

        return (
          <button
            key={section.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`section-${section.id}`}
            aria-label={`${section.label} section${
              hasData ? ", completed" : ", empty"
            }`}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md w-full",
              "text-sm font-medium transition-all duration-150",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive && "bg-primary text-primary-foreground"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">{section.label}</span>
            {/* Completion Indicator */}
            {hasData && (
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full flex-shrink-0",
                  isActive ? "bg-primary-foreground" : "bg-green-500"
                )}
                aria-label="Completed"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
