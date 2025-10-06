/**
 * Custom hook for managing upload state and operations.
 *
 * This hook provides a centralized way to manage PDF uploads,
 * GitHub repository fetching, and related state management.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  uploadPDF,
  fetchGitHubRepos,
  submitUploadData,
  getUploadConfig,
  validateFile,
  withRetry,
  debounce,
  type PDFUploadResponse,
  type GitHubRepo,
  type UploadSubmissionRequest,
  type UploadSubmissionResponse,
  type UploadConfig,
} from "@/lib/api/upload";
import {
  handleError,
  handleValidationError,
} from "@/lib/utils/simpleErrorHandler";

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

  // Submission
  submitAllData: () => Promise<UploadSubmissionResponse>;

  // Validation
  validatePDFFile: (file: File) => string | null;

  // Reset all state
  resetAll: () => void;
}

export interface UseUploadOptions {
  disableClientValidation?: boolean;
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
export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
  const { disableClientValidation = false } = options;
  // Configuration state
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Prevent double fetch/toast in React Strict Mode (dev) by ensuring one-time execution
  const didLoadConfigRef = useRef(false);

  // PDF upload states
  const [linkedin, setLinkedIn] = useState<PDFUploadState>(initialPDFState);
  const [resume, setResume] = useState<PDFUploadState>(initialPDFState);

  // GitHub repos state
  const [github, setGitHub] = useState<GitHubReposState>(initialGitHubState);

  // Load configuration on mount
  useEffect(() => {
    if (didLoadConfigRef.current) return;
    didLoadConfigRef.current = true;

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
      if (disableClientValidation) {
        return null;
      }
      return validateFile(file, config);
    },
    [config, disableClientValidation]
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

      if (!disableClientValidation) {
        const validationError = validateFile(file, config);
        if (validationError) {
          handleValidationError(validationError, "LinkedIn PDF validation");
          return;
        }
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
    [config, disableClientValidation]
  );

  // Upload Resume PDF
  const uploadResumePDF = useCallback(
    async (file: File) => {
      if (!config) {
        handleError(new Error("Configuration not loaded"), "Resume PDF upload");
        return;
      }

      if (!disableClientValidation) {
        const validationError = validateFile(file, config);
        if (validationError) {
          handleValidationError(validationError, "Resume PDF validation");
          return;
        }
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
    [config, disableClientValidation]
  );

  // Search GitHub repositories (debounced)
  const searchGitHubRepos = useCallback(
    async (username: string) => {
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
    },
    [github.pagination.perPage]
  );

  // Create debounced version
  const debouncedSearchGitHubRepos = useMemo(
    () =>
      debounce((username: string) => {
        void searchGitHubRepos(username);
      }, 500),
    [searchGitHubRepos]
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

  // Submit all upload data
  const submitAllData =
    useCallback(async (): Promise<UploadSubmissionResponse> => {
      // Get selected repositories with full data
      const selectedRepos = github.repos.filter((repo) =>
        github.selectedRepoIds.includes(repo.id)
      );

      const request: UploadSubmissionRequest = {
        github_repos: selectedRepos,
      };

      // Add LinkedIn PDF data if available
      if (linkedin.result) {
        request.linkedin_pdf = {
          text: linkedin.result.text,
          source: linkedin.result.meta.source,
          filename: linkedin.result.meta.filename,
          pages: linkedin.result.meta.pages,
          size: linkedin.result.meta.size,
          checksum: linkedin.result.meta.checksum,
          processed_at: linkedin.result.meta.processed_at,
        };
      }

      // Add Resume PDF data if available
      if (resume.result) {
        request.resume_pdf = {
          text: resume.result.text,
          source: resume.result.meta.source,
          filename: resume.result.meta.filename,
          pages: resume.result.meta.pages,
          size: resume.result.meta.size,
          checksum: resume.result.meta.checksum,
          processed_at: resume.result.meta.processed_at,
        };
      }

      return withRetry(() => submitUploadData(request));
    }, [linkedin.result, resume.result, github.repos, github.selectedRepoIds]);

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
    searchGitHubRepos: debouncedSearchGitHubRepos,
    loadMoreRepos,
    toggleRepoSelection,
    clearRepoSelection,

    // Submission
    submitAllData,

    // Validation
    validatePDFFile,

    // Reset
    resetAll,
  };
}
