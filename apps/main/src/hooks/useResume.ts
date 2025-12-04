/**
 * useResume Hook
 *
 * Handles resume API calls with:
 * - Loading/error states
 * - Resume data caching
 * - CRUD operations
 *
 * _Requirements: 10.1, 10.2_
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type {
  ResumeData,
  ResumeSummary,
  CreateResumeRequest,
  UpdateResumeRequest,
} from "@/types/resume";
import {
  createResume as apiCreateResume,
  getResume as apiGetResume,
  listResumes as apiListResumes,
  updateResume as apiUpdateResume,
  deleteResume as apiDeleteResume,
  duplicateResume as apiDuplicateResume,
  ResumeAPIError,
} from "@/lib/api/resume";

// ============================================================================
// Types
// ============================================================================

export interface UseResumeListResult {
  /** List of resume summaries */
  resumes: ResumeSummary[];
  /** Total count of resumes */
  total: number;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch the list */
  refetch: () => Promise<void>;
  /** Create a new resume */
  create: (data: CreateResumeRequest) => Promise<string>;
  /** Delete a resume */
  remove: (resumeId: string) => Promise<void>;
  /** Duplicate a resume */
  duplicate: (resumeId: string, newName?: string) => Promise<string>;
}

export interface UseResumeResult {
  /** Resume data */
  resume: ResumeData | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch the resume */
  refetch: () => Promise<void>;
  /** Update the resume */
  update: (data: UpdateResumeRequest) => Promise<void>;
  /** Delete the resume */
  remove: () => Promise<void>;
  /** Duplicate the resume */
  duplicate: (newName?: string) => Promise<string>;
}

// ============================================================================
// Cache
// ============================================================================

/** Simple in-memory cache for resume data */
const resumeCache = new Map<string, { data: ResumeData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedResume(resumeId: string): ResumeData | null {
  const cached = resumeCache.get(resumeId);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    resumeCache.delete(resumeId);
    return null;
  }

  return cached.data;
}

function setCachedResume(resumeId: string, data: ResumeData): void {
  resumeCache.set(resumeId, { data, timestamp: Date.now() });
}

function invalidateCache(resumeId?: string): void {
  if (resumeId) {
    resumeCache.delete(resumeId);
  } else {
    resumeCache.clear();
  }
}

// ============================================================================
// Error Handling
// ============================================================================

function getErrorMessage(err: unknown): string {
  if (err instanceof ResumeAPIError) {
    if (err.status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    if (err.status === 404) {
      return "Resume not found.";
    }
    if (err.status === 500 || err.status === 503) {
      return "Server error. Please try again later.";
    }
    return err.message;
  }

  if (err instanceof Error) {
    if (err.message.includes("fetch") || err.message.includes("network")) {
      return "Unable to connect. Please check your internet connection.";
    }
    return err.message;
  }

  return "An unexpected error occurred.";
}

// ============================================================================
// useResumeList Hook
// ============================================================================

/**
 * Hook for managing the list of user's resumes
 */
export function useResumeList(): UseResumeListResult {
  const { user, loading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!user) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiListResumes();
      setResumes(result.resumes);
      setTotal(result.total);
    } catch (err) {
      console.error("Error fetching resume list:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch on mount and when user changes
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      fetchList();
    } else {
      setResumes([]);
      setTotal(0);
      setError(null);
      setIsLoading(false);
    }
  }, [user, authLoading, fetchList]);

  const create = useCallback(
    async (data: CreateResumeRequest): Promise<string> => {
      const id = await apiCreateResume(data);
      // Refetch list to include new resume
      await fetchList();
      return id;
    },
    [fetchList]
  );

  const remove = useCallback(async (resumeId: string): Promise<void> => {
    await apiDeleteResume(resumeId);
    invalidateCache(resumeId);
    // Update local state immediately
    setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    setTotal((prev) => prev - 1);
  }, []);

  const duplicate = useCallback(
    async (resumeId: string, newName?: string): Promise<string> => {
      const newId = await apiDuplicateResume(resumeId, newName);
      // Refetch list to include duplicated resume
      await fetchList();
      return newId;
    },
    [fetchList]
  );

  return {
    resumes,
    total,
    isLoading,
    error,
    refetch: fetchList,
    create,
    remove,
    duplicate,
  };
}

// ============================================================================
// useResume Hook
// ============================================================================

/**
 * Hook for managing a single resume
 * @param resumeId - The ID of the resume to manage
 */
export function useResume(resumeId: string | null): UseResumeResult {
  const { user, loading: authLoading } = useAuth();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track current resumeId to handle race conditions
  const currentResumeIdRef = useRef(resumeId);
  currentResumeIdRef.current = resumeId;

  const fetchResume = useCallback(async () => {
    if (!user || !resumeId) {
      setResume(null);
      setIsLoading(false);
      if (!user) setError("User not authenticated");
      return;
    }

    // Check cache first
    const cached = getCachedResume(resumeId);
    if (cached) {
      setResume(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGetResume(resumeId);

      // Only update state if this is still the current resume
      if (currentResumeIdRef.current === resumeId) {
        setResume(data);
        setCachedResume(resumeId, data);
      }
    } catch (err) {
      console.error("Error fetching resume:", err);
      if (currentResumeIdRef.current === resumeId) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (currentResumeIdRef.current === resumeId) {
        setIsLoading(false);
      }
    }
  }, [user, resumeId]);

  // Fetch on mount and when resumeId changes
  useEffect(() => {
    if (authLoading) return;

    if (user && resumeId) {
      fetchResume();
    } else {
      setResume(null);
      setError(resumeId ? null : "No resume ID provided");
      setIsLoading(false);
    }
  }, [user, authLoading, resumeId, fetchResume]);

  const update = useCallback(
    async (data: UpdateResumeRequest): Promise<void> => {
      if (!resumeId) throw new Error("No resume ID");

      await apiUpdateResume(resumeId, data);

      // Update local state and cache
      setResume((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          ...data,
          updated_at: new Date().toISOString(),
        } as ResumeData;
        setCachedResume(resumeId, updated);
        return updated;
      });
    },
    [resumeId]
  );

  const remove = useCallback(async (): Promise<void> => {
    if (!resumeId) throw new Error("No resume ID");

    await apiDeleteResume(resumeId);
    invalidateCache(resumeId);
    setResume(null);
  }, [resumeId]);

  const duplicate = useCallback(
    async (newName?: string): Promise<string> => {
      if (!resumeId) throw new Error("No resume ID");

      const newId = await apiDuplicateResume(resumeId, newName);
      return newId;
    },
    [resumeId]
  );

  return {
    resume,
    isLoading,
    error,
    refetch: fetchResume,
    update,
    remove,
    duplicate,
  };
}

export default useResume;
