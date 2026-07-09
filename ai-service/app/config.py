"""
Configuration module for the SAHABAT AI service.

All configuration is environment-based. Required variables are validated at
startup with clear error messages. No secrets are hardcoded.
"""

import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv

load_dotenv()


class ConfigError(Exception):
    """Raised when required configuration is missing or invalid."""


class Settings:
    """Application settings loaded from environment variables."""

    # LLM provider configuration (LiteLLM format)
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini/gemini-2.0-flash")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    
    # Provider-specific API keys (for fallback support)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    LLM_FALLBACK_MODELS: list = []  # Will be populated from env var
    
    def __init__(self):
        """Initialize settings and parse fallback models."""
        # Parse fallback models from comma-separated string
        fallback_str = os.getenv("LLM_FALLBACK_MODELS", "")
        if fallback_str:
            self.LLM_FALLBACK_MODELS = [m.strip() for m in fallback_str.split(",") if m.strip()]
        
        # Set primary API key based on model provider
        if self.LLM_MODEL.startswith("openrouter/") and not self.LLM_API_KEY:
            self.LLM_API_KEY = self.OPENROUTER_API_KEY
        elif self.LLM_MODEL.startswith("gemini/") and not self.LLM_API_KEY:
            self.LLM_API_KEY = self.GEMINI_API_KEY

    # Embedding configuration
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "huggingface")
    EMBEDDING_API_KEY: str = os.getenv("EMBEDDING_API_KEY", "")
    HUGGINGFACE_MODEL: str = os.getenv("HUGGINGFACE_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

    # ChromaDB configuration
    CHROMA_PATH: str = os.getenv("CHROMA_PATH", "./data/chroma")
    RAG_RELEVANCE_THRESHOLD: float = float(
        os.getenv("RAG_RELEVANCE_THRESHOLD", "0.5")
    )
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))

    # Exa Search configuration
    EXA_API_KEY: str = os.getenv("EXA_API_KEY", "")
    OFFICIAL_SEARCH_DOMAINS: List[str] = (
        [
            d.strip()
            for d in os.getenv(
                "OFFICIAL_SEARCH_DOMAINS",
                "kemensos.go.id,kemkes.go.id,bpjs-kesehatan.go.id,bnpb.go.id,jdih.go.id,satudata.go.id",
            ).split(",")
            if d.strip()
        ]
    )
    SEARCH_CACHE_TTL: int = int(os.getenv("SEARCH_CACHE_TTL", "300"))  # 5 minutes

    # CORS configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Ingest configuration
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "500"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "50"))

    # Supported LLM providers (LiteLLM supports 100+ providers)
    # Model format: provider/model-name
    # Examples: gemini/gemini-1.5-flash, openai/gpt-4o, openrouter/google/gemini-flash-1.5
    SUPPORTED_LLM_MODEL_PREFIXES = {"gemini/", "openai/", "openrouter/", "anthropic/"}

    # Supported embedding backends
    SUPPORTED_EMBEDDING_MODELS = {"openai", "sentence-transformers", "huggingface"}

    def validate(self) -> None:
        """Validate required configuration at startup. Fail fast with clear errors."""
        errors: List[str] = []

        # Validate LLM model format (should follow LiteLLM convention: provider/model)
        if not self.LLM_MODEL:
            errors.append("LLM_MODEL is required.")
        elif "/" not in self.LLM_MODEL:
            errors.append(
                f"LLM_MODEL '{self.LLM_MODEL}' must follow LiteLLM format: 'provider/model-name'. "
                f"Examples: 'gemini/gemini-1.5-flash', 'openai/gpt-4o', 'openrouter/google/gemini-flash-1.5'"
            )
        
        # Check if model prefix is recognized (optional warning)
        model_prefix = self.LLM_MODEL.split("/")[0] + "/" if "/" in self.LLM_MODEL else ""
        if model_prefix and not any(self.LLM_MODEL.startswith(prefix) for prefix in self.SUPPORTED_LLM_MODEL_PREFIXES):
            # Just a warning, not an error - LiteLLM supports many providers
            print(
                f"[WARNING] LLM_MODEL prefix '{model_prefix}' is not in the common list. "
                f"Common prefixes: {', '.join(sorted(self.SUPPORTED_LLM_MODEL_PREFIXES))}. "
                f"LiteLLM supports 100+ providers, so this may still work."
            )

        if not self.LLM_API_KEY:
            errors.append(
                "LLM_API_KEY is required. Set it in your environment or .env file."
            )

        if (
            self.EMBEDDING_MODEL not in self.SUPPORTED_EMBEDDING_MODELS
        ):
            errors.append(
                f"EMBEDDING_MODEL '{self.EMBEDDING_MODEL}' is not supported. "
                f"Must be one of: {', '.join(sorted(self.SUPPORTED_EMBEDDING_MODELS))}"
            )

        if self.EMBEDDING_MODEL == "openai" and not self.EMBEDDING_API_KEY:
            errors.append(
                "EMBEDDING_API_KEY is required when EMBEDDING_MODEL is 'openai'."
            )

        if self.EMBEDDING_MODEL == "huggingface" and not self.EMBEDDING_API_KEY:
            errors.append(
                "EMBEDDING_API_KEY (HuggingFace token) is required when EMBEDDING_MODEL is 'huggingface'."
            )

        if not self.CHROMA_PATH:
            errors.append("CHROMA_PATH is required.")

        if not self.FRONTEND_URL:
            errors.append("FRONTEND_URL is required for CORS configuration.")

        if errors:
            raise ConfigError(
                "Configuration validation failed:\n  - " + "\n  - ".join(errors)
            )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


def validate_config() -> None:
    """Validate configuration at startup."""
    get_settings().validate()
