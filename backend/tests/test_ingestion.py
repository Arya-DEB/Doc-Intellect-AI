from pathlib import Path

from app.services.ingestion_pipeline import ingest_document

file_path = Path("uploads/bc398cc479d54bce8770b1fa8593493e.pdf")

chunks = ingest_document(file_path)

print(f"Total chunks: {len(chunks)}")

for chunk in chunks[:3]:
    print("\n--- Chunk ---")
    print("Index:", chunk.chunk_index)
    print("Page:", chunk.page)
    print("Text:", chunk.content[:300])