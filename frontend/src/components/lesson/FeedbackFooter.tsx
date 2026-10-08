"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

import { Button3D } from "@/components/ui/Button3D";
import type { AnswerResult } from "@/lib/types";

const PRAISE = ["Nicely done!", "Great job!", "Excellent!", "Correct!"];

interface FeedbackFooterProps {
  feedback: AnswerResult | null;
  canCheck: boolean;
  checking: boolean;
  onSkip: () => void;
  onCheck: () => void;
  onContinue: () => void;
  isLast: boolean;
}

/** Praise is derived from the answer so it stays stable across re-renders. */
function praiseFor(feedback: AnswerResult): string {
  return PRAISE[feedback.correct_answer.length % PRAISE.length] ?? PRAISE[0]!;
}

/**
 * The bar at the foot of the lesson: either the skip/check actions or the
 * verdict, never both.
 *
 * Deliberately no AnimatePresence. These two swap on every single answer, and
 * an exit animation that has not finished by the time the next swap arrives
 * leaves the slot empty. Only the verdict animates, on entry, keyed by the
 * answer so each new one slides in afresh.
 */
export function FeedbackFooter({
  feedback,
  canCheck,
  checking,
  onSkip,
  onCheck,
  onContinue,
  isLast,
}: FeedbackFooterProps) {
  const correct = feedback?.is_correct ?? false;

  return (
    <div
      className={clsx(
        "sticky bottom-0 min-h-[96px] border-t-2",
        feedback
          ? correct
            ? "border-brand/25 bg-correct"
            : "border-danger/25 bg-wrong"
          : "border-line bg-surface",
      )}
    >
      {feedback ? (
        <motion.div
          key={`${feedback.correct_answer}-${feedback.progress}`}
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          aria-live="assertive"
          className="mx-auto flex min-h-[96px] max-w-[1000px] flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:px-8"
        >
          <span
            aria-hidden
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              correct ? "bg-brand text-white" : "bg-danger text-white",
            )}
          >
            {correct ? <Check size={26} strokeWidth={4} /> : <X size={26} strokeWidth={4} />}
          </span>

          <div className="min-w-0 flex-1">
            <p className={clsx("text-lg", correct ? "text-brand-dark" : "text-danger-dark")}>
              {correct ? praiseFor(feedback) : "Correct solution:"}
            </p>
            <p
              className={clsx(
                "text-sm font-semibold",
                correct ? "text-brand-dark" : "text-danger-dark",
              )}
            >
              {correct ? feedback.note : feedback.correct_answer}
            </p>
          </div>

          <Button3D
            variant={correct ? "primary" : "danger"}
            size="lg"
            onClick={onContinue}
            className="md:w-44"
          >
            {isLast ? "Finish" : "Continue"}
          </Button3D>
        </motion.div>
      ) : (
        <div className="mx-auto flex min-h-[96px] max-w-[1000px] items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Button3D variant="outline" size="lg" onClick={onSkip} className="!text-muted">
            Skip
          </Button3D>
          <Button3D
            variant="primary"
            size="lg"
            disabled={!canCheck || checking}
            onClick={onCheck}
            className="w-44"
          >
            Check
          </Button3D>
        </div>
      )}
    </div>
  );
}
