"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { DateInfo, Education } from "portfolioly-schema";
import { SimpleDateInput } from "./SimpleDateInput";
import { ActionButton } from "./ActionButton";
import { FormSection } from "./FormSection";

export interface EducationFormProps {
  value: Education[];
  onChange: (next: Education[]) => void;
}

const emptyEdu: Education = {
  institution: "",
  degree: "",
  branch: "",
  start_date: { month: 9, year: new Date().getFullYear() - 4 },
  end_date: { month: 6, year: new Date().getFullYear() },
  is_current: false,
  location: "",
  grade: "",
};

export function EducationForm({ value, onChange }: EducationFormProps) {
  const items = value || [];

  const add = () => onChange([...(items || []), { ...emptyEdu }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, next: Partial<Education>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...next } : it)));
  const updateDate = (
    idx: number,
    key: "start_date" | "end_date",
    next?: DateInfo
  ) => {
    update(idx, { [key]: next } as Partial<Education>);
  };

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
        {items.map((ed, idx) => (
          <div key={idx} className="grid gap-4 p-4 rounded-md border">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Institution</Label>
                <Input
                  value={ed.institution ?? ""}
                  onChange={(e) => update(idx, { institution: e.target.value })}
                  placeholder="University"
                />
              </div>
              <div className="grid gap-2">
                <Label>Degree</Label>
                <Input
                  value={ed.degree ?? ""}
                  onChange={(e) => update(idx, { degree: e.target.value })}
                  placeholder="Bachelor of Science"
                />
              </div>
              <div className="grid gap-2">
                <Label>Branch</Label>
                <Input
                  value={ed.branch ?? ""}
                  onChange={(e) => update(idx, { branch: e.target.value })}
                  placeholder="Computer Science"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start date</Label>
                <SimpleDateInput
                  value={ed.start_date || undefined}
                  onChange={(d) => updateDate(idx, "start_date", d)}
                />
              </div>
              <div className="grid gap-2">
                <Label>End date</Label>
                <SimpleDateInput
                  value={ed.end_date || undefined}
                  onChange={(d) => updateDate(idx, "end_date", d)}
                  disabled={!!ed.is_current}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`edu-current-${idx}`}
                checked={!!ed.is_current}
                onCheckedChange={(checked) =>
                  update(idx, { is_current: Boolean(checked) })
                }
              />
              <Label htmlFor={`edu-current-${idx}`}>
                I currently study here
              </Label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input
                  value={ed.location ?? ""}
                  onChange={(e) => update(idx, { location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
              <div className="grid gap-2">
                <Label>Grade</Label>
                <Input
                  value={ed.grade ?? ""}
                  onChange={(e) => update(idx, { grade: e.target.value })}
                  placeholder="GPA or Grade"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Institution Logo URL</Label>
              <Input
                value={ed.logo_url ?? ""}
                onChange={(e) => update(idx, { logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-sm text-muted-foreground">
                Auto-filled when available. Add your own URL to override the
                suggested logo.
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

export default EducationForm;
