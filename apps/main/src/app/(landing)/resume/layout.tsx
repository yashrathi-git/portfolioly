import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title:
    "LinkedIn to Resume Builder | AI-Powered Resume Generator - Portfolioly",
  description:
    "Transform your LinkedIn profile or GitHub into a professional, ATS-friendly resume. AI extracts and formats your experience perfectly. Join the waitlist.",
  alternates: { canonical: "/resume-builder" },
  openGraph: {
    title: "LinkedIn to Resume Builder | Portfolioly",
    description:
      "Transform your LinkedIn or GitHub into a professional resume. AI-powered, ATS-friendly format. Join the waitlist.",
    type: "website",
    siteName: "Portfolioly",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn to Resume Builder | Portfolioly",
    description:
      "Transform your LinkedIn or GitHub into a professional resume. AI-powered, ATS-friendly format.",
  },
  keywords: [
    "LinkedIn to resume",
    "GitHub to resume",
    "AI resume builder",
    "resume generator",
    "ATS-friendly resume",
    "free resume builder",
    "LinkedIn resume converter",
    "professional resume maker",
  ],
};

export default function ResumeBuilderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
