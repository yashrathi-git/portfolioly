"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UploadWizard from "@/components/upload/UploadWizard";

export default function TestUploadPage() {
  const router = useRouter();
  const [isDev, setIsDev] = useState(true);
  const [disableValidation, setDisableValidation] = useState(true);
  const [acceptOverrideEnabled, setAcceptOverrideEnabled] = useState(true);

  useEffect(() => {
    const dev = process.env.NODE_ENV === "development";
    setIsDev(dev);
    if (!dev) {
      router.replace("/upload");
    }
  }, [router]);

  if (!isDev) return null;

  return (
    <ProtectedRoute requireVerification>
      <div className="min-h-[calc(100vh-3.5rem)] bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="text-center mb-2">
              <h1 className="text-3xl font-bold">Test Upload (Dev Only)</h1>
              <p className="text-muted-foreground">
                Toggle validation to test backend error responses.
              </p>
            </div>

            <div className="rounded-lg border p-4 flex flex-col gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={disableValidation}
                  onChange={(e) => setDisableValidation(e.target.checked)}
                />
                Disable client-side validation
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={acceptOverrideEnabled}
                  onChange={(e) => setAcceptOverrideEnabled(e.target.checked)}
                />
                Allow any file type in chooser (remove accept filter)
              </label>
            </div>

            <div className="p-2 sm:p-0">
              <UploadWizard
                disableClientValidation={disableValidation}
                acceptOverride={acceptOverrideEnabled ? "*/*" : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
