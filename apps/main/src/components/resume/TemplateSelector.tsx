/**
 * Template Selector Component
 *
 * Simple template selector with Jake and Modern options.
 *
 * _Requirements: 4.2, 4.3_
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface TemplateSelectorProps {
  /** Currently selected template ID */
  selectedTemplateId: string;
  /** Callback when a template is selected */
  onSelectTemplate: (templateId: string) => void;
  /** Optional className for styling */
  className?: string;
}

const TEMPLATES = [
  { id: "jake", name: "Jake" },
  { id: "modern", name: "Modern" },
] as const;

/**
 * Template Selector Component
 *
 * Simple list of template options.
 */
export function TemplateSelector({
  selectedTemplateId,
  onSelectTemplate,
  className,
}: TemplateSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-foreground">Choose Template</h3>
      <div className="space-y-1">
        {TEMPLATES.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md border transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-muted/50"
              )}
              aria-pressed={isSelected}
              aria-label={`Select ${template.name} template`}
            >
              <span className="text-sm font-medium">{template.name}</span>
              {isSelected && (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TemplateSelector;
