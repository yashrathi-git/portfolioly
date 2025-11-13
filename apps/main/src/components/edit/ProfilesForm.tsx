"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PersonalInfo, Profile, ProfileType } from "portfolioly-schema";

export interface ProfilesFormProps {
  value: PersonalInfo;
  onChange: (next: PersonalInfo) => void;
}

const profileTypes: { label: string; value: ProfileType }[] = [
  { label: "LinkedIn", value: "linkedin" },
  { label: "GitHub", value: "github" },
  { label: "Twitter / X", value: "twitter" },
  { label: "Personal Website", value: "website" },
  { label: "Portfolio", value: "portfolio" },
  { label: "YouTube", value: "youtube" },
  { label: "Google Scholar", value: "scholar" },
  { label: "Other", value: "other" },
];

export function ProfilesForm({ value, onChange }: ProfilesFormProps) {
  const profiles = useMemo(() => {
    const current = value?.profiles ?? [];
    return [...current].sort((a, b) => {
      const hasUrlA = Boolean(a.url);
      const hasUrlB = Boolean(b.url);
      if (hasUrlA === hasUrlB) return 0;
      return hasUrlA ? -1 : 1;
    });
  }, [value?.profiles]);

  const addProfile = () => {
    const next: Profile = { type: "linkedin", url: "", label: "" };
    onChange({ ...(value || {}), profiles: [...profiles, next] });
  };

  const updateProfile = (idx: number, next: Partial<Profile>) => {
    const updated = profiles.map((p, i) => (i === idx ? { ...p, ...next } : p));
    onChange({ ...(value || {}), profiles: updated });
  };

  const removeProfile = (idx: number) => {
    const updated = profiles.filter((_, i) => i !== idx);
    onChange({ ...(value || {}), profiles: updated });
  };

  const canAdd = useMemo(() => profiles.length < 10, [profiles.length]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Profiles & Social Links</CardTitle>
        <Button
          type="button"
          onClick={addProfile}
          variant="secondary"
          disabled={!canAdd}
        >
          Add profile
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6">
        {profiles.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No profiles added yet.
          </p>
        )}
        {profiles.map((p, idx) => (
          <div key={idx} className="grid gap-4 p-4 rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={(p.type as string) || "linkedin"}
                  onValueChange={(v) =>
                    updateProfile(idx, { type: v as ProfileType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {profileTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label>URL</Label>
                <Input
                  value={p.url ?? ""}
                  onChange={(e) => updateProfile(idx, { url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {p.type === "other" && (
              <div className="grid gap-2 md:max-w-md">
                <Label>Label</Label>
                <Input
                  value={p.label ?? ""}
                  onChange={(e) =>
                    updateProfile(idx, { label: e.target.value })
                  }
                  placeholder="Profile label"
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeProfile(idx)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
