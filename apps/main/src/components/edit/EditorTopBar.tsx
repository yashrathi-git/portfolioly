"use client";

import { Button } from "@/components/ui/button";
import { Save, Loader2, Globe, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublishSettingsPanel } from "./PublishSettingsPanel";
import { FullscreenPreviewButton } from "./FullscreenPreviewButton";
import { DeployToVercelButton } from "./DeployToVercelButton";

export interface EditorTopBarProps {
  title: string;
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
  /** Public token for deployment */
  publicToken?: string;
  /** Whether publish settings are being loaded */
  publishSettingsLoading?: boolean;
}

export function EditorTopBar({
  title,
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
  publicToken,
  publishSettingsLoading = false,
}: EditorTopBarProps) {
  return (
    <header className="relative border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-14 md:h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <h1 className="text-base md:text-lg font-semibold text-foreground">
              {title}
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Edit/Preview Toggle - Desktop */}
            <div className="hidden md:flex items-center rounded-lg bg-muted p-1">
              <button
                onClick={() => onModeChange("edit")}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
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
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeMode === "preview"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Preview
              </button>
            </div>

            {/* Preview Button - Mobile (icon only) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                onModeChange(activeMode === "edit" ? "preview" : "edit")
              }
              className="md:hidden hover:bg-accent/50 transition-colors min-h-[44px] min-w-[44px]"
              title={
                activeMode === "edit" ? "Preview portfolio" : "Edit portfolio"
              }
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* Fullscreen Preview Button - Desktop */}
            <FullscreenPreviewButton
              disabled={!hasContent}
              className="hidden lg:flex hover:bg-accent/50 transition-colors"
            />

            {/* Deploy to Vercel Button - Responsive */}
            <DeployToVercelButton
              username={publishUsername}
              publicToken={publicToken}
              isLoading={publishSettingsLoading}
              className="hidden md:flex hover:bg-accent/50 transition-colors"
            />

            {/* Publish Settings - Responsive */}
            <PublishSettingsPanel
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center gap-1.5 hover:bg-accent/50 transition-colors"
                  aria-label="Publish settings"
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">Publish</span>
                </Button>
              }
              initialUsername={publishUsername}
              initialAccessMode={publishAccessMode}
              isLoading={publishLoading}
              onSettingsUpdate={onPublishUpdated}
            />

            {/* Save Button - Responsive with shimmer effect */}
            {onSave && (
              <Button
                onClick={onSave}
                disabled={saving || !hasUnsavedChanges}
                size="sm"
                className={cn(
                  "relative overflow-hidden group min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-[120px]",
                  "transition-all duration-150"
                )}
                aria-label={
                  saving
                    ? "Saving portfolio changes"
                    : hasUnsavedChanges
                    ? "Save portfolio changes"
                    : "No changes to save"
                }
              >
                {/* Shimmer effect during save */}
                {saving && (
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}
                {saving ? (
                  <>
                    <Loader2
                      className="h-4 w-4 md:mr-2 animate-spin"
                      aria-hidden="true"
                    />
                    <span className="hidden md:inline">Saving</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 md:mr-2" aria-hidden="true" />
                    <span className="hidden md:inline">Save</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
