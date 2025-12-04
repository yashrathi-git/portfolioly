"use client";

/**
 * Resume List Page
 *
 * Displays saved resumes with names and dates.
 * Handles create, duplicate, and delete actions.
 *
 * _Requirements: 10.2, 10.3, 10.4_
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import withAuth from "@/lib/auth/withAuth";
import { toast } from "sonner";
import type { ResumeSummary } from "@/types/resume";
import { listResumes, deleteResume, duplicateResume } from "@/lib/api/resume";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Plus,
  FileText,
  Copy,
  Trash2,
  Pencil,
  Calendar,
} from "lucide-react";

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateString);
}

// ============================================================================
// Resume Card Component
// ============================================================================

interface ResumeCardProps {
  resume: ResumeSummary;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function ResumeCard({
  resume,
  onEdit,
  onDuplicate,
  onDelete,
}: ResumeCardProps) {
  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex-1 cursor-pointer min-w-0"
            onClick={() => onEdit(resume.id)}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <h3 className="font-medium truncate">{resume.name}</h3>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Updated {formatRelativeTime(resume.updated_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(resume.id)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(resume.id)}
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(resume.id)}
              title="Delete"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

function ResumeListPage() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load resumes
  const loadResumeList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listResumes();
      setResumes(data.resumes);
    } catch (err) {
      setError("Failed to load resumes");
      console.error("Error loading resumes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadResumeList();
    }
  }, [user, loadResumeList]);

  // Handle create new resume
  const handleCreate = useCallback(() => {
    router.push("/resume-builder");
  }, [router]);

  // Handle edit resume
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/resume-builder?id=${id}`);
    },
    [router]
  );

  // Handle duplicate resume
  const handleDuplicate = useCallback(
    async (id: string) => {
      try {
        await duplicateResume(id);
        await loadResumeList();
        toast.success("Resume duplicated!");
      } catch (err) {
        toast.error("Failed to duplicate resume");
        console.error("Error duplicating resume:", err);
      }
    },
    [loadResumeList]
  );

  // Handle delete resume
  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await deleteResume(deleteId);
      setResumes((prev) => prev.filter((r) => r.id !== deleteId));
      toast.success("Resume deleted");
    } catch (err) {
      toast.error("Failed to delete resume");
      console.error("Error deleting resume:", err);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading resumes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Resumes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your professional resumes
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Resume
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resume list */}
      {resumes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No resumes yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first resume by importing from LinkedIn, GitHub, or
              starting from scratch.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resume? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(ResumeListPage, { requireVerification: true });
