"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import { LEADERBOARD_KEY } from "@/hooks/useLeaderboard";
import { ME_KEY } from "@/hooks/useMe";
import { PATH_KEY } from "@/hooks/usePath";
import { ApiError, apiPost } from "@/lib/api";
import { sounds } from "@/lib/sounds";
import type {
  AnswerResult,
  Completion,
  ExerciseAnswer,
  LessonSession,
  PublicExercise,
  SessionMode,
} from "@/lib/types";

/** Combo milestones that pop the "N in a row" badge. */
const COMBO_MILESTONES = [3, 5, 10, 15, 20];

export type LessonPhase =
  | "loading"
  | "answering"
  | "checking"
  | "feedback"
  | "finishing"
  | "failed"
  | "done";

interface State {
  phase: LessonPhase;
  session: LessonSession | null;
  queue: number[];
  /** The exercise on screen. Held separately from the queue head so the
   *  feedback bar keeps showing the exercise that was just answered. */
  activeId: number | null;
  hearts: number;
  draft: ExerciseAnswer | null;
  feedback: AnswerResult | null;
  combo: number;
  summary: Completion | null;
  error: string | null;
  errorCode: string | null;
}

type Action =
  | { type: "started"; session: LessonSession }
  | { type: "draft"; draft: ExerciseAnswer | null }
  | { type: "checking" }
  | { type: "checked"; result: AnswerResult }
  | { type: "next" }
  | { type: "finishing" }
  | { type: "finished"; summary: Completion }
  | { type: "failed"; message: string; code: string }
  | { type: "reset" };

const INITIAL: State = {
  phase: "loading",
  session: null,
  queue: [],
  activeId: null,
  hearts: 0,
  draft: null,
  feedback: null,
  combo: 0,
  summary: null,
  error: null,
  errorCode: null,
};

/**
 * answering -> checking -> feedback -> (answering | finishing | failed) -> done
 *
 * The server owns correctness, so "checking" is a real round trip rather than an
 * optimistic update: a client that could decide its own answers could mint XP.
 */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "started":
      return {
        ...INITIAL,
        phase: "answering",
        session: action.session,
        queue: action.session.queue,
        activeId: action.session.queue[0] ?? null,
        hearts: action.session.hearts,
      };
    case "draft":
      return state.phase === "answering" ? { ...state, draft: action.draft } : state;
    case "checking":
      return { ...state, phase: "checking" };
    case "checked":
      return {
        ...state,
        phase: action.result.session_status === "failed" ? "failed" : "feedback",
        feedback: action.result,
        queue: action.result.queue,
        hearts: action.result.hearts,
        combo: action.result.is_correct ? state.combo + 1 : 0,
      };
    case "next":
      return {
        ...state,
        phase: "answering",
        activeId: state.queue[0] ?? null,
        draft: null,
        feedback: null,
      };
    case "finishing":
      return { ...state, phase: "finishing" };
    case "finished":
      return { ...state, phase: "done", summary: action.summary, hearts: action.summary.hearts };
    case "failed":
      return { ...state, error: action.message, errorCode: action.code };
    case "reset":
      return INITIAL;
    default:
      return state;
  }
}

function startPath(mode: SessionMode, lessonId: string, skillId: number): string {
  if (mode === "practice") return `/api/skills/${skillId}/practice`;
  if (mode === "legendary") return `/api/skills/${skillId}/legendary`;
  return `/api/lessons/${lessonId}/sessions`;
}

interface UseLessonSessionOptions {
  mode: SessionMode;
  lessonId: string;
  skillId: number;
  soundEnabled: boolean;
  /**
   * Bumped to ask for a brand new session, which is what a gem refill needs:
   * the server has already marked the old one failed, so there is nothing to
   * resume and the player has to deal a fresh hand.
   */
  attempt?: number;
}

export function useLessonSession({
  mode,
  lessonId,
  skillId,
  soundEnabled,
  attempt = 0,
}: UseLessonSessionOptions) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const queryClient = useQueryClient();
  const startedAttempt = useRef<number | null>(null);

  useEffect(() => {
    if (startedAttempt.current === attempt) return;
    startedAttempt.current = attempt;

    dispatch({ type: "reset" });
    apiPost<LessonSession>(startPath(mode, lessonId, skillId))
      .then((session) => dispatch({ type: "started", session }))
      .catch((error: unknown) =>
        dispatch({
          type: "failed",
          message: error instanceof ApiError ? error.message : "Could not start this lesson.",
          code: error instanceof ApiError ? error.code : "UNKNOWN",
        }),
      );
  }, [mode, lessonId, skillId, attempt]);

  const exercisesById = useMemo(
    () =>
      new Map<number, PublicExercise>(
        (state.session?.exercises ?? []).map((exercise) => [exercise.id, exercise]),
      ),
    [state.session],
  );
  const current = state.activeId === null ? null : (exercisesById.get(state.activeId) ?? null);

  const setDraft = useCallback((draft: ExerciseAnswer | null) => {
    dispatch({ type: "draft", draft });
  }, []);

  const submit = useCallback(
    async (answer: ExerciseAnswer) => {
      if (!state.session || !current || state.phase !== "answering") return;
      dispatch({ type: "checking" });
      try {
        const result = await apiPost<AnswerResult>(
          `/api/sessions/${state.session.session_id}/answers`,
          { exercise_id: current.id, answer },
        );
        if (soundEnabled) (result.is_correct ? sounds.correct : sounds.wrong)();
        dispatch({ type: "checked", result });
      } catch (error) {
        dispatch({
          type: "failed",
          message: error instanceof ApiError ? error.message : "We could not check that answer.",
          code: error instanceof ApiError ? error.code : "UNKNOWN",
        });
      }
    },
    [current, soundEnabled, state.phase, state.session],
  );

  const check = useCallback(async () => {
    if (state.draft) await submit(state.draft);
  }, [state.draft, submit]);

  const finish = useCallback(async () => {
    if (!state.session) return;
    dispatch({ type: "finishing" });
    try {
      const summary = await apiPost<Completion>(
        `/api/sessions/${state.session.session_id}/complete`,
      );
      if (soundEnabled) sounds.complete();
      dispatch({ type: "finished", summary });
      // Every header figure and the path itself moved; refetch them all.
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
      void queryClient.invalidateQueries({ queryKey: PATH_KEY });
      void queryClient.invalidateQueries({ queryKey: LEADERBOARD_KEY });
    } catch (error) {
      dispatch({
        type: "failed",
        message: error instanceof ApiError ? error.message : "We could not save your progress.",
        code: error instanceof ApiError ? error.code : "UNKNOWN",
      });
    }
  }, [queryClient, soundEnabled, state.session]);

  const advance = useCallback(() => {
    if (state.queue.length === 0) {
      void finish();
      return;
    }
    dispatch({ type: "next" });
  }, [finish, state.queue.length]);

  const abandon = useCallback(async () => {
    if (!state.session) return;
    try {
      await apiPost(`/api/sessions/${state.session.session_id}/abandon`);
    } finally {
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
    }
  }, [queryClient, state.session]);

  const answered = state.session ? state.session.total_exercises - state.queue.length : 0;

  return {
    ...state,
    current,
    answered,
    progress: state.session ? answered / state.session.total_exercises : 0,
    comboMilestone: COMBO_MILESTONES.includes(state.combo) ? state.combo : null,
    setDraft,
    check,
    submit,
    advance,
    abandon,
  };
}
