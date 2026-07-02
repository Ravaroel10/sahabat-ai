"""
Official web search tool — Exa API fallback restricted to
trusted Indonesian government domains.

This tool is independent: it does not import other tools or the orchestrator.
The orchestrator calls this tool only when RAG yields no relevant context.
"""

import hashlib
import logging
import time
from typing import Any, Dict, List

from exa_py import Exa

from app.config import get_settings

logger = logging.getLogger(__name__)

# In-memory cache: {query_hash: (timestamp, results)}
_search_cache: Dict[str, tuple] = {}


def search_official_web(query: str) -> List[Dict[str, Any]]:
    """Search official Indonesian government domains via Exa API.

    Returns structured results as [{title, url, snippet}].
    Returns empty list on API errors (does not raise).

    Args:
        query: The search query string.
    """
    import time
    
    start_time = time.time()
    settings = get_settings()

    logger.info(f"🌐 WEB SEARCH: Starting Exa API search...")
    logger.info(f"   Query: {query[:100]}{'...' if len(query) > 100 else ''}")

    # Check cache
    cache_key = _hash_query(query)
    cached = _search_cache.get(cache_key)
    if cached:
        cached_time, cached_results = cached
        cache_age = time.time() - cached_time
        if cache_age < settings.SEARCH_CACHE_TTL:
            logger.info(f"   ✅ CACHE HIT (age: {cache_age:.1f}s, TTL: {settings.SEARCH_CACHE_TTL}s)")
            logger.info(f"   Returning {len(cached_results)} cached results")
            return cached_results
        else:
            logger.info(f"   ⏰ Cache expired (age: {cache_age:.1f}s > TTL: {settings.SEARCH_CACHE_TTL}s)")

    # Build site-restricted query
    site_filters = " OR ".join(
        f"site:{domain}" for domain in settings.OFFICIAL_SEARCH_DOMAINS
    )
    restricted_query = f"{query} ({site_filters})"
    
    logger.info(f"   🔒 Domain restrictions: {len(settings.OFFICIAL_SEARCH_DOMAINS)} domains")
    logger.info(f"   Domains: {', '.join(settings.OFFICIAL_SEARCH_DOMAINS)}")

    try:
        api_start = time.time()
        results = _call_exa_api(restricted_query, settings.EXA_API_KEY)
        api_time = time.time() - api_start
        
        logger.info(f"   ✅ Exa API returned {len(results)} results in {api_time:.3f}s")
        
        for i, result in enumerate(results, 1):
            logger.info(f"   Result {i}:")
            logger.info(f"      Title: {result['title'][:80]}...")
            logger.info(f"      URL: {result['url']}")
            logger.info(f"      Snippet: {result['snippet'][:100]}...")
            
    except Exception as e:
        logger.error(f"   ❌ Exa API error: {type(e).__name__}: {str(e)}")
        logger.error(f"   Query was: {query}")
        results = []

    # Only cache successful (non-empty) results
    if results:
        _search_cache[cache_key] = (time.time(), results)
        logger.info(f"   💾 Cached results for future queries")
    else:
        logger.warning(f"   ⚠️  No results to cache")

    total_time = time.time() - start_time
    logger.info(f"   ⏱️  Total web search took: {total_time:.3f}s")

    return results


def _hash_query(query: str) -> str:
    """Generate a hash key for cache lookup."""
    return hashlib.md5(query.encode("utf-8")).hexdigest()


def _call_exa_api(query: str, api_key: str) -> List[Dict[str, Any]]:
    """Call the Exa API and return structured results.

    Raises on API errors (caller handles gracefully).
    """
    if not api_key:
        logger.warning("EXA_API_KEY not configured, returning empty results.")
        return []

    exa = Exa(api_key=api_key)
    
    # Perform search with highlights for better context
    response = exa.search(
        query,
        num_results=5,
        type="auto",
        contents={"highlights": True}
    )

    # Extract and format results
    results = []
    for result in response.results:
        item = {
            "title": result.title if hasattr(result, 'title') else "",
            "url": result.url if hasattr(result, 'url') else "",
            "snippet": "",
        }
        
        # Use highlights if available, otherwise use text excerpt
        if hasattr(result, 'highlights') and result.highlights:
            item["snippet"] = " ".join(result.highlights[:2])  # First 2 highlights
        elif hasattr(result, 'text') and result.text:
            # Take first 200 characters as snippet
            item["snippet"] = result.text[:200] + "..." if len(result.text) > 200 else result.text
        
        if item["url"]:
            results.append(item)
    
    return results
