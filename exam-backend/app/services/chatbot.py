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
        "You are an infinitely intelligent, omniscient AI Assistant integrated into the TestGenie Platform.\n"
        "Your primary goal is to provide immediate, definitive, and universally accurate answers to ANY question "
        "asked by any person, regardless of the topic.\n"
        "If they ask an exam question, explain the core concepts vividly with examples. "
        "If they ask a general knowledge, coding, life advice, or mathematical question, answer it immediately with absolute clarity and depth.\n"
        "Format your responses beautifully with markdown (using bullet points, bold emphasis, and clear spacing) so it is effortless to read.\n"
    )
    if exam_context:
        system_instruction += f"The student is specifically preparing for: {exam_context}.\n"

    # Instead of Gemini's highly strict chat history API (which crashes if roles don't strictly alternate),
    # we inject the conversation transcript directly into the prompt to guarantee reliability.
    conversation = ""
    # Keep the last 6 messages to provide conversational context without overflow
    for msg in history[-6:]:
        speaker = "AI Tutor" if msg.role == "ai" else "Student"
        conversation += f"{speaker}: {msg.content}\n\n"

    prompt = f"{conversation}Student: {message}\n\nAI Tutor:"

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_instruction,
    )

    logger.info("chatbot_request", context=exam_context, history_len=len(history))
    
    response = model.generate_content(prompt)
    return response.text
