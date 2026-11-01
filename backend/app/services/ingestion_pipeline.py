import logging
import re
from pathlib import Path

from app.services.chunking import (
    DEFAULT_CHUNK_SIZE,
    DEFAULT_CHUNK_OVERLAP,
    Chunk,
    chunk_pages,
)
from app.services.text_extraction import get_file_type, load_pdf, Page

logger = logging.getLogger(__name__)


def clean_source_text(text: str) -> str:
    """Strip web-scraping citation artifacts like 【4†L1-L5】 or 【1】 from raw document text."""
    if not text:
        return ""
    # Removes bracketed tags containing reference symbols or pure numbers
    text = re.sub(r"【\d+†[^】]+】", "", text)
    text = re.sub(r"【\d+】", "", text)
    # Normalize leftover multiple spaces
    return re.sub(r" {2,}", " ", text).strip()


def ingest_document(
        path: str | Path,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[Chunk]:
    """Ingest a document, clean citation artifacts, and return its chunks."""
    path = Path(path)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")

    file_type = get_file_type(path)
    logger.info("Ingesting %s document: %s", file_type.upper(), path.name)

    if file_type == "pdf":
        raw_pages = load_pdf(path)
    else:
        raise NotImplementedError(f"Ingestion for '{file_type}' is not implemented yet.")

    # Clean citation markers from each page's content before chunking
    cleaned_pages = []
    for page in raw_pages:
        cleaned_content = clean_source_text(page.text)
        # Recreate or update the Page object with cleaned text
        if cleaned_content:
            cleaned_pages.append(Page(text=cleaned_content, page=page.page))

    chunks = chunk_pages(
        pages=cleaned_pages,
        filename=path.name,
        filetype=file_type,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    logger.info("Document '%s' ingested into %d chunks.", path.name, len(chunks))
    return chunks