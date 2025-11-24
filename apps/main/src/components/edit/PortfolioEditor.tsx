"use client";

import { useEffect, useState, startTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Link, ShieldCheck, User } from "lucide-react";
import type { PortfolioData } from "portfolioly-schema";
import { EditorTopBar } from "./EditorTopBar";
import { NavigationSidebar } from "./NavigationSidebar";
import { sections } from "./sectionConfig";
import { PortfolioPreview } from "./PortfolioPreview";
import { usePublishStatus } from "@/hooks/usePublishStatus";

export interface PortfolioEditorProps {
  initial?: PortfolioData;
  onChange?: (next: PortfolioData) => void;
  onSave?: () => void;
  saving?: boolean;
  hasUnsavedChanges?: boolean;
  userName?: string;
}

const emptyPortfolioData: PortfolioData = {
  personal_info: { profiles: [], tags: [] },
  work_experiences: [],
  projects: [],
  education: [],
  certifications: [],
  text_blobs: {},
  metadata: {},
  layout_settings: {
    layout_mode: "both",
    default_layout: "chat",
    chat_mode_footer: true,
  },
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
  useEffect(() => {
    if (hasUnsavedChanges) {
      return;
    }

    setData(initial || emptyPortfolioData);
  }, [initial, hasUnsavedChanges]);
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const [activeMode, setActiveMode] = useState<"edit" | "preview">("edit");
  const [publicToken, setPublicToken] = useState<string | undefined>(undefined);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const {
    publishStatus,
    isLoading: isLoadingPublishStatus,
    refetch: refetchPublishStatus,
  } = usePublishStatus();

  const publishAccessMode = publishStatus
    ? publishStatus.isPublic
      ? "public"
      : "private"
    : undefined;

  // Fetch public token when username is available
  useEffect(() => {
    async function fetchPublicToken() {
      if (!publishStatus?.username) {
        setPublicToken(undefined);
        setIsLoadingToken(false);
        return;
      }

      setIsLoadingToken(true);
      try {
        const { ensurePublicToken } = await import("@/lib/api/publicToken");
        const token = await ensurePublicToken(publishStatus.username);
        setPublicToken(token);
      } catch (error) {
        console.error("Failed to fetch public token:", error);
        setPublicToken(undefined);
      } finally {
        setIsLoadingToken(false);
      }
    }

    fetchPublicToken();
  }, [publishStatus?.username]);

  const update = (next: Partial<PortfolioData>) => {
    const merged = { ...data, ...next };
    setData(merged);
    onChange?.(merged);
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handleModeChange = (mode: "edit" | "preview") => {
    startTransition(() => {
      setActiveMode(mode);
    });
  };

  // Check if portfolio has any content
  const hasContent =
    (data.personal_info?.full_name &&
      data.personal_info.full_name.trim() !== "") ||
    (data.work_experiences && data.work_experiences.length > 0) ||
    (data.projects && data.projects.length > 0) ||
    (data.education && data.education.length > 0) ||
    (data.certifications && data.certifications.length > 0);

  // Find the active section configuration
  const activeSectionConfig = sections.find((s) => s.id === activeSection);

  // Determine if we should show publish prompts
  const shouldShowPublishPrompt =
    !isLoadingPublishStatus &&
    publishStatus &&
    (!publishStatus.hasUsername || !publishStatus.isPublic);

  const renderPublishBanner = () => {
    if (!publishStatus) {
      return null;
    }

    if (!publishStatus.hasUsername) {
      return (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
            <strong className="font-semibold">
              Customize your sharing link
            </strong>
            <p className="mt-1">
              You already have a default username. Click the settings icon in
              the top bar if you&apos;d like to edit it or tweak visibility.
            </p>
          </AlertDescription>
        </Alert>
      );
    }

    if (!publishStatus.isPublic) {
      return (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
            <strong className="font-semibold">Your portfolio is private</strong>
            <p className="mt-1">
              Toggle the publish switch in settings to share your link.
            </p>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <AlertDescription className="text-sm text-emerald-900 dark:text-emerald-100">
          <strong className="font-semibold">Portfolio is live</strong>
          <p className="mt-1 flex items-center gap-2">
            <Link className="h-4 w-4" />
            <span>{publishStatus.publicUrl}</span>
          </p>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="w-full min-h-screen">
      {/* Top Bar */}
      <EditorTopBar
        title="Edit Portfolio"
        activeMode={activeMode}
        onModeChange={handleModeChange}
        onSave={onSave}
        saving={saving}
        hasUnsavedChanges={hasUnsavedChanges}
        hasContent={hasContent}
        publishUsername={publishStatus?.username}
        publishAccessMode={publishAccessMode}
        publishLoading={isLoadingPublishStatus}
        onPublishUpdated={() => refetchPublishStatus()}
        publicToken={publicToken}
        publishSettingsLoading={isLoadingPublishStatus || isLoadingToken}
      />

      {/* Content Area - Both sections always rendered, visibility controlled by CSS */}

      {/* Edit Mode */}
      <div className={activeMode === "edit" ? "block" : "hidden"}>
        <div className="mx-auto max-w-7xl px-4 md:px-4 py-8">
          {/* Publish Prompt Banner */}
          {shouldShowPublishPrompt && (
            <div className="mb-6">{renderPublishBanner()}</div>
          )}

          <div className="flex gap-6">
            {/* Floating Sidebar - Hidden on mobile */}
            <div className="hidden md:block w-60 flex-shrink-0">
              <div className="sticky top-20">
                <NavigationSidebar
                  sections={sections}
                  activeSection={activeSection}
                  onSectionChange={handleSectionChange}
                  portfolioData={data}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 w-full">
              {/* Desktop: Show only active section */}
              <div className="hidden md:block">
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

              {/* Mobile: Show all sections stacked */}
              <div className="md:hidden space-y-6">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    id={`section-${section.id}`}
                    className="scroll-mt-24"
                  >
                    {renderSectionContent(section, data, update)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Mode */}
      <div className={activeMode === "preview" ? "block" : "hidden"}>
        <div className="mx-auto max-w-[1400px] px-4 py-8">
          <PortfolioPreview data={data} />
        </div>
      </div>
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
          value={data.personal_info}
          onChange={(v) => update({ personal_info: v })}
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
                    ...data.personal_info,
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
          value={data.personal_info}
          onChange={(v) => update({ personal_info: v })}
        />
      );

    case "experience":
      return (
        <SectionComponent
          value={data.work_experiences || []}
          onChange={(v) => update({ work_experiences: v })}
        />
      );

    case "projects":
      return (
        <SectionComponent
          value={data.projects || []}
          onChange={(v) => update({ projects: v })}
        />
      );

    case "education":
      return (
        <SectionComponent
          value={data.education || []}
          onChange={(v) => update({ education: v })}
        />
      );

    case "certifications":
      return (
        <SectionComponent
          value={data.certifications || []}
          onChange={(v) => update({ certifications: v })}
        />
      );

    case "context":
      return (
        <SectionComponent
          value={data.text_blobs}
          onChange={(v) => update({ text_blobs: v })}
        />
      );

    case "layout":
      return (
        <SectionComponent
          value={data.layout_settings}
          onChange={(v) => update({ layout_settings: v })}
        />
      );

    default:
      return null;
  }
}

export default PortfolioEditor;
