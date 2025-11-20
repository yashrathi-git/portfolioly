"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Pencil,
  Upload,
  MessageSquare,
  FileText,
  Bell,
  ArrowRight,
} from "lucide-react";
import withAuth from "@/lib/auth/withAuth";
import Link from "next/link";
import { getUserSettings } from "@/lib/api/userSettings";
import { getIdToken } from "@/lib/firebase";
import { env } from "@/lib/env";
import { toast } from "sonner";

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

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background border-b">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-12">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Welcome back, {user?.displayName?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              Manage your portfolio, create new content, and track your
              professional presence.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="space-y-12">
          {/* Quick Actions Section */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">
                Quick Actions
              </h2>
              <p className="text-muted-foreground">
                Get started with your portfolio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Edit Portfolio Card */}
              <Link href="/edit" className="block group">
                <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                        <Pencil className="h-7 w-7 text-primary" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-xl mt-4">
                      Edit Portfolio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      Customize and refine your existing portfolio with our
                      powerful editor
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              {/* Create New Card */}
              <Link href="/upload" className="block group">
                <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                        <Upload className="h-7 w-7 text-primary" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-xl mt-4">Create New</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      Build a portfolio from LinkedIn, Resume, or GitHub in
                      minutes
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              {/* Analyze Chats Card */}
              <Link href="/dashboard" className="block group">
                <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                        <MessageSquare className="h-7 w-7 text-primary" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-xl mt-4">
                      Analyze Chats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      View analytics and insights from your portfolio
                      conversations
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          {/* Coming Soon Section */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">
                Coming Soon
              </h2>
              <p className="text-muted-foreground">
                Exciting features we're working on
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Resume Maker Card */}
              <button
                onClick={handleNotifyMe}
                disabled={notifyForResume || isUpdatingNotification}
                className="text-left group disabled:cursor-default"
              >
                <Card className="h-full relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50 group-disabled:cursor-default group-disabled:hover:shadow-none group-disabled:hover:scale-100 group-disabled:hover:border-border">
                  <Badge
                    variant="secondary"
                    className="absolute top-4 right-4 text-xs font-semibold bg-primary/20 text-primary border-primary/30"
                  >
                    Coming Soon
                  </Badge>
                  <CardHeader className="pb-4">
                    <div className="rounded-lg bg-primary/10 p-3 w-fit group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl mt-4">Resume Maker</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-base">
                      Create professional, ATS-friendly resumes with AI-powered
                      suggestions
                    </CardDescription>

                    {/* CTA Button */}
                    <div className="pt-4">
                      {notifyForResume ? (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary">
                          <Bell className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Notification set
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors">
                          <Bell className="h-4 w-4" />
                          <span className="text-sm font-medium">Notify me</span>
                          <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default withAuth(DashboardPage, { requireVerification: true });
