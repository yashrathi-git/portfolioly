"use client";

/**
 * Resume Editor Component
 *
 * Provides inline editing for all resume sections including:
 * - Personal info editing form
 * - Summary/objective editing
 * - Work experience editing with bullet point management
 * - Education editing
 * - Projects editing
 * - Skills category management
 * - Certifications editing
 *
 * _Requirements: 6.1, 6.2_
 */

import { FormSection } from "@/components/edit/FormSection";
import { ActionButton } from "@/components/edit/ActionButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type {
  ResumeData,
  ResumePersonalInfo,
  ResumeWorkExperience,
  ResumeEducation,
  ResumeProject,
  ResumeSkills,
  ResumeCertification,
  SkillCategory,
  DateInfo,
} from "@/types/resume";

// ============================================================================
// Types
// ============================================================================

export interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

interface ResumeDateInputProps {
  value?: DateInfo | null;
  onChange: (next: DateInfo | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

function ResumeDateInput({
  value,
  onChange,
  disabled,
  placeholder = "MM/YYYY",
}: ResumeDateInputProps) {
  const formatValue = () => {
    if (value?.month && value?.year) {
      return `${String(value.month).padStart(2, "0")}/${value.year}`;
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d/]/g, "");
    if (val.length === 2 && !val.includes("/")) {
      val = val + "/";
    }
    if (val.length > 7) {
      val = val.slice(0, 7);
    }

    // Parse and update
    const match = val.match(/^(\d{1,2})\/(\d{4})$/);
    if (match) {
      const month = parseInt(match[1], 10);
      const year = parseInt(match[2], 10);
      if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        onChange({ month, year });
        return;
      }
    }

    // If empty or incomplete, clear
    if (!val.trim()) {
      onChange(undefined);
    }
  };

  return (
    <Input
      type="text"
      value={formatValue()}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={7}
      className="font-mono"
    />
  );
}

// ============================================================================
// Section Editors
// ============================================================================

interface PersonalInfoEditorProps {
  value: ResumePersonalInfo;
  onChange: (next: ResumePersonalInfo) => void;
}

function PersonalInfoEditor({ value, onChange }: PersonalInfoEditorProps) {
  const v = value || { full_name: "" };

  return (
    <FormSection title="Personal Information">
      <div className="grid gap-2">
        <Label htmlFor="resume-full-name">Full Name</Label>
        <Input
          id="resume-full-name"
          value={v.full_name ?? ""}
          onChange={(e) => onChange({ ...v, full_name: e.target.value })}
          placeholder="John Doe"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="resume-email">Email</Label>
          <Input
            id="resume-email"
            type="email"
            value={v.email ?? ""}
            onChange={(e) => onChange({ ...v, email: e.target.value })}
            placeholder="john.doe@example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="resume-phone">Phone</Label>
          <Input
            id="resume-phone"
            value={v.phone ?? ""}
            onChange={(e) => onChange({ ...v, phone: e.target.value })}
            placeholder="+1 555 0100"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="resume-location">Location</Label>
        <Input
          id="resume-location"
          value={v.location ?? ""}
          onChange={(e) => onChange({ ...v, location: e.target.value })}
          placeholder="San Francisco, CA"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="resume-linkedin">LinkedIn URL</Label>
          <Input
            id="resume-linkedin"
            value={v.linkedin_url ?? ""}
            onChange={(e) => onChange({ ...v, linkedin_url: e.target.value })}
            placeholder="https://linkedin.com/in/johndoe"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="resume-github">GitHub URL</Label>
          <Input
            id="resume-github"
            value={v.github_url ?? ""}
            onChange={(e) => onChange({ ...v, github_url: e.target.value })}
            placeholder="https://github.com/johndoe"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="resume-website">Website URL</Label>
        <Input
          id="resume-website"
          value={v.website_url ?? ""}
          onChange={(e) => onChange({ ...v, website_url: e.target.value })}
          placeholder="https://johndoe.com"
        />
      </div>
    </FormSection>
  );
}

interface SummaryEditorProps {
  value: string | null | undefined;
  onChange: (next: string | null) => void;
}

function SummaryEditor({ value, onChange }: SummaryEditorProps) {
  return (
    <FormSection title="Professional Summary">
      <div className="grid gap-2">
        <Label htmlFor="resume-summary">Summary</Label>
        <Textarea
          id="resume-summary"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Experienced software engineer with 5+ years of expertise in building scalable web applications..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          A brief professional summary highlighting your key qualifications and
          career objectives.
        </p>
      </div>
    </FormSection>
  );
}

