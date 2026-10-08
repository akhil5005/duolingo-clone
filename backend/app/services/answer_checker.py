"""Grading, as pure functions.

No database, no session state: a payload and an answer in, a verdict out. That
keeps every rule here directly unit-testable, and it keeps grading on the
server where the answer keys live.
"""

import re
import unicodedata
from dataclasses import dataclass
from typing import Any

from app.schemas.answers import (
    FillBlankAnswer,
    MatchAnswer,
    MCAnswer,
    TranslateAnswer,
    TypeAnswerAnswer,
    parse_answer,
)
from app.schemas.exercise_payloads import (
    ExercisePayload,
    FillBlankPayload,
    MatchPayload,
    MCPayload,
    TranslatePayload,
    TypeAnswerPayload,
)

# Sentence punctuation is noise when comparing answers; Spanish adds the
# inverted opening marks, and browsers often substitute curly quotes.
_PUNCTUATION = re.compile(r"[.,!?;:\"'¿¡‘’“”]")
_WHITESPACE = re.compile(r"\s+")

TYPO_NOTE = "You have a typo."
ACCENT_NOTE = "Pay attention to the accents."
# Below this length a single edit is likely a different word, not a slip.
MIN_TYPO_LENGTH = 4


@dataclass(frozen=True)
class CheckResult:
    is_correct: bool
    correct_answer: str
    note: str | None = None


def normalize(text: str) -> str:
    """Lowercase, drop punctuation, collapse whitespace, trim."""
    return _WHITESPACE.sub(" ", _PUNCTUATION.sub("", text.lower())).strip()


def strip_accents(text: str) -> str:
    """Remove diacritics: "niño" -> "nino"."""
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(char for char in decomposed if not unicodedata.combining(char))


def levenshtein(left: str, right: str) -> int:
    """Edit distance between two strings (insertions, deletions, substitutions)."""
    if left == right:
        return 0
    if not left:
        return len(right)
    if not right:
        return len(left)

    previous = list(range(len(right) + 1))
    for i, left_char in enumerate(left, start=1):
        current = [i]
        for j, right_char in enumerate(right, start=1):
            current.append(
                min(
                    previous[j] + 1,  # deletion
                    current[j - 1] + 1,  # insertion
                    previous[j - 1] + (left_char != right_char),  # substitution
                )
            )
        previous = current
    return previous[-1]


def _check_multiple_choice(payload: MCPayload, answer: MCAnswer) -> CheckResult:
    return CheckResult(
        is_correct=answer.option_id == payload.correct_option_id,
        correct_answer=payload.canonical_answer(),
    )


def _check_translate(payload: TranslatePayload, answer: TranslateAnswer) -> CheckResult:
    submitted = normalize(" ".join(answer.tokens))
    accepted = {normalize(" ".join(option)) for option in payload.accepted}
    return CheckResult(
        is_correct=submitted in accepted,
        correct_answer=payload.canonical_answer(),
    )


def _check_match_pairs(payload: MatchPayload, answer: MatchAnswer) -> CheckResult:
    """Graded on the complete mapping.

    Individual wrong taps are handled in the UI with a shake and cost nothing;
    the client only submits once every tile has found its partner, so this is
    effectively a final consistency check.
    """
    expected = {normalize(pair.left): normalize(pair.right) for pair in payload.pairs}
    submitted = {normalize(pair.left): normalize(pair.right) for pair in answer.pairs}
    return CheckResult(
        is_correct=submitted == expected,
        correct_answer=payload.canonical_answer(),
    )


def _check_fill_blank(payload: FillBlankPayload, answer: FillBlankAnswer) -> CheckResult:
    return CheckResult(
        is_correct=normalize(answer.choice) == normalize(payload.correct),
        correct_answer=payload.canonical_answer(),
    )


def _check_type_answer(payload: TypeAnswerPayload, answer: TypeAnswerAnswer) -> CheckResult:
    submitted = normalize(answer.text)
    accepted = [normalize(option) for option in payload.accepted]
    canonical = payload.canonical_answer()

    if submitted in accepted:
        return CheckResult(True, canonical)

    # Accepted, but flag it: accents change meaning in Spanish.
    bare_submitted = strip_accents(submitted)
    bare_accepted = [strip_accents(option) for option in accepted]
    if bare_submitted in bare_accepted:
        return CheckResult(True, canonical, ACCENT_NOTE)

    # A single slipped keystroke on a long answer is a typo, not a wrong answer.
    for option in bare_accepted:
        if len(option) > MIN_TYPO_LENGTH and levenshtein(bare_submitted, option) == 1:
            return CheckResult(True, canonical, TYPO_NOTE)

    return CheckResult(False, canonical)


def check(payload: ExercisePayload, raw_answer: dict[str, Any]) -> CheckResult:
    """Grade one answer. Raises ``ValueError`` if the answer is malformed."""
    answer = parse_answer(payload.type, raw_answer)

    if isinstance(payload, MCPayload) and isinstance(answer, MCAnswer):
        return _check_multiple_choice(payload, answer)
    if isinstance(payload, TranslatePayload) and isinstance(answer, TranslateAnswer):
        return _check_translate(payload, answer)
    if isinstance(payload, MatchPayload) and isinstance(answer, MatchAnswer):
        return _check_match_pairs(payload, answer)
    if isinstance(payload, FillBlankPayload) and isinstance(answer, FillBlankAnswer):
        return _check_fill_blank(payload, answer)
    if isinstance(payload, TypeAnswerPayload) and isinstance(answer, TypeAnswerAnswer):
        return _check_type_answer(payload, answer)

    raise ValueError(f"No checker for exercise type {payload.type}")
