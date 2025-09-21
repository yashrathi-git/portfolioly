"use client";

import { useCallback, useMemo, useState } from "react";
import { StepContainer } from "./StepContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Github,
  Search,
  Star,
  BookOpen,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { GitHubReposState } from "@/hooks/useUpload";
import { type UploadConfig } from "@/lib/api/upload";
import {
  getUserErrorMessage,
  isRetryableError,
} from "@/lib/utils/errorHandling";

export type Repo = {
  id: number;
  name: string;
  description: string;
  stars: number;
};

export type GithubRepoStepProps = {
  label?: string;
  description?: string;
  githubState: GitHubReposState;
  onSearch: (username: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
  onToggleSelection: (repoId: number) => void;
  onClearSelection: () => void;
  config: UploadConfig | null;
  onBack?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
};

export function GithubRepoStep({
  label = "Select GitHub repositories",
  description = "Enter your GitHub username and pick up to 10 repos.",
  githubState,
  onSearch,
  onLoadMore,
  onToggleSelection,
  onClearSelection,
  config,
  onBack,
  onSkip,
  onNext,
}: GithubRepoStepProps) {
  const [username, setUsername] = useState("");

  const maxRepos = config?.max_github_repos || 10;
  const selectedCount = githubState.selectedRepoIds.length;
  const canSelectMore = selectedCount < maxRepos;

  const handleSearch = useCallback(async () => {
    if (!username.trim()) return;

    try {
      await onSearch(username.trim());
    } catch (error) {
      console.error("Failed to search repositories:", error);
    }
  }, [username, onSearch]);

  const handleLoadMore = useCallback(async () => {
    try {
      await onLoadMore();
    } catch (error) {
      console.error("Failed to load more repositories:", error);
    }
  }, [onLoadMore]);

  const helperText = useMemo(() => {
    if (githubState.loading && githubState.repos.length === 0)
      return "Fetching repos…";
    if (githubState.error) return "Error loading repositories";
    if (!githubState.repos.length && !githubState.username)
      return "No repos yet. Enter a username and click Fetch.";
    if (!githubState.repos.length && githubState.username)
      return "No repositories found";
    return `${selectedCount} selected • up to ${maxRepos}`;
  }, [githubState, selectedCount, maxRepos]);

  return (
    <StepContainer
      title={label}
      description={description}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
      nextLabel="Next"
      nextDisabled={false}
      loadingText={
        githubState.loading && githubState.repos.length === 0
          ? "Fetching repos…"
          : undefined
      }
    >
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleSearch}
              disabled={!username || githubState.loading}
              className="w-full sm:w-auto gap-2"
            >
              <Search
                className={`h-4 w-4 ${
                  githubState.loading ? "animate-spin" : ""
                }`}
              />
              {githubState.loading ? "Fetching…" : "Fetch"}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {githubState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{getUserErrorMessage(githubState.error)}</span>
              {isRetryableError(githubState.error) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={githubState.loading}
                >
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

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

        <ScrollArea className="h-64 rounded-md border">
          <ul className="divide-y">
            {githubState.repos.map((repo) => {
              const checked = githubState.selectedRepoIds.includes(repo.id);
              const disabled = !checked && !canSelectMore;
              return (
                <li key={repo.id} className="p-3 hover:bg-muted/40">
                  <label
                    className={`flex items-start gap-3 ${
                      disabled ? "opacity-50" : ""
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleSelection(repo.id)}
                      disabled={disabled}
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate inline-flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        {repo.name}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {repo.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        {(typeof (repo as { stars?: number }).stars === "number"
                          ? (repo as { stars: number }).stars
                          : 0
                        ).toLocaleString()}{" "}
                        stars
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
            {!githubState.repos.length && !githubState.loading ? (
              <li className="p-6 text-sm text-muted-foreground text-center">
                Nothing to show.
              </li>
            ) : null}
          </ul>
        </ScrollArea>

        {/* Clear Selection */}
        {selectedCount > 0 && (
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Clear selection
            </Button>
            <Badge variant="secondary">
              {selectedCount} repositories selected
            </Badge>
          </div>
        )}
      </div>
    </StepContainer>
  );
}

export default GithubRepoStep;
