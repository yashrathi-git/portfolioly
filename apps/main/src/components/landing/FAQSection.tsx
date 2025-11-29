"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/utils/links";

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
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

const linkClass = "text-primary hover:underline";

const faqs: { question: string; answer: React.ReactNode }[] = [
  {
    question: "Is it free?",
    answer: "Yes, it is completely free to use. No watermarks! No paywall.",
  },
  {
    question: "Is it open-source?",
    answer: (
      <>
        Yes! Check out our{" "}
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          GitHub repository
        </a>
        .
      </>
    ),
  },
  {
    question: "How to customize the portfolio after generation?",
    answer:
      "You can fork the template code and customize it yourself once you have generated your portfolio. We are also looking to add more templates quickly.",
  },
  {
    question: "How to get help?",
    answer:
      "You can open an issue on GitHub or reach out through the repository discussions. We're always happy to help!",
  },
  {
    question: "I want to report an issue",
    answer: (
      <>
        You can open an issue on{" "}
        <a
          href={`${GITHUB_REPO_URL}/issues`}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          GitHub Issues
        </a>
        .
      </>
    ),
  },
  {
    question: "Which AI models does it use?",
    answer: "We mainly use GPT-5-mini and GPT-5.1 models.",
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
