/**
 * Image validation utilities for client-side file upload validation.
 */

import { UPLOAD_CONFIG } from "@/config/uploadConfig";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an image file before upload.
 * Checks file type and size constraints.
 *
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(file: File): ValidationResult {
  // Check file type
  if (!UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: "Invalid image type. Please upload JPEG, PNG, WebP, or GIF.",
    };
  }

  // Check file size
  if (file.size > UPLOAD_CONFIG.MAX_IMAGE_SIZE_BYTES) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Image size must be under ${UPLOAD_CONFIG.MAX_IMAGE_SIZE_MB}MB (current: ${fileSizeMB}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Validate multiple image files.
 * Checks individual file validity and total count.
 *
 * @param files - Array of files to validate
 * @returns Validation result with error message if invalid
 */
export function validateImageFiles(files: File[]): ValidationResult {
  // Check count
  if (files.length > UPLOAD_CONFIG.MAX_PROJECT_IMAGES) {
    return {
      valid: false,
      error: `Maximum ${UPLOAD_CONFIG.MAX_PROJECT_IMAGES} images allowed per project`,
    };
  }

  // Validate each file
  for (const file of files) {
    const result = validateImageFile(file);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Validate an image caption.
 * Checks length constraint.
 *
 * @param caption - The caption text to validate
 * @returns Validation result with error message if invalid
 */
export function validateImageCaption(caption: string): ValidationResult {
  if (caption.length > UPLOAD_CONFIG.MAX_IMAGE_CAPTION_LENGTH) {
    return {
      valid: false,
      error: `Caption must be under ${UPLOAD_CONFIG.MAX_IMAGE_CAPTION_LENGTH} characters (current: ${caption.length})`,
    };
  }

  return { valid: true };
}

/**
 * Check if a file is a GIF.
 * GIFs require special handling to preserve animation.
 *
 * @param file - The file to check
 * @returns True if the file is a GIF
 */
export function isGif(file: File): boolean {
  return file.type === "image/gif";
}

/**
 * Format file size for display.
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "800 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
