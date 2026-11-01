from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.graphs.rag_graph import rag_graph
from app.core.database import get_db
from app.models.user import User
from app.models.chat import Conversation, ChatMessage
from app.schemas.qa import QuestionRequest, QuestionResponse
from app.core.dependencies import get_current_user

router = APIRouter(
    prefix="/chat",
    tags=["Question Answering"],
)


@router.post("/ask", response_model=QuestionResponse)
def ask_question(
    request: QuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Create a new conversation or verify ownership of an existing one
    if request.conversation_id is None:
        conversation = Conversation(
            user_id=current_user.id,
            title=request.question[:80],
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    else:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id,
            )
            .first()
        )

        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

    # Save the user's question
    user_message = ChatMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.question,
    )
    db.add(user_message)
    db.commit()

    try:
        result = rag_graph.invoke(
            {
                "question": request.question,
                "user_id": current_user.id,
                "top_k": request.top_k,
            },
            config={
                "configurable": {
                    "db": db,
                }
            },
        )

        answer = result["answer"]

        # Save the assistant's response
        assistant_message = ChatMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=answer,
        )
        db.add(assistant_message)

        # Update conversation timestamp
        db.commit()
        db.refresh(conversation)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate answer",
        )

    return {
        "question": request.question,
        "answer": answer,
        "sources": result.get("sources", []),
        "conversation_id": conversation.id,
    }