import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Resume Builder - Portfolioly",
  description:
    "Create professional, ATS-friendly resumes from your LinkedIn profile or GitHub data. Choose from multiple templates and export to PDF.",
  keywords: [
    "resume builder",
    "ATS resume",
    "LinkedIn resume",
    "GitHub resume",
    "professional resume",
    "PDF resume",
  ],
};

export default function ResumeBuilderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
