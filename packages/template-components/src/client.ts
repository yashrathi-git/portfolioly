"use client";

export * from "./components/ChatPortfolio";
export * from "./components/TraditionalPortfolio";
export * from "./components/PortfolioDock";
export * from "./components/ThemeToggle";
export * from "./components/chat/Composer";
export * from "./components/chat/EmptyState";
export * from "./components/chat/Header";
export * from "./components/chat/Thread";
export * from "./components/chat/Suggestions";
export * from "./components/chat/types";
// Re-export types from shared schema package
export type {
  DisplayPortfolioData,
  DisplayPortfolioProfile,
  DisplayProject,
  DisplayEducation,
  DisplayWorkExperience,
  SocialLink,
  SocialType,
} from "@portfolioly/schema";
export * from "./config/portfolio-config";
export { cn } from "./lib/utils";
