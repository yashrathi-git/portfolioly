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
  username?: string; // Portfolio username for API calls
  apiBaseUrl?: string; // Base URL for API calls
  authToken?: string; // Authentication token for authenticated API calls
  publicToken?: string; // Public token for token-based authentication
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
  username,
  apiBaseUrl,
  authToken,
  publicToken,
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

  // Enhanced loading state
  if (isLoading && !portfolioData) {
    return (
      <div className="min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="relative mb-6">
            <div className="animate-spin h-12 w-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full mx-auto"></div>
            <div className="animate-pulse absolute inset-0 h-12 w-12 border-2 border-blue-300/20 rounded-full mx-auto"></div>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-[var(--foreground)]">
            Loading Portfolio
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            Please wait while we prepare the experience...
          </p>
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (error && !portfolioData) {
    return (
      <div className="min-h-[100svh] w-full flex items-center justify-center bg-[var(--background)] px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-4xl sm:text-5xl mb-6">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-red-600 dark:text-red-400">
            Failed to Load Portfolio
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted-foreground)] mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-sm min-h-[44px]"
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
      <div className="min-h-[100svh] w-full relative bg-[var(--background)]">
        {/* Enhanced Layout Switcher with better positioning */}
        {showSwitcher && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={
              isPreview
                ? "absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4"
                : "fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4"
            }
          >
            <LayoutSwitcher
              currentLayout={currentLayout}
              availableLayouts={availableLayouts}
              onLayoutChange={handleLayoutChange}
            />
          </motion.div>
        )}

        {/* Enhanced Layout Content with smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLayout}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
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
                username={username}
                apiBaseUrl={apiBaseUrl}
                authToken={authToken}
                publicToken={publicToken}
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