"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagInput } from "./TagInput";
import type { PersonalInfo } from "@portfolioly/schema";

export interface PersonalInfoFormProps {
  value: PersonalInfo;
  onChange: (next: PersonalInfo) => void;
}

export function PersonalInfoForm({ value, onChange }: PersonalInfoFormProps) {
  const v = value || {};
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={v.full_name ?? ""}
            onChange={(e) => onChange({ ...v, full_name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            value={v.headline ?? ""}
            onChange={(e) => onChange({ ...v, headline: e.target.value })}
            placeholder="Senior Software Engineer"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="chatfolio_headline">ChatFolio Headline</Label>
          <Input
            id="chatfolio_headline"
            value={v.chatfolio_headline ?? ""}
            onChange={(e) =>
              onChange({ ...v, chatfolio_headline: e.target.value })
            }
            placeholder="Your chat portfolio headline"
          />
          <p className="text-sm text-muted-foreground">
            This headline will be shown on the front page of your chat portfolio
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            value={v.summary ?? ""}
            onChange={(e) => onChange({ ...v, summary: e.target.value })}
            placeholder="Brief professional summary..."
            rows={4}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={v.email ?? ""}
              onChange={(e) => onChange({ ...v, email: e.target.value })}
              placeholder="john.doe@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={v.phone ?? ""}
              onChange={(e) => onChange({ ...v, phone: e.target.value })}
              placeholder="+1 555 0100"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={v.location ?? ""}
            onChange={(e) => onChange({ ...v, location: e.target.value })}
            placeholder="San Francisco, CA"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tags">Technology Tags</Label>
          <TagInput
            value={v.tags ?? []}
            onChange={(tags) => onChange({ ...v, tags })}
            placeholder="e.g., React, TypeScript, Node.js"
          />
          <p className="text-sm text-muted-foreground">
            These tags will be displayed on your chat portfolio page
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
