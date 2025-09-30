"use client";

import { useState } from "react";
import { MessageSquare, FileText, Eye } from "lucide-react";
import { cn } from "../lib/cn";
import type { LayoutSettings } from "./PortfolioLayoutContainer";

export interface LayoutSettingsPanelProps {
  currentSettings: LayoutSettings;
  onSettingsChange: (settings: LayoutSettings) => void;
  onSave: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const LayoutSettingsPanel = ({
  currentSettings,
  onSettingsChange,
  onSave,
  isLoading = false,
  className,
}: LayoutSettingsPanelProps) => {
  const [localSettings, setLocalSettings] =
    useState<LayoutSettings>(currentSettings);
  const [isSaving, setIsSaving] = useState(false);

  const layoutModeOptions = [
    {
      value: "chat-only" as const,
      label: "Chat Mode Only",
      description: "Visitors only see the interactive chat interface",
      icon: MessageSquare,
    },
    {
      value: "traditional-only" as const,
      label: "Traditional Layout Only",
      description: "Visitors only see the classic portfolio layout",
      icon: FileText,
    },
    {
      value: "both" as const,
      label: "Both Layouts",
      description: "Visitors can switch between chat and traditional views",
      icon: Eye,
    },
  ];

  const defaultLayoutOptions = [
    {
      value: "chat" as const,
      label: "Chat Mode",
      icon: MessageSquare,
    },
    {
      value: "traditional" as const,
      label: "Traditional Layout",
      icon: FileText,
    },
  ];

  const handleLayoutModeChange = (layoutMode: LayoutSettings["layoutMode"]) => {
    const newSettings = { ...localSettings, layoutMode };

    // If switching to single layout mode, update default accordingly
    if (layoutMode === "chat-only") {
      newSettings.defaultLayout = "chat";
    } else if (layoutMode === "traditional-only") {
      newSettings.defaultLayout = "traditional";
    }

    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleDefaultLayoutChange = (
    defaultLayout: LayoutSettings["defaultLayout"]
  ) => {
    const newSettings = { ...localSettings, defaultLayout };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const showDefaultLayoutOption = localSettings.layoutMode === "both";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Layout Mode Selection */}
      <div>
        <h3 className="text-base font-semibold text-[color:var(--foreground)] mb-3">
          Layout Options
        </h3>
        <div className="space-y-3">
          {layoutModeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = localSettings.layoutMode === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                  "hover:bg-[var(--accent)]/50",
                  isSelected
                    ? "border-[color:var(--primary)] bg-[var(--primary)]/5"
                    : "border-[color:var(--border)]"
                )}
              >
                <input
                  type="radio"
                  name="layoutMode"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => handleLayoutModeChange(option.value)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "flex-shrink-0 size-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                    isSelected
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)]"
                      : "border-[color:var(--border)]"
                  )}
                >
                  {isSelected && (
                    <div className="size-2 rounded-full bg-[color:var(--primary-foreground)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="size-4 text-[color:var(--muted-foreground)]" />
                    <span className="font-medium text-[color:var(--foreground)]">
                      {option.label}
                    </span>
                  </div>
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    {option.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Default Layout Selection (only shown when "both" is selected) */}
      {showDefaultLayoutOption && (
        <div>
          <h3 className="text-base font-semibold text-[color:var(--foreground)] mb-3">
            Default Layout
          </h3>
          <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
            Choose which layout visitors see first when they visit your
            portfolio.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {defaultLayoutOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = localSettings.defaultLayout === option.value;

              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    "hover:bg-[var(--accent)]/50",
                    isSelected
                      ? "border-[color:var(--primary)] bg-[var(--primary)]/5"
                      : "border-[color:var(--border)]"
                  )}
                >
                  <input
                    type="radio"
                    name="defaultLayout"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => handleDefaultLayoutChange(option.value)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "flex-shrink-0 size-4 rounded-full border-2 flex items-center justify-center",
                      isSelected
                        ? "border-[color:var(--primary)] bg-[color:var(--primary)]"
                        : "border-[color:var(--border)]"
                    )}
                  >
                    {isSelected && (
                      <div className="size-1.5 rounded-full bg-[color:var(--primary-foreground)]" />
                    )}
                  </div>
                  <Icon className="size-4 text-[color:var(--muted-foreground)]" />
                  <span className="text-sm font-medium text-[color:var(--foreground)]">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-[color:var(--border)]">
        <button
          onClick={handleSave}
          disabled={isLoading || isSaving}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
            "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]",
            "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {(isLoading || isSaving) && (
            <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {isSaving ? "Saving..." : "Save Layout Settings"}
        </button>
      </div>
    </div>
  );
};

export default LayoutSettingsPanel;
