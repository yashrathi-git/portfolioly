"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Pencil,
  Upload,
  MessageSquare,
  FileText,
  Bell,
  Sparkles,
} from "lucide-react";
import withAuth from "@/lib/auth/withAuth";
import { getIdToken } from "@/lib/firebase";
import { env } from "@/lib/env";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DeploymentSuccessDialog } from "@/components/dashboard/DeploymentSuccessDialog";
import { saveDeploymentUrl } from "@/lib/api/deployment";

function DashboardPage() {
  const { user } = useAuth();
  const [notifyForAnalytics, setNotifyForAnalytics] = useState(false);
  const [isUpdatingNotification, setIsUpdatingNotification] = useState(false);

  // Deployment success dialog state
  const [showDeploymentSuccess, setShowDeploymentSuccess] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string>("");

  // Check for Vercel deployment redirect
  useEffect(() => {
    // Vercel redirect has malformed query string with multiple '?' instead of '&'
    // e.g., ?vercel_deployed=true?deployment-url=...
    // We need to parse this manually from the full URL
    const fullUrl = window.location.href;

    // Check if this is a Vercel redirect
    if (!fullUrl.includes("vercel_deployed=true")) {
      return;
    }

    // Parse all params - replace extra '?' with '&' to fix malformed query string
    const urlParts = fullUrl.split("?");
    if (urlParts.length < 2) return;

    // Join all query parts with '&' and parse
    const queryString = urlParts.slice(1).join("&");
    const params = new URLSearchParams(queryString);

    // Extract all Vercel deployment params
    const deploymentUrl = params.get("deployment-url");
    const deploymentDashboardUrl = params.get("deployment-dashboard-url");
    const projectDashboardUrl = params.get("project-dashboard-url");
    const projectName = params.get("project-name");
    const repositoryUrl = params.get("repository-url");

    // We need at least the deployment URL to show success
    if (deploymentUrl) {
      setDeployedUrl(deploymentUrl);
      setShowDeploymentSuccess(true);

      // Save complete deployment info to backend (fire and forget)
      saveDeploymentUrl({
        deployedUrl: deploymentUrl,
        deploymentDashboardUrl: deploymentDashboardUrl || undefined,
        projectDashboardUrl: projectDashboardUrl || undefined,
        projectName: projectName || undefined,
        repositoryUrl: repositoryUrl || undefined,
      });
    }

    // Clean up URL - remove all query params
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  useEffect(() => {
    const fetchNotificationStatus = async () => {
      try {
        const token = await getIdToken();
        if (!token) return;

        const response = await fetch(`${env.API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setNotifyForAnalytics(data.analytics_feature || false);
        }
      } catch (error) {
        console.error("Failed to fetch notification status:", error);
      }
    };

    fetchNotificationStatus();
  }, []);

  const handleNotifyMe = async () => {
    if (isUpdatingNotification || notifyForAnalytics) return;

    setNotifyForAnalytics(true);
    toast.success("You'll be notified when Analytics launches!");

    setIsUpdatingNotification(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("No auth token");

      const response = await fetch(`${env.API_BASE_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notification_type: "analytics_feature",
        }),
      });

      if (!response.ok) throw new Error("Failed to signup for notification");
    } catch (error) {
      console.error("Failed to signup for notification:", error);
      setNotifyForAnalytics(false);
    } finally {
      setIsUpdatingNotification(false);
    }
  };

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
      {/* Deployment Success Dialog */}
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

            {/* Coming Soon Section */}
            <section>
              <motion.div variants={item} className="mb-6">
                <h2 className="text-xl font-medium tracking-tight text-foreground">
                  Coming Soon
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Analytics Card */}
                <motion.div variants={item}>
                  <DashboardCard
                    title="Analytics"
                    description="View chat analytics and insights"
                    icon={MessageSquare}
                    badge="Soon"
                    onClick={handleNotifyMe}
                    disabled={notifyForAnalytics || isUpdatingNotification}
                  >
                    <div className="mt-2">
                      {notifyForAnalytics ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Bell className="h-3 w-3" />
                          <span>Notification set</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium">
                          <Bell className="h-3 w-3" />
                          <span>Notify me</span>
                        </div>
                      )}
                    </div>
                  </DashboardCard>
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
