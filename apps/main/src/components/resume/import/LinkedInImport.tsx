"use client";

/**
 * LinkedIn Import Component for Resume Builder
 *
 * Allows users to upload a LinkedIn PDF and transform it to ResumeData.
 * Reuses existing PDF upload patterns from the upload wizard.
 *
 * Requirements: 1.1, 1.2, 1.3
 */

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Upload,
  FileText,
  HelpCircle,
  CheckCircle,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  uploadPDF,
  getUploadConfig,
  validateFile,
  withRetry,
  type PDFUploadResponse,
} from "@/lib/api/upload";
import { ResumeTransformer } from "@/lib/resume/resumeTransformer";
import type { ResumeData } from "@/types/resume";
import type { PortfolioData } from "portfolioly-schema";

export interface LinkedInImportProps {
  /** Callback when resume data is successfully created */
  onImportComplete: (resumeData: ResumeData) => void;
  /** Optional callback for errors */
  onError?: (error: Error) => void;
  /** Optional custom resume name */
  resumeName?: string;
  /** Optional template ID to use */
  templateId?: string;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  result: PDFUploadResponse | null;
  error: string | null;
  transforming: boolean;
}

const initialState: UploadState = {
  uploading: false,
  progress: 0,
  result: null,
  error: null,
  transforming: false,
};

export function LinkedInImport({
  onImportComplete,
  onError,
  resumeName,
  templateId,
}: LinkedInImportProps) {
  const [state, setState] = useState<UploadState>(initialState);
  const config = getUploadConfig();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file
      const validationError = validateFile(file, config);
      if (validationError) {
        setState((prev) => ({ ...prev, error: validationError }));
        onError?.(new Error(validationError));
        return;
      }

      // Start upload
      setState({
        uploading: true,
        progress: 0,
        result: null,
        error: null,
        transforming: false,
      });

      try {
        // Upload and extract text from LinkedIn PDF
        const result = await withRetry(() =>
          uploadPDF(file, "linkedin", (progress) => {
            setState((prev) => ({ ...prev, progress }));
          })
        );

        setState((prev) => ({
          ...prev,
          uploading: false,
          progress: 100,
          result,
          transforming: true,
        }));

        // Submit the extracted data for AI processing
        const { submitUploadData } = await import("@/lib/api/upload");
        await submitUploadData({
          linkedin_pdf: {
            text: result.text,
            source: result.meta.source,
            filename: result.meta.filename,
            pages: result.meta.pages,
            size: result.meta.size,
            checksum: result.meta.checksum,
            processed_at: result.meta.processed_at,
          },
          github_repos: [],
        });

        // Fetch the processed portfolio data
        const portfolioData = await fetchExtractedPortfolioData();

        if (portfolioData) {
          const resumeData = ResumeTransformer.fromLinkedIn(portfolioData, {
            resumeName,
            templateId,
          });

          setState((prev) => ({ ...prev, transforming: false }));
          onImportComplete(resumeData);
        } else {
          throw new Error("Failed to extract portfolio data from LinkedIn PDF");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setState((prev) => ({
          ...prev,
          uploading: false,
          transforming: false,
          error: errorMessage,
        }));
        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    },
    [config, onImportComplete, onError, resumeName, templateId]
  );

  const handleClear = useCallback(() => {
    setState(initialState);
  }, []);

  const isProcessing = state.uploading || state.transforming;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="grid gap-2">
        <Label
          htmlFor="linkedin-pdf"
          className="inline-flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Upload LinkedIn PDF
        </Label>

        {!state.result && !state.error && (
          <>
            <Input
              id="linkedin-pdf"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="sr-only"
              disabled={isProcessing}
            />
            <label
              htmlFor="linkedin-pdf"
              className={`flex cursor-pointer select-none items-center justify-center rounded-lg border border-dashed bg-muted/40 dark:bg-muted/20 px-4 py-10 transition-colors hover:bg-muted/60 dark:hover:bg-muted/30 ${
                isProcessing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background border">
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="font-medium">
                  {state.uploading
                    ? "Uploading..."
                    : state.transforming
                    ? "Processing..."
                    : "Upload LinkedIn PDF"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  PDF up to {config.max_file_size_mb}MB
                </div>
              </div>
            </label>
          </>
        )}
      </div>

      {/* Upload Progress */}
      {state.uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading PDF...</span>
            <span>{Math.round(state.progress)}%</span>
          </div>
          <Progress value={state.progress} className="h-2" />
        </div>
      )}

      {/* Transforming State */}
      {state.transforming && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Extracting resume data...</span>
        </div>
      )}

      {/* Upload Success */}
      {state.result && !state.transforming && (
        <div className="rounded-md border p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              LinkedIn PDF processed successfully
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="rounded-md border p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-medium text-red-800 dark:text-red-300">
                {state.error}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <Collapsible>
        <CollapsibleTrigger className="text-sm inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="h-4 w-4" />
          How to download your LinkedIn PDF
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <ol className="text-sm text-foreground list-decimal pl-5 space-y-1">
              <li>Go to linkedin.com and sign in</li>
              <li>Click your profile picture → View Profile</li>
              <li>
                Click the &quot;More&quot; button below your profile photo
              </li>
              <li>Select &quot;Save to PDF&quot;</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              We&apos;ll extract your work experience, education, skills, and
              certifications.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * Fetches the extracted portfolio data after PDF upload.
 * The backend stores extracted data which we retrieve here.
 */
async function fetchExtractedPortfolioData(): Promise<PortfolioData | null> {
  // Import the portfolio API to fetch the extracted data
  const { getUserPortfolio } = await import("@/lib/api/portfolio");
  return getUserPortfolio();
}

export default LinkedInImport;
