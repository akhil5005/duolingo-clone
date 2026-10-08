"""Assembling the current learner's header state."""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.core import clock
from app.models.user import MAX_HEARTS, User
from app.repositories import content_repo, xp_repo
from app.schemas.me import CourseBrief, MeOut, MeUpdate
from app.services import hearts_service, streak_service, xp_service


def build(db: Session, user: User) -> MeOut:
    """Read-with-side-effects: hearts regen and streak breaks are applied here.

    Both rules are time-based, so the honest moment to settle them is whenever
    the learner's state is observed. The caller commits.
    """
    hearts_service.apply_regen(user)
    streak = streak_service.effective_streak(user)

    monday = clock.start_of_week()
    active_days = xp_repo.active_days(db, user.id, monday, monday + timedelta(days=6))

    course = content_repo.get_course(db, user.current_course_id)
    return MeOut(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_color=user.avatar_color,
        total_xp=user.total_xp,
        gems=user.gems,
        hearts=user.hearts,
        max_hearts=MAX_HEARTS,
        next_heart_at=hearts_service.next_heart_at(user),
        server_now=clock.now(),
        streak=streak,
        longest_streak=user.longest_streak,
        last_active_date=user.last_active_date,
        today_xp=xp_service.today_xp(db, user.id),
        daily_goal_xp=user.daily_goal_xp,
        week_activity=streak_service.week_activity(active_days, monday),
        sound_enabled=user.sound_enabled,
        course=(
            CourseBrief(
                title=course.title,
                flag_emoji=course.flag_emoji,
                language_code=course.language_code,
            )
            if course
            else None
        ),
    )


def update(db: Session, user: User, patch: MeUpdate) -> MeOut:
    if patch.display_name is not None:
        user.display_name = patch.display_name.strip()
    if patch.daily_goal_xp is not None:
        user.daily_goal_xp = patch.daily_goal_xp
    if patch.sound_enabled is not None:
        user.sound_enabled = patch.sound_enabled
    return build(db, user)


def refill_hearts(db: Session, user: User) -> MeOut:
    hearts_service.refill(user)
    return build(db, user)
