"""
RAG retrieval tool — searches the ChromaDB vector store for relevant context.

This tool is independent: it does not import other tools or the orchestrator.
The orchestrator calls this tool and composes results.
"""

from typing import Any, Dict, List

from app.config import get_settings
from database.chroma import get_chroma_service
from services.embeddings import get_embedding_function


def search_rag(query: str, k: int = 5) -> List[Dict[str, Any]]:
    """Search the RAG knowledge base for relevant document chunks.

    Args:
        query: The user's search query.
        k: Maximum number of results to return.

    Returns:
        List of dicts with keys: text, score, metadata.
        Empty list if no results are above the relevance threshold.
    """
    import logging
    import time
    
    logger = logging.getLogger(__name__)
    start_time = time.time()
    
    settings = get_settings()
    threshold = settings.RAG_RELEVANCE_THRESHOLD
    
    logger.info(f"📚 RAG: Searching knowledge base...")
    logger.info(f"   Query: {query[:100]}{'...' if len(query) > 100 else ''}")
    logger.info(f"   Max results (k): {k}")
    logger.info(f"   Relevance threshold: {threshold}")
    
    chroma = get_chroma_service()
    embedding_fn = get_embedding_function()

    # Query ChromaDB
    query_start = time.time()
    results = chroma.query(
        collection_name="bantu_arah_knowledge",
        query_texts=[query],
        n_results=k,
        embedding_function=embedding_fn,
    )
    query_time = time.time() - query_start
    logger.info(f"   ChromaDB query took: {query_time:.3f}s")

    documents = results.get("documents", [[]])
    distances = results.get("distances", [[]])
    metadatas = results.get("metadatas", [[]])
    ids = results.get("ids", [[]])

    if not documents or not documents[0]:
        logger.info(f"   ❌ No documents found in knowledge base")
        return []

    logger.info(f"   📄 Raw results from ChromaDB: {len(documents[0])} documents")

    parsed: List[Dict[str, Any]] = []
    filtered_count = 0
    
    for i, doc in enumerate(documents[0]):
        # ChromaDB cosine distance: lower is better. Convert to similarity score.
        distance = distances[0][i] if distances and distances[0] else 1.0
        score = 1.0 - distance  # similarity = 1 - distance

        metadata = metadatas[0][i] if metadatas and metadatas[0] else {}
        doc_id = ids[0][i] if ids and ids[0] else ""
        
        logger.info(f"   Document {i+1}: score={score:.4f}, distance={distance:.4f}, id={doc_id}")
        logger.info(f"              source={metadata.get('source', 'unknown')}")
        logger.info(f"              preview={doc[:80]}...")

        if score < threshold:
            logger.info(f"              ❌ FILTERED (below threshold {threshold})")
            filtered_count += 1
            continue

        parsed.append(
            {
                "text": doc,
                "score": score,
                "metadata": metadata,
                "id": doc_id,
            }
        )

    total_time = time.time() - start_time
    logger.info(f"   ✅ Returned {len(parsed)} documents (filtered {filtered_count} below threshold)")
    logger.info(f"   ⏱️  Total RAG search took: {total_time:.3f}s")

    return parsed
