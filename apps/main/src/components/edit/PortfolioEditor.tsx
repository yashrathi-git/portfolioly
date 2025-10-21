"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { PortfolioData } from "@portfolioly/schema";
import { EditorTopBar } from "./EditorTopBar";
import { NavigationSidebar } from "./NavigationSidebar";
import { sections } from "./sectionConfig";
import { PortfolioPreview } from "./PortfolioPreview";

export interface PortfolioEditorProps {
  initial?: PortfolioData;
  onChange?: (next: PortfolioData) => void;
  onSave?: () => void;
  saving?: boolean;
  hasUnsavedChanges?: boolean;
  userName?: string;
}

const emptyPortfolioData: PortfolioData = {
  work_experiences: [],
  projects: [],
  education: [],
  certifications: [],
};

export function PortfolioEditor({
  initial,
  onChange,
  onSave,
  saving = false,
  hasUnsavedChanges = false,
  userName,
}: PortfolioEditorProps) {
  const [data, setData] = useState<PortfolioData>(
    () => initial || emptyPortfolioData
  );
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const [activeMode, setActiveMode] = useState<"edit" | "preview">("edit");

  const update = (next: Partial<PortfolioData>) => {
    const merged = { ...data, ...next };
    setData(merged);
    onChange?.(merged);
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handleModeChange = (mode: "edit" | "preview") => {
    setActiveMode(mode);
  };

  // Find the active section configuration
  const activeSectionConfig = sections.find((s) => s.id === activeSection);

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Top Bar */}
      <EditorTopBar
        title="Edit Portfolio"
        subtitle={`Welcome back, ${userName || "there"}!`}
        activeMode={activeMode}
        onModeChange={handleModeChange}
        onSave={onSave}
        saving={saving}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Content Area */}
      {activeMode === "edit" ? (
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex gap-6">
            {/* Floating Sidebar */}
            <div className="w-60 flex-shrink-0">
              <div className="sticky top-[7.5rem]">
                <NavigationSidebar
                  sections={sections}
                  activeSection={activeSection}
                  onSectionChange={handleSectionChange}
                  portfolioData={data}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {activeSectionConfig && (
                <div
                  role="tabpanel"
                  id={`section-${activeSection}`}
                  aria-labelledby={`tab-${activeSection}`}
                >
                  {renderSectionContent(activeSectionConfig, data, update)}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl px-4 py-8">
          <PortfolioPreview data={data} />
        </div>
      )}
    </div>
  );
}

/**
 * Renders the content for a specific section based on its configuration.
 */
function renderSectionContent(
  section: (typeof sections)[number],
  data: PortfolioData,
  update: (next: Partial<PortfolioData>) => void
) {
  const SectionComponent = section.component;

  // Special handling for different section types
  switch (section.id) {
    case "personal":
      return (
        <SectionComponent
          value={data.personal_info || { profiles: [], tags: [] }}
          onChange={(v: any) => update({ personal_info: v })}
        />
      );

    case "photo":
      return (
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-2 mb-4">
              <h3 className="text-base font-semibold">Profile Photo</h3>
              <p className="text-sm text-muted-foreground">
                Upload a professional photo to personalize your portfolio
              </p>
            </div>
            <SectionComponent
              value={data.personal_info?.profile_photo_url}
              onChange={(url: string | null) =>
                update({
                  personal_info: {
                    ...(data.personal_info || { profiles: [], tags: [] }),
                    profile_photo_url: url || undefined,
                  },
                })
              }
            />
          </CardContent>
        </Card>
      );

    case "profiles":
      return (
        <SectionComponent
          value={data.personal_info || { profiles: [], tags: [] }}
          onChange={(v: any) => update({ personal_info: v })}
        />
      );

    case "experience":
      return (
        <SectionComponent
          value={data.work_experiences || []}
          onChange={(v: any) => update({ work_experiences: v })}
        />
      );

    case "projects":
      return (
        <SectionComponent
          value={data.projects || []}
          onChange={(v: any) => update({ projects: v })}
        />
      );

    case "education":
      return (
        <SectionComponent
          value={data.education || []}
          onChange={(v: any) => update({ education: v })}
        />
      );

    case "certifications":
      return (
        <SectionComponent
          value={data.certifications || []}
          onChange={(v: any) => update({ certifications: v })}
        />
      );

    case "context":
      return (
        <SectionComponent
          value={data.text_blobs || {}}
          onChange={(v: any) => update({ text_blobs: v })}
        />
      );

    case "layout":
      return (
        <SectionComponent
          value={
            data.layout_settings || {
              layout_mode: "both",
              default_layout: "chat",
            }
          }
          onChange={(v: any) => update({ layout_settings: v })}
        />
      );

    default:
      return null;
  }
}

export default PortfolioEditor;
