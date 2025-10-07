import Compressor from "compressorjs";
import { UPLOAD_CONFIG } from "@/config/uploadConfig";

/**
 * Optimize image for web use before uploading.
 * - GIFs are not optimized to preserve animation, only validated for size
 * - Other images are resized and converted to WebP format
 *
 * @param file - The image file to optimize
 * @returns Promise<File> - The optimized image file
 * @throws Error if optimization fails or GIF exceeds size limit
 */
export async function optimizeImage(file: File): Promise<File> {
  // GIFs are not optimized to preserve animation - just validate size
  if (file.type === "image/gif") {
    if (file.size > UPLOAD_CONFIG.MAX_IMAGE_SIZE_BYTES) {
      throw new Error(
        `GIF size must be under ${UPLOAD_CONFIG.MAX_IMAGE_SIZE_MB}MB`
      );
    }
    return file;
  }

  // Use compressorjs for image optimization
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: UPLOAD_CONFIG.IMAGE_QUALITY,
      maxWidth: UPLOAD_CONFIG.MAX_IMAGE_DIMENSION,
      maxHeight: UPLOAD_CONFIG.MAX_IMAGE_DIMENSION,
      mimeType: "image/webp", // Convert to WebP for better compression
      convertTypes: ["image/png", "image/jpeg"], // Convert PNG/JPEG to WebP
      strict: true, // Return original if compressed is larger
      checkOrientation: true, // Auto-rotate based on EXIF
      retainExif: false, // Remove EXIF data for privacy
      success(result) {
        // Result is a Blob, convert to File
        const optimizedFile = new File(
          [result],
          file.name.replace(/\.[^.]+$/, ".webp"),
          {
            type: "image/webp",
            lastModified: Date.now(),
          }
        );
        resolve(optimizedFile);
      },
      error(err) {
        reject(new Error(`Image optimization failed: ${err.message}`));
      },
    });
  });
}
