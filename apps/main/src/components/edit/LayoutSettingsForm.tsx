"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquare, FileText, Eye } from "lucide-react";
import { FormSection } from "./FormSection";
import type { LayoutSettings } from "portfolioly-schema";

export interface LayoutSettingsFormProps {
  value: LayoutSettings;
  onChange: (value: LayoutSettings) => void;
}

export function LayoutSettingsForm({
  value,
  onChange,
}: LayoutSettingsFormProps) {
  const [localValue, setLocalValue] = useState<LayoutSettings>(value);

  const handleLayoutModeChange = (layoutMode: string) => {
    const newValue = {
      ...localValue,
      layout_mode: layoutMode as "chat-only" | "traditional-only" | "both",
      // Auto-adjust default layout based on mode
      default_layout:
        layoutMode === "chat-only"
          ? "chat"
          : layoutMode === "traditional-only"
          ? "traditional"
          : localValue.default_layout,
    };

    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleDefaultLayoutChange = (defaultLayout: string) => {
    const newValue = {
      ...localValue,
      default_layout: defaultLayout as "chat" | "traditional",
    };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const layoutModeOptions = [
    {
      value: "chat-only",
      label: "Chat Mode Only",
      description: "Visitors only see the interactive chat interface",
      icon: MessageSquare,
    },
    {
      value: "traditional-only",
      label: "Traditional Layout Only",
      description: "Visitors only see the classic portfolio layout",
      icon: FileText,
    },
    {
      value: "both",
      label: "Both Layouts",
      description: "Visitors can switch between chat and traditional views",
      icon: Eye,
    },
  ];

  const defaultLayoutOptions = [
    {
      value: "chat",
      label: "Chat Mode",
      icon: MessageSquare,
    },
    {
      value: "traditional",
      label: "Traditional Layout",
      icon: FileText,
    },
  ];

  const showDefaultLayoutOption = localValue.layout_mode === "both";

  return (
    <FormSection
      title={
        <span className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Layout Settings
        </span>
      }
      description="Configure how visitors can view your portfolio"
    >
      <div className="space-y-6">
        {/* Layout Mode Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Layout Options</Label>
          <RadioGroup
            value={localValue.layout_mode || "both"}
            onValueChange={handleLayoutModeChange}
            className="space-y-3"
          >
            {layoutModeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={option.value}
                    id={`layout-mode-${option.value}`}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={`layout-mode-${option.value}`}
                      className="flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Default Layout Selection */}
        {showDefaultLayoutOption && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Default Layout</Label>
            <p className="text-sm text-muted-foreground">
              Choose which layout visitors see first when they visit your
              portfolio.
            </p>
            <RadioGroup
              value={localValue.default_layout || "chat"}
              onValueChange={handleDefaultLayoutChange}
              className="grid grid-cols-2 gap-4"
            >
              {defaultLayoutOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`default-layout-${option.value}`}
                    />
                    <Label
                      htmlFor={`default-layout-${option.value}`}
                      className="flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        )}
      </div>
    </FormSection>
  );
}

export default LayoutSettingsForm;
