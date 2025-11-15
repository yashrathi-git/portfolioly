"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { validateImageFile } from "@/lib/utils/imageValidation";
import { optimizeImage } from "@/lib/utils/imageOptimization";
import { parseError } from "@/lib/utils/errorHandling";
import {
  uploadProjectImages as uploadProjectImagesApi,
  deleteProjectImage as deleteProjectImageApi,
} from "@/lib/api/portfolio";
import { Upload, Trash2, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export interface ProjectCardImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

export function ProjectCardImageUpload({
  value,
  onChange,
}: ProjectCardImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!navigator.onLine) {
        toast.error("You are offline", {
          description: "Please check your internet connection and try again.",
        });
        return;
      }

      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error("Invalid image file", {
          description: validation.error || "Please select a valid image file.",
        });
        return;
      }

      setUploading(true);
      setProgress(10);

      try {
        setProgress(30);
        const optimizedFile = await optimizeImage(file);
        setProgress(50);

        const [imageUrl] = await uploadProjectImagesApi([optimizedFile]);
        setProgress(90);

        if (!imageUrl) {
          throw new Error("No image URL returned from server");
        }

        onChange(imageUrl);
        setProgress(100);
        toast.success("Card image uploaded");
      } catch (err) {
        console.error("Upload error:", err);
        const structuredError = parseError(err);
        toast.error("Failed to upload image", {
          description: structuredError.userMessage,
        });
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  }, [uploading]);

  const handleDelete = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error("You are offline", {
        description: "Please check your internet connection and try again.",
      });
      return;
    }

    if (!value || uploading) return;

    setUploading(true);
    try {
      await deleteProjectImageApi(value);
      onChange(null);
      toast.success("Card image removed");
    } catch (err) {
      console.error("Delete error:", err);
      const structuredError = parseError(err);
      toast.error("Failed to remove image", {
        description: structuredError.userMessage,
      });
    } finally {
      setUploading(false);
    }
  }, [value, onChange, uploading]);

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload button or uploading state */}
      {!value && (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleClick}
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Upload Card Image
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            GIF animations preserved
          </p>
        </div>
      )}

      {/* Uploaded image preview */}
      {value && (
        <div className="border rounded-lg p-3">
          <div className="flex items-start gap-3">
            <div className="relative w-32 h-24 rounded overflow-hidden bg-secondary group flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Card image"
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              {!uploading && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleClick}
                    className="text-white hover:bg-white/20 hover:scale-110 transition-transform h-8 w-8"
                    title="Replace image"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleDelete}
                    className="text-white hover:bg-white/20 hover:scale-110 transition-transform h-8 w-8"
                    title="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Card Image</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hover over image to replace or remove
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
