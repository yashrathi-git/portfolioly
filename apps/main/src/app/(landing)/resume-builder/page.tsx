"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, GripVertical } from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const ENTRY_VARIANTS = {
  hidden: { opacity: 0, y: 10, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const FEATURES = [
  "AI-Powered Extraction",
  "ATS-Friendly Format",
  "One-Click Export",
  "Free Forever",
];

export default function ResumeBuilderPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="relative bg-background min-h-dvh flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-4xl py-20 sm:py-24 lg:py-28">
            <div className="text-center">
              {/* Badge */}
              <motion.div
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5"
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Coming Soon
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight"
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <span className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] bg-clip-text text-transparent">
                  LinkedIn
                </span>
                <span className="text-foreground"> → </span>
                <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                  Resume
                </span>
              </motion.h1>

              <motion.p
                className="mt-6 text-pretty text-base text-muted-foreground sm:text-lg/8 max-w-2xl mx-auto"
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Transform your LinkedIn profile or GitHub into a professional,
                ATS-friendly resume. AI extracts and formats your experience
                perfectly.
              </motion.p>

              {/* Feature Ticks */}
              <motion.div
                className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {FEATURES.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </motion.div>

              {/* Waitlist Form */}
              <motion.div
                className="mt-10 max-w-md mx-auto"
                variants={ENTRY_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                {isSubmitted ? (
                  <div className="flex items-center justify-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-6 py-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      You&apos;re on the list! We&apos;ll notify you soon.
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 rounded-full px-5"
                    />
                    <ShimmerButton
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 px-6"
                    >
                      {isSubmitting ? "Joining..." : "Join Waitlist"}
                    </ShimmerButton>
                  </form>
                )}
              </motion.div>
            </div>
          </div>

          {/* Before/After Demo */}
          <motion.div
            className="mx-auto max-w-5xl px-4 pb-24"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <DraggableCompareDemo />
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DraggableCompareDemo() {
  const [sliderPosition, setSliderPosition] = useState(35);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      handleMove(e.clientX);
    },
    [handleMove]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div className="relative">
      {/* Labels */}
      <div className="flex justify-between mb-4 px-2">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#0077B5]" />
          LinkedIn Profile
        </span>
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          Your Resume
          <span className="w-3 h-3 rounded-full bg-violet-500" />
        </span>
      </div>

      {/* Drag hint */}
      <div className="text-center mb-4">
        <span className="text-xs text-muted-foreground/60">
          ← Drag the handle to compare →
        </span>
      </div>

      {/* Demo Container */}
      <div
        ref={containerRef}
        className="relative h-[550px] md:h-[650px] rounded-2xl border border-border overflow-hidden bg-card shadow-2xl select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* LinkedIn Profile (Left side) */}
        <div className="absolute inset-0">
          <LinkedInProfileMock />
        </div>

        {/* Resume (Right side with clip) */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 0 0 ${sliderPosition}%)`,
          }}
        >
          <ResumePreviewFull />
        </div>

        {/* Draggable Divider */}
        <div
          className="absolute top-0 bottom-0 z-20 cursor-ew-resize"
          style={{
            left: `${sliderPosition}%`,
            transform: "translateX(-50%)",
          }}
          onPointerDown={handlePointerDown}
        >
          {/* Line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-1 -translate-x-1/2 bg-gradient-to-b from-violet-500 via-purple-500 to-violet-500 shadow-lg shadow-violet-500/50" />

          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-zinc-900 border-2 border-violet-500 flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
            <GripVertical className="w-5 h-5 text-violet-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInProfileMock() {
  return (
    <div className="h-full bg-[#f3f2ef] overflow-hidden flex flex-col">
      {/* LinkedIn Nav Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 shrink-0">
        <svg
          className="w-8 h-8 text-[#0077B5]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        <div className="flex-1 max-w-xs">
          <div className="bg-[#eef3f8] rounded px-3 py-1.5 text-sm text-gray-500 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search
          </div>
        </div>
        <div className="flex items-center gap-6 text-gray-500">
          <div className="flex flex-col items-center text-xs">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="hidden md:block">Home</span>
          </div>
          <div className="flex flex-col items-center text-xs">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            <span className="hidden md:block">Network</span>
          </div>
          <div className="flex flex-col items-center text-xs">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
            </svg>
            <span className="hidden md:block">Jobs</span>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
            {/* Banner */}
            <div className="h-24 bg-gradient-to-r from-[#0077B5] via-[#00A0DC] to-[#0077B5]" />

            {/* Profile Info */}
            <div className="px-6 pb-4 -mt-12">
              <div className="flex items-end gap-4">
                <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">JD</span>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">John Doe</h1>
                  <span className="text-sm text-gray-500">• 1st</span>
                </div>
                <p className="text-base text-gray-700 mt-1">
                  Senior Software Engineer at Google | Ex-Meta, Ex-Amazon |
                  Building scalable systems
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  San Francisco Bay Area •{" "}
                  <span className="text-[#0077B5] hover:underline cursor-pointer">
                    500+ connections
                  </span>
                </p>

                {/* Open to work badge */}
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#dce6f1] rounded-full">
                  <div className="w-2 h-2 rounded-full bg-[#0077B5]" />
                  <span className="text-sm font-medium text-[#0077B5]">
                    Open to work
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  <button className="px-4 py-1.5 bg-[#0077B5] text-white text-sm font-semibold rounded-full hover:bg-[#006097]">
                    Connect
                  </button>
                  <button className="px-4 py-1.5 border border-[#0077B5] text-[#0077B5] text-sm font-semibold rounded-full hover:bg-[#0077B5]/5">
                    Message
                  </button>
                  <button className="px-4 py-1.5 border border-gray-400 text-gray-600 text-sm font-semibold rounded-full hover:bg-gray-50">
                    More
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Passionate software engineer with 8+ years of experience building
              scalable distributed systems. Currently leading a team at Google
              working on cloud infrastructure that serves millions of users
              daily.
              <br />
              <br />
              Previously at Meta where I built real-time data pipelines
              processing billions of events, and Amazon where I contributed to
              AWS Lambda. I love solving complex problems and mentoring
              engineers.
            </p>
          </div>

          {/* Experience Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Experience</h2>

            <div className="space-y-4">
              {/* Google */}
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    Senior Software Engineer
                  </h3>
                  <p className="text-sm text-gray-700">Google</p>
                  <p className="text-xs text-gray-500">
                    Jan 2022 - Present · 3 yrs
                  </p>
                  <p className="text-xs text-gray-500">
                    San Francisco, California
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <div className="w-12 h-12 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#0668E1">
                    <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    Software Engineer
                  </h3>
                  <p className="text-sm text-gray-700">Meta</p>
                  <p className="text-xs text-gray-500">
                    Jun 2019 - Dec 2021 · 2 yrs 7 mos
                  </p>
                  <p className="text-xs text-gray-500">
                    Menlo Park, California
                  </p>
                </div>
              </div>

              {/* Amazon */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <div className="w-12 h-12 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                    <path
                      fill="#FF9900"
                      d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.493.13.12.205.076.4-.136.587-.36.315-.756.606-1.187.872-1.64.987-3.456 1.727-5.445 2.22-1.988.494-3.945.74-5.87.74-2.26 0-4.404-.354-6.432-1.063-2.028-.71-3.86-1.723-5.496-3.04-.273-.22-.323-.41-.15-.57l-.05-.155zm6.89-5.94c0 .876.242 1.538.726 1.988.484.45 1.1.675 1.847.675.778 0 1.424-.23 1.937-.69.513-.46.77-1.12.77-1.973v-1.2c0-.852-.257-1.512-.77-1.973-.513-.46-1.16-.69-1.937-.69-.747 0-1.363.225-1.847.675-.484.45-.726 1.112-.726 1.988v1.2zm-1.658 0v-1.2c0-1.23.39-2.24 1.17-3.03.78-.79 1.78-1.185 3-1.185 1.22 0 2.22.395 3 1.185.78.79 1.17 1.8 1.17 3.03v1.2c0 1.23-.39 2.24-1.17 3.03-.78.79-1.78 1.185-3 1.185-1.22 0-2.22-.395-3-1.185-.78-.79-1.17-1.8-1.17-3.03zm14.633 3.78c.293 0 .54.097.74.29.2.193.3.43.3.71 0 .28-.1.517-.3.71-.2.193-.447.29-.74.29h-3.12c-.293 0-.54-.097-.74-.29-.2-.193-.3-.43-.3-.71 0-.28.1-.517.3-.71.2-.193.447-.29.74-.29h3.12z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    Software Development Engineer
                  </h3>
                  <p className="text-sm text-gray-700">Amazon</p>
                  <p className="text-xs text-gray-500">
                    Aug 2017 - May 2019 · 1 yr 10 mos
                  </p>
                  <p className="text-xs text-gray-500">Seattle, Washington</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumePreviewFull() {
  return (
    <div className="h-full bg-white p-6 md:p-10 font-serif text-black overflow-auto">
      {/* Header */}
      <div className="text-center mb-5 pb-3 border-b-2 border-black">
        <h1 className="text-2xl md:text-3xl font-bold tracking-wide uppercase">
          John Doe
        </h1>
        <p className="text-xs md:text-sm mt-2 text-gray-700">
          (555) 123-4567 | john.doe@email.com | linkedin.com/in/johndoe |
          github.com/johndoe
        </p>
        <p className="text-xs text-gray-600 mt-1">San Francisco, CA</p>
      </div>

      {/* Summary */}
      <section className="mb-5">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
          Professional Summary
        </h2>
        <p className="text-xs md:text-sm leading-relaxed text-gray-800">
          Passionate software engineer with 8+ years of experience building
          scalable distributed systems and leading high-performing engineering
          teams. Proven track record of delivering impactful projects at Google,
          Meta, and Amazon, with deep expertise in cloud infrastructure,
          real-time data processing, and system optimization.
        </p>
      </section>

      {/* Experience */}
      <section className="mb-5">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
          Experience
        </h2>

        <div className="mb-3">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-sm">Senior Software Engineer</span>
            <span className="text-xs">Jan 2022 - Present</span>
          </div>
          <div className="flex justify-between items-baseline text-xs italic">
            <span>Google</span>
            <span>San Francisco, CA</span>
          </div>
          <ul className="list-disc ml-4 mt-1.5 text-xs space-y-0.5">
            <li>
              Led development of cloud infrastructure platform serving 100M+
              daily active users across 50+ global regions with 99.99% uptime
              guarantee
            </li>
            <li>
              Architected and deployed microservices architecture reducing
              system latency by 40% and improving throughput by 3x under peak
              traffic conditions
            </li>
            <li>
              Mentored team of 5 engineers on best practices, code reviews, and
              system design principles, improving sprint velocity by 25%
              quarter-over-quarter
            </li>
          </ul>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-sm">Software Engineer</span>
            <span className="text-xs">Jun 2019 - Dec 2021</span>
          </div>
          <div className="flex justify-between items-baseline text-xs italic">
            <span>Meta</span>
            <span>Menlo Park, CA</span>
          </div>
          <ul className="list-disc ml-4 mt-1.5 text-xs space-y-0.5">
            <li>
              Built and maintained real-time data pipeline processing 1B+ events
              daily using Apache Kafka, Spark, and custom stream processing
              frameworks
            </li>
            <li>
              Implemented ML-powered recommendation system using TensorFlow and
              PyTorch, increasing user engagement metrics by 15% across the
              platform
            </li>
            <li>
              Reduced infrastructure costs by $2M annually through resource
              optimization, auto-scaling improvements, and implementing
              efficient caching strategies
            </li>
          </ul>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-sm">
              Software Development Engineer
            </span>
            <span className="text-xs">Aug 2017 - May 2019</span>
          </div>
          <div className="flex justify-between items-baseline text-xs italic">
            <span>Amazon</span>
            <span>Seattle, WA</span>
          </div>
          <ul className="list-disc ml-4 mt-1.5 text-xs space-y-0.5">
            <li>
              Developed core AWS Lambda features including cold start
              optimization and custom runtime support, serving 50K+ enterprise
              customers globally
            </li>
            <li>
              Designed and implemented fault-tolerant distributed systems with
              99.99% uptime SLA using DynamoDB, SQS, and Step Functions
              orchestration
            </li>
          </ul>
        </div>
      </section>

      {/* Education */}
      <section className="mb-5">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
          Education
        </h2>
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-sm">Stanford University</span>
          <span className="text-xs">2013 - 2017</span>
        </div>
        <div className="text-xs italic">
          Bachelor of Science in Computer Science, Minor in Mathematics
        </div>
        <div className="text-xs text-gray-600">
          GPA: 3.9/4.0, Magna Cum Laude, Dean&apos;s List all semesters,
          Teaching Assistant for CS161 (Algorithms)
        </div>
      </section>

      {/* Projects */}
      <section className="mb-5">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
          Projects
        </h2>
        <div className="mb-2">
          <div className="flex justify-between items-baseline">
            <span>
              <span className="font-bold text-sm">CloudScale</span>
              <span className="text-xs italic">
                {" "}
                | Go, Kubernetes, gRPC, Prometheus
              </span>
            </span>
            <span className="text-xs">2023</span>
          </div>
          <ul className="list-disc ml-4 mt-1 text-xs space-y-0.5">
            <li>
              Built open-source auto-scaling solution for Kubernetes clusters
              with predictive scaling based on historical metrics and ML-based
              forecasting
            </li>
            <li>
              Achieved 2.5K+ GitHub stars and production adoption by 50+
              companies including several Fortune 500 enterprises for
              infrastructure cost optimization
            </li>
          </ul>
        </div>
        <div>
          <div className="flex justify-between items-baseline">
            <span>
              <span className="font-bold text-sm">DataFlow</span>
              <span className="text-xs italic">
                {" "}
                | Python, Apache Kafka, Redis, PostgreSQL
              </span>
            </span>
            <span className="text-xs">2022</span>
          </div>
          <ul className="list-disc ml-4 mt-1 text-xs space-y-0.5">
            <li>
              Developed real-time data streaming framework with exactly-once
              semantics, supporting 100K+ messages/sec with sub-millisecond
              latency guarantees
            </li>
          </ul>
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-sm md:text-base font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
          Technical Skills
        </h2>
        <div className="text-xs space-y-0.5">
          <p>
            <span className="font-bold">Languages:</span> Python, Java, Go,
            TypeScript, C++, SQL, Rust, Scala, JavaScript, Bash, GraphQL,
            Protocol Buffers
          </p>
          <p>
            <span className="font-bold">Frameworks:</span> React, Node.js,
            FastAPI, Spring Boot, TensorFlow, PyTorch, Django, Flask, Next.js,
            Express, gRPC
          </p>
          <p>
            <span className="font-bold">Cloud & Tools:</span> AWS (Lambda, EC2,
            S3, DynamoDB, SQS), GCP (BigQuery, Cloud Run, Pub/Sub), Docker,
            Kubernetes, Terraform
          </p>
          <p>
            <span className="font-bold">Databases:</span> PostgreSQL, MongoDB,
            Redis, DynamoDB, BigQuery, Cassandra, Elasticsearch, MySQL,
            InfluxDB, Neo4j
          </p>
        </div>
      </section>
    </div>
  );
}
