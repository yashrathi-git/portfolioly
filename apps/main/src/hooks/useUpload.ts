/**
 * Custom hook for managing upload state and operations.
 *
 * This hook provides a centralized way to manage PDF uploads,
 * GitHub repository fetching, and related state management.
 */

import { useState, useCallback, useEffect } from "react";
import {
  uploadPDF,
  fetchGitHubRepos,
  importGitHubRepos,
  getUploadConfig,
  validateFile,
  withRetry,
  debounce,
  type PDFUploadResponse,
  type PaginatedRepoResponse,
  type GitHubRepo,
  type GitHubImportResponse,
  type UploadConfig,
} from "@/lib/api/upload";

/**
 * PDF upload state
 */
export interface PDFUploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  result: PDFUploadResponse | null;
  error: string | null;
}

/**
 * GitHub repositories state
 */
export interface GitHubReposState {
  username: string;
  loading: boolean;
  repos: GitHubRepo[];
  selectedRepoIds: number[];
  pagination: {
    page: number;
    perPage: number;
    totalCount: number;
    hasNext: boolean;
  };
  error: string | null;
}

/**
 * Upload hook return type
 */
export interface UseUploadReturn {
  // Configuration
  config: UploadConfig | null;
  configLoading: boolean;
  configError: string | null;

  // LinkedIn PDF upload
  linkedin: PDFUploadState;
  uploadLinkedInPDF: (file: File) => Promise<void>;
  clearLinkedInUpload: () => void;

  // Resume PDF upload
  resume: PDFUploadState;
  uploadResumePDF: (file: File) => Promise<void>;
  clearResumeUpload: () => void;

  // GitHub repositories
  github: GitHubReposState;
  searchGitHubRepos: (username: string) => Promise<void>;
  loadMoreRepos: () => Promise<void>;
  toggleRepoSelection: (repoId: number) => void;
  clearRepoSelection: () => void;
  importSelectedRepos: () => Promise<GitHubImportResponse>;

  // Validation
  validatePDFFile: (file: File) => string | null;

  // Reset all state
  resetAll: () => void;
}

/**
 * Initial PDF upload state
 */
const initialPDFState: PDFUploadState = {
  file: null,
  uploading: false,
  progress: 0,
  result: null,
  error: null,
};

/**
 * Initial GitHub repos state
 */
const initialGitHubState: GitHubReposState = {
  username: "",
  loading: false,
  repos: [],
  selectedRepoIds: [],
  pagination: {
    page: 1,
    perPage: 20,
    totalCount: 0,
    hasNext: false,
  },
  error: null,
};

/**
 * Custom hook for upload functionality
 */
