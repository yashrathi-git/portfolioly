"use client";

import {
  Linkedin,
  FileText,
  Github,
  ArrowRight,
  Shield,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SourceType = "linkedin" | "resume" | "github" | null;

export type SourceSelectionStepProps = {
  onSelectSource: (source: SourceType) => void;
  onSkip?: () => void;
  importedSources?: {
    linkedin?: boolean;
    resume?: boolean;
    github?: boolean;
  };
};

type SourceOption = {
  id: SourceType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline";
};

const sources: SourceOption[] = [
  {
    id: "linkedin",
    title: "Import LinkedIn Profile",
    description: "Parse your experience, skills, and headline instantly",
    icon: Linkedin,
    badge: "No authentication required",
    badgeVariant: "secondary",
  },
  {
    id: "resume",
    title: "Upload Resume",
    description: "Extract your professional experience and projects",
    icon: FileText,
  },
  {
    id: "github",
    title: "Connect GitHub",
    description: "Showcase your best repositories and contributions",
    icon: Github,
    badge: "No authentication required",
    badgeVariant: "secondary",
  },
];

export function SourceSelectionStep({
  onSelectSource,
  onSkip,
  importedSources = {},
}: SourceSelectionStepProps) {
  const isImported = (sourceId: SourceType): boolean => {
    if (!sourceId) return false;
    return importedSources[sourceId] === true;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3">
        {sources.map((source) => {
          const Icon = source.icon;
          const imported = isImported(source.id);

          return (
            <Card
              key={source.id}
              onClick={() => !imported && onSelectSource(source.id)}
              className={cn(
                "group transition-all duration-200",
                "flex flex-col h-full",
                imported
                  ? "opacity-75 cursor-not-allowed border-green-200 dark:border-green-800/30 bg-green-50/50 dark:bg-green-950/10"
                  : "cursor-pointer hover:shadow-lg hover:border-primary/50 active:scale-[0.98] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              )}
              tabIndex={imported ? -1 : 0}
              onKeyDown={(e) => {
                if (imported) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectSource(source.id);
                }
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex flex-col items-center mb-2 relative">
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-lg transition-colors mb-3",
                      imported
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 dark:group-hover:bg-primary/30"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        imported
                          ? "text-green-600 dark:text-green-400"
                          : "text-primary"
                      )}
                    />
                  </div>
                  {imported && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
                      <div className="bg-green-500 rounded-full p-1 shadow-sm">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <CardTitle
                  className={cn(
                    "text-xl font-semibold transition-colors text-center",
                    imported
                      ? "text-green-700 dark:text-green-400"
                      : "group-hover:text-primary"
                  )}
                >
                  {source.title}
                </CardTitle>
                <CardDescription className="text-sm mt-2 text-center">
                  {imported ? "Already imported" : source.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col mt-auto pt-0">
                {source.badge && !imported && (
                  <div className="flex justify-center mb-3">
                    <Badge
                      variant={source.badgeVariant || "secondary"}
                      className="text-xs"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {source.badge}
                    </Badge>
                  </div>
                )}
                {imported ? (
                  <div className="flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Imported
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Get started
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {onSkip && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={onSkip}
            type="button"
            className="text-muted-foreground hover:text-foreground"
          >
            Skip, I&apos;ll manually add data
          </Button>
        </div>
      )}
    </div>
  );
}

export default SourceSelectionStep;
