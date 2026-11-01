from langgraph.graph import END, START, StateGraph

from app.graphs.nodes import (
    check_relevance,
    generate_node,
    not_found_node,
    retrieve_node,
    retry_or_stop_node,
    rewrite_query_node,
    route_after_retrieval,
    route_question,
    smalltalk_node,
)
from app.graphs.state import RAGState


def build_rag_graph():
    graph = StateGraph(RAGState)

    graph.add_node("smalltalk", smalltalk_node)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("retry_or_stop", retry_or_stop_node)
    graph.add_node("rewrite_query", rewrite_query_node)
    graph.add_node("not_found", not_found_node)
    graph.add_node("generate", generate_node)

    # 1. small talk never touches retrieval or the LLM
    graph.add_conditional_edges(
        START,
        route_question,
        {"smalltalk": "smalltalk", "retrieve": "retrieve"},
    )

    # 2. relevance gate after retrieval
    graph.add_conditional_edges(
        "retrieve",
        check_relevance,
        {"relevant": "generate", "weak": "retry_or_stop"},
    )

    # 3. weak results: retry once with a rewritten query, then give up
    graph.add_conditional_edges(
        "retry_or_stop",
        route_after_retrieval,
        {"rewrite": "rewrite_query", "not_found": "not_found"},
    )
    graph.add_edge("rewrite_query", "retrieve")

    graph.add_edge("smalltalk", END)
    graph.add_edge("not_found", END)
    graph.add_edge("generate", END)

    return graph.compile()


rag_graph = build_rag_graph()