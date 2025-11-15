"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { WorkExperience, DateInfo } from "portfolioly-schema";
import { SimpleDateInput } from "./SimpleDateInput";
import { TagInput } from "./TagInput";
import { ActionButton } from "./ActionButton";

export interface WorkExperienceFormProps {
  value: WorkExperience[];
  onChange: (next: WorkExperience[]) => void;
}

const emptyWE: WorkExperience = {
  organization: "",
  title: "",
  location: "",
  logo_url: null,
  start_date: { month: 1, year: new Date().getFullYear() },
  end_date: { month: 12, year: new Date().getFullYear() },
  is_current: false,
  highlights: "",
  technologies: [],
};

export function WorkExperienceForm({
  value,
  onChange,
}: WorkExperienceFormProps) {
  const items = value || [];
  const canAdd = useMemo(() => items.length < 10, [items.length]);

  const add = () => onChange([...(items || []), { ...emptyWE }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, next: Partial<WorkExperience>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...next } : it)));
  const updateDate = (
    idx: number,
    key: "start_date" | "end_date",
    next?: DateInfo
  ) => {
    update(idx, { [key]: next } as Partial<WorkExperience>);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Work Experience</CardTitle>
        <ActionButton
          action="add"
          label="Add experience"
          onClick={add}
          disabled={!canAdd}
        />
      </CardHeader>
      <CardContent className="grid gap-6">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No experiences added yet.
          </p>
        )}
        {items.map((exp, idx) => (
          <div key={idx} className="grid gap-4 p-4 rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Organization</Label>
                <Input
                  value={exp.organization ?? ""}
                  onChange={(e) =>
                    update(idx, { organization: e.target.value })
                  }
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
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input
                  value={exp.location ?? ""}
                  onChange={(e) => update(idx, { location: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="grid gap-2">
                <Label>Company Logo URL</Label>
                <Input
                  value={exp.logo_url ?? ""}
                  onChange={(e) => update(idx, { logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-filled when available. Add your own URL to override the
                  suggested logo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start date</Label>
                <SimpleDateInput
                  value={exp.start_date || undefined}
                  onChange={(d) => updateDate(idx, "start_date", d)}
                />
              </div>
              <div className="grid gap-2">
                <Label>End date</Label>
                <SimpleDateInput
                  value={exp.end_date || undefined}
                  onChange={(d) => updateDate(idx, "end_date", d)}
                  disabled={!!exp.is_current}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`current-${idx}`}
                checked={!!exp.is_current}
                onCheckedChange={(checked) =>
                  update(idx, { is_current: Boolean(checked) })
                }
              />
              <Label htmlFor={`current-${idx}`}>I currently work here</Label>
            </div>

            <div className="grid gap-2">
              <Label>Highlights</Label>
              <Textarea
                rows={4}
                value={exp.highlights ?? ""}
                onChange={(e) => update(idx, { highlights: e.target.value })}
                placeholder="- Led development of key features&#10;- Improved performance by 40%&#10;- Mentored junior developers"
              />
              <p className="text-xs text-muted-foreground">
                Supports markdown formatting (e.g., - Bullet points, **bold**,
                *italic*)
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Technologies & Tags</Label>
              <TagInput
                value={exp.technologies || []}
                onChange={(tags) => update(idx, { technologies: tags })}
                placeholder="Type technology or tags, then press Enter or comma"
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
      </CardContent>
    </Card>
  );
}
