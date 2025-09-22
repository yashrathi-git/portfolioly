"use client";

import { useCallback } from "react";
import { StepContainer } from "./StepContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Upload, FileText, HelpCircle, CheckCircle, X } from "lucide-react";
import { PDFUploadState } from "@/hooks/useUpload";
import { type UploadConfig } from "@/lib/api/upload";

import Image from "next/image";

export type ParsedPdf = {
  filename: string;
  sizeKB: number;
  pages: number;
  previewText: string;
  source: "linkedin" | "resume";
};

export type PDFUploadStepProps = {
  stepIndex: number;
  totalSteps: number;
  label: string;
  description?: string;
  helpTitle?: string;
  helpImageUrl?: string;
  source: "linkedin" | "resume";
  uploadState: PDFUploadState;
  onUpload: (file: File) => Promise<void>;
  onClear: () => void;
  config: UploadConfig | null;
  accept?: string;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
};

export function PDFUploadStep(props: PDFUploadStepProps) {
  const {
    label,
    description,
    helpTitle,
    helpImageUrl,
    source,
    uploadState,
    onUpload,
    onClear,
    config,
    accept,
    onNext,
    onBack,
    onSkip,
  } = props;

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // The upload hook handles both validation and upload errors
      await onUpload(file);
    },
    [onUpload]
  );

  const maxFileSizeMB = config?.max_file_size_mb || 15;

  return (
    <div className="rounded-xl border border-border/70 bg-card shadow-sm p-4 sm:p-6">
      <StepContainer
        title={label}
        description={description}
        onBack={onBack}
        onSkip={onSkip}
        onNext={onNext}
        loadingText={uploadState.uploading ? "Processing PDF…" : undefined}
        nextLabel="Next"
        nextDisabled={false}
      >
        <div className="space-y-4">
          {/* Upload Area */}
          <div className="grid gap-2">
            <Label
              htmlFor={`pdf-${source}`}
              className="inline-flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Upload PDF
            </Label>

            {!uploadState.result && (
              <>
                <Input
                  id={`pdf-${source}`}
                  type="file"
                  accept={accept ?? "application/pdf"}
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={uploadState.uploading}
                />
                <label
                  htmlFor={`pdf-${source}`}
                  className={`flex cursor-pointer select-none items-center justify-center rounded-lg border border-dashed bg-muted/40 dark:bg-muted/20 px-4 py-10 transition-colors hover:bg-muted/60 dark:hover:bg-muted/30 ${
                    uploadState.uploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background border">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="font-medium">
                      {uploadState.uploading
                        ? "Processing..."
                        : "Upload a file or drag and drop"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      PDF up to {maxFileSizeMB}MB
                    </div>
                  </div>
                </label>
              </>
            )}
          </div>

          {/* Upload Progress */}
          {uploadState.uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing PDF...</span>
                <span>{Math.round(uploadState.progress)}%</span>
              </div>
              <Progress value={uploadState.progress} className="h-2" />
            </div>
          )}

          {/* Upload Success */}
          {uploadState.result && (
            <div className="rounded-md border p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <Badge
                  variant="secondary"
                  className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                >
                  {uploadState.result.meta.source === "linkedin"
                    ? "LinkedIn"
                    : "Resume"}
                </Badge>
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {uploadState.result.meta.filename}
                </span>
                <span className="text-sm text-muted-foreground">
                  • {Math.round(uploadState.result.meta.size / 1024)} KB •{" "}
                  {uploadState.result.meta.pages} pages
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClear}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Help Section - Only show if helpTitle or helpImageUrl is provided */}
          {(helpTitle || helpImageUrl) && (
            <Collapsible>
              <CollapsibleTrigger className="text-sm inline-flex items-center gap-2 underline underline-offset-4 cursor-help">
                <HelpCircle className="h-4 w-4" />
                {source === "linkedin"
                  ? "Where to export LinkedIn PDF"
                  : helpTitle}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                {source === "linkedin" ? (
                  <div className="space-y-3">
                    {helpImageUrl && (
                      <div className="rounded-md overflow-hidden border">
                        <Image
                          src={helpImageUrl}
                          alt="LinkedIn export help"
                          className="w-full aspect-video object-cover"
                          width={600}
                          height={338}
                        />
                      </div>
                    )}
                    <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                      <li>Open LinkedIn and go to your Profile.</li>
                      <li>Click the More button and choose Save to PDF.</li>
                      <li>Download the PDF to your computer.</li>
                      <li>Upload it here to pre-fill your profile details.</li>
                    </ol>
                  </div>
                ) : (
                  <div>
                    {helpImageUrl && (
                      <div className="rounded-md overflow-hidden border">
                        <Image
                          src={helpImageUrl}
                          alt="Help preview"
                          className="w-full aspect-video object-cover"
                          width={600}
                          height={338}
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      We extract headline, experience bullets, skills, and links
                      from your resume.
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </StepContainer>
    </div>
  );
}

export default PDFUploadStep;
