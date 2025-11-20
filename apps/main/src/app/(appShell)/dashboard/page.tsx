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
import { getUserSettings } from "@/lib/api/userSettings";
import { getIdToken } from "@/lib/firebase";
import { env } from "@/lib/env";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

function DashboardPage() {
  const { user } = useAuth();
  const [notifyForResume, setNotifyForResume] = useState(false);
  const [isUpdatingNotification, setIsUpdatingNotification] = useState(false);

  useEffect(() => {
    const fetchNotificationPreference = async () => {
      try {
        const settings = await getUserSettings();
        setNotifyForResume(settings.notify_for_resume_feature || false);
      } catch (error) {
        console.error("Failed to fetch notification preference:", error);
        setNotifyForResume(false);
      }
    };

    fetchNotificationPreference();
  }, []);

  const handleNotifyMe = async () => {
    if (isUpdatingNotification || notifyForResume) return;

    setNotifyForResume(true);
    toast.success("You'll be notified when Resume Maker launches!");

    setIsUpdatingNotification(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("No auth token");

      const response = await fetch(`${env.API_BASE_URL}/users/me/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notify_for_resume_feature: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to update notification");
    } catch (error) {
      console.error("Failed to update notification:", error);
      setNotifyForResume(false);
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
            <motion.div variants={item} className="mb-6 flex items-center justify-between">
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

              {/* Analyze Chats Card */}
              <motion.div variants={item}>
                <DashboardCard
                  title="Analyze Chats"
                  description="View analytics and insights"
                  icon={MessageSquare}
                  href="/dashboard"
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
              {/* Resume Maker Card */}
              <motion.div variants={item}>
                <DashboardCard
                  title="Resume Maker"
                  description="Create professional, ATS-friendly resumes"
                  icon={FileText}
                  badge="Soon"
                  onClick={handleNotifyMe}
                  disabled={notifyForResume || isUpdatingNotification}
                >
                  <div className="mt-2">
                    {notifyForResume ? (
                      <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Bell className="h-4 w-4" />
                        <span>Notification set</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium shadow-sm">
                        <Bell className="h-4 w-4" />
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
  );
}

export default withAuth(DashboardPage, { requireVerification: true });

