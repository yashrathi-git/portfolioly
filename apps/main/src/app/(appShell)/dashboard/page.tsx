"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Pencil, Upload, FileText, Sparkles } from "lucide-react";
import withAuth from "@/lib/auth/withAuth";
import { motion } from "framer-motion";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DeploymentSuccessDialog } from "@/components/dashboard/DeploymentSuccessDialog";
import { saveDeploymentUrl } from "@/lib/api/deployment";

function DashboardPage() {
  const { user } = useAuth();

  // Deployment success dialog state
  const [showDeploymentSuccess, setShowDeploymentSuccess] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string>("");

  // Check for Vercel deployment redirect
  useEffect(() => {
    const fullUrl = window.location.href;

    if (!fullUrl.includes("vercel_deployed=true")) {
      return;
    }

    const urlParts = fullUrl.split("?");
    if (urlParts.length < 2) return;

    const queryString = urlParts.slice(1).join("&");
    const params = new URLSearchParams(queryString);

    const deploymentUrl = params.get("deployment-url");
    const deploymentDashboardUrl = params.get("deployment-dashboard-url");
    const projectDashboardUrl = params.get("project-dashboard-url");
    const projectName = params.get("project-name");
    const repositoryUrl = params.get("repository-url");

    if (deploymentUrl) {
      setDeployedUrl(deploymentUrl);
      setShowDeploymentSuccess(true);

      saveDeploymentUrl({
        deployedUrl: deploymentUrl,
        deploymentDashboardUrl: deploymentDashboardUrl || undefined,
        projectDashboardUrl: projectDashboardUrl || undefined,
        projectName: projectName || undefined,
        repositoryUrl: repositoryUrl || undefined,
      });
    }

    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      <DeploymentSuccessDialog
        open={showDeploymentSuccess}
        onOpenChange={setShowDeploymentSuccess}
        deployedUrl={deployedUrl}
      />

      <main className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
        {/* Hero Section */}
        <div className="relative border-b bg-background pt-12 pb-12 lg:pt-16 lg:pb-16">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground mb-4 bg-muted/50">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                <span>Welcome back</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                Hello, {user?.displayName?.split(" ")[0] || "Creator"}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Manage your professional presence and analyze your impact.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-12"
          >
            {/* Quick Actions Section */}
            <section>
              <motion.div
                variants={item}
                className="mb-6 flex items-center justify-between"
              >
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-foreground">
                    Quick Actions
                  </h2>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Edit Portfolio Card */}
                <motion.div variants={item}>
                  <DashboardCard
                    title="Edit Portfolio"
                    description="Customize and refine your existing portfolio"
                    icon={Pencil}
                    href="/edit"
                  />
                </motion.div>

                {/* Create New Card */}
                <motion.div variants={item}>
                  <DashboardCard
                    title="Create New"
                    description="Build a portfolio from LinkedIn or Resume"
                    icon={Upload}
                    href="/upload"
                  />
                </motion.div>

                {/* Resume Builder Card */}
                <motion.div variants={item}>
                  <DashboardCard
                    title="Resume Builder"
                    description="Create professional, ATS-friendly resumes"
                    icon={FileText}
                    href="/resume-builder/list"
                  />
                </motion.div>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </>
  );
}

export default withAuth(DashboardPage, { requireVerification: true });
