"""The unit guidebook: key phrases and grammar for the current course."""

from fastapi.testclient import TestClient


def test_guidebook_lists_every_unit_with_its_words(client: TestClient) -> None:
    guidebook = client.get("/api/guidebook").json()

    assert guidebook["course_title"] == "Spanish"
    assert len(guidebook["units"]) == 2

    first = guidebook["units"][0]
    assert "gender" in (first["grammar_note"] or "")
    basics = first["skills"][0]
    assert basics["title"] == "Basics"
    assert {"term": "hola", "translation": "hello", "emoji": "\U0001f44b"} in basics["vocabulary"]


def test_every_skill_carries_vocabulary(client: TestClient) -> None:
    """A skill with no words would render an empty section in the guidebook."""
    guidebook = client.get("/api/guidebook").json()

    for unit in guidebook["units"]:
        for skill in unit["skills"]:
            assert skill["vocabulary"], f"{skill['title']} has no vocabulary"
            for word in skill["vocabulary"]:
                assert word["term"] and word["translation"]


def test_units_are_numbered_within_their_course(client: TestClient) -> None:
    """French unit one is row 3 in the table, but it is still unit 1 on screen."""
    courses = client.get("/api/courses").json()
    french = next(course for course in courses if course["language_code"] == "fr")
    client.patch("/api/me", json={"current_course_id": french["id"]})

    guidebook = client.get("/api/guidebook").json()

    assert [unit["order_index"] for unit in guidebook["units"]] == [1, 2]
    assert guidebook["units"][0]["id"] != 1


def test_guidebook_follows_the_chosen_course(client: TestClient) -> None:
    courses = client.get("/api/courses").json()
    french = next(course for course in courses if course["language_code"] == "fr")
    client.patch("/api/me", json={"current_course_id": french["id"]})

    guidebook = client.get("/api/guidebook").json()

    assert guidebook["course_title"] == "French"
    assert guidebook["language_code"] == "fr"
    terms = [word["term"] for word in guidebook["units"][0]["skills"][0]["vocabulary"]]
    assert "bonjour" in terms
