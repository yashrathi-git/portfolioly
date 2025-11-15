"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UPLOAD_CONFIG } from "@/config/uploadConfig";
import {
  uploadProfilePhoto as uploadProfilePhotoApi,
  deleteProfilePhoto as deleteProfilePhotoApi,
} from "@/lib/api/portfolio";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useToast } from "@/hooks/useToast";
import { Upload, X, User } from "lucide-react";

export interface ProfilePhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

export function ProfilePhotoUpload({
  value,
  onChange,
}: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  const { uploading, progress, uploadImage } = useImageUpload({
    onSuccess: (url) => {
      onChange(url);
      setPreview(url);
    },
    onError: () => {
      setPreview(value || null);
    },
  });

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Upload using the hook
      await uploadImage(file, uploadProfilePhotoApi);

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
    },
    [uploadImage]
  );

  const handleDelete = useCallback(async () => {
    if (!navigator.onLine) {
      showError(
        "Connection required",
        "You are offline. Please check your internet connection."
      );
      return;
    }

    setDeleting(true);

    try {
      await deleteProfilePhotoApi();
      onChange(null);
      setPreview(null);
      showSuccess("Profile photo removed");
    } catch (err) {
      console.error("Delete error:", err);
      showError("Failed to remove photo", "Please try again.");
    } finally {
      setDeleting(false);
    }
  }, [onChange, showSuccess, showError]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        {/* Avatar preview */}
        <div
          className="relative size-24 rounded-full overflow-hidden bg-secondary border-2 border-border flex-shrink-0"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              {!uploading && !deleting && (
                <button
                  onClick={handleDelete}
                  className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-colors"
                  title="Delete photo"
                  disabled={uploading || deleting}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <User className="h-10 w-10" />
            </div>
          )}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center border-2 border-primary border-dashed rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>

        {/* Upload controls */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_CONFIG.ALLOWED_IMAGE_EXTENSIONS.join(",")}
            onChange={handleInputChange}
            className="hidden"
            disabled={uploading}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleClick}
              disabled={uploading || deleting}
              variant={preview ? "outline" : "default"}
              size="sm"
            >
              {uploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {preview ? "Replace Photo" : "Upload Photo"}
                </>
              )}
            </Button>
            {preview && !uploading && !deleting && (
              <Button
                type="button"
                onClick={handleDelete}
                disabled={uploading || deleting}
                variant="destructive"
                size="sm"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Max size: {UPLOAD_CONFIG.MAX_IMAGE_SIZE_MB}MB. Formats: JPEG, PNG,
            WebP, GIF
          </p>
          <p className="text-xs text-muted-foreground">
            Drag and drop an image or click to browse
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && progress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}
