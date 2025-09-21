"use client";

import { useCallback, useMemo, useState } from "react";
import { StepContainer } from "./StepContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Upload, FileText, HelpCircle, Linkedin } from "lucide-react";

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
  source: ParsedPdf["source"];
  onParsed?: (data: ParsedPdf) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
};

export function PDFUploadStep(props: PDFUploadStepProps) {
  const {
    label,
    description,
    helpTitle = "How this works",
    helpImageUrl,
    source,
    onParsed,
    onNext,
    onBack,
    onSkip,
  } = props;
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedPdf | null>(null);
  const [parsing, setParsing] = useState(false);

  const defaultHelpImage = useMemo(
    () =>
      helpImageUrl ??
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1470&auto=format&fit=crop",
    [helpImageUrl]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      setFile(f);
      if (f) {
        setParsing(true);
        // Simulate parsing delay
        setTimeout(() => {
          const dummy: ParsedPdf = {
            filename: f.name,
            sizeKB: Math.max(42, Math.round(f.size / 1024)) || 128,
            pages: 2 + Math.floor(Math.random() * 5),
            previewText:
              "Experienced software engineer with a passion for building usable products. Highlights: TypeScript, React, Node.js, system design. Led projects improving performance by 30%.",
            source,
          };
          setParsed(dummy);
          onParsed?.(dummy);
          console.log(`[PDFUploadStep] Parsed ${source} PDF`, dummy);
          setParsing(false);
        }, 1200);
      }
    },
    [onParsed, source]
  );

  return (
    <StepContainer
      title={label}
      description={description}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
      loadingText={parsing ? "Parsing…" : undefined}
      nextLabel={"Next"}
      nextDisabled={false}
    >
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label
            htmlFor={`pdf-${source}`}
            className="inline-flex items-center gap-2"
          >
            {source === "linkedin" ? (
              <Linkedin className="h-4 w-4 text-[#0A66C2]" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Upload PDF
          </Label>

          {/* Visually-hidden input, styled clickable dropzone label */}
          <Input
            id={`pdf-${source}`}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
          <label
            htmlFor={`pdf-${source}`}
            className="flex cursor-pointer select-none items-center justify-center rounded-lg border border-dashed bg-card/40 px-4 py-10 transition-colors hover:bg-muted/50"
          >
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="font-medium">Upload a file or drag and drop</div>
              <div className="text-xs text-muted-foreground mt-1">
                PDF up to 10MB
              </div>
            </div>
          </label>
          <p className="text-xs text-muted-foreground">
            Optional. This demo won't upload anything to a server.
          </p>
        </div>

        {parsed ? (
          <div className="rounded-md border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {parsed.source === "linkedin" ? "LinkedIn" : "Resume"}
              </Badge>
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{parsed.filename}</span>
              <span className="text-sm text-muted-foreground">
                • {parsed.sizeKB} KB • {parsed.pages} pages
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground line-clamp-5">
              {parsed.previewText}
            </p>
          </div>
        ) : file ? (
          <div className="text-sm text-muted-foreground">
            <Upload className="h-4 w-4 inline-block mr-2" /> Preparing to parse
            "{file.name}"…
          </div>
        ) : null}

        <Collapsible>
          <CollapsibleTrigger className="text-sm inline-flex items-center gap-2 underline underline-offset-4">
            <HelpCircle className="h-4 w-4" />
            {source === "linkedin" ? "Where to export LinkedIn PDF" : helpTitle}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            {source === "linkedin" ? (
              <div className="space-y-3">
                <div className="rounded-md overflow-hidden border">
                  <img
                    src={defaultHelpImage}
                    alt="LinkedIn export help"
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                </div>
                <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                  <li>Open LinkedIn and go to your Profile.</li>
                  <li>Click the More button and choose Save to PDF.</li>
                  <li>Download the PDF to your computer.</li>
                  <li>Upload it here to pre-fill your profile details.</li>
                </ol>
              </div>
            ) : (
              <div>
                <div className="rounded-md overflow-hidden border">
                  <img
                    src={defaultHelpImage}
                    alt="Help preview"
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  We extract headline, experience bullets, skills, and links. In
                  production this would call your backend service.
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </StepContainer>
  );
}

export default PDFUploadStep;
