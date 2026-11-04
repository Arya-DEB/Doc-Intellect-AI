from typing import TypedDict


class RAGState(TypedDict, total=False):
    question: str
    user_id: int
    top_k: int
    document_id: int | None
    search_query: str
    retry_count: int
    chunks: list
    answer: str
    sources: list[dict]