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
  uploadProfilePhoto as uploadProfilePhotoApi,
  deleteProfilePhoto as deleteProfilePhotoApi,
} from "@/lib/api/portfolio";
import { Upload, X, User, AlertCircle, WifiOff, RefreshCw } from "lucide-react";

export interface ProfilePhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

export function ProfilePhotoUpload({
  value,
  onChange,
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [retryable, setRetryable] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
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
        setRetryable(true);
        setLastFile(file);
        return;
      }

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        setRetryable(false);
        return;
      }

      // Store file for potential retry
      setLastFile(file);

      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setError(null);
      setRetryable(false);
      setUploading(true);
      setProgress(10);

      try {
        // Optimize image on client side
        setProgress(30);
        const optimizedFile = await optimizeImage(file);
        setProgress(50);

        setProgress(70);

        const photoUrl = await uploadProfilePhotoApi(optimizedFile);

        setProgress(100);

        // Update parent component
        onChange(photoUrl);
        setPreview(photoUrl);

        // Reset retry state on success
        setLastFile(null);
      } catch (err) {
        console.error("Upload error:", err);

        // Parse error for better handling
        const structuredError = parseError(err);
        setError(structuredError.userMessage);
        setRetryable(isRetryableError(err));

        // Revert preview on error
        setPreview(value || null);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [value, onChange]
  );

  const handleDelete = useCallback(async () => {
    // Check online status first
    if (!navigator.onLine) {
      setError("You are offline. Please check your internet connection.");
      setRetryable(true);
      return;
    }

    setUploading(true);
    setError(null);
    setRetryable(false);

    try {
      await deleteProfilePhotoApi();

      // Update parent component and preview
      onChange(null);
      setPreview(null);
    } catch (err) {
      console.error("Delete error:", err);

      // Parse error for better handling
      const structuredError = parseError(err);
      setError(structuredError.userMessage);
      setRetryable(isRetryableError(err));
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleRetry = useCallback(() => {
    if (lastFile) {
      handleFileSelect(lastFile);
    }
  }, [lastFile, handleFileSelect]);

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
              {!uploading && (
                <button
                  onClick={handleDelete}
                  className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-colors"
                  title="Delete photo"
                  disabled={uploading}
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
              disabled={uploading}
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
            {preview && !uploading && (
              <Button
                type="button"
                onClick={handleDelete}
                disabled={uploading}
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

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <div className="flex items-start gap-2">
            {!isOnline ? (
              <WifiOff className="h-4 w-4 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertDescription>{error}</AlertDescription>
              {retryable && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={uploading || !isOnline}
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Upload
                </Button>
              )}
            </div>
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
    </div>
  );
}
