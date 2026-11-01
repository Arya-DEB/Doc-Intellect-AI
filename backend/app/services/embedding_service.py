import logging
from functools import lru_cache

from fastembed import TextEmbedding

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
EMBEDDING_DIM = 384

@lru_cache
def get_embedding_model() -> TextEmbedding:
    """Get the embedding model, cached for efficiency."""
    logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
    return TextEmbedding(model_name=EMBEDDING_MODEL)

def embed_texts(texts:list[str], batch_size:int=32) -> list[float]:
    """Embed a list of texts using the embedding model."""
    if not texts:
        return []
    model = get_embedding_model()
    vectors=[vector.tolist() for vector in model.embed(texts,batch_size=batch_size)]

    if len(vectors[0]) != EMBEDDING_DIM:
        raise ValueError(f"Expected embedding dimension {EMBEDDING_DIM}, but got {len(vectors[0])}")
    return vectors

def embed_query(text: str) -> list[float]:
    """Embed a user question. Use this for searching, embed_texts for chunks."""
    model = get_embedding_model()
    vector = next(iter(model.query_embed(text)))
    return vector.tolist()