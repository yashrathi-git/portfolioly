"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "portfolioly-schema";
import { TagInput } from "./TagInput";
import { ProjectImageUpload } from "./ProjectImageUpload";
import { ProjectCardImageUpload } from "./ProjectCardImageUpload";
import { ActionButton } from "./ActionButton";
import { FormSection } from "./FormSection";

export interface ProjectsFormProps {
  value: Project[];
  onChange: (next: Project[]) => void;
}

const emptyProject: Project = {
  name: "",
  highlights: "",
  technologies: [],
  github: "",
  live_link: "",
  demo_video: "",
  more_context: "",
  images: [],
};

export function ProjectsForm({ value, onChange }: ProjectsFormProps) {
  const items = value || [];
  const add = () => onChange([...(items || []), { ...emptyProject }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, next: Partial<Project>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...next } : it)));

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
        {items.map((p, idx) => (
          <div key={idx} className="grid gap-4 p-4 rounded-md border">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={p.name ?? ""}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="Portfolio Website"
              />
            </div>

            {/* Highlights: long text, its own row */}
            <div className="grid gap-2">
              <Label>Highlights</Label>
              <Textarea
                rows={5}
                value={p.highlights ?? ""}
                onChange={(e) => update(idx, { highlights: e.target.value })}
                placeholder="- Built responsive UI with React and TypeScript&#10;- Implemented real-time features&#10;- Deployed to production with 99.9% uptime"
              />
              <p className="text-xs text-muted-foreground">
                Supports markdown formatting (e.g., - Bullet points, **bold**,
                *italic*)
              </p>
            </div>

            {/* Technologies & Tags: single tag input */}
            <div className="grid gap-2">
              <Label>Technologies & Tags</Label>
              <TagInput
                value={p.technologies || []}
                onChange={(tags) => update(idx, { technologies: tags })}
                placeholder="Type technology or tags, then press Enter or comma"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>GitHub</Label>
                <Input
                  value={p.github ?? ""}
                  onChange={(e) => update(idx, { github: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Live link</Label>
                <Input
                  value={p.live_link ?? ""}
                  onChange={(e) => update(idx, { live_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Demo video</Label>
              <Input
                value={p.demo_video ?? ""}
                onChange={(e) => update(idx, { demo_video: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground">
                YouTube link for project demo video
              </p>
            </div>

            {/* More context: larger textbox */}
            <div className="grid gap-2">
              <Label>Detailed Description</Label>
              <Textarea
                rows={5}
                value={p.more_context ?? ""}
                onChange={(e) => update(idx, { more_context: e.target.value })}
                placeholder="Architecture, design decisions, performance notes, collaboration, etc."
              />
              <p className="text-xs text-muted-foreground">
                This markdown-supported description will be shown when users
                click on the project card
              </p>
            </div>

            {/* Card Image */}
            <div className="grid gap-2">
              <Label>Card Image</Label>
              <ProjectCardImageUpload
                value={p.card_image_url ?? null}
                onChange={(url) => update(idx, { card_image_url: url })}
              />
              <p className="text-xs text-muted-foreground">
                This image will be shown on the project card. Supports static
                images and animated GIFs.
              </p>
            </div>

            {/* Project Images */}
            <div className="grid gap-2">
              <Label>Project images</Label>
              <ProjectImageUpload
                value={p.images || []}
                onChange={(images) => update(idx, { images })}
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
