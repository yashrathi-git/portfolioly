"use client";

import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EditorTopBarProps {
  title: string;
  subtitle: string;
  activeMode: "edit" | "preview";
  onModeChange: (mode: "edit" | "preview") => void;
  onSave?: () => void;
  saving?: boolean;
  hasUnsavedChanges?: boolean;
}

export function EditorTopBar({
  title,
  subtitle,
  activeMode,
  onModeChange,
  onSave,
  saving = false,
  hasUnsavedChanges = false,
}: EditorTopBarProps) {
  return (
    <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 flex h-16 items-center justify-between">
        {/* Left: Title and Subtitle */}
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Right: Mode Toggle and Save Button */}
        <div className="flex items-center gap-4">
          {/* Edit/Preview Toggle */}
          <div className="flex items-center rounded-lg bg-muted p-1">
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

          {/* Save Button */}
          {onSave && (
            <Button
              onClick={onSave}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2"
              size="sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
