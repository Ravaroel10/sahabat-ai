# AI Service Logging Guide

## Overview

The AI service now includes comprehensive console logging throughout the entire request flow. This makes it easy to debug issues, monitor performance, and understand what's happening at each step.

## Log Format

Logs use emoji prefixes for easy scanning:

- 🚀 **Start of major operations**
- 📝 **User input / messages**
- 💬 **Conversation context**
- 👤 **User context/profile**
- 🔍 **Search operations (RAG / Web)**
- ⚠️ **Warnings / Escalations**
- ✅ **Success / Completion**
- ❌ **Failures / Errors**
- 🤖 **LLM operations**
- 📡 **Streaming operations**
- 📊 **Metrics / Statistics**
- ⏱️ **Timing information**
- 🔄 **Retry / Fallback attempts**
- 💾 **Cache operations**
- 🌐 **Web search**
- 📚 **RAG knowledge base**
- 🔒 **Domain restrictions**
- ⚡ **Performance metrics (TTFT, tokens/sec)**

## Complete Flow Example

When a user sends a message, you'll see logs for the entire flow:

### 1. API Layer (`api/chat.py`)
```
================================================================================
📨 API: New chat request received (ID: 1719840123456)
   Message: Apa syarat untuk mendapatkan bantuan PKH?
   Conversation: 2 messages
   User context: {'location': 'Jakarta', 'age': 35}
================================================================================
🚀 Calling orchestrator...
```

### 2. Orchestrator (`orchestrator/orchestrator.py`)
```
================================================================================
🚀 ORCHESTRATOR: Starting new chat request
📝 Message: Apa syarat untuk mendapatkan bantuan PKH?
💬 Conversation history: 2 messages
👤 User context: {'location': 'Jakarta', 'age': 35}
================================================================================
🔍 STEP 1: Escalation detection...
⚠️  Escalation detected: False
⏱️  Escalation detection took: 0.003s

🔍 STEP 2: RAG knowledge base search...
```

### 3. RAG Search (`tools/rag.py`)
```
📚 RAG: Searching knowledge base...
   Query: Apa syarat untuk mendapatkan bantuan PKH?
   Max results (k): 5
   Relevance threshold: 0.6
   ChromaDB query took: 0.145s
   📄 Raw results from ChromaDB: 5 documents
   Document 1: score=0.8234, distance=0.1766, id=doc_123
              source=Peraturan Menteri Sosial No. 1/2024
              preview=Program Keluarga Harapan (PKH) adalah program bantuan sosial...
   Document 2: score=0.7891, distance=0.2109, id=doc_456
              source=Pedoman PKH 2024
              preview=Syarat penerima PKH meliputi...
   ...
   ✅ Returned 4 documents (filtered 1 below threshold)
   ⏱️  Total RAG search took: 0.158s
```

### 4. Web Search Fallback (if RAG fails) (`tools/official_search.py`)
```
❌ RAG returned no results

🌐 STEP 3: Falling back to web search (Exa API)...
🌐 WEB SEARCH: Starting Exa API search...
   Query: Apa syarat untuk mendapatkan bantuan PKH?
   🔒 Domain restrictions: 3 domains
   Domains: kemensos.go.id, kemenkeu.go.id, indonesia.go.id
   ✅ Exa API returned 3 results in 0.542s
   Result 1:
      Title: Program Keluarga Harapan | Kementerian Sosial RI
      URL: https://kemensos.go.id/pkh
      Snippet: PKH merupakan program bantuan sosial bersyarat...
   💾 Cached results for future queries
   ⏱️  Total web search took: 0.567s
```

### 5. Context Building & LLM Call (`services/llm.py`)
```
🔧 STEP 4: Building full context...
📄 Context size: 2345 characters
⏱️  Context building took: 0.002s

🤖 STEP 5: Calling LLM service...
   Model: Will be determined by LLMService
   Context provided: Yes
   System prompt: Yes

⏱️  Total orchestration setup took: 0.732s
🎯 Returning: citations=4, sources=0, emergency=False
================================================================================

🤖 LLM SERVICE: Starting generation...
   Primary model: openrouter/openrouter/owl-alpha
   Temperature: 0.7
   System prompt length: 1234 chars
   Context length: 2345 chars
   User prompt length: 42 chars
   Total input length: 3621 chars
   🎯 Fallback chain: openrouter/openrouter/owl-alpha → nvidia/nemotron-3-ultra → openai/gpt-oss-120b:free

   🔄 Attempt 1/3: Calling model 'openrouter/openrouter/owl-alpha'...
   ✅ Connection established to openrouter/openrouter/owl-alpha
   ⚡ First token received in 0.234s

   ✅ Successfully completed streaming from 'openrouter/openrouter/owl-alpha'
   📊 Metrics:
      - Tokens generated: 387
      - Time to first token: 0.234s
      - Generation time: 5.678s
      - Total time: 5.912s
      - Tokens/second: 68.15
```

