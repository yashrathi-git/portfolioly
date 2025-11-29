/**
 * Waitlist API functions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface WaitlistSignupResponse {
  success: boolean;
  message: string;
  already_signed_up: boolean;
}

export async function signupForWaitlist(
  email: string,
  source: string = "resume_builder"
): Promise<WaitlistSignupResponse> {
  const response = await fetch(`${API_BASE_URL}/waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, source }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw new Error("Failed to join waitlist. Please try again.");
  }

  return response.json();
}
