import re
from pathlib import Path
from fastapi import HTTPException, UploadFile

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
PDF_SIGNATURE = b"%PDF-"


def sanitize_filename(filename: str | None) -> str:
    if not filename:
        return "document.pdf"

    # Remove any path components supplied by the client
    name = Path(filename.replace("\\", "/")).name

    # Keep only safe filename characters
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    name = name.strip("._")

    if not name:
        name = "document.pdf"

    if not name.lower().endswith(".pdf"):
        name += ".pdf"

    return name[:255]


async def read_and_validate_pdf(upload: UploadFile) -> bytes:
    filename = upload.filename or ""

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=422,
            detail="Only PDF files are allowed",
        )

    # MIME type is client-provided, so treat it as an additional check only
    if upload.content_type not in (
        "application/pdf",
        "application/octet-stream",
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid file content type",
        )

    contents = bytearray()

    # Read incrementally to enforce the limit before loading the whole file
    while True:
        chunk = await upload.read(1024 * 1024)

        if not chunk:
            break

        contents.extend(chunk)

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds the 10 MB limit",
            )

    if not contents.startswith(PDF_SIGNATURE):
        raise HTTPException(
            status_code=422,
            detail="File does not appear to be a valid PDF",
        )

    return bytes(contents)