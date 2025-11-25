"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
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
  ImageIcon,
  Loader2,
  Trash2,
  Plus,
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
  uploading: boolean;
}

export function ProjectImageUpload({
  value = [],
  onChange,
}: ProjectImageUploadProps) {
  const [uploadingImages, setUploadingImages] = useState<
    Map<string, ImageUploadState>
  >(new Map());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestImagesRef = useRef<ProjectImage[]>(value);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    latestImagesRef.current = value;
  }, [value]);

  const uploadImage = useCallback(
    async (file: File, fileId: string, previewUrl: string) => {
      try {
        if (!navigator.onLine) {
          showError(
            "You are offline",
            "Please check your internet connection and try again."
          );
          throw new Error("Offline");
        }

        const optimizedFile = await optimizeImage(file);
        const [imageUrl] = await uploadProjectImagesApi([optimizedFile]);

        if (!imageUrl) {
          throw new Error("No image URL returned from server");
        }

        const newImage: ProjectImage = {
          url: imageUrl,
          caption: "",
          order: latestImagesRef.current.length,
        };

        const updatedImages = [...latestImagesRef.current, newImage].map(
          (img, index) => ({ ...img, order: index })
        );
        onChange(updatedImages);

        setUploadingImages((prev) => {
          const next = new Map(prev);
          next.delete(fileId);
          return next;
        });

        URL.revokeObjectURL(previewUrl);
      } catch (err) {
        console.error("Upload error:", err);
        const structuredError = parseError(err);
        showError("Failed to upload image", structuredError.userMessage);

        setUploadingImages((prev) => {
          const next = new Map(prev);
          next.delete(fileId);
          return next;
        });
        URL.revokeObjectURL(previewUrl);
      }
    },
    [onChange]
  );

  const handleFilesSelect = useCallback(
    async (files: FileList | File[]) => {
      if (!navigator.onLine) {
        showError(
          "You are offline",
          "Please check your internet connection and try again."
        );
        return;
      }

      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

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
          showError("Failed to remove old images", structuredError.userMessage);
          return;
        }

        const remainingImages = currentImages
          .slice(overflow)
          .map((img, index) => ({ ...img, order: index }));
        latestImagesRef.current = remainingImages;
        onChange(remainingImages);
      }

      for (const file of fileArray) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          showError(
            "Invalid image file",
            validation.error || "Please select a valid image file."
          );
          continue;
        }

        const fileId = `${Date.now()}-${Math.random()}`;
        const previewUrl = URL.createObjectURL(file);

        setUploadingImages((prev) => {
          const next = new Map(prev);
          next.set(fileId, {
            file,
            preview: previewUrl,
            uploading: true,
          });
          return next;
        });

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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
      if (!navigator.onLine) {
        showError(
          "You are offline",
          "Please check your internet connection and try again."
        );
        return;
      }

      const imageToDelete = value[index];
      try {
        await deleteProjectImageApi(imageToDelete.url);
        const updatedImages = value
          .filter((_, i) => i !== index)
          .map((img, i) => ({ ...img, order: i }));
        onChange(updatedImages);
        showSuccess("Image removed");
      } catch (err) {
        console.error("Delete error:", err);
        const structuredError = parseError(err);
        showError("Failed to remove image", structuredError.userMessage);
      }
    },
    [value, onChange]
  );

  const handleCancelUpload = useCallback((fileId: string) => {
    setUploadingImages((prev) => {
      const existing = prev.get(fileId);
      if (existing) {
        URL.revokeObjectURL(existing.preview);
      }
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
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
      <input
        ref={fileInputRef}
        type="file"
        accept={UPLOAD_CONFIG.ALLOWED_IMAGE_EXTENSIONS.join(",")}
        onChange={handleInputChange}
        className="hidden"
        multiple
      />

      {/* Upload button section */}
      {canAddMore && (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleClick}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Images
          </Button>
          <p className="text-xs text-muted-foreground">
            {value.length}/{UPLOAD_CONFIG.MAX_PROJECT_IMAGES} images • Max{" "}
            {UPLOAD_CONFIG.MAX_IMAGE_SIZE_MB}MB each
          </p>
        </div>
      )}

      {/* Uploading images */}
      {uploadingImages.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadingImages.entries()).map(([fileId, state]) => (
            <div
              key={fileId}
              className="flex items-center gap-3 p-2 border rounded-lg bg-secondary/50"
            >
              <div className="size-12 rounded overflow-hidden bg-secondary flex-shrink-0 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.preview}
                  alt="Uploading"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Uploading...</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleCancelUpload(fileId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded images with captions */}
      {value.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Images ({value.length}/{UPLOAD_CONFIG.MAX_PROJECT_IMAGES})
          </p>
          <div className="space-y-3">
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
                    : "hover:border-primary/50 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                    <div className="relative w-32 h-24 rounded overflow-hidden bg-secondary group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.caption || `Project image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay with delete */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(index)}
                          className="text-white hover:bg-white/20 hover:scale-110 transition-transform h-8 w-8"
                          title="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Drag images to reorder • Hover over image to delete
          </p>
        </div>
      )}

      {value.length === 0 && uploadingImages.size === 0 && (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
          <p className="text-xs mt-1">
            Click &quot;Add Images&quot; to upload up to{" "}
            {UPLOAD_CONFIG.MAX_PROJECT_IMAGES} images
          </p>
        </div>
      )}
    </div>
  );
}
