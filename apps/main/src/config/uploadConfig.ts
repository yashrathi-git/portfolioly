/**
 * Centralized configuration for file and image uploads.
 * Values synced with backend configuration.
 */

export const UPLOAD_CONFIG = {
  // Image upload
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_PROJECT_IMAGES: 5,
  MAX_IMAGE_CAPTION_LENGTH: 100,
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ] as const,
  ALLOWED_IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const,
  IMAGE_QUALITY: 0.85,
  MAX_IMAGE_DIMENSION: 1920,

  // PDF upload
  MAX_PDF_SIZE_MB: 2,
  ALLOWED_PDF_TYPES: ["application/pdf"] as const,

  // GitHub
  MAX_GITHUB_REPOS: 10,
} as const;

export type ImageType = (typeof UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES)[number];
export type ImageExtension =
  (typeof UPLOAD_CONFIG.ALLOWED_IMAGE_EXTENSIONS)[number];
