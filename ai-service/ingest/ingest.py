"""
Ingest pipeline — reads the existing JSON corpora, chunks each record into
Document objects (via LangChain), embeds them, and stores in ChromaDB.

Idempotent: re-running upserts by id (no duplicates).

Usage:
    python -m ingest.ingest

Reads from the Next.js src/data/ directory (relative to project root).
"""

import json
import os
import sys
from typing import Any, Dict, List

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings
from database.chroma import get_chroma_service
from services.embeddings import get_embedding_function

# Path to the Next.js data directory (relative to project root)
# In Docker, this will be mounted at /app/src/data
DATA_DIR = "/app/src/data"

COLLECTION_NAME = "bantu_arah_knowledge"


def ingest_all() -> None:
    """Run the full ingest pipeline for all three corpora."""
    settings = get_settings()
    chroma = get_chroma_service()
    embedding_fn = get_embedding_function()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )

    total = 0

    # 1. Social programs
    programs_path = os.path.join(DATA_DIR, "programs", "social-programs.json")
    if os.path.exists(programs_path):
        count = _ingest_programs(programs_path, chroma, embedding_fn, splitter)
        total += count
        print(f"  Programs: {count} chunks ingested")
    else:
        print(f"  WARNING: {programs_path} not found, skipping programs")

    # 2. Institutions
    institutions_path = os.path.join(DATA_DIR, "institutions", "institutions.json")
    if os.path.exists(institutions_path):
        count = _ingest_institutions(institutions_path, chroma, embedding_fn, splitter)
        total += count
        print(f"  Institutions: {count} chunks ingested")
    else:
        print(f"  WARNING: {institutions_path} not found, skipping institutions")

    # 3. Document templates
    templates_path = os.path.join(DATA_DIR, "documents", "document-templates.json")
    if os.path.exists(templates_path):
        count = _ingest_templates(templates_path, chroma, embedding_fn, splitter)
        total += count
        print(f"  Document templates: {count} chunks ingested")
    else:
        print(f"  WARNING: {templates_path} not found, skipping templates")

    print(f"\nIngest complete: {total} total chunks in ChromaDB.")


def _ingest_programs(
    path: str, chroma, embedding_fn, splitter
) -> int:
    """Ingest social programs JSON into ChromaDB."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    programs = data.get("programs", [])
    documents: List[str] = []
    ids: List[str] = []
    metadatas: List[Dict[str, Any]] = []

    for program in programs:
        # Build a text representation of the program
        text = _program_to_text(program)

        # Create a Document with metadata, then split into chunks
        # (split_documents preserves metadata across chunks)
        base_metadata = {
            "source": "programs",
            "record_id": program["id"],
            "record_type": "program",
            "legal_basis": program.get("legalBasis", ""),
            "acronym": program.get("acronym", ""),
            "name": program.get("name", ""),
        }
        doc = Document(page_content=text, metadata=base_metadata)
        chunks = splitter.split_documents([doc])

        for i, chunk in enumerate(chunks):
            doc_id = f"program_{program['id']}_chunk_{i}"
            documents.append(chunk.page_content)
            ids.append(doc_id)
            metadatas.append({**chunk.metadata, "chunk_index": i})

    chroma.add_documents(
        collection_name=COLLECTION_NAME,
        documents=documents,
        ids=ids,
        metadatas=metadatas,
        embedding_function=embedding_fn,
    )

    return len(documents)


def _ingest_institutions(
    path: str, chroma, embedding_fn, splitter
) -> int:
    """Ingest institutions JSON into ChromaDB."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    institutions = data.get("institutions", [])
    documents: List[str] = []
    ids: List[str] = []
    metadatas: List[Dict[str, Any]] = []

    for inst in institutions:
        text = _institution_to_text(inst)
        base_metadata = {
            "source": "institutions",
            "record_id": inst["id"],
            "record_type": "institution",
            "name": inst.get("name", ""),
            "acronym": inst.get("acronym", ""),
        }
        doc = Document(page_content=text, metadata=base_metadata)
        chunks = splitter.split_documents([doc])

        for i, chunk in enumerate(chunks):
            doc_id = f"institution_{inst['id']}_chunk_{i}"
            documents.append(chunk.page_content)
            ids.append(doc_id)
            metadatas.append({**chunk.metadata, "chunk_index": i})

    chroma.add_documents(
        collection_name=COLLECTION_NAME,
        documents=documents,
        ids=ids,
        metadatas=metadatas,
        embedding_function=embedding_fn,
    )

    return len(documents)


