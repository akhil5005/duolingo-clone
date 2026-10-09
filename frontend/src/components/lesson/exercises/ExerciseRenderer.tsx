"use client";

import { FillBlank } from "@/components/lesson/exercises/FillBlank";
import { MatchPairs } from "@/components/lesson/exercises/MatchPairs";
import { MultipleChoice } from "@/components/lesson/exercises/MultipleChoice";
import { TranslateWordBank } from "@/components/lesson/exercises/TranslateWordBank";
import { TypeAnswer } from "@/components/lesson/exercises/TypeAnswer";
import type { ExerciseAnswer, MatchedPair, PublicExercise } from "@/lib/types";

interface ExerciseRendererProps {
  exercise: PublicExercise;
  draft: ExerciseAnswer | null;
  onChange: (answer: ExerciseAnswer | null) => void;
  disabled: boolean;
  /**
   * The language being learnt, e.g. "es". Tiles written in it are tagged for
   * screen readers and spoken aloud when tapped, the way Duolingo pronounces
   * a word as you pick it. Tiles in English get neither.
   */
  courseLang: string;
}

/**
 * Picks the component for an exercise and translates between its local shape
 * and the answer body the API expects. The switch is exhaustive over the
 * discriminated union, so a new exercise type fails to compile until it is
 * handled here.
 */
export function ExerciseRenderer({
  exercise,
  draft,
  onChange,
  disabled,
  courseLang,
}: ExerciseRendererProps) {
  switch (exercise.type) {
    case "multiple_choice":
      return (
        <MultipleChoice
          payload={exercise.payload}
          value={draft && "option_id" in draft ? draft.option_id : null}
          onChange={(optionId) => onChange(optionId ? { option_id: optionId } : null)}
          disabled={disabled}
          lang={courseLang}
        />
      );

    case "translate":
      return (
        <TranslateWordBank
          key={exercise.id}
          payload={exercise.payload}
          onChange={(tokens) => onChange(tokens ? { tokens } : null)}
          disabled={disabled}
          // Tokens are written in the side being built, which is English on a
          // "write this in English" exercise. Only speak the language we teach.
          lang={exercise.payload.target_lang === courseLang ? courseLang : null}
        />
      );

    case "match_pairs":
      return (
        <MatchPairs
          payload={exercise.payload}
          value={draft && "pairs" in draft ? (draft.pairs as MatchedPair[]) : []}
          onChange={(pairs) => onChange(pairs.length ? { pairs } : null)}
          disabled={disabled}
          lang={courseLang}
        />
      );

    case "fill_blank":
      return (
        <FillBlank
          payload={exercise.payload}
          value={draft && "choice" in draft ? draft.choice : null}
          onChange={(choice) => onChange(choice ? { choice } : null)}
          disabled={disabled}
          lang={courseLang}
        />
      );

    case "type_answer":
      return (
        <TypeAnswer
          key={exercise.id}
          payload={exercise.payload}
          value={draft && "text" in draft ? draft.text : ""}
          onChange={(text) => onChange(text.trim() ? { text } : null)}
          disabled={disabled}
        />
      );
  }
}

/** True once the learner has given an answer complete enough to check. */
export function isAnswerReady(exercise: PublicExercise, draft: ExerciseAnswer | null): boolean {
  if (!draft) return false;
  if (exercise.type === "match_pairs") {
    return "pairs" in draft && draft.pairs.length === exercise.payload.left.length;
  }
  return true;
}

/**
 * A deliberately wrong but well-formed answer, used by the Skip button.
 *
 * Skipping counts as a mistake in Duolingo, so rather than adding a "skip"
 * path to the API the client simply submits an answer that cannot be right.
 */
export function skipAnswerFor(exercise: PublicExercise): ExerciseAnswer {
  switch (exercise.type) {
    case "multiple_choice":
      return { option_id: "" };
    case "translate":
      return { tokens: [] };
    case "match_pairs":
      return { pairs: [{ left: "", right: "" }] };
    case "fill_blank":
      return { choice: "" };
    case "type_answer":
      return { text: "" };
  }
}
