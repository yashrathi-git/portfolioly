"use client";

import { useMemo } from "react";
import {
  PortfolioLayoutContainer,
  type PortfolioLayoutSettings,
} from "./PortfolioLayoutContainer";
import type { DisplayPortfolioData } from "portfolioly-schema";
import type { ChatProfile, Suggestion } from "./chat/types";

export interface PortfolioProps {
  portfolioData?: DisplayPortfolioData | null;
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

/**
 * Unified Portfolio component that handles layout switching and rendering
 *
 * This is the main component that should be used to display portfolios.
 * It automatically handles layout preferences and provides a seamless
 * experience for both owners and visitors.
 */
export const Portfolio = ({
  portfolioData,
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
}: PortfolioProps) => {
  // Extract layout settings from portfolio data
  const layoutSettings: PortfolioLayoutSettings = useMemo(() => {
    const settings = portfolioData?.layout_settings;

    return {
      layoutMode:
        (settings?.layout_mode as PortfolioLayoutSettings["layoutMode"]) ||
        "both",
      defaultLayout:
        (settings?.default_layout as PortfolioLayoutSettings["defaultLayout"]) ||
        "chat",
    };
  }, [portfolioData?.layout_settings]);

  // Generate default suggestions if none provided
  const defaultSuggestions: Suggestion[] = useMemo(() => {
    if (suggestions.length > 0) return suggestions;

    const generatedSuggestions: Suggestion[] = [];

    // Add suggestions based on available data
    if (portfolioData?.profile) {
      generatedSuggestions.push({
        id: "about",
        label: "Tell me about yourself",
        icon: "user",
      });
    }

    if (portfolioData?.projects && portfolioData.projects.length > 0) {
      generatedSuggestions.push({
        id: "projects",
        label: "Show me your projects",
        icon: "folderGit2",
      });
    }

    if (portfolioData?.skills && portfolioData.skills.length > 0) {
      generatedSuggestions.push({
        id: "skills",
        label: "What are your skills?",
        icon: "wrench",
      });
    }

    if (portfolioData?.experience && portfolioData.experience.length > 0) {
      generatedSuggestions.push({
        id: "experience",
        label: "Tell me about your experience",
        icon: "user",
      });
    }

    if (
      portfolioData?.profile?.email ||
      portfolioData?.profile?.socials?.length
    ) {
      generatedSuggestions.push({
        id: "contact",
        label: "How can I contact you?",
        icon: "mail",
      });
    }

    return generatedSuggestions;
  }, [suggestions, portfolioData]);

  // Generate effective profile for chat mode
  const effectiveProfile: ChatProfile | undefined = useMemo(() => {
    if (profile) return profile;

    if (portfolioData?.profile) {
      const links: ChatProfile["links"] = [];

      // Add social links
      portfolioData.profile.socials?.forEach((social) => {
        if (social.type === "github") {
          links.push({ type: "github", href: social.href });
        } else if (social.type === "linkedin") {
          links.push({ type: "link", href: social.href });
        } else if (social.type === "mail") {
          links.push({ type: "mail", href: social.href });
        }
      });

      // Add email if available
      if (portfolioData.profile.email) {
        links.push({
          type: "mail",
          href: `mailto:${portfolioData.profile.email}`,
        });
      }

      return {
        name: portfolioData.profile.name,
        avatarUrl:
          portfolioData.profile.avatarUrl || portfolioData.profile.avatarUrl,
        links: links.length > 0 ? links : undefined,
      };
    }

    return undefined;
  }, [profile, portfolioData]);

  return (
    <PortfolioLayoutContainer
      portfolioData={portfolioData}
      layoutSettings={layoutSettings}
      isLoading={isLoading}
      error={error}
      isOwner={isOwner}
      isPreview={isPreview}
      profile={effectiveProfile}
      suggestions={defaultSuggestions}
      presets={presets}
      username={username}
      apiBaseUrl={apiBaseUrl}
      authToken={authToken}
      publicToken={publicToken}
    />
  );
};

export default Portfolio;
