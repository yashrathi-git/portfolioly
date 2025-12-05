/**
 * Live Preview Component
 *
 * Renders the selected resume template with current ResumeData.
 * Uses @react-pdf/renderer PDFViewer for templates with PDF versions (accurate page breaks).
 * Falls back to HTML preview for templates without PDF versions.
 */

"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { TemplateRegistry } from "./templates";
import { getPDFTemplate, hasPDFTemplate } from "./templates/pdf";
import type { ResumeData, SectionType } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading PDF preview...
      </div>
    ),
  }
);

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

// Letter size page dimensions
const PAGE_WIDTH_IN = 8.5;
const PAGE_HEIGHT_IN = 11;
const PAGE_MARGIN_IN = 0.5;
// Content area height (page height minus top and bottom margins)
const CONTENT_HEIGHT_IN = PAGE_HEIGHT_IN - PAGE_MARGIN_IN * 2; // 10 inches

/**
 * Page break indicator component (for HTML preview fallback)
 * Hidden during print via no-print class
 */
function PageBreakIndicator({
  pageNumber,
  topPosition,
}: {
  pageNumber: number;
  topPosition: string;
}) {
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-10 no-print page-break-indicator"
      style={{ top: topPosition }}
    >
      {/* Dashed line */}
      <div className="relative">
        <div
          className="absolute left-[-20px] right-[-20px] border-t-2 border-dashed no-print"
          style={{ borderColor: "#f59e0b" }}
        />
        {/* Label */}
        <div
          className="absolute right-[-20px] -top-5 text-xs font-medium px-2 py-0.5 rounded no-print"
          style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
        >
          Page {pageNumber} / {pageNumber + 1}
        </div>
      </div>
    </div>
  );
}

/**
 * Check if template handles its own pagination
 * Templates like Jake's and Modern render separate pages internally
 */
function templateHandlesOwnPagination(templateId: string): boolean {
  return templateId === "jake" || templateId === "modern";
}

export function LivePreview({
  data,
  templateId,
  sectionOrder,
  className,
}: LivePreviewProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pageCount, setPageCount] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  const template = TemplateRegistry.getTemplate(templateId);
  const TemplateComponent = template?.component;

  // Check if we have a PDF template for accurate rendering
  const hasPDF = hasPDFTemplate(templateId);
  const PDFTemplate = hasPDF ? getPDFTemplate(templateId) : null;

  // Memoize the PDF document to prevent unnecessary re-renders
  const pdfDocument = useMemo(() => {
    if (!PDFTemplate) return null;
    return <PDFTemplate data={data} sectionOrder={sectionOrder} />;
  }, [PDFTemplate, data, sectionOrder]);

  // Check if template handles its own pagination (like Jake's template)
  const handlesOwnPagination = templateHandlesOwnPagination(templateId);

  // Calculate page count based on content height (for HTML preview fallback)
  // Skip for templates that handle their own pagination
  useEffect(() => {
    if (hasPDF || handlesOwnPagination || !contentRef.current) return;

    const calculatePages = () => {
      const contentHeight = contentRef.current?.scrollHeight || 0;
      const contentHeightIn = contentHeight / 96;
      const pages = Math.max(1, Math.ceil(contentHeightIn / CONTENT_HEIGHT_IN));
      setPageCount(pages);
    };

    const timeoutId = setTimeout(calculatePages, 50);
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(calculatePages, 50);
    });
    resizeObserver.observe(contentRef.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [data, sectionOrder, templateId, hasPDF, handlesOwnPagination]);

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

  // Generate page break indicators (for HTML preview fallback)
  // Skip for templates that handle their own pagination
  const pageBreaks = [];
  if (!handlesOwnPagination) {
    for (let i = 1; i < pageCount; i++) {
      pageBreaks.push(
        <PageBreakIndicator
          key={i}
          pageNumber={i}
          topPosition={`${CONTENT_HEIGHT_IN * i}in`}
        />
      );
    }
  }

  if (!TemplateComponent && !PDFTemplate) {
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

  // Use PDF preview for templates with PDF versions
  if (hasPDF && pdfDocument) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        {/* Toolbar for PDF preview */}
        <div className="flex items-center justify-center border-b bg-muted/30 px-3 py-2 gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">PDF viewer</span>
        </div>

        {/* PDF Viewer - shows exact PDF rendering with page breaks */}
        <div className="flex-1 bg-muted/20">
          <PDFViewer
            style={{ width: "100%", height: "100%", border: "none" }}
            showToolbar={true}
          >
            {pdfDocument}
          </PDFViewer>
        </div>
      </div>
    );
  }

  // Fallback to HTML preview for templates without PDF versions
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

        {/* Page count indicator - hide warning for templates that handle own pagination */}
        {!handlesOwnPagination && (
          <div className="ml-2 pl-2 border-l text-sm text-muted-foreground">
            {pageCount} {pageCount === 1 ? "page" : "pages"}
            {pageCount > 1 && (
              <span className="ml-1 text-amber-600 dark:text-amber-400">
                ⚠ exceeds 1 page
              </span>
            )}
          </div>
        )}
      </div>

      {/* Preview area with page visualization */}
      <ScrollArea className="flex-1 bg-muted/20">
        <div className="flex justify-center p-4 min-h-full">
          <div
            className="origin-top transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Page container with visual page breaks */}
            <div className="relative">
              <div
                data-resume-preview="true"
                ref={contentRef}
                className="bg-white shadow-xl relative"
                style={{
                  width: `${PAGE_WIDTH_IN}in`,
                }}
              >
                {TemplateComponent && (
                  <TemplateComponent
                    data={data}
                    sectionOrder={sectionOrder}
                    isPrintMode={false}
                  />
                )}
                {/* Page break indicators overlay */}
                {pageBreaks}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default LivePreview;
