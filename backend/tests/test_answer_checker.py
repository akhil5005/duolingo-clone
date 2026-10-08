"""Grading rules. Pure functions, so no fixtures are needed."""

import pytest

from app.models.enums import ExerciseType
from app.schemas.exercise_payloads import parse_payload
from app.services.answer_checker import (
    ACCENT_NOTE,
    TYPO_NOTE,
    check,
    levenshtein,
    normalize,
    strip_accents,
)

MC = parse_payload(
    ExerciseType.MULTIPLE_CHOICE,
    {
        "question": "Which one of these is “the water”?",
        "options": [
            {"id": "a", "text": "el agua", "emoji": None},
            {"id": "b", "text": "el pan", "emoji": None},
            {"id": "c", "text": "la leche", "emoji": None},
        ],
        "correct_option_id": "a",
    },
)

TRANSLATE = parse_payload(
    ExerciseType.TRANSLATE,
    {
        "source_text": "Yo bebo agua",
        "source_lang": "es",
        "target_lang": "en",
        "tokens": ["I", "drink", "water", "eat", "the", "bread"],
        "accepted": [["I", "drink", "water"]],
    },
)

MATCH = parse_payload(
    ExerciseType.MATCH_PAIRS,
    {
        "pairs": [
            {"left": "hola", "right": "hello"},
            {"left": "adiós", "right": "goodbye"},
            {"left": "gracias", "right": "thank you"},
        ]
    },
)

FILL_BLANK = parse_payload(
    ExerciseType.FILL_BLANK,
    {
        "before": "Yo bebo",
        "after": "todos los días.",
        "options": ["agua", "pan", "manzana"],
        "correct": "agua",
        "translation": "I drink water every day.",
    },
)

TYPE_ANSWER = parse_payload(
    ExerciseType.TYPE_ANSWER,
    {
        "source_text": "The boy eats bread",
        "target_lang": "es",
        "accepted": ["El niño come pan", "El chico come pan"],
    },
)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("  Hola,   mundo!  ", "hola mundo"),
        ("¿Dónde está el tren?", "dónde está el tren"),
        ("EL NIÑO", "el niño"),
        ("“quoted”", "quoted"),
    ],
)
def test_normalize(raw: str, expected: str) -> None:
    assert normalize(raw) == expected


def test_strip_accents() -> None:
    assert strip_accents("el niño adiós") == "el nino adios"


@pytest.mark.parametrize(
    ("left", "right", "distance"),
    [("casa", "casa", 0), ("casa", "cosa", 1), ("casa", "cas", 1), ("casa", "casas", 1),
     ("casa", "coso", 2), ("", "abc", 3)],
)
def test_levenshtein(left: str, right: str, distance: int) -> None:
    assert levenshtein(left, right) == distance


def test_multiple_choice_right_and_wrong() -> None:
    right = check(MC, {"option_id": "a"})
    wrong = check(MC, {"option_id": "b"})

    assert right.is_correct and right.note is None
    assert not wrong.is_correct
    assert wrong.correct_answer == "el agua"


def test_translate_accepts_the_exact_word_order() -> None:
    assert check(TRANSLATE, {"tokens": ["I", "drink", "water"]}).is_correct


def test_translate_is_case_and_punctuation_insensitive() -> None:
    assert check(TRANSLATE, {"tokens": ["i", "DRINK", "water."]}).is_correct


def test_translate_rejects_a_different_order() -> None:
    result = check(TRANSLATE, {"tokens": ["water", "drink", "I"]})

    assert not result.is_correct
    assert result.correct_answer == "I drink water"


def test_match_pairs_needs_the_whole_mapping() -> None:
    correct = check(
        MATCH,
        {
            "pairs": [
                {"left": "gracias", "right": "thank you"},
                {"left": "hola", "right": "hello"},
                {"left": "adiós", "right": "goodbye"},
            ]
        },
    )
    swapped = check(
        MATCH,
        {
            "pairs": [
                {"left": "hola", "right": "goodbye"},
                {"left": "adiós", "right": "hello"},
                {"left": "gracias", "right": "thank you"},
            ]
        },
    )

    assert correct.is_correct, "order of the submitted pairs must not matter"
    assert not swapped.is_correct


def test_match_pairs_rejects_a_partial_mapping() -> None:
    assert not check(MATCH, {"pairs": [{"left": "hola", "right": "hello"}]}).is_correct


def test_fill_blank() -> None:
    assert check(FILL_BLANK, {"choice": "agua"}).is_correct
    wrong = check(FILL_BLANK, {"choice": "pan"})
    assert not wrong.is_correct
    assert wrong.correct_answer == "Yo bebo agua todos los días."


def test_type_answer_exact_match_has_no_note() -> None:
    result = check(TYPE_ANSWER, {"text": "El niño come pan"})

    assert result.is_correct
    assert result.note is None


def test_type_answer_accepts_any_listed_alternative() -> None:
    assert check(TYPE_ANSWER, {"text": "el chico come pan"}).is_correct


def test_type_answer_forgives_a_missing_accent_but_says_so() -> None:
    result = check(TYPE_ANSWER, {"text": "El nino come pan"})

    assert result.is_correct
    assert result.note == ACCENT_NOTE


def test_type_answer_forgives_a_single_typo() -> None:
    result = check(TYPE_ANSWER, {"text": "El niño come pam"})

    assert result.is_correct
    assert result.note == TYPO_NOTE


def test_type_answer_rejects_two_mistakes() -> None:
    result = check(TYPE_ANSWER, {"text": "El nina come pam"})

    assert not result.is_correct
    assert result.correct_answer == "El niño come pan"


def test_short_answers_get_no_typo_forgiveness() -> None:
    """One edit on a short word is usually a different word entirely."""
    payload = parse_payload(
        ExerciseType.TYPE_ANSWER,
        {"source_text": "Yes", "target_lang": "es", "accepted": ["Sí"]},
    )

    assert not check(payload, {"text": "No"}).is_correct
    assert check(payload, {"text": "si"}).note == ACCENT_NOTE


def test_a_malformed_answer_is_rejected_rather_than_graded() -> None:
    with pytest.raises(ValueError):
        check(MC, {"choice": "a"})
    with pytest.raises(ValueError):
        check(TYPE_ANSWER, {"text": 42})
