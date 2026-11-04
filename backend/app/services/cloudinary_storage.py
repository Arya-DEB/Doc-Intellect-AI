import logging
from pathlib import Path
from uuid import uuid4
import time
import cloudinary
import cloudinary.uploader
import cloudinary.utils

logger = logging.getLogger(__name__)

CLOUDINARY_FOLDER = "doc-intellect"


def get_signed_pdf_url(
    public_id: str,
    expires_in: int = 300,
    attachment: bool = True,
) -> str:
    """Time-limited URL for a private authenticated PDF."""
    return cloudinary.utils.private_download_url(
        public_id,
        "",
        resource_type="raw",
        type="authenticated",
        expires_at=int(time.time()) + expires_in,
        attachment=attachment,
    )

def upload_pdf(
    file_path: str | Path,
    user_id: int,
) -> dict:
    public_id = (
        f"{CLOUDINARY_FOLDER}/{user_id}/{uuid4().hex}.pdf"
    )

    result = cloudinary.uploader.upload(
        str(file_path),
        resource_type="raw",
        type="authenticated",
        public_id=public_id,
        overwrite=False,
        use_filename=False,
        unique_filename=False,
    )

    return {
        "public_id": result["public_id"],
        "secure_url": result.get("secure_url"),
        "bytes": result.get("bytes"),
        "format": result.get("format"),
    }


def delete_pdf(public_id: str) -> None:
    result = cloudinary.uploader.destroy(
        public_id,
        resource_type="raw",
        type="authenticated",
        invalidate=True,
    )

    if result.get("result") not in {"ok", "not found"}:
        raise RuntimeError("Cloudinary failed to delete the PDF")