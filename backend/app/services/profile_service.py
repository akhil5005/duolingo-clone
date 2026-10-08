"""The learner profile: lifetime stats, achievement progress and recent XP."""

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import clock
from app.models.gamification import Achievement, UserAchievement
from app.models.user import User
from app.repositories import content_repo, progress_repo, xp_repo
from app.schemas.me import CourseBrief
from app.schemas.profile import (
    AchievementProgressOut,
    DailyXpOut,
    ProfileOut,
    ProfileStatsOut,
    ProfileUserOut,
)
from app.services import achievement_service, leaderboard_service, streak_service

XP_CHART_DAYS = 7


def build(db: Session, user: User) -> ProfileOut:
    streak = streak_service.effective_streak(user)
    metrics = achievement_service.current_metrics(db, user)

    unlocked = {
        row.achievement_id: row.unlocked_at
        for row in db.scalars(
            select(UserAchievement).where(UserAchievement.user_id == user.id)
        ).all()
    }
    achievements = [
        AchievementProgressOut(
            code=achievement.code,
            title=achievement.title,
            description=achievement.description,
            icon=achievement.icon,
            metric=achievement.metric,
            # Capped at the threshold so a progress bar never overflows.
            current=min(metrics.get(achievement.metric, 0), achievement.threshold),
            threshold=achievement.threshold,
            unlocked_at=unlocked.get(achievement.id),
        )
        for achievement in db.scalars(select(Achievement).order_by(Achievement.id)).all()
    ]

    today = clock.today()
    start = today - timedelta(days=XP_CHART_DAYS - 1)
    totals = xp_repo.totals_by_day(db, user.id, start, today)
    chart = [
        DailyXpOut(date=start + timedelta(days=offset), xp=totals.get(start + timedelta(days=offset), 0))
        for offset in range(XP_CHART_DAYS)
    ]

    course = content_repo.get_course(db, user.current_course_id)
    return ProfileOut(
        user=ProfileUserOut(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            avatar_color=user.avatar_color,
            course=(
                CourseBrief(
                    title=course.title,
                    flag_emoji=course.flag_emoji,
                    language_code=course.language_code,
                )
                if course
                else None
            ),
        ),
        stats=ProfileStatsOut(
            streak=streak,
            longest_streak=user.longest_streak,
            total_xp=user.total_xp,
            league=leaderboard_service.LEAGUE_NAME,
            top3_finishes=0,
            lessons_completed=progress_repo.count_lessons_completed(db, user.id),
            joined_at=user.created_at,
        ),
        achievements=achievements,
        xp_last_7_days=chart,
    )
