"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = "Processing your data...",
}: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold">Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
