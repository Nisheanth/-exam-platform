"""Question extraction and cleaning from raw OCR / PDF text."""

from __future__ import annotations

import re
from dataclasses import dataclass, field

import structlog

logger = structlog.get_logger(__name__)

# ── Regex patterns ────────────────────────────────────────────────────────────

# Matches question number prefixes like: 1. | Q1. | Q.1 | (1) | (i) | 1)
_Q_NUM_RE = re.compile(
    r"(?:^|\n)\s*"
    r"(?:"
    r"(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[.)]\s*"  # Q1. or 1. or 1)
    r"|"
    r"\((\d{1,3}|[ivxlc]+)\)\s*"  # (1) or (i)
    r"|"
    r"(\d{1,3})\s*\.\s+"  # 1. <space>
    r")",
    re.IGNORECASE,
)

# Marks patterns: (2 marks) | [5] | (5M) | [2 Marks]
_MARKS_RE = re.compile(
    r"\s*[\(\[]\s*(\d{1,2})\s*(?:marks?|m)?\s*[\)\]]",
    re.IGNORECASE,
)

# MCQ option lines: A) ... | (A) ... | a. ...
_OPTION_RE = re.compile(
    r"^\s*[\(\[]?\s*([A-Da-d])\s*[.)\]]\s*(.+)$",
    re.MULTILINE,
)

# Section headers to skip
_SECTION_HEADER_RE = re.compile(
    r"^\s*(?:section|part|group)\s+[A-Za-z]\b",
    re.IGNORECASE,
)

# Instructions / noise lines
_NOISE_RE = re.compile(
    r"^\s*(?:instructions?|note|answer\s+(?:all|any)|time\s*(?:allowed|:))",
    re.IGNORECASE,
)


@dataclass
class ParsedQuestion:
    """A cleaned question extracted from raw text."""

    text: str
    question_type: str = "short"  # mcq | short | long | numerical
    marks: float | None = None
    options: list[str] = field(default_factory=list)


def _detect_question_type(text: str, options: list[str]) -> str:
    """Classify the question type from its content."""
    if options:
        return "mcq"

    lower = text.lower()

    # Numerical detection: "calculate", "find the value", numbers in answer
    numerical_keywords = [
        "calculate", "find the value", "compute", "determine the",
        "what is the value", "how many", "how much", "evaluate",
    ]
    if any(kw in lower for kw in numerical_keywords):
        return "numerical"

    # Long answer detection: "explain", "describe", "discuss", "derive"
    long_keywords = [
        "explain", "describe", "discuss", "derive", "prove",
        "state and prove", "write an essay", "elaborate",
        "differentiate between", "compare and contrast",
    ]
    if any(kw in lower for kw in long_keywords):
        return "long"

    return "short"


def _extract_marks(text: str) -> tuple[str, float | None]:
    """Strip marks annotation from text and return (clean_text, marks)."""
    match = _MARKS_RE.search(text)
    if match:
        marks = float(match.group(1))
        clean = _MARKS_RE.sub("", text).strip()
        return clean, marks
    return text, None


def _extract_options(text: str) -> tuple[str, list[str]]:
    """Separate MCQ options from the question stem."""
    options: list[str] = []
    matches = list(_OPTION_RE.finditer(text))

    if len(matches) >= 3:  # Need at least 3 options to be MCQ
        # Everything before the first option is the stem
        stem = text[: matches[0].start()].strip()
        for m in matches:
            options.append(f"{m.group(1).upper()}) {m.group(2).strip()}")
        return stem, options

    return text, []


def _clean_text(raw: str) -> str:
    """Normalize whitespace and remove junk characters."""
    text = raw.strip()
    # Collapse multiple spaces/newlines
    text = re.sub(r"\s+", " ", text)
    # Remove leading/trailing punctuation noise
    text = text.strip("•–—-·")
    return text.strip()


def _split_into_raw_questions(full_text: str) -> list[str]:
    """Split text into raw question blocks using question-number patterns."""
    splits = list(_Q_NUM_RE.finditer(full_text))

    if not splits:
        # Fallback: try splitting by numbered lines
        lines = full_text.split("\n")
        questions = []
        current: list[str] = []
        for line in lines:
            stripped = line.strip()
            if not stripped or _SECTION_HEADER_RE.match(stripped) or _NOISE_RE.match(stripped):
                continue
            # If line starts with a digit followed by punctuation, new question
            if re.match(r"^\d{1,3}\s*[.)]\s+", stripped):
                if current:
                    questions.append(" ".join(current))
                current = [re.sub(r"^\d{1,3}\s*[.)]\s+", "", stripped)]
            else:
                current.append(stripped)
        if current:
            questions.append(" ".join(current))
        return questions

    questions: list[str] = []
    for i, match in enumerate(splits):
        start = match.end()
        end = splits[i + 1].start() if i + 1 < len(splits) else len(full_text)
        block = full_text[start:end].strip()
        if block:
            questions.append(block)

    return questions


def parse_questions(pages: list[str]) -> list[ParsedQuestion]:
    """Parse raw page texts into structured Question objects.

    Parameters
    ----------
    pages : list[str]
        Raw text per page, as returned by the OCR service.

    Returns
    -------
    list[ParsedQuestion]
        Cleaned, classified questions.
    """
    full_text = "\n\n".join(pages)
    raw_blocks = _split_into_raw_questions(full_text)

    parsed: list[ParsedQuestion] = []

    for raw in raw_blocks:
        # Skip noise
        if _SECTION_HEADER_RE.match(raw) or _NOISE_RE.match(raw):
            continue

        # Clean
        text = _clean_text(raw)
        if len(text) < 10:  # Too short to be a real question
            continue

        # Extract marks
        text, marks = _extract_marks(text)

        # Extract MCQ options
        stem, options = _extract_options(text)
        if options:
            text = stem

        # Classify
        q_type = _detect_question_type(text, options)

        parsed.append(
            ParsedQuestion(
                text=text,
                question_type=q_type,
                marks=marks,
                options=options,
            )
        )

    logger.info("parse_questions_done", count=len(parsed))
    return parsed
