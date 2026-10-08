/** Mirrors of the backend response schemas. */

export interface CourseBrief {
  title: string;
  flag_emoji: string;
  language_code: string;
}

export interface Me {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  total_xp: number;
  gems: number;
  hearts: number;
  max_hearts: number;
  next_heart_at: string | null;
  server_now: string;
  streak: number;
  longest_streak: number;
  last_active_date: string | null;
  today_xp: number;
  daily_goal_xp: number;
  week_activity: boolean[];
  sound_enabled: boolean;
  course: CourseBrief | null;
}

export interface MePatch {
  display_name?: string;
  daily_goal_xp?: number;
  sound_enabled?: boolean;
}

export type SkillState = "locked" | "available" | "in_progress" | "completed";

export interface PathSkill {
  id: number;
  title: string;
  icon: string;
  state: SkillState;
  lessons_completed: number;
  total_lessons: number;
  next_lesson_id: number | null;
  legendary: boolean;
}

export interface PathUnit {
  id: number;
  order_index: number;
  title: string;
  description: string;
  color_hex: string;
  completed_skills: number;
  total_skills: number;
  skills: PathSkill[];
}

export interface LearningPath {
  course: CourseBrief;
  units: PathUnit[];
}

export type LeagueZone = "promotion" | "demotion" | "none";

export interface LeaderboardRow {
  rank: number;
  user_id: number;
  display_name: string;
  avatar_color: string;
  xp: number;
  is_me: boolean;
  zone: LeagueZone;
}

export interface Leaderboard {
  league_name: string;
  days_left: number;
  my_rank: number | null;
  promotion_cutoff: number;
  demotion_cutoff: number;
  rows: LeaderboardRow[];
}

export type ExerciseType =
  | "multiple_choice"
  | "translate"
  | "match_pairs"
  | "fill_blank"
  | "type_answer";

export interface MCOption {
  id: string;
  text: string;
  emoji: string | null;
}

interface ExerciseBase {
  id: number;
  order_index: number;
  prompt: string;
  tts_text: string | null;
  tts_lang: string | null;
}

/**
 * The exercise shapes the client sees. Discriminated on `type` so the renderer
 * can narrow to one payload and TypeScript enforces that every type is handled.
 * Answer keys are stripped server-side and have no place in these types.
 */
export type PublicExercise = ExerciseBase &
  (
    | { type: "multiple_choice"; payload: { question: string; options: MCOption[] } }
    | {
        type: "translate";
        payload: {
          source_text: string;
          source_lang: string;
          target_lang: string;
          tokens: string[];
        };
      }
    | { type: "match_pairs"; payload: { left: string[]; right: string[] } }
    | {
        type: "fill_blank";
        payload: { before: string; after: string; options: string[]; translation: string };
      }
    | { type: "type_answer"; payload: { source_text: string; target_lang: string } }
  );

export type MatchedPair = { left: string; right: string };

export type ExerciseAnswer =
  | { option_id: string }
  | { tokens: string[] }
  | { pairs: MatchedPair[] }
  | { choice: string }
  | { text: string };

export type SessionMode = "lesson" | "practice" | "legendary";
export type SessionStatus = "active" | "completed" | "failed" | "abandoned";

export interface LessonSession {
  session_id: string;
  mode: SessionMode;
  skill_id: number;
  skill_title: string;
  lesson_id: number | null;
  exercises: PublicExercise[];
  queue: number[];
  hearts: number;
  max_hearts: number;
  total_exercises: number;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  note: string | null;
  hearts: number;
  session_status: SessionStatus;
  progress: number;
  queue: number[];
}

export interface XpLine {
  label: string;
  amount: number;
}

export interface UnlockedAchievement {
  code: string;
  title: string;
  description: string;
  icon: string;
}

export interface Completion {
  xp_breakdown: XpLine[];
  xp_earned: number;
  total_xp: number;
  accuracy: number;
  duration_seconds: number;
  streak_before: number;
  streak_after: number;
  streak_extended_today: boolean;
  week_activity: boolean[];
  daily_goal: { today_xp: number; goal: number; reached: boolean; just_reached: boolean };
  hearts: number;
  new_achievements: UnlockedAchievement[];
  skill: { id: number; state: SkillState; lessons_completed: number; total_lessons: number };
}