### 6. Streaming to Client (`api/chat.py`)
```
✅ Orchestrator setup completed in 0.735s
   Citations: 4, Sources: 0, Emergency: False
📡 Starting SSE stream...
   ⚡ First token streamed to client in 0.001s
   ✅ Finished streaming 387 tokens in 5.681s
🔄 Applying content transformation...
   ✅ Transformation completed in 0.003s
   📤 Metadata sent to client

✅ REQUEST COMPLETED (ID: 1719840123456)
   📊 Final Metrics:
      - Total tokens: 387
      - Total time: 6.421s
      - Orchestrator setup: 0.735s
      - Streaming time: 5.681s
      - Transformation time: 0.003s
      - Tokens/second: 68.12
================================================================================
```

## Error Scenarios

### Authentication Error
```
🔄 Attempt 1/3: Calling model 'openrouter/openrouter/free'...
⚠️  API error from 'openrouter/openrouter/free' after 0.123s: AuthenticationError: Missing Authentication header
🔄 Trying fallback model: nvidia/nemotron-3-ultra
```

### Rate Limit
```
⚠️  Rate limit hit for 'openrouter/openrouter/owl-alpha' after 0.234s: RateLimitError
🔄 Trying fallback model: nvidia/nemotron-3-ultra
```

### All Fallbacks Exhausted
```
❌ All fallback models failed with API errors
```

## Cache Operations

### Cache Hit
```
✅ CACHE HIT (age: 45.3s, TTL: 300s)
Returning 3 cached results
```

### Cache Miss
```
⏰ Cache expired (age: 315.7s > TTL: 300s)
```

## Viewing Logs

### Docker Compose
```bash
# View live logs
docker-compose logs -f ai-service

# View last 100 lines
docker-compose logs --tail=100 ai-service

# View logs for specific time
docker-compose logs --since=10m ai-service
```

### Filter by Component
```bash
# Only orchestrator logs
docker-compose logs ai-service | grep "ORCHESTRATOR"

# Only LLM service logs
docker-compose logs ai-service | grep "LLM SERVICE"

# Only RAG search logs
docker-compose logs ai-service | grep "RAG:"

# Only web search logs
docker-compose logs ai-service | grep "WEB SEARCH"

# Only API logs
docker-compose logs ai-service | grep "API:"

# Only errors
docker-compose logs ai-service | grep -E "(ERROR|❌|⚠️)"
```

## Performance Metrics

Key timing metrics you'll see:

1. **Escalation Detection**: ~0.001-0.01s (fast, deterministic)
2. **RAG Search**: ~0.1-0.3s (depends on ChromaDB)
3. **Web Search**: ~0.3-1.0s (depends on Exa API)
4. **Context Building**: ~0.001-0.01s (fast)
5. **Time to First Token (TTFT)**: ~0.2-0.5s (OpenRouter)
6. **Generation Time**: 2-10s (depends on response length)
7. **Tokens/Second**: 50-100 (typical for OpenRouter free models)

## Debugging Tips

### Issue: No responses
Look for:
```
❌ All fallback models failed
```
Check your API keys and model availability.

### Issue: Slow responses
Check:
```
⏱️  Total RAG search took: X.XXXs
⏱️  Total web search took: X.XXXs
```
If these are slow, check database/API connectivity.

### Issue: Rate limits
Look for:
```
⚠️  Rate limit hit for model X
```
The system will automatically try fallback models.

### Issue: Wrong model being used
Check:
```
🎯 Fallback chain: model1 → model2 → model3
```
Verify your `.env` configuration.

## Configuration

Logging is controlled by Python's standard logging module configured in `app/main.py`:

```python
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
    stream=sys.stdout,
    force=True
)
```

The service uses INFO level by default.

To change log level, set in your environment:
```bash
# In ai-service/.env or docker-compose.yml
LOG_LEVEL=DEBUG  # Very verbose
LOG_LEVEL=INFO   # Default, shows flow
LOG_LEVEL=WARNING  # Only warnings and errors
LOG_LEVEL=ERROR  # Only errors
```

Then update `main.py` to read from environment:
```python
import os
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, log_level), ...)
```

## Best Practices

1. **Always check logs after restart** to verify all services initialized correctly
2. **Monitor TTFT and tokens/sec** to detect performance degradation
3. **Watch for repeated fallbacks** - indicates primary model issues
4. **Check cache hit rates** - low rates may indicate query variation
5. **Look for patterns in failures** - helps identify systemic issues

## Next Steps

After adding this logging, restart the service:
```bash
docker-compose restart ai-service
```

Then send a test message and watch the logs flow!
