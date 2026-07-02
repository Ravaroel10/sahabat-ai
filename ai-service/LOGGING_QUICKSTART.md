# 🚀 Logging Quick Start

## TL;DR

Your AI service now has comprehensive console logging! Here's how to see it in action:

## 1️⃣ Restart the Service

```bash
docker-compose restart ai-service
```

## 2️⃣ Watch the Logs

```bash
docker-compose logs -f ai-service
```

## 3️⃣ Send a Message

Use your frontend or send a test request, and you'll see the complete flow!

## What You'll See

### 📨 Request Received
```
================================================================================
📨 API: New chat request received (ID: 1719840123456)
   Message: Apa itu PKH?
   Conversation: 0 messages
   User context: None
================================================================================
```

### 🚀 Orchestrator Processing
```
🚀 ORCHESTRATOR: Starting new chat request
📝 Message: Apa itu PKH?

🔍 STEP 1: Escalation detection...
⚠️  Escalation detected: False
⏱️  Escalation detection took: 0.002s

🔍 STEP 2: RAG knowledge base search...
```

### 📚 RAG Search
```
📚 RAG: Searching knowledge base...
   Query: Apa itu PKH?
   Max results (k): 5
   Relevance threshold: 0.6
   ChromaDB query took: 0.145s
   📄 Raw results from ChromaDB: 3 documents
   Document 1: score=0.8234, distance=0.1766
   ✅ Returned 3 documents
   ⏱️  Total RAG search took: 0.158s
```

### 🌐 Web Search (if RAG fails)
```
❌ RAG returned no results
🌐 STEP 3: Falling back to web search...
   🔒 Domain restrictions: 3 domains
   ✅ Exa API returned 2 results in 0.542s
   Result 1: Program Keluarga Harapan | Kemensos
   💾 Cached results for future queries
```

### 🤖 LLM Generation
```
🤖 LLM SERVICE: Starting generation...
   Primary model: openrouter/openrouter/owl-alpha
   🎯 Fallback chain: owl-alpha → nemotron → gpt-oss
   
   🔄 Attempt 1/3: Calling model 'openrouter/openrouter/owl-alpha'...
   ✅ Connection established
   ⚡ First token received in 0.234s
   
   ✅ Successfully completed streaming
   📊 Metrics:
      - Tokens generated: 387
      - Time to first token: 0.234s
      - Generation time: 5.678s
      - Tokens/second: 68.15
```

### 📡 Streaming Complete
```
✅ REQUEST COMPLETED (ID: 1719840123456)
   📊 Final Metrics:
      - Total tokens: 387
      - Total time: 6.421s
      - Tokens/second: 68.12
================================================================================
```

## 🎯 Quick Commands

### See only errors
```bash
docker-compose logs ai-service | grep -E "(ERROR|❌|⚠️)"
```

### See only the main flow
```bash
docker-compose logs ai-service | grep -E "(STEP|🚀|✅|❌)"
```

### See timing metrics
```bash
docker-compose logs ai-service | grep "⏱️"
```

### See last 50 lines
```bash
docker-compose logs --tail=50 ai-service
```

### See logs from last 10 minutes
```bash
docker-compose logs --since=10m ai-service
```

## 🔍 What Each Component Shows

| Component | What You'll See |
|-----------|----------------|
| **API** | Request received, ID, message preview |
| **Orchestrator** | 5 steps, timing for each |
| **RAG** | Query, results, scores, filtering |
| **Web Search** | Cache hits, Exa API calls, results |
| **LLM** | Model used, fallbacks, tokens, speed |
| **Streaming** | Token count, throughput, timing |

## 🚨 Common Scenarios

### ✅ Everything Working
```
🚀 ORCHESTRATOR: Starting
✅ RAG returned 3 documents
🤖 LLM SERVICE: Starting
✅ Successfully completed streaming
✅ REQUEST COMPLETED
```

### ⚠️ RAG Empty (Normal)
```
❌ RAG returned no results
🌐 Falling back to web search
✅ Exa API returned 2 results
```

### ❌ Authentication Error
```
⚠️ API error: AuthenticationError: Missing Authentication header
🔄 Trying fallback model
```

### ⚠️ Rate Limited
```
⚠️ Rate limit hit for model X
🔄 Trying fallback model: Y
```

## 📚 More Details

- **Full Guide**: See `LOGGING_GUIDE.md`
- **Debugging**: See `QUICK_DEBUG.md`
- **Changes**: See `COMPREHENSIVE_LOGGING_CHANGES.md`

## 💡 Pro Tips

1. **Keep logs running** in a separate terminal while testing
2. **Look for the emojis** - they make scanning easy
3. **Check timing metrics** - anything > 2s needs investigation
4. **Request IDs** help you track individual requests
5. **Cache hits** (💾) mean better performance

## ⚡ Performance Expectations

**Good:**
- RAG: < 0.3s
- Web: < 1s
- TTFT: < 0.5s
- Tokens/sec: > 50

**Needs Investigation:**
- RAG: > 1s
- Web: > 2s
- TTFT: > 1s
- Tokens/sec: < 30

## 🎉 That's It!

You now have full visibility into your AI service. Happy debugging! 🚀

---

**Quick Test:**
```bash
# Terminal 1
docker-compose logs -f ai-service

# Terminal 2 (or use your frontend)
# Send a message and watch the magic! ✨
```
