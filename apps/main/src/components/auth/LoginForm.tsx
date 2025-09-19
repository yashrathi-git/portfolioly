"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginForm({ onDone }: { onDone?: () => void }) {
  const { signIn, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle user state changes after login
  useEffect(() => {
    if (user && loading) {
      setLoading(false);
      if (user.emailVerified) {
        // User is verified, proceed normally
        onDone?.();
      }
      // Note: Unverified user redirect is handled by the parent page
    }
  }, [user, loading, onDone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      // The AuthContext will handle the user state change
      // If user is verified, onDone will be called via useEffect
      // If user is unverified, we'll show verification required message
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onDone?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Google first */}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2 shadow-sm hover:shadow transition-colors"
        onClick={handleGoogle}
        disabled={loading}
        aria-label="Continue with Google"
      >
        {/* Google Icon */}
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6.3 0 8.7-4.4 8.7-6.6 0-.4 0-.7-.1-1H12z"
          />
          <path
            fill="#34A853"
            d="M3.6 7.4l3.2 2.3C7.6 8 9.6 6.6 12 6.6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.7 12 2.7 8.5 2.7 5.5 4.6 3.6 7.4z"
          />
          <path
            fill="#4A90E2"
            d="M12 21.3c3.2 0 5.9-1.1 7.9-3l-3.6-2.9c-1 1-2.3 1.6-4.3 1.6-3.9 0-7.2-2.6-8.3-6.1l-3.8 2.9C2.9 18.5 7 21.3 12 21.3z"
          />
          <path
            fill="#FBBC05"
            d="M20 12c0-.4 0-.7-.1-1H12v3.9h5.5c-.3 1.6-1.3 2.8-2.6 3.6l3.6 2.9C20.5 19.9 20 14.9 20 12z"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="relative text-center text-xs text-muted-foreground">
        <span className="bg-background px-2 relative z-10">
          or continue with email
        </span>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="off"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
