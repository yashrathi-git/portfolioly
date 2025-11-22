"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-6 text-left transition-colors hover:text-primary"
      >
        <span className="text-lg font-medium">{question}</span>
        <span className="ml-4 flex-shrink-0">
          {isOpen ? (
            <Minus className="h-5 w-5 text-primary" />
          ) : (
            <Plus className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-muted-foreground leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const faqs = [
  {
    question: "Is it really completely free to use?",
    answer:
      "Yes! Portfolioly is open-source and free to use. You can deploy your portfolio directly to GitHub Pages or Vercel without any cost. We believe in empowering developers to showcase their work without barriers.",
  },
  {
    question: "What happens to my data?",
    answer:
      "Your data is yours. Portfolioly runs entirely on your local machine or within your own cloud environment if you choose to self-host. We don't store any of your personal information or portfolio content on our servers.",
  },
  {
    question: "How can I customize the portfolio?",
    answer:
      "You have complete control! Since the code is open-source, you can fork the repository and modify any part of the codebase. We also provide a set of built-in themes and layout options to get you started quickly without touching code if you prefer.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Portfolioly.
          </p>
        </div>
        <div className="divide-y divide-border/40 border-t border-border/40">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
