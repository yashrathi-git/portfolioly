"use client";

import { useCallback, useMemo, useState } from "react";
import ProgressIndicator from "./ProgressIndicator";
import PDFUploadStep, { ParsedPdf } from "./PDFUploadStep";
import GithubRepoStep, { Repo } from "./GithubRepoStep";
import { UploadErrorBoundary } from "./UploadErrorBoundary";
import { useUpload } from "@/hooks/useUpload";

const TOTAL_STEPS = 3;

export type UploadWizardProps = {
  onComplete?: () => void;
};

export function UploadWizard({ onComplete }: UploadWizardProps) {
  const [step, setStep] = useState(1);
  const upload = useUpload();

  const goNext = useCallback(
    () => setStep((s) => Math.min(TOTAL_STEPS, s + 1)),
    []
  );
  const goBack = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);
  const skip = useCallback(() => goNext(), [goNext]);

  const handleFinish = useCallback(async () => {
    try {
      // Import selected repositories if any
      if (upload.github.selectedRepoIds.length > 0) {
        await upload.importSelectedRepos();
      }

      console.log("[UploadWizard] complete", {
        linkedin: upload.linkedin.result,
        resume: upload.resume.result,
        selectedRepoIds: upload.github.selectedRepoIds,
      });

      onComplete?.();
    } catch (error) {
      console.error("Failed to complete upload wizard:", error);
      // Error will be handled by the error boundary
    }
  }, [upload, onComplete]);

  const content = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <PDFUploadStep
            stepIndex={1}
            totalSteps={TOTAL_STEPS}
            label="Upload LinkedIn PDF (optional)"
            description="We will parse headline, experience and skills."
            helpTitle="Where to export LinkedIn PDF?"
            helpImageUrl="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1470&auto=format&fit=crop"
            source="linkedin"
            uploadState={upload.linkedin}
            onUpload={upload.uploadLinkedInPDF}
            onClear={upload.clearLinkedInUpload}
            validateFile={upload.validatePDFFile}
            config={upload.config}
            onBack={undefined}
            onSkip={skip}
            onNext={goNext}
          />
        );
      case 2:
        return (
          <PDFUploadStep
            stepIndex={2}
            totalSteps={TOTAL_STEPS}
            label="Upload Resume PDF (optional)"
            description="Attach your current resume to enhance matching."
            helpTitle="Resume tips"
            helpImageUrl="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1470&auto=format&fit=crop"
            source="resume"
            uploadState={upload.resume}
            onUpload={upload.uploadResumePDF}
            onClear={upload.clearResumeUpload}
            validateFile={upload.validatePDFFile}
            config={upload.config}
            onBack={goBack}
            onSkip={skip}
            onNext={goNext}
          />
        );
      case 3:
      default:
        return (
          <GithubRepoStep
            label="Connect GitHub (optional)"
            description="Search by username, select up to 10 repositories."
            githubState={upload.github}
            onSearch={upload.searchGitHubRepos}
            onLoadMore={upload.loadMoreRepos}
            onToggleSelection={upload.toggleRepoSelection}
            onClearSelection={upload.clearRepoSelection}
            config={upload.config}
            onBack={goBack}
            onSkip={handleFinish}
            onNext={handleFinish}
          />
        );
    }
  }, [step, upload, goBack, goNext, skip, handleFinish]);

  return (
    <UploadErrorBoundary>
      <div className="space-y-4 sm:space-y-6">
        <ProgressIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
        <p className="text-center text-sm text-muted-foreground -mt-1">
          These steps help pre‑fill your profile. All steps are optional.
        </p>
        {content}
      </div>
    </UploadErrorBoundary>
  );
}

export default UploadWizard;
