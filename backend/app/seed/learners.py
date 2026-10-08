"""Demo learners, their XP history and the achievement catalogue.

Everything date-based is generated relative to ``clock.today()``. The free-tier
host wipes the SQLite file whenever it redeploys or spins down, so the app
re-seeds itself on boot — and the demo has to look alive on whatever day that
happens, not on the day this file was written.
"""

import random
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import clock
from app.models.course import Course
from app.models.enums import AchievementMetric, XpSource
from app.models.gamification import Achievement, UserAchievement, XpEvent
from app.models.progress import UserSkillProgress
from app.models.user import User

DEFAULT_USERNAME = "akhil"

ACHIEVEMENTS: list[dict[str, object]] = [
    {"code": "first_steps", "title": "First Steps", "icon": "\U0001F423",
     "description": "Complete your first lesson",
     "metric": AchievementMetric.LESSONS_COMPLETED, "threshold": 1},
    {"code": "scholar_10", "title": "Dedicated Learner", "icon": "\U0001F4DA",
     "description": "Complete 10 lessons",
     "metric": AchievementMetric.LESSONS_COMPLETED, "threshold": 10},
    {"code": "wildfire_3", "title": "Wildfire I", "icon": "\U0001F525",
     "description": "Reach a 3 day streak",
     "metric": AchievementMetric.STREAK, "threshold": 3},
    {"code": "wildfire_7", "title": "Wildfire II", "icon": "\U0001F30B",
     "description": "Reach a 7 day streak",
     "metric": AchievementMetric.STREAK, "threshold": 7},
    {"code": "sage_100", "title": "Sage I", "icon": "⚡",
     "description": "Earn 100 XP", "metric": AchievementMetric.TOTAL_XP, "threshold": 100},
    {"code": "sage_500", "title": "Sage II", "icon": "\U0001F31F",
     "description": "Earn 500 XP", "metric": AchievementMetric.TOTAL_XP, "threshold": 500},
    {"code": "sharpshooter", "title": "Sharpshooter", "icon": "\U0001F3AF",
     "description": "Finish a lesson without a single mistake",
     "metric": AchievementMetric.PERFECT_LESSONS, "threshold": 1},
    {"code": "unit_master", "title": "Unit Master", "icon": "\U0001F451",
     "description": "Complete every skill in a unit",
     "metric": AchievementMetric.UNITS_COMPLETED, "threshold": 1},
]

# (display_name, username, avatar_color) - rivals for the Bronze League.
RIVALS: list[tuple[str, str, str]] = [
    ("Aarav Sharma", "aarav_sharma", "#FF9600"),
    ("Priya Nair", "priya_nair", "#CE82FF"),
    ("Rohan Mehta", "rohan_mehta", "#1CB0F6"),
    ("Ananya Iyer", "ananya_iyer", "#FF4B4B"),
    ("Kabir Singh", "kabir_singh", "#58CC02"),
    ("Meera Krishnan", "meera_krishnan", "#FFC800"),
    ("Dev Patel", "dev_patel", "#2B70C9"),
    ("Sofía Ramírez", "sofia_ramirez", "#EC4899"),
    ("Luca Moretti", "luca_moretti", "#14B8A6"),
    ("Emma Dubois", "emma_dubois", "#A855F7"),
    ("Noah Becker", "noah_becker", "#F97316"),
    ("Yuki Tanaka", "yuki_tanaka", "#0EA5E9"),
    ("Chloe Dupont", "chloe_dupont", "#D946EF"),
    ("Omar Haddad", "omar_haddad", "#22C55E"),
]

# Multipliers applied to the learner's weekly XP so seven rivals sit above and
# seven below, which puts the demo learner in the middle of the league table.
RIVAL_FACTORS = (0.15, 0.3, 0.45, 0.6, 0.75, 0.85, 0.95,
                 1.1, 1.25, 1.45, 1.7, 2.0, 2.4, 2.9)
MIN_WEEKLY_XP = 20
MAX_WEEKLY_XP = 600
LEAGUE_ANCHOR_XP = 180  # used early in the week, when nobody has much XP yet

# The learner's four previous active days (yesterday backwards) and their XP.
LEARNER_XP_HISTORY = (50, 70, 60, 60)


