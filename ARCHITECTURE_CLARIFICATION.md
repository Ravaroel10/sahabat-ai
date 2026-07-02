# Architecture Clarification: Frontend vs Backend

## 🏗️ Your Current Stack

```
┌─────────────────────────────────────────────────┐
│ FRONTEND (Next.js + React)                      │
│                                                  │
│ Uses: Vercel AI SDK                             │
│   - @ai-sdk/react: useChat hook                 │
│   - ai: createUIMessageStream utilities         │
│                                                  │
│ Purpose:                                         │
│   - Stream UI updates from backend              │
│   - Display messages with rich parts            │
│   - Handle loading states                       │
│                                                  │
│ Does NOT call LLM directly!                     │
└─────────────────────────────────────────────────┘
                      ▲
                      │ SSE Stream (Vercel AI SDK format)
                      │
┌─────────────────────────────────────────────────┐
│ BACKEND API (Next.js API Routes)                │
│                                                  │
│ File: src/app/api/chat/route.ts                 │
│                                                  │
│ Uses: Vercel AI SDK (server-side)               │
│   - createUIMessageStream                       │
│   - createUIMessageStreamResponse               │
│                                                  │
│ Purpose:                                         │
│   - Receive frontend requests                   │
│   - Forward to Python AI service                │
│   - Transform Python SSE → AI SDK format        │
│   - Proxy stream back to frontend               │
│                                                  │
│ Does NOT call LLM directly!                     │
└─────────────────────────────────────────────────┘
                      ▲
                      │ SSE Stream (Python custom format)
                      │
┌─────────────────────────────────────────────────┐
│ PYTHON AI SERVICE (FastAPI)                     │
│                                                  │
│ Uses: LiteLLM (NOT Vercel AI SDK!)              │
│   - Model: openrouter/openrouter/owl-alpha     │
│   - Fallbacks: nemotron-3-ultra, gpt-oss-120b  │
│                                                  │
│ Components:                                      │
│   - orchestrator.py: Main flow                  │
│   - services/llm.py: LiteLLM wrapper            │
│   - tools/rag.py: ChromaDB search               │
│   - tools/official_search.py: Exa API           │
│                                                  │
│ Purpose:                                         │
│   - RAG search (ChromaDB + HuggingFace)         │
│   - Emergency detection                         │
│   - LLM generation (LiteLLM streaming)          │
│   - Content transformation                      │
│                                                  │
│ THIS is where LLM calls happen!                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ What You USE (Correctly)

### Frontend:
- ✅ **Vercel AI SDK** - `useChat` hook for streaming UI
- ✅ **React** - Component rendering
- ✅ **Shadcn/ui** - UI components

### Backend API (Next.js):
- ✅ **Vercel AI SDK** - SSE stream utilities
- ✅ **Next.js API Routes** - HTTP endpoints

### AI Service (Python):
- ✅ **LiteLLM** - Unified LLM interface
- ✅ **OpenRouter** - Free model provider
- ✅ **FastAPI** - Python web framework
- ✅ **ChromaDB** - Vector database
- ✅ **HuggingFace** - Embeddings API

---

## ❌ What You DON'T Use

- ❌ Vercel AI SDK on Python side
- ❌ OpenAI SDK directly (replaced by LiteLLM)
- ❌ Google Generative AI SDK (replaced by LiteLLM)
- ❌ Vercel AI SDK for LLM calls (LiteLLM handles this)

---

## 🔑 Key Point: Vercel AI SDK is ONLY for UI Streaming

**Vercel AI SDK Purpose:**
- Stream data from backend → frontend
- Display loading states
- Handle message parts
- Manage chat UI state

**It does NOT:**
- Call LLMs (that's LiteLLM's job)
- Do RAG searches (that's ChromaDB's job)
- Do web searches (that's Exa API's job)

---

## 📊 Data Flow

### 1. User sends message:
```
User types → useChat.sendMessage()
```

### 2. Frontend → Backend API:
```typescript
// Frontend
useChat({
  api: '/api/chat',  // Next.js API route
})

// POST /api/chat with UIMessage[]
```

### 3. Backend API → Python Service:
```typescript
// api/chat/route.ts
fetch(`${AI_SERVICE_URL}/chat`, {
  method: 'POST',
  body: JSON.stringify({
    message: '...',
    conversation: [...],
  })
})
```

### 4. Python Service processes:
```python
# orchestrator.py
1. detect_escalation(message)     # Check for emergencies
2. search_rag(message)             # ChromaDB + HuggingFace
3. search_official_web(message)    # Exa API (if RAG fails)
4. llm.generate_stream(...)        # LiteLLM → OpenRouter
5. transform_content(...)          # Post-processing
```

### 5. Python Service → Backend API (SSE):
```python
# Python SSE format
{"type": "token", "data": "..."}
{"type": "metadata", "citations": [...]}
{"type": "done"}
```

### 6. Backend API transforms → Frontend:
```typescript
// Transform Python SSE → Vercel AI SDK format
writer.write({ type: 'text-delta', delta: '...' })
writer.write({ type: 'data-citation', data: {...} })
writer.write({ type: 'finish', finishReason: 'stop' })
```

### 7. Frontend displays:
```typescript
// useChat receives message.parts
message.parts.map(part => {
  if (part.type === 'text') return <Markdown>{part.text}</Markdown>
  if (part.type === 'data-citation') return <CitationRenderer {...part.data} />
})
```

---

## 🎯 Your Original Question Was Correct!

You asked about implementing rich message cards (citations, program cards, etc.) 
in the **frontend** using **Vercel AI SDK**.

**This is correct!** The frontend DOES use Vercel AI SDK.

The confusion was about where LLM calls happen:
- ❌ NOT in Vercel AI SDK
- ✅ In Python with LiteLLM

But for **UI streaming and message parts**, you absolutely use Vercel AI SDK,
and my original analysis was correct:

1. ✅ Use `data-*` prefix for custom parts
2. ✅ Update types in `llm-response.ts`
3. ✅ Update component switch cases
4. ✅ Transform Python SSE in backend API
5. ✅ Emit structured parts from Python

---

## 📚 Why This Architecture Makes Sense

### Separation of Concerns:

**Frontend (Vercel AI SDK):**
- Handles UI streaming elegantly
- TypeScript types for message parts
- React hooks for state management
- **Best tool for this job!**

**Backend API (Next.js):**
- Lightweight proxy
- Transforms data formats
- Handles CORS, timeouts
- **Good middleware layer**

**Python Service (LiteLLM):**
- Heavy AI work (RAG, LLM, search)
- Mature Python AI ecosystem
- Easy to debug and test
- **Right tool for AI logic!**

---

## ✨ Summary

**You're using the right tools for each layer!**

- Vercel AI SDK = UI streaming ✅
- LiteLLM = LLM calls ✅
- ChromaDB = Vector search ✅
- HuggingFace = Embeddings ✅

The issue is just getting the **data format** right between layers.

My original analysis stands:
1. Fix frontend types (`data-*` prefix)
2. Update backend to emit custom parts
3. Enhance Python to return structured data

**The plan is still valid! Ready to start? 🚀**
