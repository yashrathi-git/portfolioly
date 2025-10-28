"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UploadWizard from "@/components/upload/UploadWizard";

/**
 * Upload onboarding page component.
 *
 * This page provides a 3-step wizard for users to auto-populate their portfolio
 * by uploading LinkedIn PDFs, resume PDFs, and selecting GitHub repositories.
 *
 * Features:
 * - Protected route requiring email verification
 * - 3-step wizard interface with progress indication
 * - PDF upload with text extraction
 * - GitHub repository selection
 * - Completion redirect to dashboard
 */
export default function UploadPage() {
  const { loading } = useAuth();

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireVerification>
      <div className="min-h-[calc(100vh-3.5rem)] bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Add information from your LinkedIn/Resume/GitHub
              </h1>
              <p className="text-lg text-muted-foreground">
                You can skip any or all step
              </p>
            </div>

            {/* Upload Wizard */}
            <div className="p-2 sm:p-0">
              <UploadWizard />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
