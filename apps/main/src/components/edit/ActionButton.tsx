"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { Plus, Trash2, Pencil, Upload, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionType = "add" | "remove" | "edit" | "upload" | "save";

interface ActionButtonProps {
  action: ActionType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
}

const actionConfig: Record<
  ActionType,
  {
    icon: typeof Plus;
    defaultVariant: VariantProps<typeof buttonVariants>["variant"];
  }
> = {
  add: { icon: Plus, defaultVariant: "secondary" },
  remove: { icon: Trash2, defaultVariant: "destructive" },
  edit: { icon: Pencil, defaultVariant: "outline" },
  upload: { icon: Upload, defaultVariant: "outline" },
  save: { icon: Save, defaultVariant: "default" },
};

export function ActionButton({
  action,
  label,
  onClick,
  disabled = false,
  loading = false,
  variant,
  size,
  className,
}: ActionButtonProps) {
  const config = actionConfig[action];
  const Icon = loading ? Loader2 : config.icon;
  const buttonVariant = variant ?? config.defaultVariant;

  return (
    <>
      {/* Desktop: Icon + Text */}
      <Button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        variant={buttonVariant}
        size={size ?? "sm"}
        className={cn("hidden md:inline-flex", className)}
        title={label}
      >
        <Icon className={cn("h-4 w-4", loading && "animate-spin")} />
        {label}
      </Button>

      {/* Mobile: Icon Only */}
      <Button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        variant={buttonVariant}
        size="icon"
        className={cn("md:hidden min-h-[44px] min-w-[44px]", className)}
        title={label}
      >
        <Icon className={cn("h-4 w-4", loading && "animate-spin")} />
        <span className="sr-only">{label}</span>
      </Button>
    </>
  );
}
