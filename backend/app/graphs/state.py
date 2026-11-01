from typing import TypedDict


class RAGState(TypedDict, total=False):
    question: str
    user_id: int
    top_k: int
    search_query: str
    retry_count: int
    chunks: list
    answer: str
    sources: list[dict]