export function useUpload(): UseUploadReturn {
  // Configuration state
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // PDF upload states
  const [linkedin, setLinkedIn] = useState<PDFUploadState>(initialPDFState);
  const [resume, setResume] = useState<PDFUploadState>(initialPDFState);

  // GitHub repos state
  const [github, setGitHub] = useState<GitHubReposState>(initialGitHubState);

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        setConfigError(null);
        const configData = await getUploadConfig();
        setConfig(configData);
      } catch (error) {
        setConfigError(
          error instanceof Error
            ? error.message
            : "Failed to load configuration"
        );
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Validate PDF file
  const validatePDFFile = useCallback(
    (file: File): string | null => {
      if (!config) {
        return "Configuration not loaded";
      }
      return validateFile(file, config);
    },
    [config]
  );

  // Upload LinkedIn PDF
  const uploadLinkedInPDF = useCallback(
    async (file: File) => {
      if (!config) {
        throw new Error("Configuration not loaded");
      }

      const validationError = validateFile(file, config);
      if (validationError) {
        setLinkedIn((prev) => ({ ...prev, error: validationError }));
        return;
      }

      setLinkedIn((prev) => ({
        ...prev,
        file,
        uploading: true,
        progress: 0,
        error: null,
        result: null,
      }));

      try {
        const result = await withRetry(() =>
          uploadPDF(file, "linkedin", (progress) => {
            setLinkedIn((prev) => ({ ...prev, progress }));
          })
        );

        setLinkedIn((prev) => ({
          ...prev,
          uploading: false,
          progress: 100,
          result,
        }));
      } catch (error) {
        setLinkedIn((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : "Upload failed",
        }));
      }
    },
    [config]
  );

  // Upload Resume PDF
  const uploadResumePDF = useCallback(
    async (file: File) => {
      if (!config) {
        throw new Error("Configuration not loaded");
      }

      const validationError = validateFile(file, config);
      if (validationError) {
        setResume((prev) => ({ ...prev, error: validationError }));
        return;
      }

      setResume((prev) => ({
        ...prev,
        file,
        uploading: true,
        progress: 0,
        error: null,
        result: null,
      }));

      try {
        const result = await withRetry(() =>
          uploadPDF(file, "resume", (progress) => {
            setResume((prev) => ({ ...prev, progress }));
          })
        );

        setResume((prev) => ({
          ...prev,
          uploading: false,
          progress: 100,
          result,
        }));
      } catch (error) {
        setResume((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : "Upload failed",
        }));
      }
    },
    [config]
  );

  // Search GitHub repositories (debounced)
  const searchGitHubRepos = useCallback(
    debounce(async (username: string) => {
      if (!username.trim()) {
        setGitHub((prev) => ({ ...prev, repos: [], error: null }));
        return;
      }

      setGitHub((prev) => ({
        ...prev,
        username,
        loading: true,
        error: null,
        repos: [],
        pagination: { ...prev.pagination, page: 1 },
      }));

      try {
        const result = await withRetry(() =>
          fetchGitHubRepos(username, 1, github.pagination.perPage)
        );

        setGitHub((prev) => ({
          ...prev,
          loading: false,
          repos: result.repos,
          pagination: {
            page: result.page,
            perPage: result.per_page,
            totalCount: result.total_count,
            hasNext: result.has_next,
          },
        }));
      } catch (error) {
        setGitHub((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch repositories",
        }));
      }
    }, 500),
    [github.pagination.perPage]
  );

  // Load more repositories
  const loadMoreRepos = useCallback(async () => {
    if (!github.username || github.loading || !github.pagination.hasNext) {
      return;
    }

    setGitHub((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const nextPage = github.pagination.page + 1;
      const result = await withRetry(() =>
        fetchGitHubRepos(github.username, nextPage, github.pagination.perPage)
      );

      setGitHub((prev) => ({
        ...prev,
        loading: false,
        repos: [...prev.repos, ...result.repos],
        pagination: {
          page: result.page,
          perPage: result.per_page,
          totalCount: result.total_count,
          hasNext: result.has_next,
        },
      }));
    } catch (error) {
      setGitHub((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load more repositories",
      }));
    }
  }, [github.username, github.loading, github.pagination]);

  // Toggle repository selection
  const toggleRepoSelection = useCallback(
    (repoId: number) => {
      setGitHub((prev) => {
        const isSelected = prev.selectedRepoIds.includes(repoId);
        const maxRepos = config?.max_github_repos || 10;

        if (isSelected) {
          // Remove from selection
          return {
            ...prev,
            selectedRepoIds: prev.selectedRepoIds.filter((id) => id !== repoId),
          };
        } else {
          // Add to selection (if under limit)
          if (prev.selectedRepoIds.length >= maxRepos) {
            return prev; // Don't add if at limit
          }
          return {
            ...prev,
            selectedRepoIds: [...prev.selectedRepoIds, repoId],
          };
        }
      });
    },
    [config?.max_github_repos]
  );

  // Clear repository selection
  const clearRepoSelection = useCallback(() => {
    setGitHub((prev) => ({ ...prev, selectedRepoIds: [] }));
  }, []);

  // Import selected repositories
  const importSelectedRepos =
    useCallback(async (): Promise<GitHubImportResponse> => {
      if (github.selectedRepoIds.length === 0) {
        throw new Error("No repositories selected");
      }

      return withRetry(() => importGitHubRepos(github.selectedRepoIds));
    }, [github.selectedRepoIds]);

  // Clear LinkedIn upload
  const clearLinkedInUpload = useCallback(() => {
    setLinkedIn(initialPDFState);
  }, []);

  // Clear resume upload
  const clearResumeUpload = useCallback(() => {
    setResume(initialPDFState);
  }, []);

  // Reset all state
  const resetAll = useCallback(() => {
    setLinkedIn(initialPDFState);
    setResume(initialPDFState);
    setGitHub(initialGitHubState);
  }, []);

  return {
    // Configuration
    config,
    configLoading,
    configError,

    // LinkedIn PDF
    linkedin,
    uploadLinkedInPDF,
    clearLinkedInUpload,

    // Resume PDF
    resume,
    uploadResumePDF,
    clearResumeUpload,

    // GitHub
    github,
    searchGitHubRepos,
    loadMoreRepos,
    toggleRepoSelection,
    clearRepoSelection,
    importSelectedRepos,

    // Validation
    validatePDFFile,

    // Reset
    resetAll,
  };
}
