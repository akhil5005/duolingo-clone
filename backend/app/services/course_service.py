"""The course catalogue and switching between courses.

Progress is per skill and skills belong to a course, so a learner can carry
several courses at once without anything being duplicated. XP, hearts, gems and
the streak stay global, which is how Duolingo treats them too.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.models.course import Course
from app.models.user import User
from app.repositories import content_repo, progress_repo
from app.schemas.course import CourseSummaryOut


def list_courses(db: Session, user: User) -> list[CourseSummaryOut]:
    progress = progress_repo.progress_map(db, user.id)
    current_id = user.current_course_id

    summaries: list[CourseSummaryOut] = []
    for plain in db.scalars(select(Course).order_by(Course.id)).all():
        course = content_repo.get_course_tree(db, plain.id)
        if course is None:
            continue
        skills = [skill for unit in course.units for skill in unit.skills]
        completed = sum(
            1
            for skill in skills
            if (row := progress.get(skill.id)) and row.lessons_completed >= len(skill.lessons)
        )
        summaries.append(
            CourseSummaryOut(
                id=course.id,
                title=course.title,
                language_code=course.language_code,
                flag_emoji=course.flag_emoji,
                total_skills=len(skills),
                completed_skills=completed,
                is_current=course.id == current_id,
            )
        )
    return summaries


def switch_to(db: Session, user: User, course_id: int) -> None:
    if db.get(Course, course_id) is None:
        raise NotFoundError("That course does not exist.")
    user.current_course_id = course_id
