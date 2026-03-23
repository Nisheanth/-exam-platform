from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(..., description="Either 'user' or 'ai'")
    content: str = Field(..., description="The content of the message")

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's new message")
    history: list[ChatMessage] = Field(default_factory=list, description="Previous conversation history")
    exam_context: str | None = Field(None, description="Optional exam name/subject context")

class ChatResponse(BaseModel):
    response: str = Field(..., description="The AI's response")
