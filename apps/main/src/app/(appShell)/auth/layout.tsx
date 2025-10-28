import { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Sign in or create an account",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full grid place-items-center p-4">{children}</div>
  );
}
