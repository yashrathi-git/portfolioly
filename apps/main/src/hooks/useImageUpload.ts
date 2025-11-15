import { useState, useCallback, useEffect, useRef } from "react";
import { validateImageFile } from "@/lib/utils/imageValidation";
import { optimizeImage } from "@/lib/utils/imageOptimization";
import { parseError, isRetryableError } from "@/lib/utils/errorHandling";
import { useToast } from "./useToast";

export interface UseImageUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  validateFile?: boolean;
  optimizeFile?: boolean;
}

export interface UseImageUploadResult {
  uploading: boolean;
  progress: number;
  error: string | null;
  isOnline: boolean;
  retryable: boolean;
  uploadImage: (
    file: File,
    uploadFn: (file: File) => Promise<string>
  ) => Promise<void>;
  retry: () => void;
  clearError: () => void;
}

/**
 * Custom hook for handling image uploads with validation, optimization,
 * progress tracking, and error handling.
 */
export function useImageUpload(
  options: UseImageUploadOptions = {}
): UseImageUploadResult {
  const {
    onSuccess,
    onError,
    validateFile = true,
    optimizeFile = true,
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [retryable, setRetryable] = useState(false);

  const lastUploadRef = useRef<{
    file: File;
    uploadFn: (file: File) => Promise<string>;
  } | null>(null);

  const { showSuccess, showError } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      const errorMsg =
        "You are offline. Please check your internet connection.";
      setError(errorMsg);
      showError("Connection lost", errorMsg);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [showError]);

  const uploadImage = useCallback(
    async (file: File, uploadFn: (file: File) => Promise<string>) => {
      // Check online status
      if (!navigator.onLine) {
        const errorMsg =
          "You are offline. Please check your internet connection.";
        setError(errorMsg);
        setRetryable(true);
        lastUploadRef.current = { file, uploadFn };
        showError("Connection required", errorMsg);
        return;
      }

      // Validate file if enabled
      if (validateFile) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          const errorMsg = validation.error || "Invalid file";
          setError(errorMsg);
          setRetryable(false);
          showError("Invalid image", errorMsg);
          if (onError) onError(errorMsg);
          return;
        }
      }

      // Store for potential retry
      lastUploadRef.current = { file, uploadFn };

      setError(null);
      setRetryable(false);
      setUploading(true);
      setProgress(10);

      try {
        let fileToUpload = file;

        // Optimize image if enabled
        if (optimizeFile) {
          setProgress(30);
          fileToUpload = await optimizeImage(file);
          setProgress(50);
        } else {
          setProgress(40);
        }

        setProgress(70);

        // Upload the file
        const url = await uploadFn(fileToUpload);

        setProgress(100);

        // Success callback
        if (onSuccess) onSuccess(url);
        showSuccess("Image uploaded successfully");

        // Reset retry state on success
        lastUploadRef.current = null;
      } catch (err) {
        console.error("Upload error:", err);

        // Parse error for better handling
        const structuredError = parseError(err);
        const errorMsg = structuredError.userMessage;

        setError(errorMsg);
        setRetryable(isRetryableError(err));

        showError("Upload failed", errorMsg);
        if (onError) onError(errorMsg);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [validateFile, optimizeFile, onSuccess, onError, showSuccess, showError]
  );

  const retry = useCallback(() => {
    if (lastUploadRef.current && isOnline) {
      const { file, uploadFn } = lastUploadRef.current;
      uploadImage(file, uploadFn);
    }
  }, [isOnline, uploadImage]);

  const clearError = useCallback(() => {
    setError(null);
    setRetryable(false);
  }, []);

  return {
    uploading,
    progress,
    error,
    isOnline,
    retryable,
    uploadImage,
    retry,
    clearError,
  };
}
