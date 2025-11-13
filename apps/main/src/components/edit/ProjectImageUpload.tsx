"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  validateImageFile,
  validateImageCaption,
} from "@/lib/utils/imageValidation";
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
  GripVertical,
  AlertCircle,
  ImageIcon,
  WifiOff,
  RefreshCw,
} from "lucide-react";

export interface ProjectImage {
  url: string;
  caption?: string;
  order: number;
}

export interface ProjectImageUploadProps {
  value?: ProjectImage[];
  onChange: (images: ProjectImage[]) => void;
}

interface ImageUploadState {
  file: File;
  preview: string;
  progress: number;
  error?: string;
  uploading: boolean;
  retryable?: boolean;
}

export function ProjectImageUpload({
  value = [],
  onChange,
}: ProjectImageUploadProps) {
  const [uploadingImages, setUploadingImages] = useState<
    Map<string, ImageUploadState>
  >(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestImagesRef = useRef<ProjectImage[]>(value);

  useEffect(() => {
    latestImagesRef.current = value;
  }, [value]);

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

  const uploadImage = useCallback(
    async (file: File, fileId: string, previewUrl: string) => {
      try {
        // Check online status
        if (!navigator.onLine) {
          throw new Error(
            "You are offline. Please check your internet connection."
          );
        }

        // Update progress
        setUploadingImages((prev) => {
          const next = new Map(prev);
          const state = next.get(fileId);
          if (state) {
            next.set(fileId, { ...state, progress: 10 });
          }
          return next;
        });

        // Optimize image on client side
        const optimizedFile = await optimizeImage(file);

        setUploadingImages((prev) => {
          const next = new Map(prev);
          const state = next.get(fileId);
          if (state) {
            next.set(fileId, { ...state, progress: 40 });
          }
          return next;
        });

        // Upload to backend
        const [imageUrl] = await uploadProjectImagesApi([optimizedFile]);

        setUploadingImages((prev) => {
          const next = new Map(prev);
          const state = next.get(fileId);
          if (state) {
            next.set(fileId, { ...state, progress: 90 });
          }
          return next;
        });

        if (!imageUrl) {
          throw new Error("No image URL returned from server");
        }

        // Add to value with next order
        const newImage: ProjectImage = {
          url: imageUrl,
          caption: "",
          order: latestImagesRef.current.length,
        };

        const updatedImages = [...latestImagesRef.current, newImage].map(
          (img, index) => ({ ...img, order: index })
        );
        onChange(updatedImages);

        // Remove from uploading state
        setUploadingImages((prev) => {
          const next = new Map(prev);
          next.delete(fileId);
          return next;
        });

        // Clean up preview URL
        URL.revokeObjectURL(previewUrl);
      } catch (err) {
        console.error("Upload error:", err);

        // Parse error for better handling
        const structuredError = parseError(err);
        const retryable = isRetryableError(err);

        // Update error state
        setUploadingImages((prev) => {
          const next = new Map(prev);
          const state = next.get(fileId);
          if (state) {
            next.set(fileId, {
              ...state,
              error: structuredError.userMessage,
              uploading: false,
              retryable,
            });
          }
          return next;
        });
      }
    },
    [onChange]
  );

  const handleFilesSelect = useCallback(
    async (files: FileList | File[]) => {
      // Check online status first
      if (!navigator.onLine) {
        setError("You are offline. Please check your internet connection.");
        return;
      }

      const fileArray = Array.from(files);
      if (fileArray.length === 0) {
        return;
      }

      const maxImages = UPLOAD_CONFIG.MAX_PROJECT_IMAGES;
      const currentImages = latestImagesRef.current;
      const overflow = currentImages.length + fileArray.length - maxImages;

      if (overflow > 0) {
        const imagesToRemove = currentImages.slice(0, overflow);

        try {
          await Promise.all(
            imagesToRemove.map((image) => deleteProjectImageApi(image.url))
          );
        } catch (err) {
          const structuredError = parseError(err);
          setError(structuredError.userMessage);
          return;
        }

        const remainingImages = currentImages
          .slice(overflow)
          .map((img, index) => ({ ...img, order: index }));

        latestImagesRef.current = remainingImages;
        onChange(remainingImages);
      }

      setError(null);

      // Process each file
      for (const file of fileArray) {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setError(validation.error || "Invalid file");
          continue;
        }

        const fileId = `${Date.now()}-${Math.random()}`;
        const previewUrl = URL.createObjectURL(file);

        // Add to uploading state
        setUploadingImages((prev) => {
          const next = new Map(prev);
          next.set(fileId, {
            file,
            preview: previewUrl,
            progress: 0,
            uploading: true,
          });
          return next;
        });

        // Start upload
        uploadImage(file, fileId, previewUrl);
      }
    },
    [onChange, uploadImage]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFilesSelect(files);
      }
      // Reset input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFilesSelect]
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
        handleFilesSelect(files);
      }
    },
    [handleFilesSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCaptionChange = useCallback(
    (index: number, caption: string) => {
      // Validate caption length
      const validation = validateImageCaption(caption);
      if (!validation.valid) {
        // Truncate to max length
        caption = caption.slice(0, UPLOAD_CONFIG.MAX_IMAGE_CAPTION_LENGTH);
      }

      const updatedImages = [...value];
      updatedImages[index] = { ...updatedImages[index], caption };
      onChange(updatedImages);
    },
    [value, onChange]
  );

  const handleDelete = useCallback(
    async (index: number) => {
      // Check online status first
      if (!navigator.onLine) {
        setError("You are offline. Please check your internet connection.");
        return;
      }

      const imageToDelete = value[index];

      try {
        await deleteProjectImageApi(imageToDelete.url);

        // Remove from value and reorder
        const updatedImages = value
          .filter((_, i) => i !== index)
          .map((img, i) => ({ ...img, order: i }));

        onChange(updatedImages);
        setError(null);
      } catch (err) {
        console.error("Delete error:", err);

        // Parse error for better handling
        const structuredError = parseError(err);
        setError(structuredError.userMessage);
      }
    },
    [value, onChange]
  );

  const handleRetryUpload = useCallback(
    (fileId: string) => {
      let retryTarget: ImageUploadState | undefined;
      setUploadingImages((prev) => {
        const existing = prev.get(fileId);
        if (!existing) {
          return prev;
        }

        retryTarget = existing;

        const next = new Map(prev);
        next.set(fileId, {
          ...existing,
          error: undefined,
          uploading: true,
          progress: 0,
        });
        return next;
      });

      if (retryTarget) {
        uploadImage(retryTarget.file, fileId, retryTarget.preview);
      }
    },
    [uploadImage]
  );

  const handleCancelUpload = useCallback((fileId: string) => {
    let previewUrl: string | undefined;
    setUploadingImages((prev) => {
      const existing = prev.get(fileId);
      if (!existing) {
        return prev;
      }

      previewUrl = existing.preview;

      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, []);

  // Drag and drop reordering
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOverImage = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();

      if (draggedIndex === null || draggedIndex === index) {
        return;
      }

      // Reorder images
      const updatedImages = [...value];
      const draggedImage = updatedImages[draggedIndex];
      updatedImages.splice(draggedIndex, 1);
      updatedImages.splice(index, 0, draggedImage);

      // Update order property
      const reorderedImages = updatedImages.map((img, i) => ({
        ...img,
        order: i,
      }));

      onChange(reorderedImages);
      setDraggedIndex(index);
    },
    [draggedIndex, value, onChange]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const canAddMore = value.length < UPLOAD_CONFIG.MAX_PROJECT_IMAGES;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
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
            multiple
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-secondary">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop images here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max {UPLOAD_CONFIG.MAX_PROJECT_IMAGES} images,{" "}
                {UPLOAD_CONFIG.MAX_IMAGE_SIZE_MB}MB each. Formats: JPEG, PNG,
                WebP, GIF
              </p>
              <p className="text-xs text-muted-foreground">
                {value.length} of {UPLOAD_CONFIG.MAX_PROJECT_IMAGES} images
                uploaded
              </p>
            </div>
            <Button
              type="button"
              onClick={handleClick}
              size="sm"
              variant="outline"
            >
              <ImageIcon className="h-4 w-4" />
              Select Images
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

      {/* Uploading Images */}
      {uploadingImages.size > 0 && (
        <div className="space-y-3">
          {Array.from(uploadingImages.entries()).map(([fileId, state]) => (
            <div key={fileId} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="size-16 rounded overflow-hidden bg-secondary flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={state.preview}
                    alt="Uploading"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {state.file.name}
                  </p>
                  {state.uploading && (
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Uploading...</span>
                        <span>{Math.round(state.progress)}%</span>
                      </div>
                      <Progress value={state.progress} className="h-1" />
                    </div>
                  )}
                  {state.error && (
                    <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{state.error}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {state.error && state.retryable && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetryUpload(fileId)}
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
                    onClick={() => handleCancelUpload(fileId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images Gallery */}
      {value.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Uploaded Images ({value.length}/{UPLOAD_CONFIG.MAX_PROJECT_IMAGES}
              )
            </p>
            <p className="text-xs text-muted-foreground">Drag to reorder</p>
          </div>
          <div className="space-y-2">
            {value.map((image, index) => (
              <div
                key={image.url}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOverImage(e, index)}
                onDragEnd={handleDragEnd}
                className={`border rounded-lg p-3 transition-all cursor-move ${
                  draggedIndex === index
                    ? "opacity-50 scale-95"
                    : "hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div className="size-20 rounded overflow-hidden bg-secondary">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.caption || `Project image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                    </div>
                    <Input
                      type="text"
                      placeholder="Add a caption (optional)"
                      value={image.caption || ""}
                      onChange={(e) =>
                        handleCaptionChange(index, e.target.value)
                      }
                      maxLength={UPLOAD_CONFIG.MAX_IMAGE_CAPTION_LENGTH}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {image.caption?.length || 0}/
                      {UPLOAD_CONFIG.MAX_IMAGE_CAPTION_LENGTH} characters
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && uploadingImages.size === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
