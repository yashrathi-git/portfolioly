"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getAnalytics,
  trackPageView,
  setAnalyticsUserId,
} from "@/lib/analytics";

export default function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const initializedRef = useRef(false);
  const prevPathnameRef = useRef<string | null>(null);

  // Initialize analytics on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    getAnalytics();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  // Set user ID when auth state changes
  useEffect(() => {
    setAnalyticsUserId(user?.uid ?? null);
  }, [user?.uid]);

  return <>{children}</>;
}
