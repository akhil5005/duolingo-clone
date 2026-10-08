"""The course catalogue and switching between courses."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.services import course_service


def test_every_seed_file_becomes_a_course(client: TestClient) -> None:
    courses = client.get("/api/courses").json()

    assert [c["language_code"] for c in courses] == ["es", "fr"]
    assert all(c["total_skills"] == 6 for c in courses)


def test_the_learner_starts_on_the_default_course(client: TestClient) -> None:
    courses = client.get("/api/courses").json()
    current = [c for c in courses if c["is_current"]]

    assert len(current) == 1
    assert current[0]["language_code"] == "es"
    assert client.get("/api/me").json()["course"]["language_code"] == "es"


def test_progress_is_reported_per_course(client: TestClient) -> None:
    """The seeded learner has finished one Spanish skill and no French ones."""
    by_code = {c["language_code"]: c for c in client.get("/api/courses").json()}

    assert by_code["es"]["completed_skills"] == 1
    assert by_code["fr"]["completed_skills"] == 0


def test_switching_course_changes_the_path_but_not_the_learner(
    client: TestClient,
) -> None:
    before = client.get("/api/me").json()
    french = next(c for c in client.get("/api/courses").json() if c["language_code"] == "fr")

    switched = client.patch("/api/me", json={"current_course_id": french["id"]}).json()
    assert switched["course"]["language_code"] == "fr"

    # XP, hearts, gems and the streak belong to the learner, not the course.
    for field in ("total_xp", "hearts", "gems", "streak", "longest_streak"):
        assert switched[field] == before[field], field

    path = client.get("/api/path").json()
    assert path["course"]["title"] == "French"
    # A brand new course starts from the top: first skill open, rest locked.
    states = [s["state"] for u in path["units"] for s in u["skills"]]
    assert states == ["available"] + ["locked"] * 5


def test_switching_back_restores_the_original_progress(client: TestClient) -> None:
    courses = {c["language_code"]: c["id"] for c in client.get("/api/courses").json()}

    client.patch("/api/me", json={"current_course_id": courses["fr"]})
    client.patch("/api/me", json={"current_course_id": courses["es"]})

    path = client.get("/api/path").json()
    assert path["course"]["title"] == "Spanish"
    assert [s["state"] for s in path["units"][0]["skills"]] == [
        "completed",
        "in_progress",
        "locked",
    ]


def test_switching_to_a_course_that_does_not_exist_is_rejected(client: TestClient) -> None:
    response = client.patch("/api/me", json={"current_course_id": 9999})

    assert response.status_code == 404
    assert client.get("/api/me").json()["course"]["language_code"] == "es"


def test_a_french_lesson_can_be_played_and_credits_the_same_learner(
    client: TestClient, seeded_db: Session
) -> None:
    from tests.test_lesson_flow_api import play_out, start_next_lesson

    courses = {c["language_code"]: c["id"] for c in client.get("/api/courses").json()}
    client.patch("/api/me", json={"current_course_id": courses["fr"]})
    before = client.get("/api/me").json()

    session = start_next_lesson(client)
    assert session["skill_title"] == "Basics"
    play_out(client, seeded_db, session["session_id"], session["queue"])
    summary = client.post(f"/api/sessions/{session['session_id']}/complete").json()

    assert summary["xp_earned"] == 15
    assert client.get("/api/me").json()["total_xp"] == before["total_xp"] + 15

    by_code = {c["language_code"]: c for c in client.get("/api/courses").json()}
    assert by_code["fr"]["completed_skills"] == 0, "one lesson does not finish a skill"
    assert by_code["es"]["completed_skills"] == 1, "Spanish progress is untouched"


def test_service_returns_the_same_shape_as_the_endpoint(
    seeded_db: Session, learner: User
) -> None:
    summaries = course_service.list_courses(seeded_db, learner)

    assert [s.title for s in summaries] == ["Spanish", "French"]
    assert sum(s.is_current for s in summaries) == 1
