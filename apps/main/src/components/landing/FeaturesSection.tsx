"use client";

import { motion } from "framer-motion";
import { Upload, MessageSquare, Rocket, Code2 } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Get data from anywhere",
    description:
      "Upload your resume, connect your GitHub, or import from LinkedIn. We extract and structure your professional data automatically.",
    imagePosition: "right" as const,
  },
  {
    icon: MessageSquare,
    title: "Stand out with chat mode",
    description:
      "Transform your portfolio into an interactive chat experience. Let visitors explore your work through natural conversation.",
    imagePosition: "left" as const,
  },
  {
    icon: Rocket,
    title: "Instant deploy for free",
    description:
      "One-click deployment to Vercel. Your portfolio goes live in seconds with a custom domain, completely free.",
    imagePosition: "right" as const,
  },
  {
    icon: Code2,
    title: "Customize with open-source control",
    description:
      "Fork the repository and customize every aspect. Full control over your portfolio design, features, and hosting.",
    imagePosition: "left" as const,
  },
];

const FADE_UP_VARIANTS = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export function FeaturesSection() {
  return (
    <section className="relative bg-background py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={FADE_UP_VARIANTS}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Build, customize, and deploy your portfolio in minutes
          </p>
        </motion.div>

        <div className="space-y-40">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isImageRight = feature.imagePosition === "right";

            return (
              <motion.div
                key={feature.title}
                className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-20 items-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={FADE_UP_VARIANTS}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Text Content */}
                <div
                  className={`${
                    isImageRight ? "lg:order-1" : "lg:order-2"
                  } lg:col-span-4 space-y-4`}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Image Placeholder */}
                <div
                  className={`${
                    isImageRight ? "lg:order-2" : "lg:order-1"
                  } lg:col-span-8 relative`}
                >
                  <div className="aspect-[16/10] rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-border overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-32 h-32 text-primary/20" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
