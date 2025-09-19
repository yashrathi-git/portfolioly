"use client";
import { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthShell() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const appName = import.meta.env.VITE_APP_NAME || "Portfolioly";

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader>
          <CardTitle className="text-2xl">{appName}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Welcome back. Sign in to continue."
              : "Create an account to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === "login" ? (
            <LoginForm onDone={() => {}} />
          ) : (
            <SignUpForm onDone={() => setMode("login")} />
          )}

          <div className="text-sm text-muted-foreground text-center">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="px-1"
                  onClick={() => setMode("signup")}
                >
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="px-1"
                  onClick={() => setMode("login")}
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
