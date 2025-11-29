import { Metadata } from "next";
import Link from "next/link";
import { GITHUB_REPO_URL } from "@/lib/utils/links";

export const metadata: Metadata = {
  title: "Privacy Policy | Portfolioly",
  description: "Privacy Policy for Portfolioly - AI-powered portfolio builder",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
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
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Portfolioly (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is
            committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, disclose, and safeguard your information when
            you use our AI-powered portfolio builder service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            2. Information We Collect
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We collect information you provide directly:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>
              <strong>Account Information:</strong> Email address, name, and
              password when you create an account
            </li>
            <li>
              <strong>Resume Data:</strong> Information extracted from uploaded
              PDF resumes including work experience, education, skills, and
              contact details
            </li>
            <li>
              <strong>GitHub Data:</strong> Public repository information when
              you connect your GitHub account
            </li>
            <li>
              <strong>LinkedIn Data:</strong> Professional information from
              uploaded LinkedIn PDF exports
            </li>
            <li>
              <strong>Profile Photos:</strong> Images you upload for your
              portfolio
            </li>
            <li>
              <strong>Portfolio Content:</strong> Any additional information you
              add to customize your portfolio
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            3. How We Use Your Information
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong>
              Your data is used exclusively for generating and serving your
              portfolio.
            </strong>{" "}
            We do not sell, share, or use your data for any other purpose.
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>To create and generate your portfolio website</li>
            <li>To process your data using AI for extraction and formatting</li>
            <li>
              To provide the AI chat feature that answers questions about your
              portfolio
            </li>
            <li>To authenticate and secure your account</li>
            <li>To enable deployment of your portfolio to hosting platforms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            4. Third-Party Services
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use the following third-party services:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>
              <strong>Firebase (Google):</strong> Authentication and user
              management
            </li>
            <li>
              <strong>Azure AI / OpenAI:</strong> AI-powered data extraction and
              chat functionality
            </li>
            <li>
              <strong>Azure Blob Storage:</strong> Image storage
            </li>
            <li>
              <strong>Vercel:</strong> Optional portfolio deployment
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Each service has its own privacy policy governing their data
            handling practices.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We retain your portfolio data for as long as your account is active.
            You can request deletion of your account and associated data at any
            time.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Uploaded PDFs:</strong> Resume and LinkedIn PDF files you
            upload are stored temporarily for AI processing only and are
            automatically deleted after 7 days by an automated cleanup script.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Your Rights (GDPR)</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            If you are in the European Economic Area (EEA), you have the
            following rights:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>
              <strong>Right to Access:</strong> Request a copy of your personal
              data
            </li>
            <li>
              <strong>Right to Rectification:</strong> Request correction of
              inaccurate data
            </li>
            <li>
              <strong>Right to Erasure:</strong> Request deletion of your
              personal data
            </li>
            <li>
              <strong>Right to Portability:</strong> Request transfer of your
              data in a machine-readable format
            </li>
            <li>
              <strong>Right to Object:</strong> Object to processing of your
              personal data
            </li>
            <li>
              <strong>Right to Withdraw Consent:</strong> Withdraw consent at
              any time
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement appropriate technical and organizational measures to
            protect your personal data against unauthorized access, alteration,
            disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            8. Children&apos;s Privacy
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Our service is not intended for children under 16. We do not
            knowingly collect personal information from children under 16.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            9. Changes to This Policy
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            For any questions about this Privacy Policy or to exercise your
            rights, please open an issue on{" "}
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
