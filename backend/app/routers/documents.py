import logging
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4
import httpx
from fastapi import Response

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.file_validation import read_and_validate_pdf, sanitize_filename
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.user import User
from app.schemas.document import DocumentDeleteResponse, DocumentResponse
from app.services.chunk_storage import store_document_chunks
from app.services.cloudinary_storage import (
    delete_pdf,
    get_signed_pdf_url,
    upload_pdf,
)
from app.services.document_service import create_document
from app.services.ingestion_pipeline import ingest_document

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])

SIGNED_URL_TTL_SECONDS = 300


# ---------- helpers ----------
def _get_owned_document(db: Session, document_id: int, user_id: int) -> Document:
    document = db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == user_id,
        )
    ).scalar_one_or_none()

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    return document


def _cleanup_asset(public_id: str | None) -> None:
    """Best-effort removal of a Cloudinary asset after a failed request."""
    if not public_id:
        return
    try:
        delete_pdf(public_id)
    except Exception:
        logger.exception("Failed to clean up Cloudinary asset %s", public_id)


async def _ingest_and_upload(content: bytes, user_id: int):
    """Extract chunks first (cheap failure), then upload the original PDF."""
    with TemporaryDirectory() as tmp_dir:
        temp_path = Path(tmp_dir) / f"{uuid4().hex}.pdf"
        temp_path.write_bytes(content)

        try:
            chunks = await run_in_threadpool(ingest_document, temp_path)
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail="Unable to extract content from this PDF.",
            )

        asset = await run_in_threadpool(upload_pdf, temp_path, user_id)

    return chunks, asset


@router.get("/{document_id}/view")
def view_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = _get_owned_document(db, document_id, current_user.id)

    if not document.file_path:
        raise HTTPException(status_code=404, detail="No file is stored for this document.")

    url = get_signed_pdf_url(document.file_path, expires_in=60)

    try:
        upstream = httpx.get(url, timeout=30, follow_redirects=True)
    except httpx.HTTPError:
        logger.exception("Cloudinary fetch failed for document %s", document_id)
        raise HTTPException(status_code=502, detail="Could not fetch the file.")

    if upstream.status_code != 200:
        logger.error("Cloudinary returned %s for document %s", upstream.status_code, document_id)
        raise HTTPException(status_code=502, detail="Could not fetch the file.")

    return Response(
        content=upstream.content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "inline",
            "Cache-Control": "private, no-store",
        },
    )

# ---------- upload ----------
@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    safe_filename = sanitize_filename(file.filename)
    public_id: str | None = None

    try:
        content = await read_and_validate_pdf(file)
        chunks, asset = await _ingest_and_upload(content, current_user.id)
        public_id = asset["public_id"]

        document = create_document(
            db=db,
            user_id=current_user.id,
            filename=safe_filename,
            file_path=public_id,
            file_type="pdf",
            file_size=len(content),
        )

        await run_in_threadpool(
            store_document_chunks,
            db=db,
            chunks=chunks,
            document_id=document.id,
            user_id=current_user.id,
        )

        db.commit()
        db.refresh(document)

    except HTTPException:
        db.rollback()
        _cleanup_asset(public_id)
        raise

    except Exception:
        db.rollback()
        _cleanup_asset(public_id)
        logger.exception("Document upload failed for user_id=%s", current_user.id)
        raise HTTPException(
            status_code=500,
            detail="Failed to process the document.",
        )

    finally:
        await file.close()

    logger.info(
        "Document uploaded: document_id=%s user_id=%s chunks=%d size=%d",
        document.id, current_user.id, len(chunks), len(content),
    )
    return document


# ---------- read ----------
@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
    )
    return db.execute(statement).scalars().all()


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_document(db, document_id, current_user.id)


@router.get("/{document_id}/file")
def get_document_file(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = _get_owned_document(db, document_id, current_user.id)

    if not document.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No file is stored for this document.",
        )

    return {
        "document_id": document.id,
        "filename": document.filename,
        "url": get_signed_pdf_url(document.file_path, SIGNED_URL_TTL_SECONDS),
        "expires_in": SIGNED_URL_TTL_SECONDS,
    }


# ---------- replace ----------
@router.put("/{document_id}/file", response_model=DocumentResponse)
async def replace_document_file(
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = _get_owned_document(db, document_id, current_user.id)
    old_public_id = document.file_path
    new_public_id: str | None = None

    try:
        content = await read_and_validate_pdf(file)
        chunks, asset = await _ingest_and_upload(content, current_user.id)
        new_public_id = asset["public_id"]

        # swap old chunks for new ones in one transaction
        db.execute(
            delete(DocumentChunk).where(DocumentChunk.document_id == document.id)
        )
        await run_in_threadpool(
            store_document_chunks,
            db=db,
            chunks=chunks,
            document_id=document.id,
            user_id=current_user.id,
        )

        document.filename = sanitize_filename(file.filename)
        document.file_path = new_public_id
        document.file_size = len(content)

        db.commit()
        db.refresh(document)

    except HTTPException:
        db.rollback()
        _cleanup_asset(new_public_id)
        raise

    except Exception:
        db.rollback()
        _cleanup_asset(new_public_id)
        logger.exception("Document replace failed for document_id=%s", document_id)
        raise HTTPException(
            status_code=500,
            detail="Failed to replace the document.",
        )

    finally:
        await file.close()

    # only after the DB commit succeeds is the old file safe to remove
    if old_public_id and old_public_id != new_public_id:
        _cleanup_asset(old_public_id)

    return document


# ---------- delete ----------
@router.delete("/{document_id}", response_model=DocumentDeleteResponse)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = _get_owned_document(db, document_id, current_user.id)
    public_id = document.file_path

    try:
        db.delete(document)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to delete document %s", document_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document.",
        )

    # DB first, then Cloudinary: a failed DB delete never loses the file
    _cleanup_asset(public_id)

    logger.info("User %s deleted document %s", current_user.id, document_id)
    return {
        "message": "Document deleted successfully.",
        "document_id": document_id,
    }