"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DateInfo } from "portfolioly-schema";
import { useEffect, useState, useId } from "react";
import { Calendar, XCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export interface SimpleDateInputProps {
  value?: DateInfo | null;
  onChange: (next: DateInfo | undefined) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
}

export function SimpleDateInput({
  value,
  onChange,
  disabled,
  className,
  id,
  placeholder = "MM/YYYY",
}: SimpleDateInputProps) {
  const internalId = useId();
  const [inputValue, setInputValue] = useState("");
  const [validationState, setValidationState] = useState<
    "idle" | "valid" | "invalid"
  >("idle");
  const { showError } = useToast();

  // Sync input value with prop value
  useEffect(() => {
    if (value?.month && value?.year) {
      setInputValue(`${String(value.month).padStart(2, "0")}/${value.year}`);
      setValidationState("valid");
    } else {
      setInputValue("");
      setValidationState("idle");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Only allow digits and slash
    val = val.replace(/[^\d/]/g, "");

    // Auto-format: add slash after 2 digits
    if (val.length === 2 && !val.includes("/")) {
      val = val + "/";
    }

    // Limit to MM/YYYY format (7 characters)
    if (val.length > 7) {
      val = val.slice(0, 7);
    }

    setInputValue(val);
    setValidationState("idle");
  };

  const handleBlur = () => {
    // If empty, clear validation state
    if (!inputValue.trim()) {
      setValidationState("idle");
      onChange(undefined);
      return;
    }

    // Validate format MM/YYYY
    const match = inputValue.match(/^(\d{1,2})\/(\d{4})$/);

    if (!match) {
      setValidationState("invalid");
      showError(
        "Invalid date format",
        "Please use MM/YYYY format (e.g., 03/2024)"
      );
      onChange(undefined);
      return;
    }

    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);

    // Validate month range
    if (month < 1 || month > 12) {
      setValidationState("invalid");
      showError("Invalid month", "Month must be between 01 and 12");
      onChange(undefined);
      return;
    }

    // Validate year range (reasonable bounds)
    if (year < 1900 || year > 2100) {
      setValidationState("invalid");
      showError("Invalid year", "Year must be between 1900 and 2100");
      onChange(undefined);
      return;
    }

    // Valid date
    setValidationState("valid");
    onChange({ month, year });
  };

  // Determine border color based on validation state
  const getBorderColor = () => {
    if (validationState === "invalid") return "border-red-500";
    return "";
  };

  // Determine icon to display
  const getIcon = () => {
    if (validationState === "invalid") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Calendar className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="relative">
      <Input
        id={id || internalId}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={7}
        className={cn("font-mono pr-10", getBorderColor(), className)}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {getIcon()}
      </div>
    </div>
  );
}

export default SimpleDateInput;
