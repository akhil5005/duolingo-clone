# lingoleap — specification

The behaviour contract this implementation is built against. The README covers setup,
architecture and deployment; this file is the reference for the rules themselves.

## Scope

Recreate Duolingo's lesson loop and gamification: a unit/skill path with lock-unlock
progression, a lesson player with five exercise types and the signature feedback bar, hearts,
XP, a daily streak, a daily goal, a weekly league and achievements. Everything persists per
learner. Content is one seeded course (Spanish for English speakers).

Deliberately mocked, with "Coming Soon" placeholders: speech recognition, in-app purchases and
Super, friends/social, extra languages. Authentication is simplified to one default learner.

## Clock

`app/core/clock.py` is the only source of time. `today()` is the current date in
`APP_TIMEZONE` plus a `day_offset` persisted in `app_state`, which is what the "Simulate next
day" developer tool moves. Any use of `datetime.now()` elsewhere is a bug.

## Progression

- Skills are ordered globally by `(unit.order_index, skill.order_index)`.
- The first skill is always available; skill _n+1_ unlocks when skill _n_ is complete.
- Skill state is **derived**, never stored: `locked` | `available` (0 lessons done) |
  `in_progress` | `completed` (all lessons done).
- The progress ring is `lessons_completed / total_lessons`; a completed skill shows a crown.
- Starting a node starts its first uncompleted lesson. Completed skills offer Practice and
  Legendary instead.

## Lesson sessions

The queue lives on the server so XP cannot be faked.

1. `POST /api/lessons/{id}/sessions` creates an `active` session whose `exercise_queue` is the
   lesson's exercise ids in order, and returns them as answer-free `PublicExercise` objects.
   Refused with `409` when hearts are at 0 in lesson mode.
2. `POST /api/sessions/{id}/answers` must target the head of the queue (`409` otherwise).
   Correct → the id moves to `answered_correct`. Wrong → the id is re-appended to the end of
   the queue (Duolingo re-asks mistakes), `mistakes` increments, and in lesson mode one heart
   is spent after regeneration is applied. Hearts reaching 0 in lesson mode fails the session;
   any mistake fails a legendary session.
3. `POST /api/sessions/{id}/complete` (`409` while the queue is non-empty) awards XP, advances
   skill progress, updates the streak, grants a heart in practice mode and evaluates
   achievements — all in one transaction.
4. `POST /api/sessions/{id}/abandon` marks the session `abandoned`; hearts already spent stay
   spent.

## XP

| Mode      | XP                                                   |
| --------- | ---------------------------------------------------- |
| Lesson    | `lesson.xp_reward` (10) + 5 bonus for zero mistakes  |
| Practice  | 5                                                    |
| Legendary | 40, and stamps `legendary_at` on the skill            |

Each award is one or more `xp_events` rows (the bonus is its own row) plus an increment of the
denormalised `users.total_xp`. The ledger is the single source of truth for the daily goal, the
weekly league and the 7-day chart.

## Hearts

Maximum 5. Regeneration is lazy, recomputed whenever the learner row is read or written:
`gained = floor((now - hearts_updated_at) / HEART_REGEN_MINUTES)`, capped at the maximum. When
the learner fills up, `hearts_updated_at` is reset to now; otherwise it advances by exactly
`gained * HEART_REGEN_MINUTES` so leftover time is not lost. `next_heart_at` is `null` when
full. A refill costs 350 (mocked) gems and returns `402` when the learner cannot afford it.
Practice never spends hearts and grants one on completion.

## Streak

On completing any session today: active today → unchanged; active yesterday → `+1`; otherwise
reset to 1. `longest_streak` tracks the maximum. On read, a `last_active_date` older than
yesterday means the streak is broken and is persisted as 0. The completion response reports
`streak_before`, `streak_after`, `streak_extended_today` and a Monday-to-Sunday
`week_activity` array for the streak screen.

## Daily goal

`today_xp` is the sum of `xp_events` for `today()`. The goal is one of 10 / 20 / 30 / 50 and is
editable in settings. The completion response flags `just_reached` so the UI can celebrate once.

## Weekly league

Monday to Sunday, based on `today()`. All users are ranked by their XP this week, ties broken by
display name. Top 5 is the promotion zone, bottom 3 the demotion zone.

## Achievements

Eight seeded achievements over five metrics (`lessons_completed`, `streak`, `total_xp`,
`perfect_lessons`, `units_completed`), evaluated after every completed session; newly unlocked
ones come back in `new_achievements`.

## Exercises and answer checking

Five types: `multiple_choice`, `translate` (word bank), `match_pairs`, `fill_blank`,
`type_answer`. Each payload is a JSON blob validated by a Pydantic discriminated union keyed on
`exercises.type`, and each payload knows how to project itself to a client-safe version — answer
keys never leave the server.

`answer_checker` is pure (no database). Normalisation lowercases, trims, collapses whitespace
and strips punctuation. `type_answer` accepts an exact normalised match, an accent-insensitive
match (noted as "Pay attention to the accents."), or a single-character Levenshtein distance on
answers longer than four characters (noted as "You have a typo."). `match_pairs` is graded on
the complete mapping: wrong taps are handled in the UI with a shake and cost no hearts.

## Assumptions

Recorded in the README. The notable ones: a single default learner resolved by
`get_current_user`, mocked gems, `match_pairs` costing no hearts for individual wrong taps,
and an ephemeral SQLite file on the free host that re-seeds itself on boot.
