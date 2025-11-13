/**
 * Error boundary components for graceful error handling
 */

import React, { Component, ReactNode } from "react";
import type { DisplayPortfolioData } from "portfolioly-schema";

export interface ErrorBoundaryState {
  hasError: boolean;
  errorType: "network" | "auth" | "validation" | "unknown";
  errorMessage?: string;
  fallbackData?: DisplayPortfolioData;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackData?: DisplayPortfolioData;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class PortfolioErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorType: "unknown",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Determine error type based on error message or type
    let errorType: ErrorBoundaryState["errorType"] = "unknown";

    if (error.message.includes("fetch") || error.message.includes("network")) {
      errorType = "network";
    } else if (
      error.message.includes("auth") ||
      error.message.includes("unauthorized")
    ) {
      errorType = "auth";
    } else if (
      error.message.includes("validation") ||
      error.message.includes("invalid")
    ) {
      errorType = "validation";
    }

    return {
      hasError: true,
      errorType,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "Portfolio Error Boundary caught an error:",
      error,
      errorInfo
    );
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          errorType={this.state.errorType}
          errorMessage={this.state.errorMessage}
          fallbackData={this.props.fallbackData}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  errorType: ErrorBoundaryState["errorType"];
  errorMessage?: string;
  fallbackData?: DisplayPortfolioData;
  onRetry: () => void;
}

function ErrorFallback({
  errorType,
  errorMessage,
  onRetry,
}: ErrorFallbackProps) {
  const getErrorTitle = () => {
    switch (errorType) {
      case "network":
        return "Connection Error";
      case "auth":
        return "Authentication Required";
      case "validation":
        return "Data Error";
      default:
        return "Something went wrong";
    }
  };

  const getErrorDescription = () => {
    switch (errorType) {
      case "network":
        return "Unable to load portfolio data. Please check your connection and try again.";
      case "auth":
        return "Please sign in to view this portfolio.";
      case "validation":
        return "The portfolio data appears to be invalid or corrupted.";
      default:
        return "An unexpected error occurred while loading the portfolio.";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {getErrorTitle()}
        </h2>
        <p className="text-gray-600 mb-4">{getErrorDescription()}</p>
        {errorMessage && (
          <details className="mb-4 text-sm text-gray-500">
            <summary className="cursor-pointer">Technical details</summary>
            <p className="mt-2 font-mono text-xs bg-gray-100 p-2 rounded">
              {errorMessage}
            </p>
          </details>
        )}
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default PortfolioErrorBoundary;
