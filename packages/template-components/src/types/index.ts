/**
 * Main type definitions for template components
 */

// Re-export types from shared schema package
export type {
  // Backend-aligned types
  PortfolioData,
  PersonalInfo,
  WorkExperience,
  Project,
  ProjectImage,
  Education,
  Certification,
  TextBlobs,
  LayoutSettings,
  PortfolioMetadata,
  DateInfo,
  Profile,
  ProfileType,
  // Display format types
  DisplayPortfolioData,
  DisplayPortfolioProfile,
  DisplayProject,
  DisplayEducation,
  DisplayWorkExperience,
  SocialLink,
  SocialType,
} from "portfolioly-schema";

// Configuration types
export type { TemplateConfig, DataSourceType } from "../config/template-config";

// Data provider types
export type { DataProvider } from "../providers/data-provider";
export type { BatchLoadResult } from "../providers/batch-data-provider";
export type {
  ServerFetchResult,
  ServerDataProviderOptions,
} from "../providers/server-data-provider";
export type { HydratedPageProps } from "../providers/hydration-provider";

// Component types
export type {
  ComponentDataRequirements,
  FlaggedComponentProps,
} from "../utils/component-flags";
export type { DebugInfo } from "../utils/debug";

// API client types - these would be inferred from the classes
export interface ApiClientConfig {
  baseUrl?: string;
  authToken?: string;
  timeout?: number;
}

export interface UsernameValidation {
  valid: boolean;
  error?: string;
}

export interface UserSettings {
  username?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Token-related types
export interface EnsureTokenRequest {
  username: string;
}

export interface EnsureTokenResponse {
  token: string;
}

export interface EnsureUsernameRequest {
  user_id: string;
}

export interface EnsureUsernameResponse {
  username: string;
}

export interface PortfolioConfig {
  apiBaseUrl: string;
  username: string;
  publicToken?: string;
}
