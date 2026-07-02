# Quick Debug Cheat Sheet

## 🚨 Restart Service
```bash
docker-compose restart ai-service
```

## 📊 View Logs in Real-Time
```bash
# All logs
docker-compose logs -f ai-service

# Just errors and warnings
docker-compose logs -f ai-service | grep -E "(ERROR|WARNING|❌|⚠️)"

# Just the flow (main steps)
docker-compose logs -f ai-service | grep -E "(STEP|API:|ORCHESTRATOR|LLM SERVICE)"
```

## 🔍 Check Specific Components

### Check if RAG is working
```bash
docker-compose logs ai-service | grep "RAG:"
```
**Look for**: `✅ Returned X documents` or `❌ No documents found`

### Check if Web Search is working
```bash
docker-compose logs ai-service | grep "WEB SEARCH"
```
**Look for**: `✅ Exa API returned X results` or `❌ Exa API error`

### Check LLM calls
```bash
docker-compose logs ai-service | grep "LLM SERVICE"
```
**Look for**: 
- `✅ Successfully completed streaming` (good)
- `⚠️ Rate limit hit` (rate limited)
- `❌ All fallback models failed` (all models failed)

### Check API requests
```bash
docker-compose logs ai-service | grep "API:"
```
**Look for**: `📨 API: New chat request received`

## 🔑 Common Issues

### Issue 1: "Missing Authentication header"
**Symptom**:
```
⚠️  API error from 'openrouter/openrouter/free': AuthenticationError: Missing Authentication header
```
**Fix**: Check your `.env` file has `OPENROUTER_API_KEY` set

### Issue 2: Rate limit errors
**Symptom**:
```
⚠️  Rate limit hit for 'openrouter/openrouter/owl-alpha'
```
**Fix**: Wait a bit or check if fallback models work

### Issue 3: No RAG results
**Symptom**:
```
❌ RAG returned no results
🌐 STEP 3: Falling back to web search
```
**Cause**: Normal - means no relevant documents in knowledge base. Web search kicks in automatically.

### Issue 4: Slow responses
**Check timing metrics**:
```bash
docker-compose logs ai-service | grep "⏱️"
```
**Look for**:
- RAG search > 1s = ChromaDB slow
- Web search > 2s = Exa API slow
- TTFT > 1s = LLM slow to start
- Tokens/sec < 30 = Slow generation

### Issue 5: All models failed
**Symptom**:
```
❌ All fallback models failed
```
**Check**:
1. API key is correct
2. Network connectivity
3. OpenRouter status: https://status.openrouter.ai

## 📈 Performance Benchmarks

**Normal timings**:
- Escalation: < 0.01s
- RAG search: 0.1-0.3s
- Web search: 0.3-1.0s
- TTFT: 0.2-0.5s
- Tokens/sec: 50-100

**If you see**:
- RAG > 1s: Database issue
- Web search > 2s: Network/API issue
- TTFT > 1s: LLM overloaded
- Tokens/sec < 30: Model throttling

## 🎯 Quick Test

Send a simple message and look for this pattern:

```
================================================================================
📨 API: New chat request received
================================================================================
🚀 ORCHESTRATOR: Starting new chat request
🔍 STEP 1: Escalation detection...
✅ or ❌
🔍 STEP 2: RAG knowledge base search...
✅ or ❌
[If RAG fails]
🌐 STEP 3: Falling back to web search...
✅ or ❌
🔧 STEP 4: Building full context...
🤖 STEP 5: Calling LLM service...
   🔄 Attempt 1/X: Calling model...
   ✅ Successfully completed streaming
📡 Starting SSE stream...
✅ REQUEST COMPLETED
================================================================================
```

## 🛠️ Configuration Check

```bash
# Check environment variables
docker-compose exec ai-service env | grep -E "(LLM_MODEL|OPENROUTER|EXA|HUGGINGFACE)"
```

**Should see**:
- `LLM_MODEL=openrouter/openrouter/owl-alpha`
- `OPENROUTER_API_KEY=sk-or-v1-...`
- `EXA_API_KEY=...`
- `HUGGINGFACE_API_KEY=...`

## 📝 Full Request Flow Example

```bash
# Terminal 1: Watch logs
docker-compose logs -f ai-service

# Terminal 2: Send test request (adjust URL if needed)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Apa itu PKH?", "conversation": [], "user_context": {}}'
```

Watch Terminal 1 for the complete flow!

## 🎨 Log Icons Reference

- 🚀 = Start
- ✅ = Success
- ❌ = Failure
- ⚠️ = Warning
- 🔍 = Search
- 📚 = RAG
- 🌐 = Web Search
- 🤖 = LLM
- 📡 = Streaming
- ⏱️ = Timing
- 🔄 = Retry
- 💾 = Cache
- 📊 = Metrics
- ⚡ = Performance

## 💡 Pro Tips

1. **Use grep with color**: `grep --color=auto`
2. **Follow one request**: Look for the request ID
3. **Compare timings**: Check if one step is consistently slow
4. **Watch for patterns**: Repeated errors indicate systemic issues
5. **Check cache**: High cache hits = efficient
