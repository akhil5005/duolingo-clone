"""The lesson loop, end to end through the API."""

from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.course import Exercise
from app.models.enums import ExerciseType
from app.models.user import User
from app.schemas.exercise_payloads import (
    FillBlankPayload,
    MatchPayload,
    MCPayload,
    TranslatePayload,
    TypeAnswerPayload,
    parse_payload,
)


def _payload(db: Session, exercise_id: int):
    exercise = db.get(Exercise, exercise_id)
    assert exercise is not None
    return parse_payload(exercise.type, exercise.payload)


def correct_answer(db: Session, exercise_id: int) -> dict[str, Any]:
    """Derive a passing answer from the stored answer key."""
    payload = _payload(db, exercise_id)
    if isinstance(payload, MCPayload):
        return {"option_id": payload.correct_option_id}
    if isinstance(payload, TranslatePayload):
        return {"tokens": payload.accepted[0]}
    if isinstance(payload, MatchPayload):
        return {"pairs": [{"left": p.left, "right": p.right} for p in payload.pairs]}
    if isinstance(payload, FillBlankPayload):
        return {"choice": payload.correct}
    if isinstance(payload, TypeAnswerPayload):
        return {"text": payload.accepted[0]}
    raise AssertionError(f"unhandled payload {payload}")


def wrong_answer(db: Session, exercise_id: int) -> dict[str, Any]:
    payload = _payload(db, exercise_id)
    if isinstance(payload, MCPayload):
        return {"option_id": next(o.id for o in payload.options if o.id != payload.correct_option_id)}
    if isinstance(payload, TranslatePayload):
        return {"tokens": list(reversed(payload.accepted[0])) + ["zzz"]}
    if isinstance(payload, MatchPayload):
        return {"pairs": [{"left": p.left, "right": "zzz"} for p in payload.pairs]}
    if isinstance(payload, FillBlankPayload):
        return {"choice": next(o for o in payload.options if o != payload.correct)}
    if isinstance(payload, TypeAnswerPayload):
        return {"text": "definitely not the answer"}
    raise AssertionError(f"unhandled payload {payload}")


def start_next_lesson(client: TestClient) -> dict[str, Any]:
    """Open the lesson the learning path currently points at."""
    path = client.get("/api/path").json()
    skill = next(
        skill
        for unit in path["units"]
        for skill in unit["skills"]
        if skill["next_lesson_id"] is not None and skill["state"] != "locked"
    )
    response = client.post(f"/api/lessons/{skill['next_lesson_id']}/sessions")
    assert response.status_code == 201, response.text
    return response.json()


def answer(client: TestClient, session_id: str, exercise_id: int, body: dict[str, Any]):
    return client.post(
        f"/api/sessions/{session_id}/answers",
        json={"exercise_id": exercise_id, "answer": body},
    )


def play_out(client: TestClient, db: Session, session_id: str, queue: list[int]) -> None:
    """Answer everything left in the queue correctly until it is empty."""
    while queue:
        result = answer(client, session_id, queue[0], correct_answer(db, queue[0]))
        assert result.status_code == 200, result.text
        queue = result.json()["queue"]


def test_starting_a_lesson_never_leaks_answer_keys(
    client: TestClient, seeded_db: Session
) -> None:
    session = start_next_lesson(client)

    assert session["mode"] == "lesson"
    assert len(session["exercises"]) == session["total_exercises"] > 0

    banned = {"correct_option_id", "accepted", "correct", "pairs"}
    for exercise in session["exercises"]:
        assert not banned & exercise["payload"].keys(), exercise
        assert exercise["type"] in set(ExerciseType)


def test_a_wrong_answer_costs_a_heart_and_is_asked_again(
    client: TestClient, seeded_db: Session, learner: User
) -> None:
    hearts_before = client.get("/api/me").json()["hearts"]
    session = start_next_lesson(client)
    first = session["queue"][0]

    result = answer(client, session["session_id"], first, wrong_answer(seeded_db, first)).json()

    assert result["is_correct"] is False
    assert result["hearts"] == hearts_before - 1
    assert result["correct_answer"]
    assert result["queue"][0] != first, "the next exercise should be served"
    assert result["queue"][-1] == first, "the missed exercise returns at the end"
    assert result["progress"] == 0.0


def test_answering_out_of_order_is_rejected(client: TestClient, seeded_db: Session) -> None:
    session = start_next_lesson(client)
    second = session["queue"][1]

    response = answer(client, session["session_id"], second, correct_answer(seeded_db, second))

    assert response.status_code == 409
    assert response.json()["code"] == "WRONG_EXERCISE"


def test_cannot_complete_while_exercises_remain(
    client: TestClient, seeded_db: Session
) -> None:
    session = start_next_lesson(client)

    response = client.post(f"/api/sessions/{session['session_id']}/complete")

    assert response.status_code == 409
    assert response.json()["code"] == "SESSION_INCOMPLETE"


