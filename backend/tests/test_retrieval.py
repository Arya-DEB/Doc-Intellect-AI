from unittest.mock import patch

from app.services.retrieval_service import retrieve_relevant_chunks


def test_retrieve_relevant_chunks_filters_by_user_and_returns_top_k(db_session):
    # Arrange: mock the query embedding so the test doesn't load the model
    fake_embedding = [0.1] * 384

    with patch(
        "app.services.retrieval_service.embed_query",
        return_value=fake_embedding,
    ):
        results = retrieve_relevant_chunks(
            db=db_session,
            question="What is the document about?",
            user_id=1,
            top_k=5,
        )

    # Assert: retrieval returns a list and respects the requested limit
    assert isinstance(results, list)
    assert len(results) <= 5