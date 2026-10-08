"""Derivation of the learning path and its lock states.

Nothing about lock/unlock is stored. Skills are ordered globally by
``(unit.order_index, skill.order_index)`` and a skill opens up as soon as the
previous one is finished, so new seeded content slots in without a migration.
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.models.course import Course, Skill
from app.models.enums import SkillState
from app.models.progress import UserSkillProgress
from app.models.user import User
from app.repositories import content_repo, progress_repo
from app.schemas.me import CourseBrief
from app.schemas.path import PathOut, PathSkillOut, PathUnitOut


@dataclass(frozen=True)
class SkillStatus:
    skill: Skill
    state: str
    lessons_completed: int
    total_lessons: int
    next_lesson_id: int | None
    legendary: bool

    @property
    def is_completed(self) -> bool:
        return self.state == SkillState.COMPLETED

    @property
    def is_unlocked(self) -> bool:
        return self.state != SkillState.LOCKED


def _status_for(skill: Skill, progress: UserSkillProgress | None, previous_done: bool) -> SkillStatus:
    total = len(skill.lessons)
    done = min(progress.lessons_completed if progress else 0, total)
    completed = total > 0 and done >= total

    if not previous_done:
        state = SkillState.LOCKED
    elif completed:
        state = SkillState.COMPLETED
    elif done == 0:
        state = SkillState.AVAILABLE
    else:
        state = SkillState.IN_PROGRESS

    next_lesson_id = None if completed else (skill.lessons[done].id if done < total else None)
    return SkillStatus(
        skill=skill,
        state=state,
        lessons_completed=done,
        total_lessons=total,
        next_lesson_id=next_lesson_id,
        legendary=bool(progress and progress.legendary_at),
    )


def skill_statuses(db: Session, user: User, course: Course) -> dict[int, SkillStatus]:
    """Status of every skill in the course, keyed by skill id."""
    progress = progress_repo.progress_map(db, user.id)
    statuses: dict[int, SkillStatus] = {}
    previous_done = True  # the very first skill is always open
    for unit in course.units:
        for skill in unit.skills:
            status = _status_for(skill, progress.get(skill.id), previous_done)
            statuses[skill.id] = status
            previous_done = status.is_completed
    return statuses


def require_status(db: Session, user: User, skill_id: int) -> SkillStatus:
    course = course_for(db, user)
    statuses = skill_statuses(db, user, course)
    status = statuses.get(skill_id)
    if status is None:
        raise NotFoundError("That skill is not part of your course.")
    return status


def course_for(db: Session, user: User) -> Course:
    course = content_repo.get_course_tree(db, user.current_course_id) if user.current_course_id else None
    if course is None:
        plain = content_repo.get_course(db)
        course = content_repo.get_course_tree(db, plain.id) if plain else None
    if course is None:
        raise NotFoundError("No course has been seeded yet.")
    return course


def build_path(db: Session, user: User) -> PathOut:
    course = course_for(db, user)
    statuses = skill_statuses(db, user, course)

    units: list[PathUnitOut] = []
    for unit in course.units:
        skills = [statuses[skill.id] for skill in unit.skills]
        units.append(
            PathUnitOut(
                id=unit.id,
                order_index=unit.order_index,
                title=unit.title,
                description=unit.description,
                color_hex=unit.color_hex,
                completed_skills=sum(1 for s in skills if s.is_completed),
                total_skills=len(skills),
                skills=[
                    PathSkillOut(
                        id=s.skill.id,
                        title=s.skill.title,
                        icon=s.skill.icon,
                        state=s.state,
                        lessons_completed=s.lessons_completed,
                        total_lessons=s.total_lessons,
                        next_lesson_id=s.next_lesson_id,
                        legendary=s.legendary,
                    )
                    for s in skills
                ],
            )
        )

    return PathOut(
        course=CourseBrief(
            title=course.title,
            flag_emoji=course.flag_emoji,
            language_code=course.language_code,
        ),
        units=units,
    )
