/**
 * Section Reorder Component
 *
 * Implements drag-and-drop section reordering for resume sections.
 * Updates section_order in ResumeData when sections are reordered.
 *
 * _Requirements: 8.1, 8.2_
 */

"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { SectionType } from "@/types/resume";
import { GripVertical, Eye, EyeOff } from "lucide-react";

export interface SectionReorderProps {
  /** Current section order */
  sectionOrder: SectionType[];
  /** Callback when section order changes */
  onReorder: (newOrder: SectionType[]) => void;
  /** Optional className for styling */
  className?: string;
  /** Optional: sections that have content (for visual feedback) */
  sectionsWithContent?: SectionType[];
}

/** Human-readable labels for section types */
const SECTION_LABELS: Record<SectionType, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  skills: "Skills",
  certifications: "Certifications",
};

/** Icons for each section type */
const SECTION_ICONS: Record<SectionType, string> = {
  summary: "📝",
  experience: "💼",
  education: "🎓",
  projects: "🚀",
  skills: "⚡",
  certifications: "🏆",
};

interface DragState {
  draggedIndex: number | null;
  dragOverIndex: number | null;
}

/**
 * Section Reorder Component
 *
 * Allows users to drag and drop sections to reorder them.
 */
export function SectionReorder({
  sectionOrder,
  onReorder,
  className,
  sectionsWithContent = [],
}: SectionReorderProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggedIndex: null,
    dragOverIndex: null,
  });

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
      setDragState({ draggedIndex: index, dragOverIndex: null });
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragState((prev) => ({ ...prev, dragOverIndex: index }));
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({ ...prev, dragOverIndex: null }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault();
      const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);

      if (dragIndex === dropIndex) {
        setDragState({ draggedIndex: null, dragOverIndex: null });
        return;
      }

      // Create new order by moving the dragged item
      const newOrder = [...sectionOrder];
      const [draggedItem] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, draggedItem);

      onReorder(newOrder);
      setDragState({ draggedIndex: null, dragOverIndex: null });
    },
    [sectionOrder, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDragState({ draggedIndex: null, dragOverIndex: null });
  }, []);

  // Move section up/down with keyboard
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newOrder = [...sectionOrder];
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1],
      ];
      onReorder(newOrder);
    },
    [sectionOrder, onReorder]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === sectionOrder.length - 1) return;
      const newOrder = [...sectionOrder];
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
      onReorder(newOrder);
    },
    [sectionOrder, onReorder]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
      if (e.key === "ArrowUp" && e.altKey) {
        e.preventDefault();
        handleMoveUp(index);
      } else if (e.key === "ArrowDown" && e.altKey) {
        e.preventDefault();
        handleMoveDown(index);
      }
    },
    [handleMoveUp, handleMoveDown]
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Section Order</h3>
        <span className="text-xs text-muted-foreground">Drag to reorder</span>
      </div>

      <div className="space-y-1" role="list" aria-label="Resume sections">
        {sectionOrder.map((section, index) => {
          const hasContent = sectionsWithContent.includes(section);
          const isDragging = dragState.draggedIndex === index;
          const isDragOver = dragState.dragOverIndex === index;

          return (
            <div
              key={section}
              role="listitem"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border cursor-grab",
                "transition-all duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isDragging && "opacity-50 cursor-grabbing",
                isDragOver && "border-primary bg-primary/5",
                !isDragging && !isDragOver && "bg-background hover:bg-muted/50"
              )}
              aria-label={`${SECTION_LABELS[section]} section, position ${
                index + 1
              } of ${sectionOrder.length}. Press Alt+Arrow keys to move.`}
            >
              {/* Drag handle */}
              <GripVertical
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
                aria-hidden="true"
              />

              {/* Section icon */}
              <span className="text-base" aria-hidden="true">
                {SECTION_ICONS[section]}
              </span>

              {/* Section label */}
              <span className="flex-1 text-sm font-medium">
                {SECTION_LABELS[section]}
              </span>

              {/* Content indicator */}
              {hasContent ? (
                <Eye
                  className="h-4 w-4 text-green-500"
                  aria-label="Has content"
                />
              ) : (
                <EyeOff
                  className="h-4 w-4 text-muted-foreground/50"
                  aria-label="No content"
                />
              )}

              {/* Position number */}
              <span className="text-xs text-muted-foreground w-5 text-center">
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: Use Alt + Arrow keys to move sections with keyboard
      </p>
    </div>
  );
}

export default SectionReorder;
