# LiteLLM Migration Guide

## Overview

BantuArah AI service has been migrated from manual provider-specific code to **LiteLLM**, a unified interface for 100+ LLM providers.

## What Changed

### Before (Manual Abstraction)
```python
# Had to maintain separate code for each provider
if provider == "gemini":
    import google.genai
    # Gemini-specific code
elif provider == "openai":
    import openai
    # OpenAI-specific code
```

Problems:
- ❌ Only 2 providers supported
- ❌ No automatic fallback
- ❌ Manual rate limit handling
- ❌ Deprecated `google.generativeai` package

### After (LiteLLM)
```python
from litellm import completion

# One interface for all providers!
response = completion(
    model="gemini/gemini-1.5-flash",
    messages=messages,
    stream=True,
    fallbacks=["gemini/gemini-2.0-flash"],
)
```

Benefits:
- ✅ 100+ providers supported
- ✅ Automatic fallback on failures
- ✅ Built-in rate limit handling
- ✅ No deprecated packages
- ✅ Unified streaming interface

## Configuration Changes

### Environment Variables

**Old format:**
```bash
LLM_PROVIDER=gemini
LLM_MODEL=gemini-flash-latest
LLM_API_KEY=xxx
```

**New format (LiteLLM):**
```bash
# Model format: provider/model-name
LLM_MODEL=gemini/gemini-1.5-flash
LLM_API_KEY=xxx

# Optional: Fallback models (comma-separated)
LLM_FALLBACK_MODELS=gemini/gemini-2.0-flash,openrouter/google/gemini-flash-1.5
```

### Supported Model Formats

LiteLLM uses the format: `provider/model-name`

**Google Gemini (Direct):**
```
gemini/gemini-1.5-flash
gemini/gemini-1.5-pro
gemini/gemini-2.0-flash    # Recommended: 60 RPM free tier
```

**Via OpenRouter (No Rate Limits):**
```
openrouter/google/gemini-flash-1.5
openrouter/anthropic/claude-3.5-sonnet
openrouter/meta-llama/llama-3.3-70b
openrouter/openai/gpt-4o
```

**OpenAI (Direct):**
```
openai/gpt-4o
openai/gpt-4o-mini
openai/o1-preview
```

**Anthropic (Direct):**
```
anthropic/claude-3.5-sonnet
anthropic/claude-3.5-haiku
```

## Solving the Rate Limit Problem

### The Issue
Gemini free tier has strict limits:
- **5 requests per minute** on `gemini-1.5-flash`
- Causes `429 ResourceExhausted` errors
- Blocks all chat requests after hitting limit

### Solution 1: Use Newer Model (Recommended)
```bash
# gemini-2.0-flash has 60 RPM free tier (12x more!)
LLM_MODEL=gemini/gemini-2.0-flash
```

### Solution 2: Add Fallbacks
```bash
LLM_MODEL=gemini/gemini-1.5-flash
LLM_FALLBACK_MODELS=gemini/gemini-2.0-flash,openrouter/google/gemini-flash-1.5
```

If primary hits rate limit → automatically tries fallback models

### Solution 3: Use OpenRouter
```bash
# OpenRouter: Pay-per-token, no rate limits
LLM_MODEL=openrouter/google/gemini-flash-1.5
OPENROUTER_API_KEY=your-key-here
```

Benefits:
- ✅ No 5 req/min limit
- ✅ Access to 100+ models with ONE key
- ✅ Pay only for what you use
- ✅ Automatic load balancing

Get key: https://openrouter.ai/keys

## API Key Configuration

LiteLLM auto-detects which API key to use based on the model prefix:

### Environment Variables (Recommended)
```bash
# For gemini/* models
GEMINI_API_KEY=xxx

# For openrouter/* models
OPENROUTER_API_KEY=xxx

# For openai/* models
OPENAI_API_KEY=xxx

# For anthropic/* models
ANTHROPIC_API_KEY=xxx
```

### Or: Generic LLM_API_KEY
```bash
# Works for the primary model
LLM_API_KEY=xxx
```

LiteLLM checks in this order:
1. `api_key` parameter passed to `completion()`
2. Provider-specific env var (e.g., `GEMINI_API_KEY`)
3. Generic `LLM_API_KEY` env var

## Migration Steps

### 1. Install LiteLLM
```bash
cd ai-service
pip install litellm>=1.50.0
```

