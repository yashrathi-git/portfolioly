import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Portfolio - Portfolioly",
  description: "Create and edit your professional portfolio",
};

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
