"use client";

import { useState } from "react";
import { TagInput as EmblorTagInput, Tag } from "emblor";
import { toast } from "sonner";

export interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add a tag",
  className,
}: TagInputProps) {
  // Convert string[] to Tag[] format
  const tags: Tag[] = value.map((text, index) => ({
    id: `${text}-${index}`,
    text,
  }));

  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  const handleSetTags = (newTags: React.SetStateAction<Tag[]>) => {
    const resolvedTags =
      typeof newTags === "function" ? newTags(tags) : newTags;

    // Check for duplicates and show toast
    const textValues = resolvedTags.map((tag) => tag.text);
    const seen = new Set<string>();

    for (const text of textValues) {
      if (seen.has(text)) {
        toast.error(`"${text}" is already added.`);
        return;
      }
      seen.add(text);
    }

    onChange(textValues);
  };

  return (
    <EmblorTagInput
      tags={tags}
      setTags={handleSetTags}
      placeholder={placeholder}
      styleClasses={{
        input: className || "w-full",
        inlineTagsContainer:
          "border-input dark:bg-input/30 flex min-h-9 w-full rounded-md border bg-transparent px-3 py-1 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        tag: {
          body: "bg-secondary text-secondary-foreground border-secondary/50 hover:bg-secondary/80",
        },
      }}
      activeTagIndex={activeTagIndex}
      setActiveTagIndex={setActiveTagIndex}
      shape="pill"
    />
  );
}

export default TagInput;
