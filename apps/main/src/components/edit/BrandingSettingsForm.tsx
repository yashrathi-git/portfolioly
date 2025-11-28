"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Star, Sparkles, Github } from "lucide-react";
import { FormSection } from "./FormSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GITHUB_REPO_URL } from "@/lib/utils/links";
import type { LayoutSettings } from "portfolioly-schema";
import posthog from "posthog-js";

export interface BrandingSettingsFormProps {
  value: LayoutSettings;
  onChange: (value: LayoutSettings) => void;
}

export function BrandingSettingsForm({
  value,
  onChange,
}: BrandingSettingsFormProps) {
  const [localValue, setLocalValue] = useState<LayoutSettings>(value);
  const [showBrandingDialog, setShowBrandingDialog] = useState(false);

  const handleBrandingToggle = (checked: boolean) => {
    if (!checked) {
      setShowBrandingDialog(true);
    } else {
      const newValue = {
        ...localValue,
        chat_mode_footer: true,
      };
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  const handleConfirmRemoveBranding = () => {
    posthog.capture("footer_disabled");
    const newValue = {
      ...localValue,
      chat_mode_footer: false,
    };
    setLocalValue(newValue);
    onChange(newValue);
    setShowBrandingDialog(false);
  };

  return (
    <FormSection
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Branding
        </span>
      }
      description="Manage Portfolioly branding on your portfolio"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Show Branding</Label>
          <p className="text-sm text-muted-foreground">
            Display &quot;Built with Portfolioly&quot; footer.
          </p>
        </div>
        <Switch
          checked={localValue.chat_mode_footer ?? true}
          onCheckedChange={handleBrandingToggle}
        />
      </div>

      <Dialog open={showBrandingDialog} onOpenChange={setShowBrandingDialog}>
        <DialogContent className="sm:max-w-md animate-in fade-in-0 duration-200">
          <DialogHeader>
            <DialogTitle className="text-xl">Support Portfolioly</DialogTitle>
            <DialogDescription asChild>
              <div className="pt-2 space-y-4">
                <p className="text-foreground">
                  It takes a lot of time and effort to build this app. If you
                  like using Portfolioly please consider leaving a GitHub star,
                  it helps more than you think :)
                </p>
                <Button
                  onClick={() => window.open(GITHUB_REPO_URL, "_blank")}
                  className="gap-2 bg-[#24292f] hover:bg-[#24292f]/90 text-white"
                >
                  <Github className="h-4 w-4" />
                  Star on GitHub
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleConfirmRemoveBranding}
            >
              Disable Branding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormSection>
  );
}

export default BrandingSettingsForm;
