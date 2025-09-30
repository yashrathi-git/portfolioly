"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutSwitcher, type LayoutMode } from "./LayoutSwitcher";
import { ChatPortfolio } from "./ChatPortfolio";
import { TraditionalPortfolio } from "./TraditionalPortfolio";
import type { PortfolioData } from "../types/portfolio";
import type { ChatProfile, Suggestion } from "./chat/types";
import PortfolioErrorBoundary from "./ErrorBoundary";

export interface LayoutSettings {
  layoutMode: "chat-only" | "traditional-only" | "both";
  defaultLayout: "chat" | "traditional";
}

export interface PortfolioLayoutContainerProps {
  portfolioData?: PortfolioData | null;
  layoutSettings?: LayoutSettings;
  isLoading?: boolean;
  error?: string;
  isOwner?: boolean;
  isPreview?: boolean; // For preview mode with contained switcher
  // Chat-specific props
  profile?: ChatProfile;
  suggestions?: Suggestion[];
  presets?: Record<string, string>;
}

const SESSION_STORAGE_KEY = "portfolio-layout-preference";

export const PortfolioLayoutContainer = ({
  portfolioData,
  layoutSettings = {
    layoutMode: "both",
    defaultLayout: "chat",
  },
  isLoading = false,
  error,
  isOwner = false,
  isPreview = false,
  profile,
  suggestions = [],
  presets = {},
}: PortfolioLayoutContainerProps) => {
  // Determine available layouts based on settings
  const getAvailableLayouts = (): LayoutMode[] => {
    switch (layoutSettings.layoutMode) {
      case "chat-only":
        return ["chat"];
      case "traditional-only":
        return ["traditional"];
      case "both":
      default:
        return ["chat", "traditional"];
    }
  };

  const availableLayouts = getAvailableLayouts();

  // Initialize current layout
  const getInitialLayout = (): LayoutMode => {
    // For owners, always use their default setting
    if (isOwner) {
      return layoutSettings.defaultLayout;
    }

    // For visitors, check session storage first, then use owner's default
    if (typeof window !== "undefined") {
      const sessionPreference = sessionStorage.getItem(
        SESSION_STORAGE_KEY
      ) as LayoutMode;
      if (sessionPreference && availableLayouts.includes(sessionPreference)) {
        return sessionPreference;
      }
    }

    return layoutSettings.defaultLayout;
  };

  const [currentLayout, setCurrentLayout] =
    useState<LayoutMode>(getInitialLayout);

  // Update layout when settings change
  useEffect(() => {
    const newAvailableLayouts = getAvailableLayouts();

    // If current layout is no longer available, switch to default
    if (!newAvailableLayouts.includes(currentLayout)) {
      setCurrentLayout(layoutSettings.defaultLayout);
    }
  }, [layoutSettings, currentLayout]);

  // Handle layout change
  const handleLayoutChange = (newLayout: LayoutMode) => {
    setCurrentLayout(newLayout);

    // Save visitor preference to session storage (not for owners)
    if (!isOwner && typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_STORAGE_KEY, newLayout);
    }
  };

  // Show loading state
  if (isLoading && !portfolioData) {
    return (
      <div className="min-h-[100svh] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[color:var(--muted-foreground)]">
            Loading portfolio...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !portfolioData) {
    return (
      <div className="min-h-[100svh] w-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4 text-2xl">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">
            Failed to Load Portfolio
          </h2>
          <p className="text-[color:var(--muted-foreground)] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const showSwitcher = availableLayouts.length > 1;

  return (
    <PortfolioErrorBoundary>
      <div className="min-h-[100svh] w-full relative">
        {/* Layout Switcher */}
        {showSwitcher && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={
              isPreview
                ? "absolute top-4 left-1/2 -translate-x-1/2 z-50"
                : "fixed top-4 left-1/2 -translate-x-1/2 z-50"
            }
          >
            <LayoutSwitcher
              currentLayout={currentLayout}
              availableLayouts={availableLayouts}
              onLayoutChange={handleLayoutChange}
            />
          </motion.div>
        )}

        {/* Layout Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLayout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {currentLayout === "chat" ? (
              <ChatPortfolio
                portfolioData={portfolioData}
                profile={profile}
                suggestions={suggestions}
                presets={presets}
                isLoading={isLoading}
                error={error}
              />
            ) : (
              <TraditionalPortfolio
                data={portfolioData}
                isLoading={isLoading}
                error={error}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PortfolioErrorBoundary>
  );
};

export default PortfolioLayoutContainer;
