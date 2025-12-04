"use client";

/**
 * GitHub Import Component for Resume Builder
 *
 * Allows users to search for GitHub repositories by username,
 * select repos, and add them to their resume as projects.
 * Repositories are sorted by stars (descending).
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Github,
  Search,
  Star,
  BookOpen,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  fetchGitHubRepos,
  withRetry,
  type GitHubRepo,
  type PaginatedRepoResponse,
} from "@/lib/api/upload";
import { ResumeTransformer } from "@/lib/resume/resumeTransformer";
import type { ResumeData, ResumeProject } from "@/types/resume";

export interface GitHubImportProps {
  /** Callback when repos are selected and confirmed */
  onImportComplete: (projects: ResumeProject[]) => void;
  /** Optional callback for errors */
  onError?: (error: Error) => void;
  /** Maximum number of repos that can be selected */
  maxRepos?: number;
  /** Existing resume to merge projects into (optional) */
  existingResume?: ResumeData;
}

interface GitHubState {
  username: string;
  loading: boolean;
  repos: GitHubRepo[];
  selectedRepoIds: number[];
  error: string | null;
  pagination: {
    page: number;
    perPage: number;
    totalCount: number;
    hasNext: boolean;
  };
}

const initialState: GitHubState = {
  username: "",
  loading: false,
  repos: [],
  selectedRepoIds: [],
  error: null,
  pagination: {
    page: 1,
    perPage: 20,
    totalCount: 0,
    hasNext: false,
  },
};

/**
 * Sorts GitHub repositories by star count in descending order.
 * Property 2: GitHub Repositories Sorted by Stars
 */
export function sortReposByStars(repos: GitHubRepo[]): GitHubRepo[] {
  return [...repos].sort((a, b) => b.stars - a.stars);
}

export function GitHubImport({
  onImportComplete,
  onError,
  maxRepos = 10,
}: GitHubImportProps) {
  const [state, setState] = useState<GitHubState>(initialState);
  const [inputUsername, setInputUsername] = useState("");

  const selectedCount = state.selectedRepoIds.length;
  const canSelectMore = selectedCount < maxRepos;

  // Sort repos by stars for display
  const sortedRepos = useMemo(
    () => sortReposByStars(state.repos),
    [state.repos]
  );

  const handleSearch = useCallback(async () => {
    const username = inputUsername.trim();
    if (!username) return;

    setState((prev) => ({
      ...prev,
      username,
      loading: true,
      repos: [],
      selectedRepoIds: [],
      error: null,
      pagination: { ...prev.pagination, page: 1 },
    }));

    try {
      const result = await withRetry(() => fetchGitHubRepos(username, 1, 20));

      setState((prev) => ({
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch repositories";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [inputUsername, onError]);

  const handleLoadMore = useCallback(async () => {
    if (!state.username || state.loading || !state.pagination.hasNext) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const nextPage = state.pagination.page + 1;
      const result = await withRetry(() =>
        fetchGitHubRepos(state.username, nextPage, state.pagination.perPage)
      );

      setState((prev) => ({
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load more repos";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [state.username, state.loading, state.pagination, onError]);

  const handleToggleSelection = useCallback(
    (repoId: number) => {
      setState((prev) => {
        const isSelected = prev.selectedRepoIds.includes(repoId);

        if (isSelected) {
          return {
            ...prev,
            selectedRepoIds: prev.selectedRepoIds.filter((id) => id !== repoId),
          };
        } else {
          if (prev.selectedRepoIds.length >= maxRepos) {
            return prev;
          }
          return {
            ...prev,
            selectedRepoIds: [...prev.selectedRepoIds, repoId],
          };
        }
      });
    },
    [maxRepos]
  );

  const handleClearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedRepoIds: [] }));
  }, []);

  const handleImport = useCallback(() => {
    // Get selected repos
    const selectedRepos = state.repos.filter((repo) =>
      state.selectedRepoIds.includes(repo.id)
    );

    if (selectedRepos.length === 0) return;

    // Transform to ResumeData projects
    const partialResume = ResumeTransformer.fromGitHub(selectedRepos);
    const projects = partialResume.projects ?? [];

    onImportComplete(projects);
  }, [state.repos, state.selectedRepoIds, onImportComplete]);

  const handleRetry = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
    handleSearch();
  }, [handleSearch]);

  const helperText = useMemo(() => {
    if (state.loading && state.repos.length === 0) return "Fetching repos…";
    if (!state.repos.length && !state.username)
      return "Enter a username and click Fetch";
    if (!state.repos.length && state.username && !state.loading)
      return "No repositories found";
    return `${selectedCount} selected • up to ${maxRepos}`;
  }, [
    state.loading,
    state.repos.length,
    state.username,
    selectedCount,
    maxRepos,
  ]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <Label
            htmlFor="gh-username"
            className="inline-flex items-center gap-2"
          >
            <Github className="h-4 w-4" />
            GitHub Username
          </Label>
          <Input
            id="gh-username"
            placeholder="e.g. octocat"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            onClick={handleSearch}
            disabled={!inputUsername.trim() || state.loading}
            className="w-full sm:w-auto gap-2"
          >
            {state.loading && state.repos.length === 0 ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {state.loading && state.repos.length === 0 ? "Fetching…" : "Fetch"}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {state.error && (
        <div className="rounded-md border p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-medium text-red-800 dark:text-red-300">
                {state.error}
              </span>
            </div>
            <Button size="sm" variant="ghost" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Selection Info */}
      {state.repos.length > 0 && (
        <>
          <div className="flex items-center justify-between text-sm">
            <div className="font-medium">
              Select up to {maxRepos} repositories
            </div>
            <div className="text-muted-foreground">
              {selectedCount}/{maxRepos} selected
            </div>
          </div>

          <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" />
            {helperText}
          </div>
        </>
      )}

      {/* Repository List */}
      {(state.repos.length > 0 || state.loading) && (
        <ScrollArea className="h-64 rounded-md border">
          <ul className="divide-y">
            {sortedRepos.map((repo) => {
              const checked = state.selectedRepoIds.includes(repo.id);
              const disabled = !checked && !canSelectMore;
              return (
                <li key={repo.id} className="p-3 hover:bg-muted/40">
                  <label
                    className={`flex items-start gap-3 cursor-pointer ${
                      disabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => handleToggleSelection(repo.id)}
                      disabled={disabled}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate inline-flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        {repo.name}
                      </div>
                      {repo.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {repo.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-500" />
                          {repo.stars.toLocaleString()}
                        </span>
                        {repo.language && (
                          <span className="text-muted-foreground">
                            {repo.language}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}

            {/* Empty State */}
            {!state.repos.length && !state.loading && state.username && (
              <li className="p-6 text-sm text-muted-foreground text-center">
                No repositories found for this user.
              </li>
            )}

            {/* Loading More */}
            {state.loading && state.repos.length > 0 && (
              <li className="p-4 text-sm text-muted-foreground text-center">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                Loading more repositories...
              </li>
            )}

            {/* Load More Button */}
            {state.pagination.hasNext && !state.loading && (
              <li className="p-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoadMore}
                  className="gap-2"
                >
                  Load more
                </Button>
              </li>
            )}
          </ul>
        </ScrollArea>
      )}

      {/* Actions */}
      {selectedCount > 0 && (
        <div className="flex justify-between items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClearSelection}>
            Clear selection
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedCount}{" "}
              {selectedCount === 1 ? "repository" : "repositories"} selected
            </Badge>
            <Button onClick={handleImport} size="sm">
              Import Selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GitHubImport;
