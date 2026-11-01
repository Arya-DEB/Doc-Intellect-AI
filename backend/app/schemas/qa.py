from pydantic import BaseModel, Field


class QuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=10)
    conversation_id: int | None = None

class SourceResponse(BaseModel):
    chunk_id: int
    document_id: int
    page_number: int | None
    content: str


class QuestionResponse(BaseModel):
    question: str
    answer: str
    sources: list  # Keep your existing source type if already defined
    conversation_id: int

class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=5000)
    top_k: int = Field(default=5, ge=1, le=20)
    conversation_id: int | None = None