"""Builds the unit guidebook from the course tree.

The vocabulary shown here is the same list the lesson player presents before a
skill's first lesson, read straight off ``Skill.vocabulary``. Keeping one
source means the guidebook can never promise a word the lesson never teaches.
"""

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.models.user import User
from app.repositories import content_repo
from app.schemas.guidebook import (
    GuidebookOut,
    GuidebookSkillOut,
    GuidebookUnitOut,
    VocabularyOut,
)
from app.services import path_service


def build(db: Session, user: User) -> GuidebookOut:
    plain = path_service.course_for(db, user)
    course = content_repo.get_course_tree(db, plain.id)
    if course is None:
        raise NotFoundError("No course has been seeded yet.")

    return GuidebookOut(
        course_title=course.title,
        language_code=course.language_code,
        units=[
            GuidebookUnitOut(
                id=unit.id,
                order_index=unit.order_index,
                title=unit.title,
                description=unit.description,
                color_hex=unit.color_hex,
                grammar_note=unit.grammar_note,
                skills=[
                    GuidebookSkillOut(
                        id=skill.id,
                        title=skill.title,
                        icon=skill.icon,
                        vocabulary=[
                            VocabularyOut(**word) for word in (skill.vocabulary or [])
                        ],
                    )
                    for skill in unit.skills
                ],
            )
            for unit in course.units
        ],
    )
