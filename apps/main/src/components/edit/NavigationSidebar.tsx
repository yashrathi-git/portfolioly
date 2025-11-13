"use client";

import type { LucideIcon } from "lucide-react";
import type { PortfolioData } from "portfolioly-schema";
import { cn } from "@/lib/utils";

export interface NavigationSection {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (value: any) => void;
  }>;
  hasData: (data: PortfolioData) => boolean;
}

export interface NavigationSidebarProps {
  sections: NavigationSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  portfolioData: PortfolioData;
}

/**
 * NavigationSidebar Component
 *
 * A vertical navigation sidebar for portfolio editing sections with the following features:
 *
 * Visual States:
 * - Default: Muted text (text-muted-foreground), no background
 * - Hover: Light background (bg-accent) with smooth 150ms transition
 * - Active: Primary background (bg-primary), white text, 4px left border accent
 * - Focus: Visible ring indicator for keyboard navigation
 *
 * Accessibility:
 * - WCAG AA compliant color contrast ratios (minimum 4.5:1)
 * - Keyboard navigable with visible focus indicators
 * - ARIA attributes for screen reader support
 * - Minimum 44x44px touch targets for mobile
 *
 * Animations:
 * - All transitions use 150ms ease-in-out for smooth visual feedback
 */

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
              // Base styles - default state with muted text, no background
              "flex items-center gap-3 px-3 py-2.5 rounded-md w-full min-h-[44px]",
              "text-sm font-medium text-muted-foreground",
              // Smooth transitions (150ms ease-in-out)
              "transition-all duration-150 ease-in-out",
              // Hover state - light background with smooth transition
              "hover:bg-accent hover:text-accent-foreground",
              // Focus-visible ring for keyboard navigation
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              // Active state - primary background, white text, left border accent (4px)
              isActive && [
                "bg-primary text-primary-foreground",
                "border-l-4 border-primary-foreground/20",
                "pl-[8px]", // Adjust padding to account for border (12px - 4px)
              ]
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">{section.label}</span>
            {/* Completion Indicator */}
            <span
              className={cn(
                "h-2 w-2 rounded-full flex-shrink-0 ml-auto",
                hasData
                  ? isActive
                    ? "bg-primary-foreground"
                    : "bg-green-500"
                  : "bg-muted"
              )}
              aria-label={hasData ? "Completed" : "Empty"}
            />
          </button>
        );
      })}
    </nav>
  );
}