interface WorkExperienceEditorProps {
  value: ResumeWorkExperience[];
  onChange: (next: ResumeWorkExperience[]) => void;
}

function WorkExperienceEditor({ value, onChange }: WorkExperienceEditorProps) {
  const items = value || [];

  const generateId = () =>
    `exp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const emptyExperience: ResumeWorkExperience = {
    id: generateId(),
    company: "",
    title: "",
    location: null,
    start_date: { month: 1, year: new Date().getFullYear() },
    end_date: null,
    is_current: false,
    highlights: [],
  };

  const add = () =>
    onChange([...items, { ...emptyExperience, id: generateId() }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, next: Partial<ResumeWorkExperience>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...next } : it)));

  const updateHighlights = (idx: number, text: string) => {
    // Split by newlines and filter empty lines
    const highlights = text
      .split("\n")
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter((line) => line.length > 0);
    update(idx, { highlights });
  };

  const highlightsToText = (highlights: string[]) =>
    highlights.map((h) => `• ${h}`).join("\n");

  return (
    <FormSection
      title="Work Experience"
      actions={
        <ActionButton action="add" label="Add experience" onClick={add} />
      }
    >
      <div className="grid gap-6">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No work experience added yet.
          </p>
        )}
        {items.map((exp, idx) => (
          <div key={exp.id} className="grid gap-4 p-4 rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Company</Label>
                <Input
                  value={exp.company ?? ""}
                  onChange={(e) => update(idx, { company: e.target.value })}
                  placeholder="Company Inc."
                />
              </div>
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                  value={exp.title ?? ""}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={exp.location ?? ""}
                onChange={(e) =>
                  update(idx, { location: e.target.value || null })
                }
                placeholder="San Francisco, CA"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <ResumeDateInput
                  value={exp.start_date}
                  onChange={(d) =>
                    update(idx, {
                      start_date: d || {
                        month: 1,
                        year: new Date().getFullYear(),
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <ResumeDateInput
                  value={exp.end_date}
                  onChange={(d) => update(idx, { end_date: d || null })}
                  disabled={exp.is_current}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`exp-current-${idx}`}
                checked={exp.is_current}
                onCheckedChange={(checked) =>
                  update(idx, {
                    is_current: Boolean(checked),
                    end_date: checked ? null : exp.end_date,
                  })
                }
              />
              <Label htmlFor={`exp-current-${idx}`}>
                I currently work here
              </Label>
            </div>

            <div className="grid gap-2">
              <Label>Highlights (bullet points)</Label>
              <Textarea
                rows={4}
                value={highlightsToText(exp.highlights)}
                onChange={(e) => updateHighlights(idx, e.target.value)}
                placeholder="• Led development of key features&#10;• Improved performance by 40%&#10;• Mentored junior developers"
              />
              <p className="text-xs text-muted-foreground">
                Each line becomes a bullet point. Start with • or - for clarity.
              </p>
            </div>

            <div className="flex justify-end">
              <ActionButton
                action="remove"
                label="Remove"
                onClick={() => remove(idx)}
              />
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

interface EducationEditorProps {
  value: ResumeEducation[];
  onChange: (next: ResumeEducation[]) => void;
}

function EducationEditor({ value, onChange }: EducationEditorProps) {
  const items = value || [];

  const generateId = () =>
    `edu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const emptyEducation: ResumeEducation = {
    id: generateId(),
    institution: "",
    degree: "",
    field: null,
    location: null,
    start_date: { month: 9, year: new Date().getFullYear() - 4 },
    end_date: null,
    gpa: null,
    highlights: [],
  };

  const add = () =>
    onChange([...items, { ...emptyEducation, id: generateId() }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, next: Partial<ResumeEducation>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...next } : it)));

  const updateHighlights = (idx: number, text: string) => {
    const highlights = text
      .split("\n")
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter((line) => line.length > 0);
    update(idx, { highlights });
  };

  const highlightsToText = (highlights: string[]) =>
    highlights.map((h) => `• ${h}`).join("\n");

  return (
    <FormSection
      title="Education"
      actions={
        <ActionButton action="add" label="Add education" onClick={add} />
      }
    >
      <div className="grid gap-6">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No education entries yet.
          </p>
        )}
        {items.map((edu, idx) => (
          <div key={edu.id} className="grid gap-4 p-4 rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Institution</Label>
                <Input
                  value={edu.institution ?? ""}
                  onChange={(e) => update(idx, { institution: e.target.value })}
                  placeholder="University of California"
                />
              </div>
              <div className="grid gap-2">
                <Label>Degree</Label>
                <Input
                  value={edu.degree ?? ""}
                  onChange={(e) => update(idx, { degree: e.target.value })}
                  placeholder="Bachelor of Science"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Field of Study</Label>
                <Input
                  value={edu.field ?? ""}
                  onChange={(e) =>
                    update(idx, { field: e.target.value || null })
                  }
                  placeholder="Computer Science"
                />
              </div>
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input
                  value={edu.location ?? ""}
                  onChange={(e) =>
                    update(idx, { location: e.target.value || null })
                  }
                  placeholder="Berkeley, CA"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <ResumeDateInput
                  value={edu.start_date}
                  onChange={(d) =>
                    update(idx, {
                      start_date: d || {
                        month: 9,
                        year: new Date().getFullYear(),
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <ResumeDateInput
                  value={edu.end_date}
                  onChange={(d) => update(idx, { end_date: d || null })}
                />
              </div>
              <div className="grid gap-2">
                <Label>GPA</Label>
                <Input
                  value={edu.gpa ?? ""}
                  onChange={(e) => update(idx, { gpa: e.target.value || null })}
                  placeholder="3.8/4.0"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Highlights</Label>
              <Textarea
                rows={3}
                value={highlightsToText(edu.highlights)}
                onChange={(e) => updateHighlights(idx, e.target.value)}
                placeholder="• Dean's List&#10;• Relevant coursework: Data Structures, Algorithms"
              />
            </div>

            <div className="flex justify-end">
              <ActionButton
                action="remove"
                label="Remove"
                onClick={() => remove(idx)}
              />
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

interface ProjectsEditorProps {
  value: ResumeProject[];
  onChange: (next: ResumeProject[]) => void;
}

function ProjectsEditor({ value, onChange }: ProjectsEditorProps) {
  const items = value || [];

  const generateId = () =>
    `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const emptyProject: ResumeProject = {
    id: generateId(),
    name: "",
    description: null,
    technologies: [],
    url: null,
    highlights: [],
  };

  const add = () => onChange([...items, { ...emptyProject, id: generateId() }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, next: Partial<ResumeProject>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...next } : it)));

  const updateHighlights = (idx: number, text: string) => {
    const highlights = text
      .split("\n")
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter((line) => line.length > 0);
    update(idx, { highlights });
  };

  const highlightsToText = (highlights: string[]) =>
    highlights.map((h) => `• ${h}`).join("\n");

  const updateTechnologies = (idx: number, text: string) => {
    const technologies = text
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    update(idx, { technologies });
  };

  const technologiesToText = (technologies: string[]) =>
    technologies.join(", ");

  return (
    <FormSection
      title="Projects"
      actions={<ActionButton action="add" label="Add project" onClick={add} />}
    >
      <div className="grid gap-6">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No projects added yet.
          </p>
        )}
        {items.map((proj, idx) => (
          <div key={proj.id} className="grid gap-4 p-4 rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Project Name</Label>
                <Input
                  value={proj.name ?? ""}
                  onChange={(e) => update(idx, { name: e.target.value })}
                  placeholder="Portfolio Website"
                />
              </div>
              <div className="grid gap-2">
                <Label>URL</Label>
                <Input
                  value={proj.url ?? ""}
                  onChange={(e) => update(idx, { url: e.target.value || null })}
                  placeholder="https://github.com/user/project"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={proj.description ?? ""}
                onChange={(e) =>
                  update(idx, { description: e.target.value || null })
                }
                placeholder="A brief description of the project..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Technologies</Label>
              <Input
                value={technologiesToText(proj.technologies)}
                onChange={(e) => updateTechnologies(idx, e.target.value)}
                placeholder="React, TypeScript, Node.js"
              />
              <p className="text-xs text-muted-foreground">
                Separate technologies with commas.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Highlights</Label>
              <Textarea
                rows={3}
                value={highlightsToText(proj.highlights)}
                onChange={(e) => updateHighlights(idx, e.target.value)}
                placeholder="• Built responsive UI with React&#10;• Implemented real-time features"
              />
            </div>

            <div className="flex justify-end">
              <ActionButton
                action="remove"
                label="Remove"
                onClick={() => remove(idx)}
              />
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

interface SkillsEditorProps {
  value: ResumeSkills;
  onChange: (next: ResumeSkills) => void;
}

function SkillsEditor({ value, onChange }: SkillsEditorProps) {
  const categories = value?.categories || [];

  const add = () => {
    const newCategory: SkillCategory = { name: "", items: [] };
    onChange({ categories: [...categories, newCategory] });
  };

  const remove = (idx: number) => {
    onChange({ categories: categories.filter((_, i) => i !== idx) });
  };

  const update = (idx: number, next: Partial<SkillCategory>) => {
    onChange({
      categories: categories.map((cat, i) =>
        i === idx ? { ...cat, ...next } : cat
      ),
    });
  };

  const updateItems = (idx: number, text: string) => {
    const items = text
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    update(idx, { items });
  };

  const itemsToText = (items: string[]) => items.join(", ");

  return (
    <FormSection
      title="Skills"
      actions={<ActionButton action="add" label="Add category" onClick={add} />}
    >
      <div className="grid gap-6">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No skill categories added yet. Add categories like
            &quot;Languages&quot;, &quot;Frameworks&quot;, or &quot;Tools&quot;.
          </p>
        )}
        {categories.map((cat, idx) => (
          <div key={idx} className="grid gap-4 p-4 rounded-md border">
            <div className="grid gap-2">
              <Label>Category Name</Label>
              <Input
                value={cat.name ?? ""}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="Languages, Frameworks, Tools, etc."
              />
            </div>

            <div className="grid gap-2">
              <Label>Skills</Label>
              <Textarea
                rows={2}
                value={itemsToText(cat.items)}
                onChange={(e) => updateItems(idx, e.target.value)}
                placeholder="JavaScript, TypeScript, Python, Go"
              />
              <p className="text-xs text-muted-foreground">
                Separate skills with commas.
              </p>
            </div>

            <div className="flex justify-end">
              <ActionButton
                action="remove"
                label="Remove"
                onClick={() => remove(idx)}
              />
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

interface CertificationsEditorProps {
  value: ResumeCertification[];
  onChange: (next: ResumeCertification[]) => void;
}

function CertificationsEditor({ value, onChange }: CertificationsEditorProps) {
  const items = value || [];

  const generateId = () =>
    `cert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const emptyCertification: ResumeCertification = {
    id: generateId(),
    name: "",
    issuer: null,
    date: null,
  };

  const add = () =>
    onChange([...items, { ...emptyCertification, id: generateId() }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, next: Partial<ResumeCertification>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...next } : it)));

  return (
    <FormSection
      title="Certifications"
      actions={
        <ActionButton action="add" label="Add certification" onClick={add} />
      }
    >
      <div className="grid gap-6">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No certifications added yet.
          </p>
        )}
        {items.map((cert, idx) => (
          <div key={cert.id} className="grid gap-4 p-4 rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Certification Name</Label>
                <Input
                  value={cert.name ?? ""}
                  onChange={(e) => update(idx, { name: e.target.value })}
                  placeholder="AWS Certified Developer"
                />
              </div>
              <div className="grid gap-2">
                <Label>Issuer</Label>
                <Input
                  value={cert.issuer ?? ""}
                  onChange={(e) =>
                    update(idx, { issuer: e.target.value || null })
                  }
                  placeholder="Amazon Web Services"
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  value={cert.date ?? ""}
                  onChange={(e) =>
                    update(idx, { date: e.target.value || null })
                  }
                  placeholder="2024 or Jan 2024"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <ActionButton
                action="remove"
                label="Remove"
                onClick={() => remove(idx)}
              />
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ResumeEditor - Main component for editing all resume sections
 *
 * Provides inline editing for:
 * - Personal info
 * - Summary/objective
 * - Work experience with bullet points
 * - Education
 * - Projects
 * - Skills categories
 * - Certifications
 */
export function ResumeEditor({ data, onChange, className }: ResumeEditorProps) {
  const updateField = <K extends keyof ResumeData>(
    field: K,
    value: ResumeData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className={cn("grid gap-6", className)}>
      <PersonalInfoEditor
        value={data.personal_info}
        onChange={(v) => updateField("personal_info", v)}
      />

      <SummaryEditor
        value={data.summary}
        onChange={(v) => updateField("summary", v)}
      />

      <WorkExperienceEditor
        value={data.work_experiences}
        onChange={(v) => updateField("work_experiences", v)}
      />

      <EducationEditor
        value={data.education}
        onChange={(v) => updateField("education", v)}
      />

      <ProjectsEditor
        value={data.projects}
        onChange={(v) => updateField("projects", v)}
      />

      <SkillsEditor
        value={data.skills}
        onChange={(v) => updateField("skills", v)}
      />

      <CertificationsEditor
        value={data.certifications}
        onChange={(v) => updateField("certifications", v)}
      />
    </div>
  );
}

export default ResumeEditor;
