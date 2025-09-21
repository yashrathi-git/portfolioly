"use client";

import { useCallback, useMemo, useState } from "react";
import { StepContainer } from "./StepContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Github, User, Search, Star, BookOpen } from "lucide-react";

export type Repo = {
  id: number;
  name: string;
  description: string;
  stars: number;
};

export type GithubRepoStepProps = {
  label?: string;
  description?: string;
  onBack?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  onFetched?: (repos: Repo[], username: string) => void;
  onSelectionChange?: (selectedIds: number[], repos: Repo[]) => void;
};

function makeDummyRepos(username: string, count = 12): Repo[] {
  const baseNames = [
    "awesome-project",
    "portfolio-site",
    "api-server",
    "design-system",
    "cli-tools",
    "react-widgets",
    "nextjs-app",
    "data-pipelines",
    "ml-notebooks",
    "infra-scripts",
    "ui-library",
    "testing-utils",
  ];
  return Array.from({ length: count }).map((_, i) => ({
    id: i + 1,
    name: `${username || "user"}-${baseNames[i % baseNames.length]}`,
    description: "Dummy description for demonstration purposes.",
    stars: Math.floor(Math.random() * 2000),
  }));
}

export function GithubRepoStep({
  label = "Select GitHub repositories",
  description = "Enter your GitHub username and pick up to 10 repos.",
  onBack,
  onSkip,
  onNext,
  onFetched,
  onSelectionChange,
}: GithubRepoStepProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  const selectedCount = selected.length;
  const canSelectMore = selectedCount < 10;

  const handleFetch = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const data = makeDummyRepos(username, 12);
      setRepos(data);
      onFetched?.(data, username);
      console.log("[GithubRepoStep] fetched repos for", username, data);
      setLoading(false);
    }, 900);
  }, [username, onFetched]);

  const toggleSelection = useCallback(
    (id: number) => {
      setSelected((curr) => {
        const exists = curr.includes(id);
        let next = curr;
        if (exists) {
          next = curr.filter((x) => x !== id);
        } else if (canSelectMore) {
          next = [...curr, id];
        }
        onSelectionChange?.(next, repos);
        console.log("[GithubRepoStep] selected", next);
        return next;
      });
    },
    [canSelectMore, onSelectionChange, repos]
  );

  const helperText = useMemo(() => {
    if (loading) return "Fetching repos…";
    if (!repos.length) return "No repos yet. Enter a username and click Fetch.";
    return `${selectedCount} selected • up to 10`;
  }, [loading, repos.length, selectedCount]);

  return (
    <StepContainer
      title={label}
      description={description}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
      nextLabel="Next"
      nextDisabled={false}
      loadingText={loading ? "Fetching repos…" : undefined}
    >
      <div className="space-y-4">
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
              onClick={handleFetch}
              disabled={!username || loading}
              className="w-full sm:w-auto gap-2"
            >
              <Search className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Fetching…" : "Fetch"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="font-medium">Select up to 10 repositories</div>
          <div className="text-muted-foreground">
            {selectedCount}/10 selected
          </div>
        </div>
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <Github className="h-3.5 w-3.5" />
          {helperText}
        </div>

        <ScrollArea className="h-64 rounded-md border">
          <ul className="divide-y">
            {repos.map((r) => {
              const checked = selected.includes(r.id);
              const disabled = !checked && !canSelectMore;
              return (
                <li key={r.id} className="p-3 hover:bg-muted/40">
                  <label
                    className={`flex items-start gap-3 ${
                      disabled ? "opacity-50" : ""
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleSelection(r.id)}
                      disabled={disabled}
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate inline-flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        {r.name}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {r.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        {r.stars.toLocaleString()} stars
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
            {!repos.length && !loading ? (
              <li className="p-6 text-sm text-muted-foreground text-center">
                Nothing to show.
              </li>
            ) : null}
          </ul>
        </ScrollArea>
      </div>
    </StepContainer>
  );
}

export default GithubRepoStep;
