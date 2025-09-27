/**
 * Abstract data provider interface and base implementation
 */

import { PortfolioData } from "../types/portfolio";
import { TemplateConfig } from "../config/template-config";

export interface DataProvider {
  // Core data fetching
  getPortfolioData(username?: string): Promise<PortfolioData | null>;
  getAuthenticatedPortfolioData(): Promise<PortfolioData | null>;

  // Username management
  checkUsernameAvailability(username: string): Promise<boolean>;
  setUsername(username: string): Promise<void>;
  setPortfolioVisibility(isPublic: boolean): Promise<void>;

  // Cache management
  clearCache(): void;
  refreshData(): Promise<void>;
}

export abstract class BaseDataProvider implements DataProvider {
  protected config: TemplateConfig;
  protected cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: TemplateConfig) {
    this.config = config;
  }

  abstract getPortfolioData(username?: string): Promise<PortfolioData | null>;
  abstract getAuthenticatedPortfolioData(): Promise<PortfolioData | null>;
  abstract checkUsernameAvailability(username: string): Promise<boolean>;
  abstract setUsername(username: string): Promise<void>;
  abstract setPortfolioVisibility(isPublic: boolean): Promise<void>;

  protected getCachedData<T>(key: string): T | null {
    if (!this.config.enableCache) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired =
      Date.now() - cached.timestamp > (this.config.cacheTimeout || 0);
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  protected setCachedData<T>(key: string, data: T): void {
    if (!this.config.enableCache) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  async refreshData(): Promise<void> {
    this.clearCache();
  }

  protected log(message: string, ...args: any[]): void {
    if (this.config.enableDebugLogging) {
      console.log(`[DataProvider] ${message}`, ...args);
    }
  }
}

export class DataProviderError extends Error {
  constructor(
    message: string,
    public readonly type:
      | "network"
      | "auth"
      | "validation"
      | "unknown" = "unknown",
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "DataProviderError";
  }
}
