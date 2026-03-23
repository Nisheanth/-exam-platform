"""Chat API endpoint."""

import structlog
from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chatbot import generate_chat_response

logger = structlog.get_logger(__name__)
router = APIRouter()

@router.post("", response_model=ChatResponse)
def chat_with_tutor(request: ChatRequest) -> ChatResponse:
    """Send a message to the AI Study Tutor.
    
    Uses historical messages for context and optionally an exam/subject context.
    """
    try:
        response_text = generate_chat_response(
            message=request.message,
            history=request.history,
            exam_context=request.exam_context
        )
        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error("chat_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to communicate with AI Tutor")
