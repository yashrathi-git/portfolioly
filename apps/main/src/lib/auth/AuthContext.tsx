"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  AuthError,
} from "firebase/auth";

export type AuthContextValue = {
  user: User | null;
  loading: boolean;

  // Verification state
  verificationStatus: "idle" | "pending" | "verified" | "failed";
  lastVerificationSent: Date | null;

  // Auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;

  // Verification methods
  resendVerification: () => Promise<void>;
  // Force-refresh the Firebase user and update context consumers
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification state
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "pending" | "verified" | "failed"
  >("idle");
  const [lastVerificationSent, setLastVerificationSent] = useState<Date | null>(
    null
  );

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);

        // If user becomes verified, update status
        if (u?.emailVerified && verificationStatus !== "verified") {
          setVerificationStatus("verified");
        }
      });
    } catch (e) {
      console.error("Firebase not initialized:", e);
      setLoading(false);
    }
    return () => {
      if (unsub) unsub();
    };
  }, [verificationStatus]);

  // Note: We intentionally avoid listening to onIdTokenChanged to prevent reload loops.

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError));
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        const auth = getFirebaseAuth();
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Update profile with display name (now required)
        await updateProfile(cred.user, { displayName });

        // Send email verification as part of the sign-up flow
        try {
          await sendEmailVerification(cred.user);
          setLastVerificationSent(new Date());
          setVerificationStatus("pending");
        } catch (verificationError) {
          console.error("Failed to send verification email", verificationError);
          setVerificationStatus("failed");
          throw new Error(
            "Failed to send verification email. Please try again."
          );
        }

        // Keep user signed in but unverified
        // They will be redirected to verification screen by the app logic
      } catch (error) {
        const authError = error as AuthError;
        throw new Error(getAuthErrorMessage(authError));
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await fbSignOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      throw new Error("Failed to sign out");
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError));
    }
  }, []);

  const resendVerification = useCallback(async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("Please sign in to resend verification email");
    }

    // Security control: Check if enough time has passed since last verification email
    if (lastVerificationSent) {
      const timeSinceLastSent = Date.now() - lastVerificationSent.getTime();
      const minWaitTime = 60 * 1000; // 1 minute minimum wait time

      if (timeSinceLastSent < minWaitTime) {
        const remainingTime = Math.ceil(
          (minWaitTime - timeSinceLastSent) / 1000
        );
        throw new Error(
          `Please wait ${remainingTime} seconds before requesting another verification email`
        );
      }
    }

    try {
      await sendEmailVerification(currentUser);
      setLastVerificationSent(new Date());
      setVerificationStatus("pending");
    } catch (error) {
      const authError = error as AuthError;
      setVerificationStatus("failed");
      throw new Error(getAuthErrorMessage(authError));
    }
  }, [lastVerificationSent]);

  // Removed internal polling; verification check is handled by the verify page hook

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const auth = getFirebaseAuth();
      const current = auth.currentUser;
      if (!current) {
        setUser(null);
        return null;
      }
      await current.reload();
      // Create a new object reference preserving prototype to trigger React updates
      const reloadedUser = Object.create(
        Object.getPrototypeOf(current),
        Object.getOwnPropertyDescriptors(current)
      ) as User;
      setUser(reloadedUser);
      if (current.emailVerified && verificationStatus !== "verified") {
        setVerificationStatus("verified");
      }
      return current;
    } catch (error) {
      console.error("Refresh user error:", error);
      return null;
    }
  }, [verificationStatus]);

  // Refresh on window focus/visibility change to pick up verification quickly
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      void refreshUser();
    };
    window.addEventListener("focus", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("focus", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      verificationStatus,
      lastVerificationSent,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      resendVerification,
      refreshUser,
    }),
    [
      user,
      loading,
      verificationStatus,
      lastVerificationSent,
      resendVerification,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters";
    case "auth/invalid-email":
      return "Please enter a valid email address";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later";
    case "auth/network-request-failed":
      return "Network error. Please check your connection";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled";
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled";
    default:
      return error.message || "An error occurred during authentication";
  }
}
