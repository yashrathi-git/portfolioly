import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Edit Portfolio - Portfolioly",
  description: "Create and edit your professional portfolio",
};

export default function EditLayout({ children }: { children: ReactNode }) {
  return children;
}
