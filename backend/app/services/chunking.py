from dataclasses import dataclass, field
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.services.text_extraction import Page

import hashlib
import re

############################# hash function for fingerprint  #############################################
def content_hash(text: str) -> str:
    """
    Fingerprint of a text, ignoring case and spacing differences.
    Two chunks with the same hash are treated as duplicates.
    """
    normalized = re.sub(r"\s+", " ", text).strip().lower()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
#############################################################################################################



DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 150

@dataclass
class Chunk:
    """A chunk of text from a document."""
    content: str
    chunk_index: int
    page: int | None = None  # 1-based page number for PDFs
    metadata: dict = field(default_factory=dict)

def chunk_pages(
    pages: list[Page], 
    filename: str | None = None,
    filetype: str | None = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE, 
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[Chunk]:
    """Split pages into chunks of text."""
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be less than chunk_size")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks:list[Chunk] = []
    seen_hashes: set[str] = set()

    for page in pages:
        page_chunks = text_splitter.split_text(page.text)
        for index, chunk_text in enumerate(page_chunks):
            chunk_text=chunk_text.strip()
            if not chunk_text:
                continue  # Skip empty chunks
            digest = content_hash(chunk_text)
            if digest in seen_hashes:
                continue  # Skip duplicate chunks
            seen_hashes.add(digest)

            chunk = Chunk(
                content=chunk_text,
                chunk_index=index,
                page=page.page,
                metadata={"source_page": page.page},
            )
            chunks.append(chunk)

    return chunks