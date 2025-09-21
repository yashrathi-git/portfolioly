/**
 * Integration test component to verify upload functionality
 * This can be used for testing the complete upload flow
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpload } from "@/hooks/useUpload";
import { checkUploadHealth } from "@/lib/api/upload";

export function UploadIntegrationTest() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const upload = useUpload();

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const status = await checkUploadHealth();
      setHealthStatus(status);
    } catch (error) {
      setHealthStatus({
        error: error instanceof Error ? error.message : "Health check failed",
      });
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Status */}
          <div>
            <h3 className="font-semibold mb-2">Configuration Status</h3>
            <div className="text-sm space-y-1">
              <div>Loading: {upload.configLoading ? "Yes" : "No"}</div>
              <div>Error: {upload.configError || "None"}</div>
              {upload.config && (
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div>Max file size: {upload.config.max_file_size_mb}MB</div>
                  <div>Max GitHub repos: {upload.config.max_github_repos}</div>
                  <div>
                    PDF uploads/hour:{" "}
                    {upload.config.rate_limits.pdf_uploads_per_hour}
                  </div>
                  <div>
                    GitHub requests/hour:{" "}
                    {upload.config.rate_limits.github_requests_per_hour}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Health Check */}
          <div>
            <h3 className="font-semibold mb-2">Backend Health</h3>
            <Button onClick={checkHealth} disabled={healthLoading} size="sm">
              {healthLoading ? "Checking..." : "Check Health"}
            </Button>
            {healthStatus && (
              <div className="mt-2 bg-gray-50 p-2 rounded text-xs">
                <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Upload States */}
          <div>
            <h3 className="font-semibold mb-2">Upload States</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium">LinkedIn PDF</h4>
                <div>Uploading: {upload.linkedin.uploading ? "Yes" : "No"}</div>
                <div>Progress: {upload.linkedin.progress}%</div>
                <div>Error: {upload.linkedin.error || "None"}</div>
                <div>Result: {upload.linkedin.result ? "Success" : "None"}</div>
              </div>
              <div>
                <h4 className="font-medium">Resume PDF</h4>
                <div>Uploading: {upload.resume.uploading ? "Yes" : "No"}</div>
                <div>Progress: {upload.resume.progress}%</div>
                <div>Error: {upload.resume.error || "None"}</div>
                <div>Result: {upload.resume.result ? "Success" : "None"}</div>
              </div>
            </div>
          </div>

          {/* GitHub State */}
          <div>
            <h3 className="font-semibold mb-2">GitHub State</h3>
            <div className="text-sm space-y-1">
              <div>Username: {upload.github.username || "None"}</div>
              <div>Loading: {upload.github.loading ? "Yes" : "No"}</div>
              <div>Repositories: {upload.github.repos.length}</div>
              <div>Selected: {upload.github.selectedRepoIds.length}</div>
              <div>Error: {upload.github.error || "None"}</div>
              <div>
                Has Next: {upload.github.pagination.hasNext ? "Yes" : "No"}
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <Button onClick={upload.resetAll} variant="outline" size="sm">
            Reset All State
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
