"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Certification } from "@/types/portfolio";

export interface CertificationsFormProps {
  value: Certification[];
  onChange: (next: Certification[]) => void;
}

const emptyCert: Certification = { name: "", link: "" };

export function CertificationsForm({
  value,
  onChange,
}: CertificationsFormProps) {
  const items = value || [];
  const add = () => onChange([...(items || []), { ...emptyCert }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, next: Partial<Certification>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...next } : it)));

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Certifications</CardTitle>
        <Button type="button" variant="secondary" onClick={add}>
          Add certification
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No certifications added yet.
          </p>
        )}
        {items.map((c, idx) => (
          <div key={idx} className="grid gap-4 p-4 rounded-md border">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={c.name ?? ""}
                  onChange={(e) => update(idx, { name: e.target.value })}
                  placeholder="Certification name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Link</Label>
                <Input
                  value={c.link ?? ""}
                  onChange={(e) => update(idx, { link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => remove(idx)}
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

export default CertificationsForm;
