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
  type GitHubRepo,
  type GitHubImportResponse,
  type UploadConfig,
} from "@/lib/api/upload";
import { handleError } from "@/lib/utils/simpleErrorHandler";

/**
 * PDF upload state
 */
export interface PDFUploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  result: PDFUploadResponse | null;
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
}

/**
 * Upload hook return type
 */
export interface UseUploadReturn {
  // Configuration
  config: UploadConfig | null;
  configLoading: boolean;

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
  searchGitHubRepos: (username: string) => void;
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
};

/**
 * Custom hook for upload functionality
 */
export function useUpload(): UseUploadReturn {
  // Configuration state
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

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
        const configData = await getUploadConfig();
        setConfig(configData);
      } catch (error) {
        handleError(error, "loading upload configuration");
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
        handleError(
          new Error("Configuration not loaded"),
          "LinkedIn PDF upload"
        );
        return;
      }

      const validationError = validateFile(file, config);
      if (validationError) {
        handleError(new Error(validationError), "LinkedIn PDF validation");
        return;
      }

      setLinkedIn((prev) => ({
        ...prev,
        file,
        uploading: true,
        progress: 0,
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
        }));
        handleError(error, "LinkedIn PDF upload");
      }
    },
    [config]
  );

  // Upload Resume PDF
  const uploadResumePDF = useCallback(
    async (file: File) => {
      if (!config) {
        handleError(new Error("Configuration not loaded"), "Resume PDF upload");
        return;
      }

      const validationError = validateFile(file, config);
      if (validationError) {
        handleError(new Error(validationError), "Resume PDF validation");
        return;
      }

      setResume((prev) => ({
        ...prev,
        file,
        uploading: true,
        progress: 0,
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
        }));
        handleError(error, "Resume PDF upload");
      }
    },
    [config]
  );

  // Search GitHub repositories (debounced)
  const searchGitHubRepos = useCallback(
    debounce(async (username: string) => {
      if (!username.trim()) {
        setGitHub((prev) => ({ ...prev, repos: [] }));
        return;
      }

      setGitHub((prev) => ({
        ...prev,
        username,
        loading: true,
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
        }));
        handleError(error, "GitHub repository search");
      }
    }, 500),
    [github.pagination.perPage]
  );

  // Load more repositories
  const loadMoreRepos = useCallback(async () => {
    if (!github.username || github.loading || !github.pagination.hasNext) {
      return;
    }

    setGitHub((prev) => ({ ...prev, loading: true }));

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
      }));
      handleError(error, "loading more repositories");
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