def _ingest_templates(
    path: str, chroma, embedding_fn, splitter
) -> int:
    """Ingest document templates JSON into ChromaDB."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    templates = data.get("templates", [])
    documents: List[str] = []
    ids: List[str] = []
    metadatas: List[Dict[str, Any]] = []

    for template in templates:
        text = _template_to_text(template)
        base_metadata = {
            "source": "document-templates",
            "record_id": template["id"],
            "record_type": "document-template",
            "name": template.get("name", ""),
        }
        doc = Document(page_content=text, metadata=base_metadata)
        chunks = splitter.split_documents([doc])

        for i, chunk in enumerate(chunks):
            doc_id = f"template_{template['id']}_chunk_{i}"
            documents.append(chunk.page_content)
            ids.append(doc_id)
            metadatas.append({**chunk.metadata, "chunk_index": i})

    chroma.add_documents(
        collection_name=COLLECTION_NAME,
        documents=documents,
        ids=ids,
        metadatas=metadatas,
        embedding_function=embedding_fn,
    )

    return len(documents)


def _program_to_text(program: Dict[str, Any]) -> str:
    """Convert a program record to a searchable text representation."""
    parts = [
        f"Program: {program.get('name', '')}",
        f"Singkatan: {program.get('acronym', '')}",
        f"Deskripsi: {program.get('description', '')}",
        f"Dasar Hukum: {program.get('legalBasis', '')}",
        f"Kementerian: {program.get('ministry', '')}",
        f"Manfaat: {program.get('benefits', '')}",
        f"Kelayakan: {program.get('eligibility', '')}",
        f"Dokumen Diperlukan: {program.get('documents', '')}",
        f"Kontak: {program.get('contact', '')}",
    ]
    keywords = program.get("keywords", [])
    if keywords:
        parts.append(f"Kata Kunci: {', '.join(keywords)}")
    return "\n".join(parts)


def _institution_to_text(inst: Dict[str, Any]) -> str:
    """Convert an institution record to a searchable text representation."""
    parts = [
        f"Institusi: {inst.get('name', '')}",
        f"Singkatan: {inst.get('acronym', '')}",
        f"Tipe: {inst.get('type', '')}",
        f"Alamat: {inst.get('address', '')}",
        f"Telepon: {inst.get('phone', '')}",
        f"Email: {inst.get('email', '')}",
        f"Website: {inst.get('website', '')}",
        f"Hotline: {inst.get('hotline', '')}",
    ]
    services = inst.get("services", [])
    if services:
        parts.append(f"Layanan: {', '.join(services)}")
    return "\n".join(parts)


def _template_to_text(template: Dict[str, Any]) -> str:
    """Convert a document template record to a searchable text representation."""
    parts = [
        f"Dokumen: {template.get('name', '')}",
        f"Tipe: {template.get('type', '')}",
        f"Deskripsi: {template.get('description', '')}",
    ]
    fields = template.get("fields", [])
    if fields:
        parts.append(f"Kolom: {', '.join(fields)}")
    return "\n".join(parts)


if __name__ == "__main__":
    print("Starting SAHABAT AI knowledge base ingest...")
    print(f"  Data directory: {DATA_DIR}")
    print(f"  ChromaDB path: {get_settings().CHROMA_PATH}")
    print()
    ingest_all()
