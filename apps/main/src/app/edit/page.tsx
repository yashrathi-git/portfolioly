"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Portfolio Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground text-lg">
            Your portfolio editor will be available here soon.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            We're processing your uploaded data and will have your editable
            portfolio ready shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
