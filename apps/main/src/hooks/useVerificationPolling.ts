"use client";
import { useEffect, useRef, useState } from "react";
import { User } from "firebase/auth";

export type UseVerificationPollingReturn = {
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  verificationDetected: boolean;
  pollingError: string | null;
};

export function useVerificationPolling(
  user: User | null,
  onVerificationDetected: () => void | Promise<void>
): UseVerificationPollingReturn {
  const [isPolling, setIsPolling] = useState(false);
  const [verificationDetected, setVerificationDetected] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const isCheckingRef = useRef(false);
  const pollCountRef = useRef(0);
  const maxPollsRef = useRef(200); // ~10 minutes max

  const checkVerificationStatus = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      if (isCheckingRef.current) {
        return false;
      }
      isCheckingRef.current = true;
      // Reload user to get fresh verification status
      await user.reload();
      return user.emailVerified;
    } catch (error) {
      console.error("Error checking verification status:", error);
      setPollingError(
        "Connection issue. Verification status will be checked again shortly."
      );
      return false;
    } finally {
      isCheckingRef.current = false;
    }
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    isPollingRef.current = false;
    pollCountRef.current = 0;
    setPollingError(null);
  };

  const startPolling = () => {
    if (isPollingRef.current || isPolling || !user) return;

    setIsPolling(true);
    isPollingRef.current = true;
    setPollingError(null);
    pollCountRef.current = 0;

    const poll = async () => {
      try {
        const isVerified = await checkVerificationStatus();

        if (isVerified) {
          setVerificationDetected(true);
          stopPolling();
          await onVerificationDetected();
          return;
        }

        pollCountRef.current++;
        if (pollCountRef.current >= maxPollsRef.current) {
          stopPolling();
          return;
        }

        // Progressive polling intervals with exponential backoff
        let interval = 3000; // Start with 3 seconds
        if (pollCountRef.current > 40) {
          interval = 10000; // 10 seconds after ~2 minutes
        } else if (pollCountRef.current > 24) {
          interval = 5000; // 5 seconds after ~1.2 minutes
        }

        // Add exponential backoff on errors
        if (pollingError) {
          interval = Math.min(interval * 2, 30000); // Max 30 seconds
        }

        pollingIntervalRef.current = setTimeout(poll, interval);
      } catch (error) {
        console.error("Polling error:", error);
        setPollingError(
          "Connection issue. Verification status will be checked again shortly."
        );

        // Continue polling with longer interval on errors
        const errorInterval = Math.min(
          10000 * (pollCountRef.current / 10 + 1),
          30000
        );
        pollingIntervalRef.current = setTimeout(poll, errorInterval);
      }
    };

    // Start first poll after a short delay to avoid rapid loops on re-render
    pollingIntervalRef.current = setTimeout(poll, 1000);
  };

  // Cleanup on unmount or user change
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Stop polling if user changes or becomes null
  useEffect(() => {
    if (!user && isPolling) {
      stopPolling();
    }
  }, [user, isPolling]);

  // Reset verification detected when user changes
  useEffect(() => {
    setVerificationDetected(false);
    setPollingError(null);
  }, [user]);

  return {
    isPolling,
    startPolling,
    stopPolling,
    verificationDetected,
    pollingError,
  };
}
