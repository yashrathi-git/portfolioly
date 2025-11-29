import { Metadata } from "next";
import Link from "next/link";
import { GITHUB_REPO_URL } from "@/lib/utils/links";

export const metadata: Metadata = {
  title: "Terms of Service | Portfolioly",
  description:
    "Terms of Service for Portfolioly - AI-powered portfolio builder",
};

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">The Basics</h2>
          <p className="text-muted-foreground leading-relaxed">
            Portfolioly is a free, open-source hobby project. By using it, you
            agree to these simple terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">What You Can Do</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>
              Create portfolio websites from your resume, GitHub, or LinkedIn
              data
            </li>
            <li>Deploy your portfolio to Vercel or self-host it</li>
            <li>Use the service for free</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">What We Ask</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Only upload content you have the right to share</li>
            <li>Don&apos;t use the service for anything illegal or harmful</li>
            <li>Don&apos;t try to break or abuse the service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Your Content</h2>
          <p className="text-muted-foreground leading-relaxed">
            You own everything you upload. We only use it to generate your
            portfolio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">No Warranties</h2>
          <p className="text-muted-foreground leading-relaxed">
            This is a hobby project provided &quot;as is&quot;. We can&apos;t
            guarantee it will always work perfectly or be available.
            AI-generated content may have errors — please review before
            publishing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Open Source</h2>
          <p className="text-muted-foreground leading-relaxed">
            Portfolioly is AGPL-3.0 licensed. You can view, fork, and contribute
            to the code on{" "}
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Questions?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Open an issue on{" "}
            <a
              href={`${GITHUB_REPO_URL}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t">
        <Link href="/" className="text-primary hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
