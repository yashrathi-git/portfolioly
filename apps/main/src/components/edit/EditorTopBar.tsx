"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublishSettingsPanel } from "./PublishSettingsPanel";
import { FullscreenPreviewButton } from "./FullscreenPreviewButton";
import { DeployToVercelButton } from "./DeployToVercelButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface EditorTopBarProps {
  title: string;
  subtitle: string;
  activeMode: "edit" | "preview";
  onModeChange: (mode: "edit" | "preview") => void;
  onSave?: () => void;
  saving?: boolean;
  hasUnsavedChanges?: boolean;
  /** Whether portfolio has content to preview */
  hasContent?: boolean;
  publishUsername?: string;
  publishAccessMode?: "public" | "private";
  publishLoading?: boolean;
  onPublishUpdated?: (updated?: {
    username?: string;
    accessMode?: "public" | "private";
  }) => void;
}

export function EditorTopBar({
  title,
  subtitle,
  activeMode,
  onModeChange,
  onSave,
  saving = false,
  hasUnsavedChanges = false,
  hasContent = true,
  publishUsername,
  publishAccessMode,
  publishLoading,
  onPublishUpdated,
}: EditorTopBarProps) {
  const [publishSettingsOpen, setPublishSettingsOpen] = useState(false);

  return (
    <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4">
        {/* Main Top Bar */}
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Left: Title and Subtitle */}
          <div className="flex flex-col min-w-0 flex-shrink">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight truncate">
              {title}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">
              {subtitle}
            </p>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Edit/Preview Toggle */}
            <div className="flex items-center rounded-lg bg-muted p-1">
              <button
                onClick={() => onModeChange("edit")}
                className={cn(
                  "px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all min-h-[44px] md:min-h-0",
                  activeMode === "edit"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Edit
              </button>
              <button
                onClick={() => onModeChange("preview")}
                className={cn(
                  "px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all min-h-[44px] md:min-h-0",
                  activeMode === "preview"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Preview
              </button>
            </div>

            {/* Divider - Hidden on mobile */}
            <div className="hidden md:block h-6 w-px bg-border" />

            {/* Fullscreen Preview Button */}
            <FullscreenPreviewButton
              disabled={!hasContent}
              className="hidden sm:flex"
            />

            {/* Deploy to Vercel Button */}
            <DeployToVercelButton className="hidden lg:flex" />

            {/* Publish Settings Toggle */}
            <Collapsible
              open={publishSettingsOpen}
              onOpenChange={setPublishSettingsOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "min-h-[44px] md:min-h-0",
                    publishSettingsOpen && "bg-accent"
                  )}
                  aria-label="Toggle publish settings"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">Publish</span>
                </Button>
              </CollapsibleTrigger>
            </Collapsible>

            {/* Save Button */}
            {onSave && (
              <Button
                onClick={onSave}
                disabled={saving || !hasUnsavedChanges}
                className={cn(
                  "flex items-center gap-2 min-w-[100px] md:min-w-[120px] transition-all duration-150",
                  (saving || !hasUnsavedChanges) && "cursor-not-allowed",
                  "min-h-[44px] md:min-h-0"
                )}
                size="sm"
                aria-label={
                  saving
                    ? "Saving portfolio changes"
                    : hasUnsavedChanges
                    ? "Save portfolio changes"
                    : "No changes to save"
                }
              >
                {saving ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {hasUnsavedChanges ? "Save Changes" : "Saved"}
                    </span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible Publish Settings Panel */}
        <Collapsible
          open={publishSettingsOpen}
          onOpenChange={setPublishSettingsOpen}
        >
          <CollapsibleContent>
            <div className="pb-6 pt-2">
              <PublishSettingsPanel
                initialUsername={publishUsername}
                initialAccessMode={publishAccessMode}
                isLoading={publishLoading}
                onSettingsUpdate={onPublishUpdated}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
