"use client";

/**
 * Resume Builder Page
 *
 * Main page for creating and editing resumes.
 * Integrates editor, preview, template selector, and import components.
 *
 * _Requirements: 3.1, 3.2, 3.3_
 */

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import withAuth from "@/lib/auth/withAuth";
import { toast } from "sonner";
import {
  ResumeEditor,
  LivePreview,
  TemplateSelector,
  SectionReorder,
  TemplateRegistry,
} from "@/components/resume";
import {
  LinkedInImport,
  GitHubImport,
  PortfolioImport,
} from "@/components/resume/import";
import { useResumeEditor } from "@/hooks/useResumeEditor";
import type { ResumeData, SectionType, ResumeProject } from "@/types/resume";
import { getResume, createResume, updateResume } from "@/lib/api/resume";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Undo2,
  Redo2,
  Save,
  Download,
  FileText,
  Github,
  Linkedin,
  FolderOpen,
  ChevronLeft,
  Settings2,
} from "lucide-react";
import { exportToPDF, isPrintSupported } from "@/lib/resume/pdfExport";

// ============================================================================
// Types
// ============================================================================

type ImportSource = "linkedin" | "github" | "portfolio" | null;

// ============================================================================
// Default Resume Data
// ============================================================================

function createEmptyResume(): ResumeData {
  const now = new Date().toISOString();
  return {
    id: "",
    name: "Untitled Resume",
    template_id: TemplateRegistry.getDefaultTemplate().id,
    section_order: [
      "summary",
      "experience",
      "education",
      "projects",
      "skills",
      "certifications",
    ] as SectionType[],
    personal_info: {
      full_name: "",
      email: null,
      phone: null,
      location: null,
      linkedin_url: null,
      github_url: null,
      website_url: null,
    },
    summary: null,
    work_experiences: [],
    education: [],
    projects: [],
    skills: { categories: [] },
    certifications: [],
    created_at: now,
    updated_at: now,
  };
}

// ============================================================================
// Main Component
// ============================================================================

function ResumeBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("id");

  // State
  const [loading, setLoading] = useState(!!resumeId);
  const [error, setError] = useState<string | null>(null);
  const [importSource, setImportSource] = useState<ImportSource>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "import">("import");
  const [showSettings, setShowSettings] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(
    resumeId
  );

  // Initialize with empty resume or load existing
  const [initialData, setInitialData] = useState<ResumeData>(createEmptyResume);

  // Resume editor hook
  const {
    data: resumeData,
    setData: setResumeData,
    isDirty,
    isSaving,
    saveError,
    save,
    canUndo,
    canRedo,
    undo,
    redo,
    markAsSaved,
  } = useResumeEditor({
    initialData,
    onSave: async (data) => {
      if (currentResumeId) {
        // Update existing resume
        await updateResume(currentResumeId, data);
      } else {
        // Create new resume
        const newId = await createResume({
          name: data.name,
          template_id: data.template_id,
          personal_info: data.personal_info,
          summary: data.summary,
          work_experiences: data.work_experiences,
          education: data.education,
          projects: data.projects,
          skills: data.skills,
          certifications: data.certifications,
          section_order: data.section_order,
        });
        setCurrentResumeId(newId);
        // Update URL without reload
        window.history.replaceState(null, "", `/resume-builder?id=${newId}`);
      }
      toast.success("Resume saved!");
    },
    autoSaveEnabled: false, // Manual save for now
  });

  // Load existing resume if ID provided
  useEffect(() => {
    if (!resumeId) {
      setLoading(false);
      return;
    }

    const idToLoad = resumeId; // Capture for closure

    async function loadResume() {
      try {
        setLoading(true);
        setError(null);
        const resume = await getResume(idToLoad);
        setInitialData(resume);
        setCurrentResumeId(idToLoad);
        setActiveTab("edit");
      } catch (err) {
        setError("Failed to load resume. It may have been deleted.");
        console.error("Error loading resume:", err);
      } finally {
        setLoading(false);
      }
    }

    loadResume();
  }, [resumeId]);

  // Handle LinkedIn import complete
  const handleLinkedInImport = useCallback(
    (data: ResumeData) => {
      setResumeData(data);
      setImportSource(null);
      setActiveTab("edit");
      toast.success("LinkedIn data imported successfully!");
    },
    [setResumeData]
  );

  // Handle GitHub import complete (adds projects to existing resume)
  const handleGitHubImport = useCallback(
    (projects: ResumeProject[]) => {
      setResumeData({
        ...resumeData,
        projects: [...resumeData.projects, ...projects],
      });
      setImportSource(null);
      toast.success(`${projects.length} projects imported from GitHub!`);
    },
    [resumeData, setResumeData]
  );

  // Handle Portfolio import complete
  const handlePortfolioImport = useCallback(
    (data: ResumeData) => {
      setResumeData(data);
      setImportSource(null);
      setActiveTab("edit");
      toast.success("Portfolio data imported successfully!");
    },
    [setResumeData]
  );

  // Handle template change
  const handleTemplateChange = useCallback(
    (templateId: string) => {
      setResumeData({
        ...resumeData,
        template_id: templateId,
      });
    },
    [resumeData, setResumeData]
  );

  // Handle section reorder
  const handleSectionReorder = useCallback(
    (newOrder: SectionType[]) => {
      setResumeData({
        ...resumeData,
        section_order: newOrder,
      });
    },
    [resumeData, setResumeData]
  );

  // Handle PDF export
  const handleExport = useCallback(async () => {
    if (!isPrintSupported()) {
      toast.error("PDF export is not supported in this browser");
      return;
    }

    try {
      await exportToPDF({ data: resumeData });
      toast.success("PDF export initiated - check your print dialog");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  }, [resumeData]);

  // Handle import error
  const handleImportError = useCallback((err: Error) => {
    toast.error("Import failed", { description: err.message });
    setImportSource(null);
  }, []);

  // Determine which sections have content
  const sectionsWithContent: SectionType[] = [];
  if (resumeData.summary) sectionsWithContent.push("summary");
  if (resumeData.work_experiences.length > 0)
    sectionsWithContent.push("experience");
  if (resumeData.education.length > 0) sectionsWithContent.push("education");
  if (resumeData.projects.length > 0) sectionsWithContent.push("projects");
  if (resumeData.skills.categories.length > 0)
    sectionsWithContent.push("skills");
  if (resumeData.certifications.length > 0)
    sectionsWithContent.push("certifications");

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading resume...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/resume-builder")}>
            Create New Resume
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top toolbar */}
      <div className="border-b bg-background px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/resume-builder/list")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            My Resumes
          </Button>
          <span className="text-muted-foreground">|</span>
          <span className="font-medium">{resumeData.name || "Untitled"}</span>
          {isDirty && (
            <span className="text-xs text-muted-foreground">(unsaved)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <span className="text-muted-foreground">|</span>

          {/* Save */}
          <Button
            variant="ghost"
            size="sm"
            onClick={save}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>

          {/* Export */}
          <Button variant="default" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel - Editor */}
        <div className="w-[400px] border-r flex flex-col min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "edit" | "import")}
            className="flex flex-col h-full"
          >
            <TabsList className="mx-4 mt-4 grid grid-cols-2">
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* Import source selection */}
                  {!importSource && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Import your data to get started quickly:
                      </p>

                      <Card
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setImportSource("linkedin")}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                            <Linkedin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">LinkedIn PDF</p>
                            <p className="text-xs text-muted-foreground">
                              Upload your LinkedIn profile PDF
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setImportSource("github")}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                            <Github className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">GitHub Projects</p>
                            <p className="text-xs text-muted-foreground">
                              Import repositories as projects
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setImportSource("portfolio")}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900">
                            <FolderOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium">Existing Portfolio</p>
                            <p className="text-xs text-muted-foreground">
                              Import from your Portfolioly data
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="pt-4 border-t">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setActiveTab("edit")}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Start from scratch
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Import components */}
                  {importSource === "linkedin" && (
                    <div className="space-y-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImportSource(null)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                      <LinkedInImport
                        onImportComplete={handleLinkedInImport}
                        onError={handleImportError}
                        templateId={resumeData.template_id}
                      />
                    </div>
                  )}

                  {importSource === "github" && (
                    <div className="space-y-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImportSource(null)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                      <GitHubImport
                        onImportComplete={handleGitHubImport}
                        onError={handleImportError}
                        maxRepos={10}
                      />
                    </div>
                  )}

                  {importSource === "portfolio" && (
                    <div className="space-y-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImportSource(null)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                      <PortfolioImport
                        onImportComplete={handlePortfolioImport}
                        onError={handleImportError}
                        templateId={resumeData.template_id}
                      />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="edit" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <ResumeEditor data={resumeData} onChange={setResumeData} />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Live Preview */}
        <div className="flex-1 min-w-0 bg-muted/30">
          <LivePreview
            data={resumeData}
            templateId={resumeData.template_id}
            sectionOrder={resumeData.section_order}
            className="h-full"
          />
        </div>

        {/* Right panel - Settings (collapsible) */}
        <div
          className={`border-l transition-all duration-200 ${
            showSettings ? "w-[280px]" : "w-0"
          } overflow-hidden`}
        >
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <TemplateSelector
                selectedTemplateId={resumeData.template_id}
                onSelectTemplate={handleTemplateChange}
              />

              <SectionReorder
                sectionOrder={resumeData.section_order}
                onReorder={handleSectionReorder}
                sectionsWithContent={sectionsWithContent}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Settings toggle button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l-md rounded-r-none border border-r-0"
          onClick={() => setShowSettings(!showSettings)}
          title={showSettings ? "Hide settings" : "Show settings"}
        >
          <Settings2
            className={`h-4 w-4 transition-transform ${
              showSettings ? "rotate-90" : ""
            }`}
          />
        </Button>
      </div>

      {/* Save error toast */}
      {saveError && (
        <Alert variant="destructive" className="fixed bottom-4 right-4 w-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default withAuth(ResumeBuilderPage, { requireVerification: true });
