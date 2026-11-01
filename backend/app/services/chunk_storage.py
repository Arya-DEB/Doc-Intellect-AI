from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.services.chunking import Chunk
from app.services.embedding_service import embed_texts


def store_document_chunks(
    db: Session,
    chunks: list[Chunk],
    document_id: int,
    user_id: int,
) -> int:
    """Generate embeddings and add document chunks to the DB session."""
    if not chunks:
        raise ValueError("No chunks to store")

    texts = [chunk.content for chunk in chunks]
    embeddings = embed_texts(texts)

    if len(embeddings) != len(chunks):
        raise ValueError("Embedding count does not match chunk count")

    db_chunks = [
        DocumentChunk(
            document_id=document_id,
            user_id=user_id,
            chunk_index=chunk.chunk_index,
            content=chunk.content,
            embedding=embedding,
            page_number=chunk.page,
        )
        for chunk, embedding in zip(chunks, embeddings)
    ]

    db.add_all(db_chunks)
    return len(db_chunks)