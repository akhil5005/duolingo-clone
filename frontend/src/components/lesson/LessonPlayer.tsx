"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CompletionScreen } from "@/components/lesson/end/CompletionScreen";
import { FailedScreen } from "@/components/lesson/end/FailedScreen";
import { StreakScreen } from "@/components/lesson/end/StreakScreen";
import {
  ExerciseRenderer,
  isAnswerReady,
  skipAnswerFor,
} from "@/components/lesson/exercises/ExerciseRenderer";
import { FeedbackFooter } from "@/components/lesson/FeedbackFooter";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { OutOfHeartsModal } from "@/components/lesson/modals/OutOfHeartsModal";
import { QuitModal } from "@/components/lesson/modals/QuitModal";
import { SpeakerButton } from "@/components/lesson/SpeakerButton";
import { Mascot } from "@/components/mascot/Mascot";
import { useToast } from "@/components/ui/Toast";
import { useKeyPress } from "@/hooks/useKeyboard";
import { useLessonSession } from "@/hooks/useLessonSession";
import { useMe } from "@/hooks/useMe";
import type { PublicExercise, SessionMode } from "@/lib/types";

interface LessonPlayerProps {
  mode: SessionMode;
  lessonId: string;
  skillId: number;
}

/** Sentence prompts read better coming out of the mascot's mouth. */
function PromptBubble({ exercise }: { exercise: PublicExercise }) {
  if (exercise.type !== "translate") return null;

  return (
    <div className="mb-6 flex items-end gap-3">
      <Mascot expression="happy" size={76} animate={false} className="shrink-0" />
      <p
        lang={exercise.payload.source_lang}
        className="relative rounded-2xl border-2 border-line bg-surface px-4 py-3 text-lg"
      >
        {exercise.payload.source_text}
        <span className="absolute -left-[9px] bottom-4 h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-line bg-surface" />
      </p>
      {exercise.tts_text && exercise.tts_lang && (
        <SpeakerButton text={exercise.tts_text} lang={exercise.tts_lang} />
      )}
    </div>
  );
}

export function LessonPlayer({ mode, lessonId, skillId }: LessonPlayerProps) {
  const router = useRouter();
  const toast = useToast();
  const { data: me } = useMe();
  const [quitOpen, setQuitOpen] = useState(false);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const celebrated = useRef(false);

  const lesson = useLessonSession({
    mode,
    lessonId,
    skillId,
    soundEnabled: me?.sound_enabled ?? true,
    attempt,
  });

  /**
   * Deal a fresh session for the same lesson. Both callers reach here with the
   * old session already failed server-side: a gem refill (which is only worth
   * anything if the lesson actually resumes) and a legendary retry.
   */
  const restartLesson = () => {
    celebrated.current = false;
    setOutOfHearts(false);
    setAttempt((current) => current + 1);
  };

  const courseLang = me?.course?.language_code ?? "es";
  const { current, draft, phase, feedback, summary, check, submit, advance, setDraft } = lesson;
  const ready = current ? isAnswerReady(current, draft) : false;
  const isLastExercise = lesson.queue.length === 0;

  // Matching is graded on the complete mapping, so there is nothing left to
  // confirm once every tile has a partner.
  useEffect(() => {
    if (phase === "answering" && current?.type === "match_pairs" && ready) void check();
  }, [check, current?.type, phase, ready]);

  useKeyPress(
    "Enter",
    () => {
      if (phase === "feedback") advance();
      else if (phase === "answering" && ready) void check();
    },
    { enabled: !quitOpen && phase !== "done", allowWhileTyping: true },
  );

  useEffect(() => {
    if (!summary || celebrated.current) return;
    celebrated.current = true;

    if (summary.daily_goal.just_reached) {
      toast({
        variant: "success",
        icon: "\u{1F3AF}",
        title: "Daily goal complete!",
        description: `${summary.daily_goal.goal} XP earned today`,
      });
    }
    for (const achievement of summary.new_achievements) {
      toast({
        variant: "achievement",
        icon: achievement.icon,
        title: achievement.title,
        description: achievement.description,
      });
    }
  }, [summary, toast]);

  const leave = () => router.push("/learn");

  const quit = async () => {
    await lesson.abandon();
    leave();
  };

  if (lesson.error && !lesson.session) {
    const noHearts = lesson.errorCode === "NO_HEARTS";
    return noHearts ? (
      <OutOfHeartsModal open skillId={skillId} onRefilled={restartLesson} />
    ) : (
      <FailedScreen title="We could not start this lesson" description={lesson.error} onLeave={leave} />
    );
  }

  if (phase === "loading" || !lesson.session) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4">
        <Mascot expression="thinking" size={120} />
        <p className="text-sm font-semibold text-muted">Getting your lesson ready…</p>
      </div>
    );
  }

  if (phase === "failed" && mode === "legendary") {
    return (
      <FailedScreen
        title="Legendary attempt over"
        description="A legendary challenge ends on the first mistake. Give it another go whenever you are ready."
        onRetry={restartLesson}
        onLeave={leave}
      />
    );
  }

  if (phase === "done" && summary) {
    if (showStreak) {
      return <StreakScreen summary={summary} onContinue={leave} />;
    }
    return (
      <CompletionScreen
        summary={summary}
        onContinue={() => (summary.streak_extended_today ? setShowStreak(true) : leave())}
      />
    );
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[1000px] flex-col overflow-hidden">
      <LessonHeader
        mode={lesson.session.mode}
        progress={lesson.progress}
        hearts={lesson.hearts}
        comboMilestone={lesson.comboMilestone}
        onQuit={() => setQuitOpen(true)}
      />

      <main className="flex flex-1 flex-col justify-center overflow-y-auto px-4 pb-8 pt-4 md:px-8">
        {current && (
          <>
            <h1 className="mb-6 text-2xl md:text-3xl">{current.prompt}</h1>
            <PromptBubble exercise={current} />
            <ExerciseRenderer
              exercise={current}
              draft={draft}
              onChange={setDraft}
              disabled={phase !== "answering"}
              courseLang={courseLang}
            />
          </>
        )}
      </main>

      <FeedbackFooter
        feedback={phase === "feedback" || phase === "failed" ? feedback : null}
        canCheck={ready}
        checking={phase === "checking" || phase === "finishing"}
        isLast={isLastExercise}
        onSkip={() => current && void submit(skipAnswerFor(current))}
        onCheck={() => void check()}
        onContinue={() => (phase === "failed" ? setOutOfHearts(true) : advance())}
      />

      <QuitModal open={quitOpen} onStay={() => setQuitOpen(false)} onQuit={() => void quit()} />
      <OutOfHeartsModal
        open={outOfHearts}
        skillId={lesson.session.skill_id}
        onRefilled={restartLesson}
      />
    </div>
  );
}
