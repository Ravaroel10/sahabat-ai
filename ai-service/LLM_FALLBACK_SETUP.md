# LLM Fallback Configuration Guide

This document explains how to configure LLM fallback support in the Bantu Arah AI service using LiteLLM.

## Overview

The AI service supports automatic fallback to alternative LLM providers when the primary model fails due to:
- Rate limiting
- API timeouts
- Service unavailability
- API errors

## Supported Providers

The system uses **LiteLLM**, which supports 100+ LLM providers with a unified interface:

- **OpenRouter** (`openrouter/...`) - Access to multiple free and paid models
- **Gemini** (`gemini/...`) - Google's Gemini models
- **OpenAI** (`openai/...`) - GPT models
- **Anthropic** (`anthropic/...`) - Claude models
- Many more...

## Configuration

### Environment Variables

Configure your LLM settings in `ai-service/.env`:

```bash
# Primary model (LiteLLM format: provider/model-name)
LLM_MODEL=openrouter/openai/gpt-oss-120b:free
LLM_API_KEY=your-primary-api-key

# Fallback models (comma-separated, tried in order)
LLM_FALLBACK_MODELS=openrouter/nvidia/nemotron-3-ultra-550b-a55b:free,gemini/gemini-1.5-flash,openrouter/free

# Provider-specific API keys
OPENROUTER_API_KEY=your-openrouter-key
GEMINI_API_KEY=your-gemini-key
```

### Fallback Chain Example

With the configuration above, the system will try models in this order:

1. **Primary**: `openrouter/openai/gpt-oss-120b:free`
2. **Fallback 1**: `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free`
3. **Fallback 2**: `gemini/gemini-1.5-flash` (uses GEMINI_API_KEY)
4. **Fallback 3**: `openrouter/free` (auto-selects best available)

## How It Works

1. **Primary Model Attempt**: The system first tries the model specified in `LLM_MODEL`
2. **Automatic Fallback**: If the primary model fails, the system automatically tries the next model in `LLM_FALLBACK_MODELS`
3. **API Key Detection**: LiteLLM automatically uses the correct API key based on the model prefix:
   - `openrouter/*` → Uses `OPENROUTER_API_KEY`
   - `gemini/*` → Uses `GEMINI_API_KEY`
   - `openai/*` → Uses `OPENAI_API_KEY`
   - etc.
4. **Graceful Degradation**: If all models fail, the system returns a user-friendly error message

## Adding New Providers

To add a new provider to your fallback chain:

1. **Add API Key** (if needed):
   ```bash
   # In ai-service/.env
   NEW_PROVIDER_API_KEY=your-api-key
   ```

2. **Update Config** (if needed):
   ```python
   # In ai-service/app/config.py
   NEW_PROVIDER_API_KEY: str = os.getenv("NEW_PROVIDER_API_KEY", "")
   ```

3. **Update LLM Service** (if needed):
   ```python
   # In ai-service/services/llm.py, add to _setup_api_keys()
   if hasattr(settings, 'NEW_PROVIDER_API_KEY') and settings.NEW_PROVIDER_API_KEY:
       os.environ["NEW_PROVIDER_API_KEY"] = settings.NEW_PROVIDER_API_KEY
   ```

4. **Add to Fallback Chain**:
   ```bash
   LLM_FALLBACK_MODELS=...,newprovider/model-name
   ```

## Best Practices

### Mixing Free and Paid Models

You can mix free and paid models in your fallback chain:

```bash
# Start with free models, fall back to paid if needed
LLM_FALLBACK_MODELS=openrouter/free,gemini/gemini-1.5-flash,openai/gpt-4o
```

### Cost Optimization

Order your fallback models from least to most expensive:

```bash
# Free → Cheap → Expensive
LLM_FALLBACK_MODELS=openrouter/free,gemini/gemini-1.5-flash,openai/gpt-4-turbo
```

### Reliability

Include models from different providers for better reliability:

```bash
# OpenRouter → Gemini → OpenAI (different infrastructure)
LLM_FALLBACK_MODELS=openrouter/free,gemini/gemini-1.5-flash,openai/gpt-3.5-turbo
```

## Monitoring

The system logs detailed information about fallback attempts:

```
🤖 LLM SERVICE: Starting generation...
   Primary model: openrouter/openai/gpt-oss-120b:free
   🎯 Fallback chain: openrouter/openai/gpt-oss-120b:free → openrouter/nvidia/nemotron-3-ultra-550b-a55b:free → gemini/gemini-1.5-flash → openrouter/free

   🔄 Attempt 1/4: Calling model 'openrouter/openai/gpt-oss-120b:free'...
   ⚠️  Rate limit hit for 'openrouter/openai/gpt-oss-120b:free' after 2.341s
   🔄 Trying fallback model: openrouter/nvidia/nemotron-3-ultra-550b-a55b:free

   🔄 Attempt 2/4: Calling model 'openrouter/nvidia/nemotron-3-ultra-550b-a55b:free'...
   ✅ Connection established to openrouter/nvidia/nemotron-3-ultra-550b-a55b:free
   ⚡ First token received in 0.823s
   ✅ Successfully completed streaming from 'openrouter/nvidia/nemotron-3-ultra-550b-a55b:free'
```

## Troubleshooting

### Fallback Not Working

1. **Check API Keys**: Ensure all provider API keys are set in `.env`
2. **Verify Model Names**: Use correct LiteLLM format (`provider/model-name`)
3. **Check Logs**: Look for error messages in the service logs

### All Models Failing

1. **Rate Limits**: Check if you've hit rate limits on all providers
2. **API Keys**: Verify all API keys are valid and not expired
3. **Model Availability**: Some free models may have limited availability

### Unexpected Costs

1. **Review Fallback Order**: Ensure free models are tried before paid ones
2. **Monitor Usage**: Check your provider dashboards for usage metrics
3. **Set Limits**: Configure rate limiting in your LiteLLM settings

## Example Configurations

### Development (All Free)

```bash
LLM_MODEL=openrouter/free
LLM_FALLBACK_MODELS=gemini/gemini-1.5-flash,openrouter/nvidia/nemotron-3-ultra-550b-a55b:free
OPENROUTER_API_KEY=your-key
GEMINI_API_KEY=your-key
```

### Production (Reliability First)

```bash
LLM_MODEL=openai/gpt-4o
LLM_FALLBACK_MODELS=gemini/gemini-1.5-pro,openrouter/anthropic/claude-3-sonnet,openrouter/free
OPENAI_API_KEY=your-key
GEMINI_API_KEY=your-key
OPENROUTER_API_KEY=your-key
```

### Cost-Optimized Production

```bash
LLM_MODEL=gemini/gemini-1.5-flash
LLM_FALLBACK_MODELS=openrouter/free,openrouter/nvidia/nemotron-3-ultra-550b-a55b:free,openai/gpt-3.5-turbo
GEMINI_API_KEY=your-key
OPENROUTER_API_KEY=your-key
OPENAI_API_KEY=your-key
```

## References

- [LiteLLM Documentation](https://docs.litellm.ai/)
- [OpenRouter Models](https://openrouter.ai/models)
- [Google Gemini API](https://ai.google.dev/)
- [OpenAI API](https://platform.openai.com/)
