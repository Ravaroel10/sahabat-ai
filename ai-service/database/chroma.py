"""
ChromaDB service — encapsulates all vector database operations.

No module outside this file should import `chromadb` directly. This enables
replacing ChromaDB with another vector store without affecting the rest of
the application.
"""

from typing import Any, Dict, List, Optional
from functools import lru_cache

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import get_settings


class ChromaService:
    """Encapsulates ChromaDB PersistentClient operations."""

    def __init__(self, path: str):
        self._path = path
        self._client = chromadb.PersistentClient(
            path=path,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

    def get_or_create_collection(
        self,
        name: str,
        embedding_function: Optional[Any] = None,
    ):
        """Get an existing collection or create a new one."""
        return self._client.get_or_create_collection(
            name=name,
            embedding_function=embedding_function,
            metadata={"hnsw:space": "cosine"},
        )

    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        ids: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        embedding_function: Optional[Any] = None,
    ) -> None:
        """Add or upsert documents into a collection (idempotent by id)."""
        collection = self.get_or_create_collection(
            collection_name, embedding_function=embedding_function
        )
        collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas or [{} for _ in documents],
        )

    def query(
        self,
        collection_name: str,
        query_texts: List[str],
        n_results: int = 5,
        embedding_function: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Perform a similarity search against a collection."""
        collection = self.get_or_create_collection(
            collection_name, embedding_function=embedding_function
        )
        if collection.count() == 0:
            return {
                "documents": [[]],
                "distances": [[]],
                "metadatas": [[]],
                "ids": [[]],
            }
        return collection.query(
            query_texts=query_texts,
            n_results=n_results,
            include=["documents", "distances", "metadatas"],
        )

    def delete_collection(self, name: str) -> None:
        """Delete a collection by name."""
        try:
            self._client.delete_collection(name)
        except Exception:
            pass  # Collection may not exist

    def count(self, collection_name: str) -> int:
        """Return the number of documents in a collection."""
        try:
            collection = self._client.get_collection(collection_name)
            return collection.count()
        except Exception:
            return 0

    def get_embedding_function(self, model: str, api_key: str = "", hf_model: str = ""):
        """Return a ChromaDB embedding function for the given backend.

        This is the ONLY place chromadb embedding utils are imported, per the
        design constraint that no module outside database/chroma.py imports chromadb.

        Args:
            model: 'openai', 'sentence-transformers', or 'huggingface'
            api_key: Required for 'openai' and 'huggingface' backends.
            hf_model: HuggingFace model ID for 'huggingface' backend.
        """
        from chromadb.utils import embedding_functions

        if model == "openai":
            return embedding_functions.OpenAIEmbeddingFunction(
                api_key=api_key,
                model_name="text-embedding-3-small",
            )
        elif model == "sentence-transformers":
            return embedding_functions.DefaultEmbeddingFunction()
        elif model == "huggingface":
            # Use custom HuggingFace embedding function
            from database.huggingface_embeddings import HuggingFaceEmbeddingFunction
            return HuggingFaceEmbeddingFunction(
                api_key=api_key,
                model_name=hf_model or "thenlper/gte-large",
            )
        else:
            raise ValueError(
                f"Unsupported embedding model: '{model}'. "
                "Must be 'openai', 'sentence-transformers', or 'huggingface'."
            )

    def health_check(self) -> None:
        """Verify ChromaDB is reachable. Raises on failure."""
        _ = self._client.heartbeat()


@lru_cache
def get_chroma_service() -> ChromaService:
    """Get cached ChromaService instance."""
    settings = get_settings()
    return ChromaService(path=settings.CHROMA_PATH)
