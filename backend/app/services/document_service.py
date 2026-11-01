
from sqlalchemy.orm import Session

from app.models.document import Document


def create_document(
    db: Session,
    user_id: int,
    filename: str,
    file_path: str,
    file_type: str,
    file_size: int,
) -> Document:
    document = Document(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


def get_user_documents(db: Session, user_id: int):
    return (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
        .all()
    )


def get_user_document(
    db: Session,
    document_id: int,
    user_id: int,
):
    return (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == user_id,
        )
        .first()
    )
