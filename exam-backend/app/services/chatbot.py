"""Socratic AI Chatbot service using Google Gemini."""

from __future__ import annotations

import structlog
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.core.config import get_settings
from app.schemas.chat import ChatMessage

logger = structlog.get_logger(__name__)
settings = get_settings()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    reraise=True,
)
def generate_chat_response(
    message: str,
    history: list[ChatMessage],
    exam_context: str | None = None,
) -> str:
    """Generate a response from Google Gemini using the Socratic method."""
    import google.generativeai as genai  # lazy import

    genai.configure(api_key=settings.GOOGLE_API_KEY)

    # Build System Prompt
    system_instruction = (
        "You are an expert AI Study Tutor. Your goal is to help a student prepare for their exams.\n"
        "Use the Socratic method where appropriate to guide them to the answer rather than just giving it straight away. "
        "Keep your tone encouraging, precise, and highly educational. "
        "Format your responses nicely with markdown (bullet points, bold text for emphasis).\n"
    )
    if exam_context:
        system_instruction += f"The student is specifically preparing for: {exam_context}.\n"

    # Gemini uses a different history format
    gemini_history = []
    for msg in history:
        role = "model" if msg.role == "ai" else "user"
        gemini_history.append({"role": role, "parts": [msg.content]})

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_instruction,
    )

    chat = model.start_chat(history=gemini_history)

    logger.info("chatbot_request", context=exam_context, history_len=len(history))

    response = chat.send_message(message)
    return response.text
