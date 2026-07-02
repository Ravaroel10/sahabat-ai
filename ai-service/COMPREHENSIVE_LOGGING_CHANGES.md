# Comprehensive Logging Implementation

## Summary

Added detailed console logging throughout the entire AI service flow to make debugging and monitoring easy. Now you can see exactly what happens from when a message is received until the response is returned.

## Files Modified

### 1. `orchestrator/orchestrator.py`
**Changes**:
- Added logging at the start of `orchestrate_chat()` with request details
- Logs each of the 5 steps with clear section headers
- Added timing metrics for each step (escalation, RAG, web search, context building)
- Logs detailed information about RAG results (count, scores, sources)
- Logs web search results when RAG fails
- Shows final summary with citations, sources, and emergency status
- Tracks total orchestration setup time

**New logs include**:
- Request start banner with message preview
- Escalation detection results
- RAG search results (count, scores, sources)
- Web search fallback (when triggered)
- Context building stats
- Step-by-step timing metrics
- Final summary with all metadata

### 2. `tools/rag.py`
**Changes**:
- Added detailed logging for RAG knowledge base searches
- Logs query details and search parameters
- Shows ChromaDB query timing
- Logs each document result with score, distance, ID, and source
- Shows relevance threshold filtering
- Counts how many documents were filtered out
- Tracks total RAG search time

**New logs include**:
- Query text and parameters (k, threshold)
- ChromaDB performance metrics
- Individual document results with scores
- Filtering statistics
- Document previews (first 80 chars)
- Success/failure indicators

### 3. `tools/official_search.py`
**Changes**:
- Added logging for Exa API web search operations
- Shows cache hit/miss with age and TTL
- Logs domain restrictions being applied
- Shows individual search results with titles and URLs
- Tracks API call timing
- Logs caching operations
- Shows total web search time

**New logs include**:
- Query text
- Cache hit/miss with timing
- Domain restriction details
- Exa API call timing
- Individual result details (title, URL, snippet)
- Cache operations
- Error handling with full details

### 4. `services/llm.py`
**Changes**:
- Added comprehensive logging for LLM generation
- Shows model selection and fallback chain
- Logs input sizes (system prompt, context, user prompt)
- Tracks connection establishment
- Measures time to first token (TTFT)
- Counts tokens generated
- Calculates tokens per second
- Logs fallback attempts with reasons
- Shows detailed error information

**New logs include**:
- Model and temperature settings
- Input length breakdown
- Complete fallback chain
- Attempt number and model being tried
- Connection status
- First token timing
- Token count and generation speed
- Success metrics (tokens/sec, total time)
- Error types and fallback logic

### 5. `api/chat.py`
**Changes**:
- Added request ID for tracking individual requests
- Logs incoming request details
- Tracks orchestrator call timing
- Monitors SSE streaming with token counts
- Shows content transformation timing
- Provides comprehensive final metrics
- Improved error logging with timing

**New logs include**:
- Unique request ID for correlation
- Request start with full details
- Orchestrator call timing
- SSE stream start and token flow
- First token streaming timing
- Content transformation metrics
- Complete request summary with all timings
- Token throughput metrics

## New Files Created

### 1. `LOGGING_GUIDE.md`
Comprehensive guide covering:
- Log format and emoji reference
- Complete flow example with all logs
- Error scenario examples
- Cache operation logs
- Docker commands for viewing logs
- Performance benchmarks
- Debugging tips
- Configuration instructions

### 2. `QUICK_DEBUG.md`
Quick reference cheat sheet with:
- Common docker-compose commands
- Component-specific log filters
- Common issues and fixes
- Performance benchmarks
- Quick test procedures
- Configuration check commands
- Log icon reference
- Pro tips

### 3. `COMPREHENSIVE_LOGGING_CHANGES.md` (this file)
Summary of all changes made.

## Logging Flow Overview

```
📨 API Request
    ↓
🚀 Orchestrator Start
    ↓
🔍 STEP 1: Escalation Detection (0.001-0.01s)
    ├─ ✅ Emergency detected OR
    └─ ❌ No emergency
    ↓
🔍 STEP 2: RAG Search (0.1-0.3s)
    ├─ ✅ Found documents → Continue to STEP 4
    └─ ❌ No documents → Go to STEP 3
    ↓
🌐 STEP 3: Web Search (0.3-1.0s)
    ├─ 💾 Cache hit → Return cached
    └─ 🌐 Call Exa API
        ├─ ✅ Found results
        └─ ❌ No results
    ↓
🔧 STEP 4: Build Context (0.001-0.01s)
    ↓
🤖 STEP 5: LLM Call (2-10s)
    ├─ 🔄 Try primary model
    │   ├─ ✅ Success → Stream tokens
    │   └─ ❌ Failed → Try fallback
    ├─ 🔄 Try fallback 1
    │   ├─ ✅ Success → Stream tokens
    │   └─ ❌ Failed → Try fallback 2
    └─ ...
    ↓
📡 Stream to Client
    ├─ Token 1
    ├─ Token 2
    ├─ ...
    ├─ Token N
    └─ Metadata + Done
    ↓
✅ Request Complete
```

