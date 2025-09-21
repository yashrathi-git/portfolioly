"use client";

import { useCallback, useMemo, useState } from "react";
import ProgressIndicator from "./ProgressIndicator";
import PDFUploadStep, { ParsedPdf } from "./PDFUploadStep";
import GithubRepoStep, { Repo } from "./GithubRepoStep";

const TOTAL_STEPS = 3;

export type UploadWizardProps = {
  onLinkedInParsed?: (data: ParsedPdf | null) => void;
  onResumeParsed?: (data: ParsedPdf | null) => void;
  onReposFetched?: (repos: Repo[], username: string) => void;
  onRepoSelectionChange?: (selectedIds: number[], repos: Repo[]) => void;
  onComplete?: (payload: {
    linkedin: ParsedPdf | null;
    resume: ParsedPdf | null;
    selectedRepoIds: number[];
  }) => void;
};

export function UploadWizard({
  onLinkedInParsed,
  onResumeParsed,
  onReposFetched,
  onRepoSelectionChange,
  onComplete,
}: UploadWizardProps) {
  const [step, setStep] = useState(1);
  const [linkedin, setLinkedin] = useState<ParsedPdf | null>(null);
  const [resume, setResume] = useState<ParsedPdf | null>(null);
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
  const [reposCache, setReposCache] = useState<Repo[]>([]);
  const [ghUser, setGhUser] = useState("");

  const goNext = useCallback(
    () => setStep((s) => Math.min(TOTAL_STEPS, s + 1)),
    []
  );
  const goBack = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);
  const skip = useCallback(() => goNext(), [goNext]);

  const handleFinish = useCallback(() => {
    const payload = { linkedin, resume, selectedRepoIds };
    console.log("[UploadWizard] complete", payload);
    onComplete?.(payload);
  }, [linkedin, resume, selectedRepoIds, onComplete]);

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
            onParsed={(d) => {
              setLinkedin(d);
              onLinkedInParsed?.(d);
            }}
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
            onParsed={(d) => {
              setResume(d);
              onResumeParsed?.(d);
            }}
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
            onBack={goBack}
            onSkip={handleFinish}
            onNext={handleFinish}
            onFetched={(r, username) => {
              setReposCache(r);
              setGhUser(username);
              onReposFetched?.(r, username);
            }}
            onSelectionChange={(ids, repos) => {
              setSelectedRepoIds(ids);
              onRepoSelectionChange?.(ids, repos);
            }}
          />
        );
    }
  }, [
    step,
    goBack,
    goNext,
    skip,
    handleFinish,
    onLinkedInParsed,
    onRepoSelectionChange,
    onReposFetched,
    onResumeParsed,
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <ProgressIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
      <p className="text-center text-sm text-muted-foreground -mt-1">
        These steps help pre‑fill your profile. All steps are optional.
      </p>
      {content}
    </div>
  );
}

export default UploadWizard;
