from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import embed_query


def retrieve_relevant_chunks(
    db: Session,
    question: str,
    user_id: int,
    top_k: int = 5,
    document_id: int | None = None,
) -> list[DocumentChunk]:
    query_embedding = embed_query(question)

    distance = DocumentChunk.embedding.cosine_distance(query_embedding)

    statement = select(
        DocumentChunk,
        distance.label("distance"),
    ).where(
        DocumentChunk.user_id == user_id,
    )

    # Restrict retrieval to the selected document when provided
    if document_id is not None:
        statement = statement.where(
            DocumentChunk.document_id == document_id
        )

    statement = statement.order_by(distance).limit(top_k)

    rows = db.execute(statement).all()

    chunks = []

    for chunk, cosine_distance in rows:
        chunk.similarity_score = 1 - float(cosine_distance)
        chunks.append(chunk)

    return chunks