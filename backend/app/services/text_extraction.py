from dataclasses import dataclass
from pathlib import Path
from pypdf import PdfReader


# Maps file extensions to the file type stored in the database
SUPPORTED_EXTENSIONS = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".md": "md",
    ".markdown": "md",
}



@dataclass
class Page:
    """A piece of raw text from a document."""
    text: str
    page: int | None = None  # 1-based page number for PDFs


def get_file_type(path: str | Path) -> str:
    """Return 'pdf', 'docx' or 'md' for a path, or raise ValueError."""
    suffix = Path(path).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise ValueError(f"Unsupported file type '{suffix}'. Supported: {supported}")
    return SUPPORTED_EXTENSIONS[suffix]


def load_pdf(path: str | Path) -> list[Page]:
    """Extract text from each PDF page using pypdf."""
    path = Path(path)
    
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")

    reader = PdfReader(str(path))

    if reader.is_encrypted:
        raise ValueError(f"{path.name} is password-protected and cannot be read.")

    pages = []
    for number, pdf_page in enumerate(reader.pages, start=1):
        text = pdf_page.extract_text() or ""
        pages.append(Page(text=text, page=number))

    # Filter out empty pages
    pages = [p for p in pages if p.text.strip()]

    if not pages:
        raise ValueError(f"No text could be extracted from {path.name}.")

    return pages