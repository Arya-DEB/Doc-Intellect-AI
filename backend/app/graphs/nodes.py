import logging

from langchain_core.runnables import RunnableConfig

from app.graphs.state import RAGState
from app.services.generation_service import generate_answer
from app.services.query_rewrite_service import rewrite_query
from app.services.retrieval_service import retrieve_relevant_chunks
from app.services.router_service import smalltalk_reply

logger = logging.getLogger(__name__)

NOT_FOUND = "I couldn't find this information in the uploaded documents."

# Placeholder thresholds; tune after checking real scores in LangSmith.
MIN_SCORE = 0.35
# Each retry costs one LLM call (query rewrite), so keep this small.
MAX_RETRIES = 1


# ---------- routing (no LLM) ----------
def route_question(state: RAGState) -> str:
    # smalltalk_reply is cached, so calling it again in smalltalk_node is free.
    if smalltalk_reply(state["question"]) is not None:
        return "smalltalk"
    return "retrieve"


def smalltalk_node(state: RAGState) -> RAGState:
    reply = smalltalk_reply(state["question"]) or (
        "I'm Doc Intellect AI. Ask me about your uploaded documents."
    )
    return {"answer": reply, "sources": []}


# ---------- retrieval (local embeddings + DB, no LLM) ----------
def retrieve_node(state: RAGState, config: RunnableConfig) -> RAGState:
    db = config["configurable"]["db"]
    search_query = state.get("search_query") or state["question"]

    chunks = retrieve_relevant_chunks(
        db=db,
        question=search_query,
        user_id=state["user_id"],
        top_k=state.get("top_k", 3),
        document_id=state.get("document_id"),
    )

    return {"chunks": chunks}


def _top_score(chunks: list) -> float | None:
    """Read the best chunk's similarity from an object or a dict."""
    first = chunks[0]
    for name in ("similarity_score", "score"):
        value = (
            first.get(name) if isinstance(first, dict) else getattr(first, name, None)
        )
        if value is not None:
            return float(value)
    return None


def check_relevance(state: RAGState) -> str:
    chunks = state.get("chunks") or []
    if not chunks:
        return "weak"

    score = _top_score(chunks)
    if score is None:
        # Retrieval isn't returning scores, so the gate cannot work.
        logger.warning("No similarity score on retrieved chunks; relevance gate skipped.")
        return "relevant"

    logger.info("Top similarity score: %.3f", score)
    return "relevant" if score >= MIN_SCORE else "weak"


def retry_or_stop_node(state: RAGState) -> RAGState:
    """Pass-through node: gives the conditional edge below something to branch from."""
    return {}


def route_after_retrieval(state: RAGState) -> str:
    if state.get("retry_count", 0) < MAX_RETRIES:
        return "rewrite"
    return "not_found"


# ---------- retry path (one LLM call) ----------
def rewrite_query_node(state: RAGState) -> RAGState:
    rewritten = rewrite_query(state["question"])
    return {
        "search_query": rewritten,
        "retry_count": state.get("retry_count", 0) + 1,
    }


def not_found_node(state: RAGState) -> RAGState:
    return {"answer": NOT_FOUND, "sources": []}


# ---------- the main token-spending node ----------
def generate_node(state: RAGState) -> RAGState:
    chunks = state["chunks"]

    answer = generate_answer(
        question=state["question"],
        chunks=chunks,
    )

    # A refusal should never show sources
    if answer.strip() == NOT_FOUND:
        return {"answer": NOT_FOUND, "sources": []}

    sources = [
        {
            "chunk_id": chunk.id,
            "document_id": chunk.document_id,
            "page_number": chunk.page_number,
            "content": chunk.content,
        }
        for chunk in chunks
    ]
    return {"answer": answer, "sources": sources}