from pydantic import BaseModel, Field,ConfigDict
from datetime import datetime

class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=5000)
    top_k: int = Field(default=5, ge=1, le=20)
    conversation_id: int | None = None
    document_id: int | None = None


class SourceResponse(BaseModel):
    chunk_id: int
    document_id: int
    page_number: int | None
    content: str


class QuestionResponse(BaseModel):
    question: str
    answer: str
    sources: list[SourceResponse]
    conversation_id: int




class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailResponse(ConversationResponse):
    messages: list[ChatMessageResponse]