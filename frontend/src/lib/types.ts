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
