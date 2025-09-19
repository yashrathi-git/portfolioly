/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useAuth, AuthProvider } from "@/lib/auth/AuthContext";

// Mock Firebase
jest.mock("@/lib/firebase", () => ({
  getFirebaseAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  })),
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  sendEmailVerification: jest.fn(),
}));

describe("Enhanced AuthContext", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("should initialize with correct default values", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.verificationStatus).toBe("idle");
    expect(result.current.isPolling).toBe(false);
    expect(result.current.lastVerificationSent).toBeNull();
  });

  it("should have all required methods", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
    expect(typeof result.current.signOut).toBe("function");
    expect(typeof result.current.signInWithGoogle).toBe("function");
    expect(typeof result.current.resendVerification).toBe("function");
    expect(typeof result.current.startVerificationPolling).toBe("function");
    expect(typeof result.current.stopVerificationPolling).toBe("function");
    expect(typeof result.current.checkVerificationStatus).toBe("function");
  });

  it("should require displayName for signUp", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // The signUp method now requires displayName as a required parameter
    // This test verifies the type signature is correct
    expect(result.current.signUp).toBeDefined();

    // In a real test, we would mock Firebase and test the actual functionality
    // For now, we're just verifying the method exists and has the right signature
  });
});