def seed_achievements(db: Session) -> None:
    existing = set(db.scalars(select(Achievement.code)).all())
    for row in ACHIEVEMENTS:
        if row["code"] in existing:
            continue
        db.add(Achievement(**row))
    db.flush()


def _add_xp(db: Session, user: User, amount: int, days_ago: int) -> None:
    day = clock.today() - timedelta(days=days_ago)
    db.add(
        XpEvent(
            user_id=user.id,
            amount=amount,
            source=XpSource.LESSON,
            activity_date=day,
            created_at=clock.naive_now() - timedelta(days=days_ago),
        )
    )


def seed_default_learner(db: Session, course: Course) -> User:
    """The learner the app logs in as, pre-loaded with believable progress."""
    now = clock.naive_now()
    user = User(
        username=DEFAULT_USERNAME,
        display_name="Akhil",
        avatar_color="#1CB0F6",
        is_default_learner=True,
        current_course_id=course.id,
        total_xp=sum(LEARNER_XP_HISTORY),
        gems=500,
        hearts=4,
        # One heart is already part-way through regenerating, so the hearts
        # popover has a live countdown to show.
        hearts_updated_at=now - timedelta(minutes=20),
        streak_count=len(LEARNER_XP_HISTORY),
        longest_streak=len(LEARNER_XP_HISTORY),
        # Yesterday, not today: finishing one lesson now plays the streak screen.
        last_active_date=clock.today() - timedelta(days=1),
        daily_goal_xp=20,
        sound_enabled=True,
        created_at=now - timedelta(days=12),
    )
    db.add(user)
    db.flush()

    for days_ago, amount in enumerate(reversed(LEARNER_XP_HISTORY), start=1):
        _add_xp(db, user, amount, days_ago)

    first_skill, second_skill = course.units[0].skills[0], course.units[0].skills[1]
    db.add(
        UserSkillProgress(
            user_id=user.id,
            skill_id=first_skill.id,
            lessons_completed=len(first_skill.lessons),
            completed_at=now - timedelta(days=2),
        )
    )
    db.add(
        UserSkillProgress(user_id=user.id, skill_id=second_skill.id, lessons_completed=1)
    )

    unlocked = db.scalars(
        select(Achievement).where(Achievement.code.in_(["first_steps", "wildfire_3"]))
    ).all()
    for achievement in unlocked:
        db.add(
            UserAchievement(
                user_id=user.id, achievement_id=achievement.id, unlocked_at=now - timedelta(days=2)
            )
        )
    db.flush()
    return user


def _spread_over_week(total: int, day_count: int, rng: random.Random) -> list[int]:
    """Split a weekly total across the days elapsed so far, summing exactly."""
    weights = [rng.random() + 0.2 for _ in range(day_count)]
    scale = sum(weights)
    amounts = [int(total * weight / scale) for weight in weights]
    amounts[-1] += total - sum(amounts)
    return amounts


def seed_rivals(db: Session, course: Course, learner_week_xp: int) -> None:
    """Fill the Bronze League with seeded rivals around the learner's XP."""
    rng = random.Random(20261008)  # fixed seed: the demo looks the same every boot
    today = clock.today()
    days_elapsed = (today - clock.start_of_week()).days + 1
    anchor = max(learner_week_xp, LEAGUE_ANCHOR_XP)

    for (display_name, username, color), factor in zip(RIVALS, RIVAL_FACTORS, strict=True):
        target = min(MAX_WEEKLY_XP, max(MIN_WEEKLY_XP, round(anchor * factor)))
        rival = User(
            username=username,
            display_name=display_name,
            avatar_color=color,
            is_default_learner=False,
            current_course_id=course.id,
            total_xp=target + rng.randrange(0, 900, 10),
            gems=rng.randrange(100, 900, 50),
            hearts=rng.randint(2, 5),
            hearts_updated_at=clock.naive_now(),
            streak_count=rng.randint(1, 30),
            longest_streak=rng.randint(30, 90),
            last_active_date=today,
            daily_goal_xp=rng.choice([10, 20, 30, 50]),
            sound_enabled=True,
            created_at=clock.naive_now() - timedelta(days=rng.randint(20, 400)),
        )
        db.add(rival)
        db.flush()
        for offset, amount in enumerate(_spread_over_week(target, days_elapsed, rng)):
            if amount > 0:
                _add_xp(db, rival, amount, days_elapsed - 1 - offset)
    db.flush()
