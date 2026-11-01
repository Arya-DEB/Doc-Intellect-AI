from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.services.retrieval_service import retrieve_relevant_chunks
from app.services.generation_service import generate_answer


def answer_question(
    db: Session,
    question: str,
    user_id: int,
    top_k: int = 5,
) -> dict:
    # Retrieve relevant chunks belonging to this user
    chunks = retrieve_relevant_chunks(
        db=db,
        question=question,
        user_id=user_id,
        top_k=top_k,
    )

    # Generate an answer using the retrieved context
    answer = generate_answer(
        question=question,
        chunks=chunks,
    )

    # Return answer and source metadata
    sources = [
        {
            "chunk_id": chunk.id,
            "document_id": chunk.document_id,
            "page_number": chunk.page_number,
            "content": chunk.content,
        }
        for chunk in chunks
    ]

    return {
        "question": question,
        "answer": answer,
        "sources": sources,
    }