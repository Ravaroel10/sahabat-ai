"""
Embedding service — wraps ChromaDB embedding functions behind a single
interface so the embedding model can be swapped via configuration.

Supported backends:
- openai: OpenAI text-embedding-3-small (requires API key)
- sentence-transformers: all-MiniLM-L6-v2 (local, CPU, no GPU needed)
- huggingface: HuggingFace Inference API (free tier, requires HF token)
"""

from typing import Any
from functools import lru_cache

from app.config import get_settings
from database.chroma import get_chroma_service


@lru_cache
def get_embedding_function() -> Any:
    """Return the configured embedding function for ChromaDB.

    Delegates to the ChromaService so that chromadb is only imported
    inside database/chroma.py (design constraint).

    The selection is based on the EMBEDDING_MODEL env var:
    - 'openai': uses OpenAI text-embedding-3-small
    - 'sentence-transformers': uses all-MiniLM-L6-v2 (local, CPU)
    - 'huggingface': uses HuggingFace Inference API (free tier)
    """
    settings = get_settings()
    chroma = get_chroma_service()
    return chroma.get_embedding_function(
        settings.EMBEDDING_MODEL, 
        settings.EMBEDDING_API_KEY,
        settings.HUGGINGFACE_MODEL,
    )
