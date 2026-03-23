"""FAISS-based similarity clustering for grouping related questions."""

from __future__ import annotations

from dataclasses import dataclass, field

import faiss
import numpy as np
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class QuestionCluster:
    """A cluster of semantically similar questions."""

    cluster_id: int
    representative_text: str
    question_indices: list[int] = field(default_factory=list)
    question_texts: list[str] = field(default_factory=list)
    paper_ids: list[str] = field(default_factory=list)
    years: list[int] = field(default_factory=list)


def group_by_similarity(
    texts: list[str],
    embeddings: np.ndarray,
    paper_ids: list[str],
    years: list[int],
    threshold: float = 0.80,
) -> list[QuestionCluster]:
    """Group questions into clusters based on embedding similarity.

    Uses a FAISS L2 (Euclidean) index.  Since embeddings are L2-normalised,
    ``L2_distance = 2 * (1 - cosine_similarity)``, so we convert the
    threshold accordingly.

    Parameters
    ----------
    texts : list[str]
        Question texts (parallel with embeddings).
    embeddings : np.ndarray
        Shape ``(n, 384)``, L2-normalised.
    paper_ids : list[str]
        Paper IDs corresponding to each question.
    years : list[int]
        Exam years corresponding to each question.
    threshold : float
        Cosine-similarity threshold for grouping.

    Returns
    -------
    list[QuestionCluster]
        Clusters of similar questions.
    """
    n = len(texts)
    if n == 0:
        return []

    dim = embeddings.shape[1]
    # Normalise just in case
    faiss.normalize_L2(embeddings)

    # Build the FAISS index
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    # L2 distance threshold from cosine similarity
    # cos_sim = 1 - L2^2 / 2  →  L2^2 = 2 * (1 - cos_sim)
    l2_threshold = 2.0 * (1.0 - threshold)

    # For each vector, find neighbours within threshold
    # Use range_search for exact results
    lims, D, I = index.range_search(embeddings, l2_threshold)

    # Union-Find for transitive grouping
    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: int, b: int) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for i in range(n):
        start, end = int(lims[i]), int(lims[i + 1])
        for j_idx in range(start, end):
            j = int(I[j_idx])
            if i != j:
                union(i, j)

    # Collect clusters
    cluster_map: dict[int, list[int]] = {}
    for i in range(n):
        root = find(i)
        cluster_map.setdefault(root, []).append(i)

    clusters: list[QuestionCluster] = []
    for cid, (root, members) in enumerate(sorted(cluster_map.items())):
        # Only keep clusters with ≥ 2 questions (repeated in different papers)
        unique_papers = set(paper_ids[m] for m in members)
        if len(unique_papers) < 2 and len(members) < 2:
            # Single-occurrence question from one paper – skip
            continue

        # Representative: the longest question text (usually most complete)
        rep_idx = max(members, key=lambda m: len(texts[m]))

        cluster = QuestionCluster(
            cluster_id=cid,
            representative_text=texts[rep_idx],
            question_indices=members,
            question_texts=[texts[m] for m in members],
            paper_ids=[paper_ids[m] for m in members],
            years=[years[m] for m in members],
        )
        clusters.append(cluster)

    logger.info(
        "clustering_done",
        total_questions=n,
        clusters_formed=len(clusters),
    )
    return clusters
