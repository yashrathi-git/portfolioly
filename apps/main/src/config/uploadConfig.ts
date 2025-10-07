/**
 * Centralized configuration for file and image uploads.
 * These values should match the backend configuration.
 */

export const UPLOAD_CONFIG = {
  // Image upload limits
  MAX_IMAGE_SIZE_BYTES: 800 * 1024, // 800KB
  MAX_IMAGE_SIZE_MB: 0.8,
  MAX_PROJECT_IMAGES: 5, // Maximum images per project
  MAX_IMAGE_CAPTION_LENGTH: 100, // Maximum characters for image captions

  // Allowed image types
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ] as const,

  ALLOWED_IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const,

  // Image optimization settings
  IMAGE_QUALITY: 0.85, // Quality for client-side compression (not applied to GIFs)
  MAX_IMAGE_DIMENSION: 1920, // Max width/height for web optimization (not applied to GIFs)
} as const;

export type ImageType = (typeof UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES)[number];
export type ImageExtension =
  (typeof UPLOAD_CONFIG.ALLOWED_IMAGE_EXTENSIONS)[number];
