import { toast as sonnerToast } from "sonner";

/**
 * Consistent toast notification configuration
 */
const TOAST_CONFIG = {
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 5000,
  INFO_DURATION: 4000,
  POSITION: "bottom-right" as const,
};

/**
 * Custom hook for consistent toast notifications across the app.
 * Wraps sonner toast with predefined durations and positioning.
 */
export function useToast() {
  const showSuccess = (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: TOAST_CONFIG.SUCCESS_DURATION,
      position: TOAST_CONFIG.POSITION,
    });
  };

  const showError = (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: TOAST_CONFIG.ERROR_DURATION,
      position: TOAST_CONFIG.POSITION,
    });
  };

  const showInfo = (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: TOAST_CONFIG.INFO_DURATION,
      position: TOAST_CONFIG.POSITION,
    });
  };

  const showWarning = (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: TOAST_CONFIG.INFO_DURATION,
      position: TOAST_CONFIG.POSITION,
    });
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
