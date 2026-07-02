# Test Logging Configuration

## What Changed

### 1. Added logging configuration in `app/main.py`
```python
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
    stream=sys.stdout,
    force=True
)
```

### 2. Added request logging middleware
```python
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all incoming requests for debugging."""
    logger.info(f"📥 Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"📤 Response status: {response.status_code}")
    return response
```

## Test Steps

### Step 1: Restart the service
```bash
docker-compose restart ai-service
```

### Step 2: Watch logs
```bash
docker-compose logs -f ai-service
```

### Step 3: Test health endpoint
In another terminal:
```bash
curl http://localhost:8000/health
```

You should see:
```
📥 Incoming request: GET /health
📤 Response status: 200
```

### Step 4: Send a chat message
From your frontend or using curl:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Apa itu PKH?",
    "conversation": [],
    "user_context": null
  }'
```

You should now see the COMPLETE flow:

```
📥 Incoming request: POST /chat
================================================================================
📨 API: New chat request received (ID: 1719840123456)
   Message: Apa itu PKH?
   Conversation: 0 messages
   User context: None
================================================================================
🚀 Calling orchestrator...
================================================================================
🚀 ORCHESTRATOR: Starting new chat request
📝 Message: Apa itu PKH?
💬 Conversation history: 0 messages
👤 User context: None
================================================================================
🔍 STEP 1: Escalation detection...
⚠️  Escalation detected: False
⏱️  Escalation detection took: 0.002s

🔍 STEP 2: RAG knowledge base search...
📚 RAG: Searching knowledge base...
   Query: Apa itu PKH?
   Max results (k): 5
   Relevance threshold: 0.6
   ...
```

## Troubleshooting

### If you don't see logs:

1. **Check the service is running:**
   ```bash
   docker-compose ps ai-service
   ```

2. **Check for Python errors on startup:**
   ```bash
   docker-compose logs ai-service | head -30
   ```

3. **Verify logging is configured:**
   ```bash
   docker-compose exec ai-service python -c "import logging; print(logging.root.level)"
   ```
   Should print: `20` (which is INFO level)

4. **Force rebuild if needed:**
   ```bash
   docker-compose build ai-service
   docker-compose up -d ai-service
   ```

### If logs are too verbose:

Set LOG_LEVEL in your `.env` or `docker-compose.yml`:
```yaml
services:
  ai-service:
    environment:
      - LOG_LEVEL=WARNING
```

Then modify `main.py` to use it:
```python
import os
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    ...
)
```

## Expected Behavior

### Startup (should already see):
```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
[startup] Configuration validated successfully.
[startup] ChromaDB connected.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Health Check:
```
📥 Incoming request: GET /health
📤 Response status: 200
```

### Chat Request (NEW - this is what we added):
```
📥 Incoming request: POST /chat
================================================================================
📨 API: New chat request received
================================================================================
🚀 ORCHESTRATOR: Starting new chat request
[... full flow with RAG, Web Search, LLM ...]
✅ REQUEST COMPLETED
📤 Response status: 200
```

## Verification Checklist

- [ ] Service restarts without errors
- [ ] Health check logs appear (📥 GET /health)
- [ ] Chat request logs appear (📥 POST /chat)
- [ ] Orchestrator logs appear (🚀 ORCHESTRATOR)
- [ ] RAG search logs appear (📚 RAG:)
- [ ] LLM service logs appear (🤖 LLM SERVICE)
- [ ] Request completion logs appear (✅ REQUEST COMPLETED)

## Next Steps

Once you see these logs working:

1. Check performance metrics (⏱️)
2. Verify cache behavior (💾)
3. Test fallback models (🔄)
4. Check error handling (❌)

The comprehensive logging is now active and will help you debug any issues!