def test_a_perfect_lesson_awards_xp_advances_the_skill_and_extends_the_streak(
    client: TestClient, seeded_db: Session
) -> None:
    before = client.get("/api/me").json()
    session = start_next_lesson(client)
    play_out(client, seeded_db, session["session_id"], session["queue"])

    summary = client.post(f"/api/sessions/{session['session_id']}/complete").json()

    assert summary["xp_earned"] == 15, "10 for the lesson plus the 5 XP perfect bonus"
    assert [line["amount"] for line in summary["xp_breakdown"]] == [10, 5]
    assert summary["accuracy"] == 100
    assert summary["total_xp"] == before["total_xp"] + 15
    # The learner was last active yesterday, so finishing today extends the streak.
    assert summary["streak_before"] == 4
    assert summary["streak_after"] == 5
    assert summary["streak_extended_today"] is True
    assert summary["daily_goal"]["today_xp"] == 15
    assert summary["daily_goal"]["just_reached"] is False
    assert summary["skill"]["lessons_completed"] == 2

    after = client.get("/api/me").json()
    assert after["total_xp"] == before["total_xp"] + 15
    assert after["streak"] == 5
    assert after["today_xp"] == 15


def test_mistakes_lose_the_perfect_bonus_and_lower_accuracy(
    client: TestClient, seeded_db: Session
) -> None:
    session = start_next_lesson(client)
    first = session["queue"][0]
    wrong = answer(client, session["session_id"], first, wrong_answer(seeded_db, first)).json()
    play_out(client, seeded_db, session["session_id"], wrong["queue"])

    summary = client.post(f"/api/sessions/{session['session_id']}/complete").json()

    assert summary["xp_earned"] == 10
    assert summary["accuracy"] < 100


def test_the_path_reflects_progress_after_completing_a_lesson(
    client: TestClient, seeded_db: Session
) -> None:
    def food_and_drink() -> dict[str, Any]:
        path = client.get("/api/path").json()
        return path["units"][0]["skills"][1]

    assert food_and_drink()["lessons_completed"] == 1
    session = start_next_lesson(client)
    play_out(client, seeded_db, session["session_id"], session["queue"])
    client.post(f"/api/sessions/{session['session_id']}/complete")

    assert food_and_drink()["lessons_completed"] == 2
    assert food_and_drink()["state"] == "in_progress"


def test_running_out_of_hearts_fails_the_session_and_blocks_a_new_one(
    client: TestClient, seeded_db: Session, learner: User
) -> None:
    learner.hearts = 1
    seeded_db.flush()
    session = start_next_lesson(client)
    first = session["queue"][0]

    result = answer(client, session["session_id"], first, wrong_answer(seeded_db, first)).json()

    assert result["hearts"] == 0
    assert result["session_status"] == "failed"

    blocked = client.post(f"/api/lessons/{session['lesson_id']}/sessions")
    assert blocked.status_code == 409
    assert blocked.json()["code"] == "NO_HEARTS"


def test_abandoning_keeps_the_hearts_already_spent(
    client: TestClient, seeded_db: Session
) -> None:
    session = start_next_lesson(client)
    first = session["queue"][0]
    answer(client, session["session_id"], first, wrong_answer(seeded_db, first))

    response = client.post(f"/api/sessions/{session['session_id']}/abandon")

    assert response.json() == {"status": "abandoned"}
    assert client.get("/api/me").json()["hearts"] == 3
    assert client.post(f"/api/sessions/{session['session_id']}/abandon").status_code == 409


def test_practice_costs_no_hearts_and_gives_one_back(
    client: TestClient, seeded_db: Session, learner: User
) -> None:
    learner.hearts = 2
    seeded_db.flush()
    session = client.post("/api/skills/0/practice").json()
    first = session["queue"][0]

    wrong = answer(client, session["session_id"], first, wrong_answer(seeded_db, first)).json()
    assert wrong["hearts"] == 2, "practice never costs a heart"

    play_out(client, seeded_db, session["session_id"], wrong["queue"])
    summary = client.post(f"/api/sessions/{session['session_id']}/complete").json()

    assert summary["xp_earned"] == 5
    assert summary["hearts"] == 3


def test_legendary_requires_a_finished_skill_and_ends_on_one_mistake(
    client: TestClient, seeded_db: Session
) -> None:
    path = client.get("/api/path").json()
    basics, food = path["units"][0]["skills"][0], path["units"][0]["skills"][1]

    assert client.post(f"/api/skills/{food['id']}/legendary").status_code == 409

    session = client.post(f"/api/skills/{basics['id']}/legendary").json()
    first = session["queue"][0]
    result = answer(client, session["session_id"], first, wrong_answer(seeded_db, first)).json()

    assert result["session_status"] == "failed"
    assert result["hearts"] == 4, "a legendary run does not spend hearts"
