"use client";

import { useCallback, useMemo, useState } from "react";
import ProgressIndicator from "./ProgressIndicator";
import PDFUploadStep from "./PDFUploadStep";
import GithubRepoStep from "./GithubRepoStep";
import { PlaceholderCompletionScreen } from "./PlaceholderCompletionScreen";
import { useUpload } from "@/hooks/useUpload";
import { handleError, handleSuccess } from "@/lib/utils/simpleErrorHandler";
import type { UploadSubmissionResponse } from "@/lib/api/upload";

const TOTAL_STEPS = 3;

export type UploadWizardProps = {
  onComplete?: () => void;
  disableClientValidation?: boolean;
  acceptOverride?: string;
};

export function UploadWizard({
  onComplete,
  disableClientValidation = false,
  acceptOverride,
}: UploadWizardProps) {
  const [step, setStep] = useState(1);
  const [completionData, setCompletionData] =
    useState<UploadSubmissionResponse | null>(null);
  const upload = useUpload({ disableClientValidation });

  const goNext = useCallback(
    () => setStep((s) => Math.min(TOTAL_STEPS, s + 1)),
    []
  );
  const goBack = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);
  const skip = useCallback(() => goNext(), [goNext]);

  const handleFinish = useCallback(async () => {
    try {
      // Submit all upload data
      const result = await upload.submitAllData();

      console.log("[UploadWizard] complete", result);

      // Store completion data and show completion screen
      setCompletionData(result);
      setStep(4); // Move to completion screen

      // Show success message based on processing type
      if (result.data.processing_type === "ai_extraction") {
        handleSuccess("Portfolio created successfully using AI extraction!");
      } else if (result.data.processing_type === "github_only") {
        handleSuccess("GitHub repositories added to your portfolio!");
      } else if (result.data.processing_type === "placeholder") {
        handleSuccess("Upload received! AI processing will be available soon.");
      } else {
        handleSuccess("Upload completed successfully!");
      }
    } catch (error) {
      handleError(error, "upload wizard completion");
    }
  }, [upload]);

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
            // helpImageUrl="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1470&auto=format&fit=crop"
            source="linkedin"
            uploadState={upload.linkedin}
            onUpload={upload.uploadLinkedInPDF}
            onClear={upload.clearLinkedInUpload}
            config={upload.config}
            accept={acceptOverride}
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
            source="resume"
            uploadState={upload.resume}
            onUpload={upload.uploadResumePDF}
            onClear={upload.clearResumeUpload}
            config={upload.config}
            accept={acceptOverride}
            onBack={goBack}
            onSkip={skip}
            onNext={goNext}
          />
        );
      case 3:
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
      case 4:
      default:
        return completionData ? (
          <PlaceholderCompletionScreen
            processingType={completionData.data.processing_type}
            message={completionData.message}
            onContinue={() => onComplete?.()}
          />
        ) : null;
    }
  }, [
    step,
    upload,
    goBack,
    goNext,
    skip,
    handleFinish,
    acceptOverride,
    completionData,
    onComplete,
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {step <= TOTAL_STEPS && (
        <>
          <ProgressIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
          <p className="text-center text-sm text-muted-foreground -mt-1">
            These steps help pre‑fill your profile. All steps are optional.
          </p>
        </>
      )}
      {content}
    </div>
  );
}

export default UploadWizard;
