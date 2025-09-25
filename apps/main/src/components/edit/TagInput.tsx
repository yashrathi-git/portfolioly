"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  allowDuplicates?: boolean;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Type and press Enter or comma",
  allowDuplicates = false,
  className,
}: TagInputProps) {
  const [input, setInput] = useState("");

  const commit = (raw: string) => {
    const parts = raw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    const next = [...value];
    for (const p of parts) {
      if (allowDuplicates || !next.includes(p)) next.push(p);
    }
    onChange(next);
    setInput("");
  };

  const remove = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((t, i) => (
          <Badge
            key={`${t}-${i}`}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {t}
            <button
              type="button"
              className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground"
              onClick={() => remove(i)}
              aria-label={`Remove ${t}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(input);
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text.includes(",") || text.includes("\n")) {
              e.preventDefault();
              commit(text);
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={() => commit(input)}>
          Add
        </Button>
      </div>
    </div>
  );
}

export default TagInput;
