from datetime import datetime

from pydantic import BaseModel, ConfigDict


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


class ConversationDeleteResponse(BaseModel):
    message: str
    conversation_id: int