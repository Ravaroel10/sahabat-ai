"""
Custom HuggingFace embedding function for ChromaDB.

Uses the HuggingFace Inference API feature_extraction endpoint to generate
embeddings. This provides free-tier access to HuggingFace's embedding models.
"""

from typing import Union
import logging

from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from huggingface_hub import InferenceClient

logger = logging.getLogger(__name__)


class HuggingFaceEmbeddingFunction(EmbeddingFunction[Documents]):
    """
    HuggingFace embedding function using the Inference API.
    
    This function generates embeddings using HuggingFace's free Inference API
    via the feature_extraction endpoint.
    """

    def __init__(
        self,
        api_key: str,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        normalize: bool = True,
    ):
        """
        Initialize the HuggingFace embedding function.
        
        Args:
            api_key: HuggingFace API token (required for Inference API)
            model_name: HuggingFace model ID (default: sentence-transformers/all-MiniLM-L6-v2)
            normalize: Whether to normalize embeddings (default: True)
        """
        if not api_key:
            raise ValueError("HuggingFace API key is required")
        
        self._client = InferenceClient(
            token=api_key,
        )
        self._model_name = model_name
        self._normalize = normalize

    def __call__(self, input: Documents) -> Embeddings:
        """
        Generate embeddings for the given documents.
        
        Args:
            input: List of text documents to embed
            
        Returns:
            List of embedding vectors (one per document)
        """
        import numpy as np
        
        embeddings = []
        
        # Process each document
        for text in input:
            try:
                # Call HuggingFace Inference API for feature extraction
                # Returns a numpy array (np.ndarray)
                result = self._client.feature_extraction(
                    text,
                    model=self._model_name,
                )
                
                # Convert numpy array to list
                if isinstance(result, np.ndarray):
                    # For 2D arrays (batch of embeddings), take the first row
                    if result.ndim == 2:
                        embedding = result[0].tolist()
                    # For 1D arrays, convert directly
                    elif result.ndim == 1:
                        embedding = result.tolist()
                    else:
                        logger.warning(f"Unexpected array dimensions: {result.ndim}")
                        embedding = [0.0] * 384
                    
                    embeddings.append(embedding)
                else:
                    logger.warning(f"Unexpected result type: {type(result)}")
                    # Return a zero vector of appropriate dimension as fallback
                    # all-MiniLM-L6-v2 has 384 dimensions
                    embeddings.append([0.0] * 384)
                    
            except Exception as e:
                logger.error(f"Error generating embedding: {e}")
                # Return a zero vector as fallback (384 dimensions for all-MiniLM-L6-v2)
                embeddings.append([0.0] * 384)
        
        return embeddings
