"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { validateImageFile } from "@/lib/utils/imageValidation";
import { optimizeImage } from "@/lib/utils/imageOptimization";
import { UPLOAD_CONFIG } from "@/config/uploadConfig";
import { parseError, isRetryableError } from "@/lib/utils/errorHandling";
import {
  uploadProjectImages as uploadProjectImagesApi,
  deleteProjectImage as deleteProjectImageApi,
} from "@/lib/api/portfolio";
import {
  Upload,
  X,
  AlertCircle,
  ImageIcon,
  WifiOff,
  RefreshCw,
} from "lucide-react";

export interface ProjectCardImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

interface ImageUploadState {
  file: File;
  preview: string;
  progress: number;
  error?: string;
  uploading: boolean;
  retryable?: boolean;
}

export function ProjectCardImageUpload({
  value,
  onChange,
}: ProjectCardImageUploadProps) {
  const [uploadingImage, setUploadingImage] = useState<ImageUploadState | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setError("You are offline. Please check your internet connection.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Check online status first
      if (!navigator.onLine) {
        setError("You are offline. Please check your internet connection.");
        return;
      }

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        return;
      }

      setError(null);

      const previewUrl = URL.createObjectURL(file);

      // Set uploading state
      setUploadingImage({
        file,
        preview: previewUrl,
        progress: 0,
        uploading: true,
      });

      // Start upload
      uploadImage(file, previewUrl);
    },
    [onChange]
  );

  const uploadImage = async (file: File, previewUrl: string) => {
    try {
      // Check online status
      if (!navigator.onLine) {
        throw new Error(
          "You are offline. Please check your internet connection."
        );
      }

      // Update progress
      setUploadingImage((prev) => (prev ? { ...prev, progress: 10 } : null));

      // Optimize image on client side (GIFs are not compressed)
      const optimizedFile = await optimizeImage(file);

      setUploadingImage((prev) => (prev ? { ...prev, progress: 40 } : null));

      // Upload to backend
      const [imageUrl] = await uploadProjectImagesApi([optimizedFile]);

      setUploadingImage((prev) => (prev ? { ...prev, progress: 90 } : null));

      if (!imageUrl) {
        throw new Error("No image URL returned from server");
      }

      // Update value with the new URL
      onChange(imageUrl);

      // Clear uploading state
      setUploadingImage(null);

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      console.error("Upload error:", err);

      // Parse error for better handling
      const structuredError = parseError(err);
      const retryable = isRetryableError(err);

      // Update error state
      setUploadingImage((prev) =>
        prev
          ? {
              ...prev,
              error: structuredError.userMessage,
              uploading: false,
              retryable,
            }
          : null
      );
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
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

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDelete = useCallback(async () => {
    // Check online status first
    if (!navigator.onLine) {
      setError("You are offline. Please check your internet connection.");
      return;
    }

    if (!value) return;

    try {
      await deleteProjectImageApi(value);
      onChange(null);
      setError(null);
    } catch (err) {
      console.error("Delete error:", err);

      // Parse error for better handling
      const structuredError = parseError(err);
      setError(structuredError.userMessage);
    }
  }, [value, onChange]);

  const handleRetryUpload = useCallback(() => {
    if (uploadingImage) {
      // Reset error and retry
      setUploadingImage({
        ...uploadingImage,
        error: undefined,
        uploading: true,
        progress: 0,
      });
      uploadImage(uploadingImage.file, uploadingImage.preview);
    }
  }, [uploadingImage]);

  const handleCancelUpload = useCallback(() => {
    if (uploadingImage) {
      URL.revokeObjectURL(uploadingImage.preview);
    }
    setUploadingImage(null);
  }, [uploadingImage]);

  const hasImage = !!value;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!hasImage && !uploadingImage && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_CONFIG.ALLOWED_IMAGE_EXTENSIONS.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-secondary">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop an image here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max {UPLOAD_CONFIG.MAX_IMAGE_SIZE_MB}MB. Formats: JPEG, PNG,
                WebP, GIF
              </p>
              <p className="text-xs text-muted-foreground">
                GIF animations are preserved
              </p>
            </div>
            <Button
              type="button"
              onClick={handleClick}
              size="sm"
              variant="outline"
            >
              <ImageIcon className="h-4 w-4" />
              Select Image
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <div className="flex items-start gap-2">
            {!isOnline ? (
              <WifiOff className="h-4 w-4 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5" />
            )}
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Offline Warning */}
      {!isOnline && !error && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You are currently offline. Upload functionality will be available
            when you reconnect.
          </AlertDescription>
        </Alert>
      )}

      {/* Uploading Image */}
      {uploadingImage && (
        <div className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-3">
            <div className="size-16 rounded overflow-hidden bg-secondary flex-shrink-0">
              <img
                src={uploadingImage.preview}
                alt="Uploading"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {uploadingImage.file.name}
              </p>
              {uploadingImage.uploading && (
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadingImage.progress)}%</span>
                  </div>
                  <Progress value={uploadingImage.progress} className="h-1" />
                </div>
              )}
              {uploadingImage.error && (
                <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{uploadingImage.error}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {uploadingImage.error && uploadingImage.retryable && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRetryUpload}
                  disabled={!isOnline}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCancelUpload}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Image Preview */}
      {hasImage && !uploadingImage && (
        <div className="border rounded-lg p-3">
          <div className="flex items-start gap-3">
            <div className="size-20 rounded overflow-hidden bg-secondary flex-shrink-0">
              <img
                src={value}
                alt="Card image"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Card Image</p>
              <p className="text-xs text-muted-foreground mt-1">
                This image will be displayed on the project card
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasImage && !uploadingImage && (
        <div className="text-center py-4 text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No card image uploaded yet</p>
        </div>
      )}
    </div>
  );
}
