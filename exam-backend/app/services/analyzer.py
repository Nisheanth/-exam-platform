"""Pattern analysis engine: frequency, heatmap, importance scoring, gap analysis."""

from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import datetime, timezone

import numpy as np
import structlog
from sqlalchemy.orm import Session

from app.models.analysis import AnalysisResult
from app.models.paper import Paper, Question
from app.services.clusterer import QuestionCluster, group_by_similarity
from app.services.embedder import encode

logger = structlog.get_logger(__name__)


def _load_questions_for_exam(
    db: Session, exam_name: str, subject: str
) -> tuple[list[Question], list[Paper]]:
    """Load all questions + parent papers for a given exam/subject."""
    papers = (
        db.query(Paper)
        .filter(
            Paper.exam_name == exam_name,
            Paper.subject == subject,
            Paper.status == "complete",
        )
        .order_by(Paper.year)
        .all()
    )
    if not papers:
        return [], []

    paper_ids = [p.id for p in papers]
    questions = (
        db.query(Question)
        .filter(Question.paper_id.in_(paper_ids))
        .all()
    )
    return questions, papers


def _build_paper_lookup(papers: list[Paper]) -> dict[str, Paper]:
    return {str(p.id): p for p in papers}


def compute_repeated_questions(
    clusters: list[QuestionCluster],
    paper_lookup: dict[str, Paper],
) -> list[dict]:
    """Identify questions that appear across multiple years.

    Returns sorted by frequency (descending).
    """
    repeated: list[dict] = []
    for cluster in clusters:
        unique_years = sorted(set(cluster.years))
        if len(unique_years) < 2:
            continue

        # Infer topic from the questions (use the most-assigned topic)
        topics: list[str] = []
        for pid in cluster.paper_ids:
            paper = paper_lookup.get(pid)
            if paper:
                topics.append(paper.subject)

        repeated.append({
            "question_text": cluster.representative_text,
            "years": unique_years,
            "frequency": len(unique_years),
            "topic": _guess_topic(cluster.representative_text, cluster.question_texts),
        })

    repeated.sort(key=lambda r: r["frequency"], reverse=True)
    return repeated


def _guess_topic(representative: str, all_texts: list[str]) -> str:
    """Simple keyword-based topic guessing.

    In production, this would be replaced by a proper NLP classifier.
    For now, use spaCy noun-chunk extraction on the representative text.
    """
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(representative)
        # Use the most common noun chunks
        chunks = [chunk.text.title() for chunk in doc.noun_chunks if len(chunk.text) > 3]
        if chunks:
            return chunks[0]
    except Exception:
        pass

    # Fallback: first 5 significant words
    words = [w for w in representative.split() if len(w) > 3]
    return " ".join(words[:3]).title() if words else "General"


def compute_topic_heatmap(
    questions: list[Question],
    papers: list[Paper],
    paper_lookup: dict[str, Paper],
) -> list[dict]:
    """Build topic × year frequency heatmap.

    Groups questions by their assigned topic and counts occurrences per year.
    """
    # Gather all years
    all_years = sorted(set(p.year for p in papers))
    if not all_years:
        return []

    # Group by topic
    topic_year_counts: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))

    for q in questions:
        topic = q.topic or "Uncategorised"
        paper = paper_lookup.get(str(q.paper_id))
        if paper:
            topic_year_counts[topic][paper.year] += 1

    heatmap: list[dict] = []
    for topic, year_counts in sorted(topic_year_counts.items()):
        year_dict = {str(y): year_counts.get(y, 0) for y in all_years}
        total = sum(year_dict.values())

        # Gap analysis: count consecutive most-recent years with 0 questions
        gap_years = 0
        for y in reversed(all_years):
            if year_counts.get(y, 0) == 0:
                gap_years += 1
            else:
                break

        heatmap.append({
            "topic": topic,
            "year_counts": year_dict,
            "total": total,
            "gap_years": gap_years,
        })

    heatmap.sort(key=lambda h: h["total"], reverse=True)
    return heatmap


