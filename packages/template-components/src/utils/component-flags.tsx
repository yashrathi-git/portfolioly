/**
 * Component flagging system for external data dependencies
 */

import React from "react";
import type { DisplayPortfolioData } from "portfolioly-schema";

export interface ComponentDataRequirements {
  requiresExternalData: boolean;
  dataSource: "api" | "json" | "props";
  fallbackData?: DisplayPortfolioData | null;
  description: string;
}

export interface FlaggedComponentProps {
  portfolioData?: DisplayPortfolioData | null;
  isLoading?: boolean;
  error?: string;
}

/**
 * Decorator to flag components that require external data
 */
export function requiresExternalData(
  requirements: Omit<ComponentDataRequirements, "requiresExternalData">
) {
  return function (Component: React.ComponentType<any>) {
    const WrappedComponent = (props: any) => {
      const { portfolioData, isLoading, error } = props;

      // Development warnings (only when not loading)
      if (process.env.NODE_ENV === "development") {
        // Skip validation during loading state
        if (!isLoading && !portfolioData && !error) {
          console.warn(
            `Component ${
              Component.displayName || Component.name
            } requires external data but none was provided. ` +
              `Expected data source: ${requirements.dataSource}. ` +
              `Description: ${requirements.description}`
          );
        }
      }

      const effectiveData = portfolioData ?? requirements.fallbackData ?? null;

      return <Component {...props} portfolioData={effectiveData} />;
    };

    WrappedComponent.displayName = `RequiresExternalData(${
      Component.displayName || Component.name
    })`;

    (WrappedComponent as any).__dataRequirements = {
      requiresExternalData: true,
      ...requirements,
    };

    return WrappedComponent;
  };
}

/**
 * Check if a component requires external data
 */
export function componentRequiresExternalData(
  component: React.ComponentType<any>
): ComponentDataRequirements | null {
  return (component as any).__dataRequirements || null;
}

/**
 * Get all flagged components from a module
 */
export function getFlaggedComponents(
  moduleExports: Record<string, any>
): Array<{
  name: string;
  component: React.ComponentType<any>;
  requirements: ComponentDataRequirements;
}> {
  const flaggedComponents: Array<{
    name: string;
    component: React.ComponentType<any>;
    requirements: ComponentDataRequirements;
  }> = [];

  for (const [name, exportedValue] of Object.entries(moduleExports)) {
    if (typeof exportedValue === "function") {
      const requirements = componentRequiresExternalData(exportedValue);
      if (requirements) {
        flaggedComponents.push({
          name,
          component: exportedValue,
          requirements,
        });
      }
    }
  }

  return flaggedComponents;
}

/**
 * Development utility to log all flagged components
 */
export function logFlaggedComponents(moduleExports: Record<string, any>): void {
  if (process.env.NODE_ENV !== "development") return;

  const flaggedComponents = getFlaggedComponents(moduleExports);

  if (flaggedComponents.length > 0) {
    console.group("🏷️ Components requiring external data:");
    flaggedComponents.forEach(({ name, requirements }) => {
      console.log(`• ${name}:`, {
        dataSource: requirements.dataSource,
        description: requirements.description,
        hasFallback: !!requirements.fallbackData,
      });
    });
    console.groupEnd();
  }
}

/**
 * Higher-order component to provide dummy data for development
 */
export function withDummyData<P extends FlaggedComponentProps>(
  Component: React.ComponentType<P>,
  dummyData?: DisplayPortfolioData | null
) {
  return function DummyDataWrapper(props: P) {
    const effectiveProps = {
      ...props,
      portfolioData: props.portfolioData ?? dummyData ?? null,
      isLoading: props.isLoading || false,
      error: props.error,
    };

    return <Component {...effectiveProps} />;
  };
}

/**
 * Validation utility for component props
 */
export function validateComponentData(
  componentName: string,
  data: DisplayPortfolioData | null | undefined,
  requirements: ComponentDataRequirements,
  isLoading?: boolean
): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Skip validation during loading state
  if (isLoading) {
    return {
      isValid: true,
      warnings: [],
      errors: [],
    };
  }

  if (!data) {
    if (requirements.fallbackData) {
      warnings.push(`${componentName}: No data provided, using fallback data`);
    } else {
      // Changed from error to warning - this is informational only
      warnings.push(
        `${componentName}: No data provided and no fallback available`
      );
    }
  }

  // Additional validation could be added here
  // e.g., checking for required fields based on component needs

  // Always return valid - warnings don't block functionality
  return {
    isValid: true,
    warnings,
    errors,
  };
}

/**
 * Development hook to track component data usage
 */
export function useComponentDataTracking(
  componentName: string,
  data: DisplayPortfolioData | null | undefined,
  requirements?: ComponentDataRequirements,
  isLoading?: boolean
) {
  if (process.env.NODE_ENV === "development" && requirements) {
    const validation = validateComponentData(
      componentName,
      data,
      requirements,
      isLoading
    );

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => console.warn(warning));
    }

    if (validation.errors.length > 0) {
      validation.errors.forEach((error) => console.error(error));
    }
  }
}

// Type guard for flagged component props
export function isFlaggedComponentProps(
  props: any
): props is FlaggedComponentProps {
  return (
    typeof props === "object" &&
    props !== null &&
    ("portfolioData" in props || "isLoading" in props || "error" in props)
  );
}
