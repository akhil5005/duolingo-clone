"""Lock/unlock derivation on the learning path."""

from sqlalchemy.orm import Session

from app.models.enums import SkillState
from app.models.progress import UserSkillProgress
from app.models.user import User
from app.repositories import content_repo
from app.services import path_service


def _flat_skills(path) -> list:
    return [skill for unit in path.units for skill in unit.skills]


def _set_progress(db: Session, user: User, skill_id: int, lessons_completed: int) -> None:
    row = db.get(UserSkillProgress, {"user_id": user.id, "skill_id": skill_id})
    if row is None:
        row = UserSkillProgress(user_id=user.id, skill_id=skill_id)
        db.add(row)
    row.lessons_completed = lessons_completed
    db.flush()


def test_seeded_learner_sees_expected_states(seeded_db: Session, learner: User) -> None:
    skills = _flat_skills(path_service.build_path(seeded_db, learner))
    states = [skill.state for skill in skills]

    assert states == [
        SkillState.COMPLETED,
        SkillState.IN_PROGRESS,
        SkillState.LOCKED,
        SkillState.LOCKED,
        SkillState.LOCKED,
        SkillState.LOCKED,
    ]


def test_first_skill_is_available_with_no_progress(seeded_db: Session, learner: User) -> None:
    seeded_db.query(UserSkillProgress).delete()
    seeded_db.flush()

    skills = _flat_skills(path_service.build_path(seeded_db, learner))

    assert skills[0].state == SkillState.AVAILABLE
    assert skills[0].lessons_completed == 0
    assert all(skill.state == SkillState.LOCKED for skill in skills[1:])


def test_completing_a_skill_unlocks_exactly_the_next_one(
    seeded_db: Session, learner: User
) -> None:
    seeded_db.query(UserSkillProgress).delete()
    seeded_db.flush()
    skills = _flat_skills(path_service.build_path(seeded_db, learner))
    _set_progress(seeded_db, learner, skills[0].id, skills[0].total_lessons)

    updated = _flat_skills(path_service.build_path(seeded_db, learner))

    assert updated[0].state == SkillState.COMPLETED
    assert updated[1].state == SkillState.AVAILABLE
    assert updated[2].state == SkillState.LOCKED


def test_unlocking_crosses_the_unit_boundary(seeded_db: Session, learner: User) -> None:
    """Skills are ordered globally, so finishing a unit opens the next unit."""
    path = path_service.build_path(seeded_db, learner)
    first_unit, second_unit = path.units[0], path.units[1]
    for skill in first_unit.skills:
        _set_progress(seeded_db, learner, skill.id, skill.total_lessons)

    updated = path_service.build_path(seeded_db, learner)

    assert updated.units[0].completed_skills == updated.units[0].total_skills
    assert updated.units[1].skills[0].state == SkillState.AVAILABLE
    assert updated.units[1].skills[1].state == SkillState.LOCKED
    assert second_unit.id == updated.units[1].id


def test_next_lesson_id_tracks_the_first_uncompleted_lesson(
    seeded_db: Session, learner: User
) -> None:
    skill_id = _flat_skills(path_service.build_path(seeded_db, learner))[1].id
    skill = content_repo.get_skill(seeded_db, skill_id)
    assert skill is not None

    for completed in range(len(skill.lessons)):
        _set_progress(seeded_db, learner, skill_id, completed)
        status = path_service.require_status(seeded_db, learner, skill_id)
        assert status.next_lesson_id == skill.lessons[completed].id

    _set_progress(seeded_db, learner, skill_id, len(skill.lessons))
    assert path_service.require_status(seeded_db, learner, skill_id).next_lesson_id is None


def test_progress_is_clamped_to_the_lesson_count(seeded_db: Session, learner: User) -> None:
    """A stale counter larger than the content must not break the ring."""
    skill = _flat_skills(path_service.build_path(seeded_db, learner))[0]
    _set_progress(seeded_db, learner, skill.id, skill.total_lessons + 5)

    updated = _flat_skills(path_service.build_path(seeded_db, learner))[0]

    assert updated.lessons_completed == updated.total_lessons
    assert updated.state == SkillState.COMPLETED
