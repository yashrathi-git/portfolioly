"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PDFUploadStep from "./PDFUploadStep";
import GithubRepoStep from "./GithubRepoStep";
import SourceSelectionStep, { type SourceType } from "./SourceSelectionStep";
import { LoadingScreen } from "./LoadingScreen";
import { useUpload } from "@/hooks/useUpload";
import { handleError, handleSuccess } from "@/lib/utils/simpleErrorHandler";

export type UploadWizardProps = {
  disableClientValidation?: boolean;
  acceptOverride?: string;
};

export function UploadWizard({
  disableClientValidation = false,
  acceptOverride,
}: UploadWizardProps) {
  const [selectedSource, setSelectedSource] = useState<SourceType>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const upload = useUpload({ disableClientValidation });
  const router = useRouter();

  const handleSelectSource = useCallback((source: SourceType) => {
    setSelectedSource(source);
  }, []);

  const handleAddAnother = useCallback(() => {
    setSelectedSource(null);
  }, []);

  const handleFinish = useCallback(async () => {
    setIsProcessing(true);

    try {
      // Submit all upload data
      const result = await upload.submitAllData();

      console.log("[UploadWizard] complete", result);

      // Check if the submission was successful
      if (result.success) {
        // Show success message
        handleSuccess("Portfolio data processed successfully!");
      } else {
        // Handle failure case - show error message but still allow user to proceed
        handleError(new Error(result.message), "upload wizard completion");
      }

      // Always redirect to edit page so user can manually fill data
      router.push("/edit");
    } catch (error) {
      setIsProcessing(false);
      handleError(error, "upload wizard completion");
    }
  }, [upload, router]);

  const handleSkip = useCallback(async () => {
    // If user has uploaded anything, submit it before redirecting
    if (upload.linkedin.result || upload.resume.result || upload.github.selectedRepoIds.length > 0) {
      await handleFinish();
    } else {
      // No data uploaded, just redirect
      router.push("/edit");
    }
  }, [upload, handleFinish, router]);

  const content = useMemo(() => {
    if (isProcessing) {
      return (
        <LoadingScreen message="Processing your data and generating your portfolio..." />
      );
    }

    // Determine which sources have been imported
    const importedSources = {
      linkedin: !!upload.linkedin.result,
      resume: !!upload.resume.result,
      github: upload.github.selectedRepoIds.length > 0,
    };

    // Show source selection if no source is selected
    if (!selectedSource) {
      return (
        <SourceSelectionStep
          onSelectSource={handleSelectSource}
          onSkip={handleSkip}
          importedSources={importedSources}
        />
      );
    }

    // Show appropriate import screen based on selected source
    switch (selectedSource) {
      case "linkedin":
        return (
          <PDFUploadStep
            stepIndex={1}
            totalSteps={1}
            label="Import LinkedIn Profile"
            description="Upload your LinkedIn PDF to automatically extract your experience, skills, and headline."
            helpTitle="Where to export LinkedIn PDF?"
            source="linkedin"
            uploadState={upload.linkedin}
            onUpload={upload.uploadLinkedInPDF}
            onClear={upload.clearLinkedInUpload}
            config={upload.config}
            accept={acceptOverride}
            onBack={undefined}
            onSkip={handleSkip}
            onNext={handleFinish}
            onAddAnother={handleAddAnother}
          />
        );
      case "resume":
        return (
          <PDFUploadStep
            stepIndex={1}
            totalSteps={1}
            label="Upload Resume"
            description="Upload your resume PDF to extract your professional experience and projects."
            source="resume"
            uploadState={upload.resume}
            onUpload={upload.uploadResumePDF}
            onClear={upload.clearResumeUpload}
            config={upload.config}
            accept={acceptOverride}
            onBack={undefined}
            onSkip={handleSkip}
            onNext={handleFinish}
            onAddAnother={handleAddAnother}
          />
        );
      case "github":
        return (
          <GithubRepoStep
            label="Connect GitHub"
            description="Search by username and select up to 10 repositories to showcase your best work."
            githubState={upload.github}
            onSearch={upload.searchGitHubRepos}
            onLoadMore={upload.loadMoreRepos}
            onToggleSelection={upload.toggleRepoSelection}
            onClearSelection={upload.clearRepoSelection}
            config={upload.config}
            onBack={undefined}
            onSkip={handleSkip}
            onNext={handleFinish}
            onAddAnother={handleAddAnother}
          />
        );
      default:
        return null;
    }
  }, [
    selectedSource,
    isProcessing,
    upload,
    handleSelectSource,
    handleAddAnother,
    handleFinish,
    handleSkip,
    acceptOverride,
  ]);

  return <div className="space-y-4 sm:space-y-6">{content}</div>;
}

export default UploadWizard;
