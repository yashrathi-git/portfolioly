"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DateInfo } from "portfolioly-schema";
import { useId } from "react";

export interface MonthYearInputProps {
  value?: DateInfo | null;
  onChange: (next: DateInfo | undefined) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

// Uses native month picker for a compact calendar-styled month/year control
export function MonthYearInput({
  value,
  onChange,
  disabled,
  className,
  id,
}: MonthYearInputProps) {
  const internalId = useId();
  const v =
    value?.year && value?.month
      ? `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(
          2,
          "0"
        )}`
      : "";

  return (
    <Input
      id={id || internalId}
      type="month"
      value={v}
      onChange={(e) => {
        const raw = e.target.value; // YYYY-MM
        if (!raw) {
          onChange(undefined);
          return;
        }
        const [y, m] = raw.split("-");
        const year = Number(y);
        const month = Number(m);
        if (Number.isFinite(year) && Number.isFinite(month)) {
          onChange({ year, month });
        }
      }}
      disabled={disabled}
      className={cn(className)}
    />
  );
}

export default MonthYearInput;
