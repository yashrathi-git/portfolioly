/**
 * Template Selector Component
 *
 * Displays thumbnail previews of available resume templates
 * and handles template selection with callback.
 *
 * _Requirements: 4.2, 4.3_
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TemplateRegistry, type TemplateDefinition } from "./templates";
import { Check } from "lucide-react";

export interface TemplateSelectorProps {
  /** Currently selected template ID */
  selectedTemplateId: string;
  /** Callback when a template is selected */
  onSelectTemplate: (templateId: string) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Template thumbnail card component
 */
function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: TemplateDefinition;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col rounded-lg border-2 p-2 transition-all hover:border-primary/50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-background"
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${template.name} template`}
    >
      {/* Thumbnail preview */}
      <div className="relative aspect-[8.5/11] w-full overflow-hidden rounded-md bg-muted">
        {/* Placeholder for template thumbnail - shows template name as fallback */}
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          <span className="font-medium">{template.name}</span>
        </div>
      </div>

      {/* Template info */}
      <div className="mt-2 text-left">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{template.name}</span>
          {isSelected && (
            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {template.description}
        </p>
      </div>
    </button>
  );
}

/**
 * Template Selector Component
 *
 * Displays a grid of template thumbnails for selection.
 */
export function TemplateSelector({
  selectedTemplateId,
  onSelectTemplate,
  className,
}: TemplateSelectorProps) {
  const templates = TemplateRegistry.templates;

  if (templates.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground py-4", className)}>
        No templates available
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-foreground">Choose Template</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplateId === template.id}
            onSelect={() => onSelectTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default TemplateSelector;
