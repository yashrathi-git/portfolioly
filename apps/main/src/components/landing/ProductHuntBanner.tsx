"use client";

import { X } from "lucide-react";
import { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PRODUCT_HUNT_URL =
  "https://www.producthunt.com/products/portfolioly?launch=portfolioly";

// Launch time: Nov 30, 2024 at 1:30 PM IST (UTC+5:30) = 8:00 AM UTC
const LAUNCH_TIME = new Date("2025-11-30T08:00:00Z").getTime();

// Context to share banner visibility state
const BannerContext = createContext<{ isVisible: boolean }>({
  isVisible: false,
});

export const useBannerVisible = () => useContext(BannerContext);

function useCountdown(targetTime: number) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isLive: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isLive: true };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, isLive: false };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return timeLeft;
}

function CountdownDisplay({
  hours,
  minutes,
  seconds,
}: {
  hours: number;
  minutes: number;
  seconds: number;
}) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-xs tabular-nums bg-orange-100 dark:bg-orange-900/50 px-1.5 py-0.5 rounded">
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}

export function ProductHuntBannerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const { hours, minutes, seconds, isLive } = useCountdown(LAUNCH_TIME);

  useEffect(() => {
    setHasMounted(true);
    const dismissed = sessionStorage.getItem("ph-banner-dismissed");
    if (dismissed) setIsVisible(false);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("ph-banner-dismissed", "true");
  };

  const showBanner = hasMounted && isVisible;

  return (
    <BannerContext.Provider value={{ isVisible: showBanner }}>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-[60] overflow-hidden border-b border-orange-200/50 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:border-orange-900/30 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-orange-950/40"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-x-3 px-4 py-2 sm:px-6">
              <a
                href={PRODUCT_HUNT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-orange-800 hover:text-orange-900 dark:text-orange-200 dark:hover:text-orange-100"
              >
                <span className="hidden sm:inline">{isLive ? "🎉" : "🚀"}</span>
                {isLive ? (
                  <>
                    <span>
                      <span className="font-semibold">
                        We&apos;re live on Product Hunt!
                      </span>
                      <span className="hidden sm:inline">
                        {" "}
                        — Support us with an upvote
                      </span>
                    </span>
                    <span className="inline-flex items-center rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white animate-pulse">
                      Vote Now →
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      <span className="font-semibold">
                        Launching on Product Hunt in
                      </span>
                      <span className="hidden sm:inline"> </span>
                    </span>
                    <CountdownDisplay
                      hours={hours}
                      minutes={minutes}
                      seconds={seconds}
                    />
                    <span className="inline-flex items-center rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                      Subscribe →
                    </span>
                  </>
                )}
              </a>
              <button
                onClick={handleDismiss}
                className="absolute right-2 sm:right-4 p-1 rounded-full text-orange-600/70 hover:text-orange-800 hover:bg-orange-100 dark:text-orange-400/70 dark:hover:text-orange-200 dark:hover:bg-orange-900/30 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </BannerContext.Provider>
  );
}