Or rebuild Docker:
```bash
docker-compose build ai-service
```

### 2. Update .env Configuration
```bash
# Old format (REMOVE):
# LLM_PROVIDER=gemini
# LLM_MODEL=gemini-flash-latest

# New format (ADD):
LLM_MODEL=gemini/gemini-2.0-flash
LLM_FALLBACK_MODELS=gemini/gemini-1.5-flash

# Optional: Add OpenRouter for unlimited requests
# OPENROUTER_API_KEY=your-key-here
```

### 3. Restart Service
```bash
docker-compose restart ai-service
```

### 4. Test
```bash
# Health check
curl http://localhost:8000/health

# Test chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Halo, apa itu PKH?",
    "conversation": [],
    "user_context": null
  }'
```

## Code Changes Summary

### services/llm.py
- ✅ Removed `google.genai` import (deprecated)
- ✅ Removed `openai` import
- ✅ Added `litellm.completion`
- ✅ Unified streaming interface
- ✅ Added automatic error handling
- ✅ Added fallback support

### app/config.py
- ✅ Removed `LLM_PROVIDER`
- ✅ Changed `LLM_MODEL` to LiteLLM format
- ✅ Added `LLM_FALLBACK_MODELS`
- ✅ Updated validation logic

### requirements.txt
- ❌ Removed: `google-generativeai>=0.8.0`
- ❌ Removed: `openai>=1.50.0`
- ✅ Added: `litellm>=1.50.0`

## Troubleshooting

### Error: "LLM_MODEL must follow LiteLLM format"
**Fix:** Update model name to include provider prefix
```bash
# Wrong:
LLM_MODEL=gemini-flash-latest

# Correct:
LLM_MODEL=gemini/gemini-1.5-flash
```

### Error: "Rate limit exceeded" (429)
**Fix:** Use newer model or add fallbacks
```bash
LLM_MODEL=gemini/gemini-2.0-flash  # 60 RPM free tier
LLM_FALLBACK_MODELS=openrouter/google/gemini-flash-1.5
```

### Error: "Invalid API key"
**Fix:** Set correct env var for your provider
```bash
# For gemini/* models:
GEMINI_API_KEY=your-key

# Or use generic:
LLM_API_KEY=your-key
```

### Logs show "Fallback to model X"
**This is GOOD!** It means automatic failover is working:
```
[INFO] Rate limit hit for gemini/gemini-1.5-flash
[INFO] Falling back to: gemini/gemini-2.0-flash
[INFO] Request succeeded with fallback model
```

## Advanced Configuration

### Multiple Fallback Chains
```bash
LLM_MODEL=gemini/gemini-1.5-flash
LLM_FALLBACK_MODELS=gemini/gemini-2.0-flash,openrouter/google/gemini-flash-1.5,openai/gpt-4o-mini
```

Tries in order:
1. Direct Gemini 1.5 Flash
2. Direct Gemini 2.0 Flash
3. OpenRouter Gemini
4. OpenAI GPT-4o Mini

### Provider-Specific Settings
```bash
# OpenRouter settings
OPENROUTER_API_KEY=xxx

# OpenAI settings
OPENAI_API_KEY=xxx
OPENAI_ORGANIZATION=your-org-id  # Optional

# Anthropic settings
ANTHROPIC_API_KEY=xxx
```

## Benefits Recap

| Aspect | Before | After (LiteLLM) |
|--------|--------|-----------------|
| **Providers** | 2 (Gemini, OpenAI) | 100+ |
| **Code complexity** | High (manual per-provider) | Low (one interface) |
| **Fallback** | None | Automatic |
| **Rate limit handling** | Manual | Automatic |
| **Adding new provider** | Rewrite code | Change model string |
| **Deprecated packages** | ❌ Yes (`google-generativeai`) | ✅ No |
| **Maintenance** | High | Low |

## Resources

- **LiteLLM Docs:** https://docs.litellm.ai/
- **Supported Providers:** https://docs.litellm.ai/docs/providers
- **OpenRouter:** https://openrouter.ai/
- **Model Pricing:** https://openrouter.ai/models

## Support

If you encounter issues:
1. Check logs: `docker-compose logs ai-service`
2. Verify env vars: `docker-compose exec ai-service env | grep LLM`
3. Test health endpoint: `curl http://localhost:8000/health`
4. Check LiteLLM docs for your specific provider