def score_importance(
    clusters: list[QuestionCluster],
    paper_lookup: dict[str, Paper],
    current_year: int | None = None,
) -> list[dict]:
    """Score question importance combining frequency, recency, and marks.

    Formula: ``score = frequency * recency_weight * mark_weight``

    - recency_weight = 1.0 + 0.15 * years_since_last_appearance (bonus for
      questions that keep appearing recently)
    - mark_weight = 1.0 + 0.1 * (marks - 1) if marks > 1 else 1.0
    """
    if current_year is None:
        current_year = datetime.now(timezone.utc).year

    scored: list[dict] = []

    for cluster in clusters:
        unique_years = sorted(set(cluster.years))
        if not unique_years:
            continue

        frequency = len(unique_years)
        most_recent = max(unique_years)
        years_ago = current_year - most_recent

        # Recency: questions appearing recently get a boost
        if years_ago <= 1:
            recency_weight = 1.3
        elif years_ago <= 2:
            recency_weight = 1.15
        elif years_ago <= 3:
            recency_weight = 1.0
        else:
            recency_weight = 0.8

        # Mark weight (average marks in cluster if available)
        mark_weight = 1.0

        raw_score = frequency * recency_weight * mark_weight
        normalised = round(min(raw_score / 10.0, 1.0), 2)

        scored.append({
            "question_text": cluster.representative_text,
            "score": normalised,
            "topic": _guess_topic(
                cluster.representative_text, cluster.question_texts
            ),
            "years_seen": unique_years,
        })

    scored.sort(key=lambda s: s["score"], reverse=True)
    return scored[:50]  # Top 50


def gap_analysis(topic_heatmap: list[dict], gap_threshold: int = 2) -> list[str]:
    """Return topics absent for ``gap_threshold`` or more consecutive recent years."""
    overdue: list[str] = []
    for entry in topic_heatmap:
        if entry["gap_years"] >= gap_threshold:
            overdue.append(entry["topic"])
    return overdue


def run_full_analysis(
    db: Session, exam_name: str, subject: str
) -> AnalysisResult:
    """Execute the complete analysis pipeline and persist the result.

    Steps:
    1. Load all questions for the exam/subject
    2. Compute embeddings (or reuse from DB)
    3. Cluster by similarity
    4. Compute repeated questions, heatmap, importance scores
    5. Store result as JSON in ``analysis_results``
    """
    logger.info("analysis_start", exam=exam_name, subject=subject)

    questions, papers = _load_questions_for_exam(db, exam_name, subject)
    if not questions:
        raise ValueError(
            f"No processed questions found for {exam_name} / {subject}"
        )

    paper_lookup = _build_paper_lookup(papers)

    # Prepare data for clustering
    texts = [q.text for q in questions]
    q_paper_ids = [str(q.paper_id) for q in questions]
    q_years = [paper_lookup[str(q.paper_id)].year for q in questions]

    # Get or compute embeddings
    existing_embeddings = []
    texts_to_embed = []
    indices_to_embed = []

    for i, q in enumerate(questions):
        if q.embedding is not None:
            existing_embeddings.append((i, np.array(q.embedding, dtype=np.float32)))
        else:
            texts_to_embed.append(q.text)
            indices_to_embed.append(i)

    # Build full embedding matrix
    all_embeddings = np.zeros((len(questions), 384), dtype=np.float32)
    for i, emb in existing_embeddings:
        all_embeddings[i] = emb

    if texts_to_embed:
        new_embeddings = encode(texts_to_embed)
        for idx, emb in zip(indices_to_embed, new_embeddings):
            all_embeddings[idx] = emb

    # Cluster
    clusters = group_by_similarity(
        texts=texts,
        embeddings=all_embeddings,
        paper_ids=q_paper_ids,
        years=q_years,
        threshold=0.82,
    )

    # Compute analyses
    repeated = compute_repeated_questions(clusters, paper_lookup)
    heatmap = compute_topic_heatmap(questions, papers, paper_lookup)
    important = score_importance(clusters, paper_lookup)

    # Persist
    result_data = {
        "repeated_questions": repeated,
        "topic_heatmap": heatmap,
        "important_questions": important,
    }

    analysis = AnalysisResult(
        id=uuid.uuid4(),
        exam_name=exam_name,
        subject=subject,
        result_json=result_data,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    logger.info(
        "analysis_complete",
        analysis_id=str(analysis.id),
        repeated=len(repeated),
        topics=len(heatmap),
        important=len(important),
    )
    return analysis
