from langchain_core.prompts import ChatPromptTemplate

from app.services.generation_service import get_llm


REWRITE_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """Rewrite the user's question into a clear, standalone search query
        for retrieving information from uploaded documents.

        Preserve the original meaning.
        Do not answer the question.
        Return only the rewritten query."""
    ),
    ("human", "Question: {question}")
])


def rewrite_query(question: str) -> str:
    chain = REWRITE_PROMPT | get_llm()
    response = chain.invoke({"question": question})
    rewritten = response.content.strip()

    return rewritten or question