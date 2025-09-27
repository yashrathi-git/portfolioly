/**
 * Main type definitions for template components
 */

// Re-export all types for easy importing
export * from "./portfolio";

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
