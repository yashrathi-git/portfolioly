/**
 * Development and debugging utilities for template components
 */

import { TemplateConfig } from "../config/template-config";
import { PortfolioData } from "../types/portfolio";
import { getFlaggedComponents } from "./component-flags";

export interface DebugInfo {
  config: TemplateConfig;
  dataSource: string;
  hasData: boolean;
  dataSize?: number;
  errors: string[];
  warnings: string[];
  performance: {
    loadTime?: number;
    cacheHits: number;
    apiCalls: number;
  };
}

class DebugLogger {
  private logs: Array<{
    timestamp: number;
    level: "info" | "warn" | "error";
    message: string;
    data?: any;
  }> = [];

  private config: TemplateConfig;

  constructor(config: TemplateConfig) {
    this.config = config;
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  error(message: string, data?: any) {
    this.log("error", message, data);
  }

  private log(level: "info" | "warn" | "error", message: string, data?: any) {
    const entry = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    this.logs.push(entry);

    // Only log to console in development and if debug logging is enabled
    if (
      this.config.enableDebugLogging &&
      process.env.NODE_ENV === "development"
    ) {
      const prefix = `[TemplateComponents:${level.toUpperCase()}]`;

      switch (level) {
        case "info":
          console.log(prefix, message, data || "");
          break;
        case "warn":
          console.warn(prefix, message, data || "");
          break;
        case "error":
          console.error(prefix, message, data || "");
          break;
      }
    }

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  getLogs(level?: "info" | "warn" | "error") {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      logs: this.logs,
    };
  }
}

// Global debug logger instance
let debugLogger: DebugLogger | null = null;

export function initializeDebugLogger(config: TemplateConfig): DebugLogger {
  debugLogger = new DebugLogger(config);
  return debugLogger;
}

export function getDebugLogger(): DebugLogger | null {
  return debugLogger;
}

/**
 * Debug utility to validate configuration
 */
export function validateConfiguration(config: TemplateConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check data source configuration
  if (!config.dataSource) {
    errors.push("Data source is required");
  } else if (!["api", "json", "hybrid"].includes(config.dataSource)) {
    errors.push(`Invalid data source: ${config.dataSource}`);
  }

  // Check API endpoints if using API
  if (config.dataSource === "api" || config.dataSource === "hybrid") {
    if (!config.apiEndpoints) {
      warnings.push("No API endpoints configured for API data source");
    } else {
      if (
        !config.apiEndpoints.publicPortfolio &&
        !config.apiEndpoints.authenticatedPortfolio
      ) {
        warnings.push("No portfolio endpoints configured");
      }
    }
  }

  // Check JSON files if using JSON
  if (config.dataSource === "json" || config.dataSource === "hybrid") {
    if (!config.jsonFiles?.portfolioData) {
      warnings.push("No JSON file path configured for JSON data source");
    }
  }

  // Check authentication for private endpoints
  if (config.apiEndpoints?.authenticatedPortfolio && !config.authToken) {
    warnings.push(
      "Authenticated endpoints configured but no auth token provided"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Debug utility to analyze portfolio data
 */
export function analyzePortfolioData(data: PortfolioData | null): {
  hasData: boolean;
  completeness: number; // 0-1 score
  missingFields: string[];
  dataSize: number;
} {
  if (!data) {
    return {
      hasData: false,
      completeness: 0,
      missingFields: ["all"],
      dataSize: 0,
    };
  }

  const requiredFields = [
    "profile.name",
    "profile.headline",
    "projects",
    "education",
    "experience",
  ];

  const missingFields: string[] = [];
  let presentFields = 0;

  // Check profile
  if (!data.profile?.name) missingFields.push("profile.name");
  else presentFields++;

  if (!data.profile?.headline) missingFields.push("profile.headline");
  else presentFields++;

  // Check arrays
  if (!data.projects || data.projects.length === 0)
    missingFields.push("projects");
  else presentFields++;

  if (!data.education || data.education.length === 0)
    missingFields.push("education");
  else presentFields++;

  if (!data.experience || data.experience.length === 0)
    missingFields.push("experience");
  else presentFields++;

  const completeness = presentFields / requiredFields.length;
  const dataSize = JSON.stringify(data).length;

  return {
    hasData: true,
    completeness,
    missingFields,
    dataSize,
  };
}

/**
 * Debug utility to test different data sources
 */
export async function testDataSources(config: TemplateConfig): Promise<{
  api: { available: boolean; error?: string };
  json: { available: boolean; error?: string };
}> {
  const results = {
    api: { available: false, error: undefined as string | undefined },
    json: { available: false, error: undefined as string | undefined },
  };

  // Test API availability
  if (config.apiEndpoints?.publicPortfolio) {
    try {
      const response = await fetch(
        config.apiEndpoints.publicPortfolio + "/test",
        {
          method: "HEAD",
        }
      );
      results.api.available = response.status !== 404;
    } catch (error) {
      results.api.error =
        error instanceof Error ? error.message : "Unknown error";
    }
  }

  // Test JSON file availability
  if (config.jsonFiles?.portfolioData) {
    try {
      const response = await fetch(config.jsonFiles.portfolioData, {
        method: "HEAD",
      });
      results.json.available = response.ok;
    } catch (error) {
      results.json.error =
        error instanceof Error ? error.message : "Unknown error";
    }
  }

  return results;
}

/**
 * Development utility to generate debug report
 */
export function generateDebugReport(
  config: TemplateConfig,
  data: PortfolioData | null,
  moduleExports?: Record<string, any>
): DebugInfo {
  const configValidation = validateConfiguration(config);
  const dataAnalysis = analyzePortfolioData(data);

  const errors = [...configValidation.errors];
  const warnings = [...configValidation.warnings];

  if (dataAnalysis.completeness < 0.5) {
    warnings.push(
      `Portfolio data is ${Math.round(
        dataAnalysis.completeness * 100
      )}% complete`
    );
  }

  if (dataAnalysis.missingFields.length > 0) {
    warnings.push(`Missing fields: ${dataAnalysis.missingFields.join(", ")}`);
  }

  return {
    config,
    dataSource: config.dataSource,
    hasData: dataAnalysis.hasData,
    dataSize: dataAnalysis.dataSize,
    errors,
    warnings,
    performance: {
      cacheHits: 0, // Would be tracked by data provider
      apiCalls: 0, // Would be tracked by data provider
    },
  };
}

/**
 * Development utility to log component usage
 */
export function logComponentUsage(moduleExports: Record<string, any>): void {
  if (process.env.NODE_ENV !== "development") return;

  const flaggedComponents = getFlaggedComponents(moduleExports);

  console.group("📊 Template Components Usage Report");
  console.log(`Total components: ${Object.keys(moduleExports).length}`);
  console.log(`Flagged components: ${flaggedComponents.length}`);

  if (flaggedComponents.length > 0) {
    console.group("Components requiring external data:");
    flaggedComponents.forEach(({ name, requirements }) => {
      console.log(`• ${name}: ${requirements.description}`);
    });
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private timers: Map<string, number> = new Map();
  private metrics: Map<string, number[]> = new Map();

  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    // Store metric
    const existing = this.metrics.get(name) || [];
    existing.push(duration);
    this.metrics.set(name, existing.slice(-10)); // Keep last 10 measurements

    return duration;
  }

  getAverageTime(name: string): number {
    const measurements = this.metrics.get(name) || [];
    if (measurements.length === 0) return 0;

    return (
      measurements.reduce((sum, time) => sum + time, 0) / measurements.length
    );
  }

  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    for (const [name, measurements] of this.metrics.entries()) {
      result[name] = {
        average: this.getAverageTime(name),
        count: measurements.length,
      };
    }

    return result;
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor();