## Emoji Legend

| Emoji | Meaning |
|-------|---------|
| 🚀 | Start of operation |
| 📝 | User input/message |
| 💬 | Conversation context |
| 👤 | User context/profile |
| 🔍 | Search operation |
| ⚠️ | Warning/escalation |
| ✅ | Success |
| ❌ | Failure |
| 🤖 | LLM operation |
| 📡 | Streaming |
| 📊 | Metrics/stats |
| ⏱️ | Timing |
| 🔄 | Retry/fallback |
| 💾 | Cache |
| 🌐 | Web search |
| 📚 | RAG/knowledge base |
| 🔒 | Security/restrictions |
| ⚡ | Performance metric |

## Performance Metrics Tracked

### Per-Component Timing
1. **Escalation Detection**: Time to detect emergencies
2. **RAG Search**: ChromaDB query time + processing
3. **Web Search**: Exa API call time + caching
4. **Context Building**: Time to compose full context
5. **LLM Generation**: Total time + TTFT + tokens/sec
6. **Streaming**: Time to stream all tokens
7. **Transformation**: Content transformation time

### Aggregate Metrics
- **Total Request Time**: End-to-end latency
- **Orchestrator Setup**: Time before streaming starts
- **Tokens Generated**: Total token count
- **Tokens/Second**: Generation throughput

## Usage

### Restart Service
```bash
docker-compose restart ai-service
```

### View All Logs
```bash
docker-compose logs -f ai-service
```

### View Just Errors
```bash
docker-compose logs ai-service | grep -E "(ERROR|❌|⚠️)"
```

### View Flow Overview
```bash
docker-compose logs ai-service | grep -E "(STEP|API:|ORCHESTRATOR)"
```

### View Performance Metrics
```bash
docker-compose logs ai-service | grep "⏱️"
```

## Benefits

1. **Easy Debugging**: See exactly where issues occur
2. **Performance Monitoring**: Track timing for each component
3. **Request Tracing**: Follow individual requests with unique IDs
4. **Cache Monitoring**: See cache hit rates and effectiveness
5. **Model Fallback Visibility**: See which models are used and why
6. **Error Context**: Full error details with timing and context
7. **Production Ready**: Structured logs for log aggregation tools

## Next Steps

1. **Restart the service** to load the new logging code
2. **Send a test message** to see the full flow
3. **Monitor logs** to verify everything is working
4. **Check performance metrics** to ensure acceptable speeds
5. **Use the debug guides** when troubleshooting issues

## Example Output

When you send a message like "Apa itu PKH?", you'll see something like:

```
================================================================================
📨 API: New chat request received (ID: 1719840123456)
   Message: Apa itu PKH?
...
🔍 STEP 1: Escalation detection...
⚠️  Escalation detected: False
⏱️  Escalation detection took: 0.002s
...
📚 RAG: Searching knowledge base...
   ✅ Returned 3 documents
   ⏱️  Total RAG search took: 0.145s
...
🤖 LLM SERVICE: Starting generation...
   🔄 Attempt 1/3: Calling model 'openrouter/openrouter/owl-alpha'...
   ✅ Successfully completed streaming
   📊 Metrics:
      - Tokens generated: 387
      - Tokens/second: 68.15
...
✅ REQUEST COMPLETED
   📊 Final Metrics:
      - Total time: 6.421s
      - Tokens/second: 68.12
================================================================================
```

## Configuration

The logging uses Python's standard logging module with INFO level by default. All logs are printed to stdout (console), which Docker Compose captures.

To change log level, set in `.env`:
```bash
LOG_LEVEL=DEBUG  # Very verbose
LOG_LEVEL=INFO   # Default
LOG_LEVEL=WARNING  # Only warnings+
LOG_LEVEL=ERROR  # Only errors
```

## Compatibility

- Works with Docker Compose log viewing
- Compatible with log aggregation tools (Datadog, Splunk, etc.)
- Structured format for easy parsing
- Color-friendly (emojis work in most terminals)
- No external dependencies added

## Testing

To verify the logging is working:

1. Restart the service:
   ```bash
   docker-compose restart ai-service
   ```

2. Watch logs in real-time:
   ```bash
   docker-compose logs -f ai-service
   ```

3. Send a test request (from another terminal or your frontend)

4. You should see the complete flow logged with all the emojis and metrics

## Troubleshooting

If logs aren't appearing:
1. Check log level isn't set to ERROR
2. Verify service is running: `docker-compose ps`
3. Check for startup errors: `docker-compose logs ai-service`

If logs are too verbose:
1. Set `LOG_LEVEL=WARNING` in `.env`
2. Or filter logs: `docker-compose logs ai-service | grep -E "(ERROR|WARNING)"`

## Conclusion

The AI service now has comprehensive, production-ready logging that makes it easy to:
- Debug issues quickly
- Monitor performance
- Track requests end-to-end
- Identify bottlenecks
- Understand fallback behavior
- Verify API integrations

All without adding external dependencies or complexity!
