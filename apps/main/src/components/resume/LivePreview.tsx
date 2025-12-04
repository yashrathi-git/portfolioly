/**
 * Live Preview Component
 *
 * Renders the selected resume template with current ResumeData.
 * Includes zoom controls for preview scaling and print mode toggle.
 *
 * _Requirements: 3.1, 3.4_
 */

"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TemplateRegistry } from "./templates";
import type { ResumeData, SectionType } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Printer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface LivePreviewProps {
  /** Resume data to render */
  data: ResumeData;
  /** Template ID to use for rendering */
  templateId: string;
  /** Section order for rendering */
  sectionOrder: SectionType[];
  /** Optional className for styling */
  className?: string;
  /** Callback when print mode is toggled */
  onPrintModeChange?: (isPrintMode: boolean) => void;
}

/** Zoom level presets */
const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5];
const DEFAULT_ZOOM = 0.75;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

/**
 * Live Preview Component
 *
 * Displays a real-time preview of the resume with zoom controls.
 */
export function LivePreview({
  data,
  templateId,
  sectionOrder,
  className,
  onPrintModeChange,
}: LivePreviewProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Get the template component
  const template = TemplateRegistry.getTemplate(templateId);
  const TemplateComponent = template?.component;

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
  }, []);

  const handleZoomPreset = useCallback((level: number) => {
    setZoom(level);
  }, []);

  // Print mode toggle
  const handleTogglePrintMode = useCallback(() => {
    setIsPrintMode((prev) => {
      const newValue = !prev;
      onPrintModeChange?.(newValue);
      return newValue;
    });
  }, [onPrintModeChange]);

  // Format zoom percentage for display
  const zoomPercentage = Math.round(zoom * 100);

  if (!TemplateComponent) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full text-muted-foreground",
          className
        )}
      >
        Template not found: {templateId}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Zoom controls toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium min-w-[4rem] text-center">
            {zoomPercentage}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom presets */}
        <div className="hidden sm:flex items-center gap-1">
          {ZOOM_LEVELS.map((level) => (
            <Button
              key={level}
              variant={zoom === level ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleZoomPreset(level)}
              className="text-xs px-2"
            >
              {Math.round(level * 100)}%
            </Button>
          ))}
        </div>

        {/* Print mode toggle */}
        <Button
          variant={isPrintMode ? "secondary" : "ghost"}
          size="sm"
          onClick={handleTogglePrintMode}
          aria-pressed={isPrintMode}
          aria-label={isPrintMode ? "Exit print mode" : "Enter print mode"}
        >
          <Printer className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Print</span>
        </Button>
      </div>

      {/* Preview area */}
      <ScrollArea className="flex-1 bg-muted/20">
        <div className="flex justify-center p-4 min-h-full">
          <div
            ref={previewRef}
            className="origin-top transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Paper container with shadow */}
            <div
              data-resume-preview="true"
              className={cn(
                "bg-white shadow-lg",
                isPrintMode ? "shadow-none" : "shadow-xl"
              )}
              style={{
                width: "8.5in",
                minHeight: "11in",
              }}
            >
              <TemplateComponent
                data={data}
                sectionOrder={sectionOrder}
                isPrintMode={isPrintMode}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default LivePreview;
