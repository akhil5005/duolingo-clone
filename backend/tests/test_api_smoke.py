"""End-to-end shape checks for the read endpoints."""

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_me_returns_the_default_learner(client: TestClient) -> None:
    body = client.get("/api/me").json()

    assert body["username"] == "akhil"
    assert body["total_xp"] == 240
    assert body["streak"] == 4
    assert body["hearts"] == 4
    assert body["max_hearts"] == 5
    assert body["next_heart_at"] is not None
    assert body["course"]["language_code"] == "es"


def test_me_accepts_a_settings_patch(client: TestClient) -> None:
    body = client.patch("/api/me", json={"daily_goal_xp": 50, "sound_enabled": False}).json()

    assert body["daily_goal_xp"] == 50
    assert body["sound_enabled"] is False


def test_me_rejects_an_unsupported_daily_goal(client: TestClient) -> None:
    assert client.patch("/api/me", json={"daily_goal_xp": 25}).status_code == 422


def test_path_returns_the_seeded_course(client: TestClient) -> None:
    body = client.get("/api/path").json()

    assert len(body["units"]) == 2
    assert [unit["title"] for unit in body["units"]] == [
        "Form basic sentences",
        "Get around in a city",
    ]
    assert all(len(unit["skills"]) == 3 for unit in body["units"])
    assert body["units"][0]["skills"][0]["state"] == "completed"
    assert body["units"][0]["completed_skills"] == 1


def test_error_responses_carry_a_machine_code(client: TestClient) -> None:
    # Hearts are not full for the seeded learner, but 500 gems is enough, so the
    # refill succeeds; asking twice hits the "already full" conflict.
    assert client.post("/api/me/hearts/refill").status_code == 200
    conflict = client.post("/api/me/hearts/refill")
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "HEARTS_FULL"
