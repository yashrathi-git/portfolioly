"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UploadWizard from "@/components/upload/UploadWizard";

/**
 * Upload onboarding page component.
 *
 * This page provides a streamlined way for users to auto-populate their portfolio
 * by importing data from LinkedIn, GitHub, or their Resume.
 *
 * Features:
 * - Protected route requiring email verification
 * - Source selection with card-based UI
 * - Single-step import process per source
 * - Option to add multiple sources
 * - Completion redirect to edit page
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
                Import Your Professional Data
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose a source to get started—quick and easy. You can add more anytime.
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
