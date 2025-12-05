/**
 * Live Preview Component
 *
 * Renders the selected resume template with current ResumeData.
 * Includes zoom controls for preview scaling.
 */

"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TemplateRegistry } from "./templates";
import type { ResumeData, SectionType } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface LivePreviewProps {
  data: ResumeData;
  templateId: string;
  sectionOrder: SectionType[];
  className?: string;
}

const DEFAULT_ZOOM = 0.65;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

export function LivePreview({
  data,
  templateId,
  sectionOrder,
  className,
}: LivePreviewProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const template = TemplateRegistry.getTemplate(templateId);
  const TemplateComponent = template?.component;

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
  }, []);

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
      <div className="flex items-center justify-center border-b bg-muted/30 px-3 py-2 gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <span className="text-sm font-medium min-w-[4rem] text-center tabular-nums">
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
          title="Reset zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview area */}
      <ScrollArea className="flex-1 bg-muted/20">
        <div className="flex justify-center p-4 min-h-full">
          <div
            className="origin-top transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          >
            <div
              data-resume-preview="true"
              className="bg-white shadow-xl"
              style={{
                width: "8.5in",
                minHeight: "11in",
              }}
            >
              <TemplateComponent
                data={data}
                sectionOrder={sectionOrder}
                isPrintMode={false}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default LivePreview;
