"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TextBlobs } from "@/types/portfolio";

export interface TextBlobsFormProps {
  value: TextBlobs | undefined;
  onChange: (next: TextBlobs) => void;
}

export function TextBlobsForm({ value, onChange }: TextBlobsFormProps) {
  const v = value || {};
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Free-form Context</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="achievements">Achievements / Awards</Label>
          <Textarea
            id="achievements"
            rows={5}
            value={v.achievements ?? ""}
            onChange={(e) => onChange({ ...v, achievements: e.target.value })}
            placeholder={"Recipient of XYZ award...\nTop speaker at JSConf..."}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="additional_context">
            Additional context or prompts
          </Label>
          <Textarea
            id="additional_context"
            rows={6}
            value={v.additional_context ?? ""}
            onChange={(e) =>
              onChange({ ...v, additional_context: e.target.value })
            }
            placeholder={
              "Anything you'd like the AI to consider when building your portfolio..."
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default TextBlobsForm;
