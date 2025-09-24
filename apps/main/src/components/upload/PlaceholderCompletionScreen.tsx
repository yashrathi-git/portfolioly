"use client";

import { CheckCircle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceholderCompletionScreenProps {
  onContinue: () => void;
  processingType: "placeholder" | "no_data" | "ai_extraction" | "github_only";
  message?: string;
}

export function PlaceholderCompletionScreen({
  onContinue,
  processingType,
  message,
}: PlaceholderCompletionScreenProps) {
  const getContent = () => {
    switch (processingType) {
      case "placeholder":
        return {
          icon: <Clock className="h-12 w-12 text-blue-500" />,
          title: "Upload Received!",
          description:
            "AI-powered portfolio extraction will be available soon. Your data has been saved and we'll process it once the feature is ready.",
          buttonText: "Continue to Dashboard",
        };
      case "no_data":
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "All Set!",
          description:
            "You can always come back later to upload your resume, LinkedIn profile, or add GitHub repositories to enrich your portfolio.",
          buttonText: "Go to Dashboard",
        };
      case "ai_extraction":
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "Portfolio Created!",
          description:
            "Your portfolio has been successfully created using AI-powered extraction from your uploaded documents and GitHub repositories.",
          buttonText: "View Portfolio",
        };
      case "github_only":
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "GitHub Projects Added!",
          description:
            "Your GitHub repositories have been successfully added to your portfolio. You can always upload PDFs later for more detailed information.",
          buttonText: "View Portfolio",
        };
      default:
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "Upload Complete!",
          description: message || "Your data has been processed successfully.",
          buttonText: "Continue",
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">{content.icon}</div>
          <CardTitle className="text-2xl font-bold">{content.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {content.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onContinue} className="w-full" size="lg">
            {content.buttonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {processingType === "placeholder" && (
            <p className="text-sm text-muted-foreground mt-4">
              We'll notify you when AI processing becomes available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
