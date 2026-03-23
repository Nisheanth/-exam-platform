"""Google Gemini prediction service with structured prompts and retry logic."""

from __future__ import annotations

import json
import structlog
from sqlalchemy.orm import Session

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import get_settings
from app.models.analysis import AnalysisResult
from app.schemas.prediction import PredictResponse, PredictionItem

logger = structlog.get_logger(__name__)
settings = get_settings()


def build_prediction_prompt(analysis_data: dict) -> str:
    """Construct a structured prompt from analysis results."""
    repeated = analysis_data.get("repeated_questions", [])
    heatmap = analysis_data.get("topic_heatmap", [])
    important = analysis_data.get("important_questions", [])

    prompt_parts: list[str] = []

    prompt_parts.append(
        "You are an expert exam pattern analyst. Based on the historical "
        "exam data below, predict which questions and topics are most likely "
        "to appear in the next exam.\n"
    )

    if repeated:
        prompt_parts.append("## Frequently Repeated Questions")
        for i, rq in enumerate(repeated[:20], 1):
            prompt_parts.append(
                f"{i}. \"{rq['question_text']}\" — appeared in years "
                f"{rq['years']} (frequency: {rq['frequency']}, topic: {rq['topic']})"
            )
        prompt_parts.append("")

    if heatmap:
        prompt_parts.append("## Topic Frequency Heatmap (year → count)")
        for entry in heatmap[:30]:
            counts_str = ", ".join(
                f"{y}: {c}" for y, c in entry["year_counts"].items()
            )
            prompt_parts.append(
                f"- {entry['topic']}: {counts_str} | Total: {entry['total']} | "
                f"Gap years: {entry['gap_years']}"
            )
        prompt_parts.append("")

    if important:
        prompt_parts.append("## High-Importance Questions")
        for i, iq in enumerate(important[:15], 1):
            prompt_parts.append(
                f"{i}. \"{iq['question_text']}\" — score: {iq['score']}, "
                f"topic: {iq['topic']}, seen in: {iq['years_seen']}"
            )
        prompt_parts.append("")

    overdue = [
        e["topic"] for e in heatmap
        if e.get("gap_years", 0) >= 2
    ]
    if overdue:
        prompt_parts.append("## Overdue Topics (absent 2+ years)")
        for t in overdue:
            prompt_parts.append(f"- {t}")
        prompt_parts.append("")

    prompt_parts.append(
        "## Instructions\n"
        "Based on the data above, provide your analysis as a JSON object with "
        "exactly this structure:\n"
        "```json\n"
        "{\n"
        '  "predictions": [\n'
        "    {\n"
        '      "question": "Predicted question text",\n'
        '      "topic": "Topic name",\n'
        '      "confidence": "High" or "Medium",\n'
        '      "reason": "Why this is likely to appear"\n'
        "    }\n"
        "  ],\n"
        '  "overdue_topics": ["Topic1", "Topic2"],\n'
        '  "strategy_tip": "A concise study strategy recommendation"\n'
        "}\n"
        "```\n\n"
        "Provide 10-15 predictions. Include all overdue topics. "
        "The strategy_tip should be actionable and specific to the data.\n"
        "Return ONLY the JSON, no other text."
    )

    return "\n".join(prompt_parts)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    reraise=True,
)
def call_gemini(prompt: str) -> dict:
    """Send the prediction prompt to Gemini and parse the JSON response."""
    import google.generativeai as genai  # lazy import

    genai.configure(api_key=settings.GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    logger.info("gemini_api_call", prompt_len=len(prompt))

    response = model.generate_content(prompt)
    response_text = response.text

    logger.info("gemini_response_received", response_len=len(response_text))

    # Parse JSON — strip markdown code fences if present
    clean = response_text.strip()
    if clean.startswith("```"):
        lines = clean.split("\n")
        json_lines = []
        inside = False
        for line in lines:
            if line.strip().startswith("```") and not inside:
                inside = True
                continue
            elif line.strip().startswith("```") and inside:
                break
            elif inside:
                json_lines.append(line)
        clean = "\n".join(json_lines)

    parsed = json.loads(clean)
    return parsed


def predict(
    db: Session,
    exam_name: str,
    subject: str,
    analysis_id,
) -> PredictResponse:
    """Run the full prediction pipeline using Google Gemini."""
    analysis = db.query(AnalysisResult).filter(AnalysisResult.id == str(analysis_id)).first()
    if not analysis:
        raise ValueError(f"Analysis result {analysis_id} not found")

    if analysis.exam_name != exam_name or analysis.subject != subject:
        raise ValueError(
            f"Analysis {analysis_id} belongs to "
            f"{analysis.exam_name}/{analysis.subject}, "
            f"not {exam_name}/{subject}"
        )

    prompt = build_prediction_prompt(analysis.result_json)
    raw_response = call_gemini(prompt)

    predictions = []
    for p in raw_response.get("predictions", []):
        predictions.append(
            PredictionItem(
                question=p.get("question", ""),
                topic=p.get("topic", ""),
                confidence=p.get("confidence", "Medium"),
                reason=p.get("reason", ""),
            )
        )

    overdue_topics = raw_response.get("overdue_topics", [])
    strategy_tip = raw_response.get("strategy_tip", "Focus on frequently tested topics.")

    response = PredictResponse(
        predictions=predictions,
        overdue_topics=overdue_topics,
        strategy_tip=strategy_tip,
    )

    logger.info(
        "prediction_complete",
        exam=exam_name,
        subject=subject,
        num_predictions=len(predictions),
    )
    return response
