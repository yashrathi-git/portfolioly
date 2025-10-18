"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PortfolioData } from "@portfolioly/schema";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { ProfilesForm } from "./ProfilesForm";
import { WorkExperienceForm } from "./WorkExperienceForm";
import { ProjectsForm } from "./ProjectsForm";
import { EducationForm } from "./EducationForm";
import { CertificationsForm } from "./CertificationsForm";
import { TextBlobsForm } from "./TextBlobsForm";
import { LayoutSettingsForm } from "./LayoutSettingsForm";
import { PortfolioPreview } from "./PortfolioPreview";

export interface PortfolioEditorProps {
  initial?: PortfolioData;
  onChange?: (next: PortfolioData) => void;
}

const emptyPortfolioData: PortfolioData = {
  work_experiences: [],
  projects: [],
  education: [],
  certifications: [],
};

export function PortfolioEditor({ initial, onChange }: PortfolioEditorProps) {
  const [data, setData] = useState<PortfolioData>(
    () => initial || emptyPortfolioData
  );
  const [tab, setTab] = useState<string>("edit");

  const update = (next: Partial<PortfolioData>) => {
    const merged = { ...data, ...next };
    setData(merged);
    onChange?.(merged);
  };

  const isValid = useMemo(() => {
    const pi = data.personal_info;
    if (!pi) return false;
    return Boolean(pi.full_name && pi.full_name.trim());
  }, [data]);

  const reset = () => {
    if (initial) {
      setData(initial);
      return;
    }

    setData(emptyPortfolioData);
  };

  return (
    <div className="w-full">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {isValid
                  ? "Ready to preview"
                  : "Enter your name to enable a complete preview"}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" type="button" onClick={reset}>
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={() => setTab("preview")}
                  disabled={!isValid}
                >
                  Preview
                </Button>
              </div>
            </div>

            <PersonalInfoForm
              value={data.personal_info || { profiles: [] }}
              onChange={(v) => update({ personal_info: v })}
            />

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-2 mb-4">
                  <h3 className="text-base font-semibold">Profile Photo</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a professional photo to personalize your portfolio
                  </p>
                </div>
                <ProfilePhotoUpload
                  value={data.personal_info?.profile_photo_url}
                  onChange={(url) =>
                    update({
                      personal_info: {
                        ...(data.personal_info || { profiles: [] }),
                        profile_photo_url: url || undefined,
                      },
                    })
                  }
                />
              </CardContent>
            </Card>

            <ProfilesForm
              value={data.personal_info || { profiles: [] }}
              onChange={(v) => update({ personal_info: v })}
            />

            <WorkExperienceForm
              value={data.work_experiences || []}
              onChange={(v) => update({ work_experiences: v })}
            />

            <ProjectsForm
              value={data.projects || []}
              onChange={(v) => update({ projects: v })}
            />

            <EducationForm
              value={data.education || []}
              onChange={(v) => update({ education: v })}
            />

            <CertificationsForm
              value={data.certifications || []}
              onChange={(v) => update({ certifications: v })}
            />

            <TextBlobsForm
              value={data.text_blobs || {}}
              onChange={(v) => update({ text_blobs: v })}
            />

            <LayoutSettingsForm
              value={
                data.layout_settings || {
                  layout_mode: "both",
                  default_layout: "chat",
                }
              }
              onChange={(v) => update({ layout_settings: v })}
            />

            <Card>
              <CardContent className="p-4 text-xs text-muted-foreground">
                Metadata is managed automatically and is not editable here.
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="preview" className="mt-6">
          <PortfolioPreview data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PortfolioEditor;
