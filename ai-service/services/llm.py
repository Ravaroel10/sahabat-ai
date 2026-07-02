"""
LLM service — abstraction layer for LLM generation using LiteLLM.

The orchestrator and tools must never import an LLM provider SDK directly.
All generation goes through LLMService.generate(...). The provider is
selected by the LLM_MODEL env var which uses LiteLLM's unified format:
- gemini/gemini-1.5-flash
- openai/gpt-4o
- openrouter/google/gemini-flash-1.5
- anthropic/claude-3.5-sonnet
etc.

LiteLLM provides unified interface for 100+ providers with automatic
fallback support, rate limiting, and consistent streaming across all models.
"""

from typing import Iterator, Optional, Dict, Any
from functools import lru_cache
import logging
import os

from litellm import completion
from litellm.exceptions import APIError, RateLimitError, Timeout

from app.config import get_settings, ConfigError

logger = logging.getLogger(__name__)


class LLMService:
    """Unified LLM generation service powered by LiteLLM."""

    def __init__(self, model: str, api_key: str, fallback_models: Optional[list] = None):
        self._model = model
        self._api_key = api_key
        self._fallback_models = fallback_models or []
        
        # Set API keys as environment variables for LiteLLM to auto-detect
        self._setup_api_keys()

    def _setup_api_keys(self):
        """Setup API keys in environment for LiteLLM auto-detection.
        
        This method sets up API keys for the primary model and all fallback models.
        LiteLLM will automatically detect these environment variables.
        """
        # Set up primary model API key
        if self._model.startswith("openrouter/"):
            if self._api_key:
                os.environ["OPENROUTER_API_KEY"] = self._api_key
        elif self._model.startswith("gemini/"):
            if self._api_key:
                os.environ["GEMINI_API_KEY"] = self._api_key
        elif self._model.startswith("openai/"):
            if self._api_key:
                os.environ["OPENAI_API_KEY"] = self._api_key
        elif self._model.startswith("anthropic/"):
            if self._api_key:
                os.environ["ANTHROPIC_API_KEY"] = self._api_key
        
        # Also set up API keys for fallback models from environment
        # This allows mixing different providers in the fallback chain
        from app.config import get_settings
        settings = get_settings()
        
        # OpenRouter fallback support
        if settings.OPENROUTER_API_KEY and not os.environ.get("OPENROUTER_API_KEY"):
            os.environ["OPENROUTER_API_KEY"] = settings.OPENROUTER_API_KEY
        
        # Gemini fallback support
        if hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY and not os.environ.get("GEMINI_API_KEY"):
            os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY

    def generate_stream(
        self,
        prompt: str,
        system_prompt: str = "",
        context: str = "",
        temperature: float = 0.7,
    ) -> Iterator[str]:
        """Stream LLM generation tokens as they arrive.

        Args:
            prompt: The user message / query.
            system_prompt: System instructions.
            context: Retrieved context (RAG or web search) to include.
            temperature: Sampling temperature.

        Yields:
            str: Individual text chunks as they arrive.
        """
        import time
        
        start_time = time.time()
        user_content = self._build_user_content(context, prompt)
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_content})

        logger.info("🤖 LLM SERVICE: Starting generation...")
        logger.info(f"   Primary model: {self._model}")
        logger.info(f"   Temperature: {temperature}")
        logger.info(f"   System prompt length: {len(system_prompt)} chars")
        logger.info(f"   Context length: {len(context)} chars")
        logger.info(f"   User prompt length: {len(prompt)} chars")
        logger.info(f"   Total input length: {sum(len(m['content']) for m in messages)} chars")

        # Try models in order: primary, then fallbacks
        models_to_try = [self._model] + (self._fallback_models if self._fallback_models else [])
        
        logger.info(f"   🎯 Fallback chain: {' → '.join(models_to_try)}")
        
        for attempt, model in enumerate(models_to_try):
            try:
                logger.info(f"\n   🔄 Attempt {attempt + 1}/{len(models_to_try)}: Calling model '{model}'...")
                call_start = time.time()
                
                # Use synchronous completion with streaming
                response = completion(
                    model=model,
                    messages=messages,
                    stream=True,
                    temperature=temperature,
                    timeout=30,
                    drop_params=True,  # Drop unsupported params for compatibility
                )

                logger.info(f"   ✅ Connection established to {model}")
                
                # Track streaming metrics
                token_count = 0
                first_token_time = None
                
                # Iterate through the streaming response
                for chunk in response:
                    if first_token_time is None:
                        first_token_time = time.time()
                        ttft = first_token_time - call_start  # Time to first token
                        logger.info(f"   ⚡ First token received in {ttft:.3f}s")
                    
                    # Extract content from the chunk
                    # LiteLLM uses OpenAI format: chunk['choices'][0]['delta']
                    if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            token_count += 1
                            yield delta.content
                    elif isinstance(chunk, dict):
                        # Fallback to dict access
                        delta = chunk.get('choices', [{}])[0].get('delta', {})
                        content = delta.get('content')
                        if content:
                            token_count += 1
                            yield content
                
                # If we successfully streamed, log metrics and break
                total_time = time.time() - start_time
                generation_time = time.time() - call_start
                
                logger.info(f"\n   ✅ Successfully completed streaming from '{model}'")
                logger.info(f"   📊 Metrics:")
                logger.info(f"      - Tokens generated: {token_count}")
                logger.info(f"      - Time to first token: {first_token_time - call_start if first_token_time else 0:.3f}s")
                logger.info(f"      - Generation time: {generation_time:.3f}s")
                logger.info(f"      - Total time: {total_time:.3f}s")
                if token_count > 0 and generation_time > 0:
                    logger.info(f"      - Tokens/second: {token_count / generation_time:.2f}")
                return

            except RateLimitError as e:
                elapsed = time.time() - start_time
                logger.warning(f"   ⚠️  Rate limit hit for '{model}' after {elapsed:.3f}s: {e}")
                if attempt < len(models_to_try) - 1:
                    logger.info(f"   🔄 Trying fallback model: {models_to_try[attempt + 1]}")
                    continue
                else:
                    logger.error("   ❌ All fallback models exhausted due to rate limits")
                    yield "\n\n---\n⚠️ Maaf, layanan sedang sibuk. Silakan coba lagi dalam beberapa detik.\n"
                    return
                
            except Timeout as e:
                elapsed = time.time() - start_time
                logger.warning(f"   ⚠️  Timeout calling '{model}' after {elapsed:.3f}s: {e}")
                if attempt < len(models_to_try) - 1:
                    logger.info(f"   🔄 Trying fallback model: {models_to_try[attempt + 1]}")
                    continue
                else:
                    logger.error("   ❌ All fallback models timed out")
                    yield "\n\n---\n⚠️ Koneksi timeout. Silakan coba lagi.\n"
                    return
                
            except APIError as e:
                elapsed = time.time() - start_time
                logger.warning(f"   ⚠️  API error from '{model}' after {elapsed:.3f}s: {e}")
                if attempt < len(models_to_try) - 1:
                    logger.info(f"   🔄 Trying fallback model: {models_to_try[attempt + 1]}")
                    continue
                else:
                    logger.error("   ❌ All fallback models failed with API errors")
                    yield "\n\n---\n⚠️ Terjadi kesalahan. Silakan coba lagi nanti.\n"
                    return
                
            except Exception as e:
                elapsed = time.time() - start_time
                logger.error(f"   ❌ Unexpected error with '{model}' after {elapsed:.3f}s: {type(e).__name__}: {str(e)}", exc_info=True)
                if attempt < len(models_to_try) - 1:
                    logger.info(f"   🔄 Trying fallback model: {models_to_try[attempt + 1]}")
                    continue
                else:
                    logger.error("   ❌ All fallback models failed")
                    yield "\n\n---\n⚠️ Terjadi kesalahan sistem. Silakan hubungi administrator.\n"
                    return

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        context: str = "",
        temperature: float = 0.7,
    ) -> str:
        """Non-streaming LLM generation. Returns the full response text."""
        return "".join(
            self.generate_stream(prompt, system_prompt, context, temperature)
        )

    def _build_user_content(self, context: str, prompt: str) -> str:
        """Compose the user-facing content from context and the user message."""
        parts = []
        if context:
            parts.append(f"## Konteks yang Tersedia\n\n{context}")
        parts.append(f"## Pertanyaan Pengguna\n\n{prompt}")
        return "\n\n".join(parts)


@lru_cache
def get_llm_service() -> LLMService:
    """Get cached LLMService instance based on configuration."""
    settings = get_settings()
    return LLMService(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,
        fallback_models=settings.LLM_FALLBACK_MODELS,
    )
