"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Linkedin } from "lucide-react";
import Image from "next/image";

type LinkedInInstructionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const steps = [
  {
    number: 1,
    title: "Go to linkedin.com",
    description: "Sign in to your account",
  },
  {
    number: 2,
    title: "Open your profile",
    description: "Click your profile picture and select 'View Profile'",
  },
  {
    number: 3,
    title: "Save to PDF",
    description: "In the Resources section, click 'Save to PDF'",
  },
];

export function LinkedInInstructionsDialog({
  open,
  onOpenChange,
}: LinkedInInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 duration-300">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            <DialogTitle>How to export your LinkedIn PDF</DialogTitle>
          </div>
          <DialogDescription>
            Quick steps to download your profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <ol className="space-y-2">
            {steps.map((step) => (
              <li key={step.number} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {step.number}
                </span>
                <div className="flex-1 min-w-0 pt-0.5">
                  <span className="text-sm">
                    <span className="font-medium">{step.title}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {step.description}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-md overflow-hidden border">
            <Image
              src="https://media.portfolioly.app/linkedin-pdf/linkedin_pdf.png"
              alt="LinkedIn Save to PDF location"
              width={600}
              height={338}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LinkedInInstructionsDialog;
