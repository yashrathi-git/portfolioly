"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { Plus, FolderOpen, Settings } from "lucide-react";
import withAuth from "@/lib/auth/withAuth";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.displayName || user?.email?.split("@")[0]}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Create Portfolio</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Start building a new portfolio to showcase your work and skills.
              </CardDescription>
              <Button className="w-full mt-4" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">My Portfolios</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                View and manage your existing portfolios and projects.
              </CardDescription>
              <Button variant="outline" className="w-full mt-4" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Customize your profile and account preferences.
              </CardDescription>
              <Button variant="outline" className="w-full mt-4" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Welcome to Portfolioly! Here&apos;s what you can do next:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Complete your profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Add your personal information, skills, and professional
                    background.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Create your first portfolio</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose from our templates and start showcasing your work.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Share your portfolio</h4>
                  <p className="text-sm text-muted-foreground">
                    Get a custom URL and share your portfolio with the world.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default withAuth(DashboardPage, { requireVerification: true });
