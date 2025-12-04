"use client";

/**
 * Portfolio Import Component for Resume Builder
 *
 * Allows users to import their existing portfolio data and transform it to ResumeData.
 * Checks for existing portfolio data and provides a one-click import option.
 *
 * Requirements: 1.4
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  User,
  GraduationCap,
  FolderOpen,
} from "lucide-react";
import { getUserPortfolio, hasUserPortfolio } from "@/lib/api/portfolio";
import { ResumeTransformer } from "@/lib/resume/resumeTransformer";
import type { ResumeData } from "@/types/resume";
import type { PortfolioData } from "portfolioly-schema";

export interface PortfolioImportProps {
  /** Callback when resume data is successfully created */
  onImportComplete: (resumeData: ResumeData) => void;
  /** Optional callback for errors */
  onError?: (error: Error) => void;
  /** Optional custom resume name */
  resumeName?: string;
  /** Optional template ID to use */
  templateId?: string;
}

interface PortfolioState {
  checking: boolean;
  hasPortfolio: boolean;
  portfolioData: PortfolioData | null;
  importing: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  checking: true,
  hasPortfolio: false,
  portfolioData: null,
  importing: false,
  error: null,
};

export function PortfolioImport({
  onImportComplete,
  onError,
  resumeName,
  templateId,
}: PortfolioImportProps) {
  const [state, setState] = useState<PortfolioState>(initialState);

  // Check for existing portfolio on mount
  useEffect(() => {
    async function checkPortfolio() {
      try {
        const exists = await hasUserPortfolio();

        if (exists) {
          // Fetch the full portfolio data
          const data = await getUserPortfolio();
          setState({
            checking: false,
            hasPortfolio: true,
            portfolioData: data,
            importing: false,
            error: null,
          });
        } else {
          setState({
            checking: false,
            hasPortfolio: false,
            portfolioData: null,
            importing: false,
            error: null,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to check portfolio";
        setState({
          checking: false,
          hasPortfolio: false,
          portfolioData: null,
          importing: false,
          error: errorMessage,
        });
        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    }

    checkPortfolio();
  }, [onError]);

  const handleImport = useCallback(async () => {
    if (!state.portfolioData) return;

    setState((prev) => ({ ...prev, importing: true, error: null }));

    try {
      const resumeData = ResumeTransformer.fromPortfolio(state.portfolioData, {
        resumeName,
        templateId,
      });

      setState((prev) => ({ ...prev, importing: false }));
      onImportComplete(resumeData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to import portfolio";
      setState((prev) => ({
        ...prev,
        importing: false,
        error: errorMessage,
      }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [state.portfolioData, onImportComplete, onError, resumeName, templateId]);

  // Loading state
  if (state.checking) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Checking for existing portfolio...
        </span>
      </div>
    );
  }

  // No portfolio found
  if (!state.hasPortfolio) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="font-medium">No Portfolio Found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You don&apos;t have an existing portfolio to import from.
          <br />
          Try importing from LinkedIn or GitHub instead.
        </p>
      </div>
    );
  }

  // Portfolio found - show preview and import button
  const personalInfo = state.portfolioData?.personal_info;
  const workCount = state.portfolioData?.work_experiences?.length ?? 0;
  const eduCount = state.portfolioData?.education?.length ?? 0;
  const projectCount = state.portfolioData?.projects?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Portfolio Preview */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium">Portfolio Found</h3>
            <p className="text-sm text-muted-foreground">
              {personalInfo?.full_name || "Your portfolio"} is ready to import
            </p>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Personal Info</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>
              {workCount} {workCount === 1 ? "Experience" : "Experiences"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span>
              {eduCount} {eduCount === 1 ? "Education" : "Educations"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>
              {projectCount} {projectCount === 1 ? "Project" : "Projects"}
            </span>
          </div>
        </div>
      </div>

      {/* Error State */}
      {state.error && (
        <div className="rounded-md border p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <span className="text-sm font-medium text-red-800 dark:text-red-300">
              {state.error}
            </span>
          </div>
        </div>
      )}

      {/* Import Button */}
      <Button
        onClick={handleImport}
        disabled={state.importing}
        className="w-full gap-2"
      >
        {state.importing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            Import from Portfolio
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        This will create a new resume using your existing portfolio data.
      </p>
    </div>
  );
}

export default PortfolioImport;
