## Why

All AI functionality currently lives inside the Next.js web app, tightly coupling LLM calls, retrieval, and prompt logic to the frontend runtime. The "RAG" is keyword scoring over JSON files (no embeddings, no vectors), and the only real LLM call is a single `streamText` in `/api/chat`. Extracting AI into a dedicated Python FastAPI service separates concerns cleanly, enables a real ChromaDB-backed RAG pipeline with official web-search fallback, and makes the LLM provider swappable — while the Next.js app keeps only UI, auth, database, and a thin streaming proxy. This runs in parallel with the existing `feature-consolidation` UI change; both touch `/api/chat` and `unified-chat` but coordinate via a shared streaming contract.

## What Changes

- **BREAKING**: Move the LLM call out of Next.js. `/api/chat/route.ts` becomes a thin streaming proxy that forwards to the Python service's `POST /chat` and translates its SSE stream into the Vercel AI SDK UI message stream format (so the client's `useChat()` hook is unchanged).
- **BREAKING**: Delete `src/lib/ai/providers.ts`, `src/lib/ai/rag.ts`, `src/lib/ai/escalation.ts`, and `src/prompts/system-prompts.ts` from the Next.js app — their logic moves to Python.
- Delete `src/lib/eligibility.ts` (dead code — unused by the marketplace). The marketplace's actual eligibility logic lives in `src/lib/eligibility-calculator.ts`, which **stays in the Next.js app** and computes synchronously in `useMemo` on every filter change. The Python service gets its own `tools/eligibility.py` for orchestrator-internal use only (chat context), interpreting the same `requirements` data shape. No network call is introduced for marketplace filtering.
- Move the content transformer (`src/lib/content-transformer.ts`) into the Python service as a post-LLM output step.
- Reconcile the two program datasets: `src/data/programs/social-programs.json` (read by the old `rag.ts`, destined for the ChromaDB RAG corpus) and `src/data/social-programs.ts` (read by the marketplace, exports `SOCIAL_PROGRAMS`). These have different shapes today and must be aligned so the RAG corpus and marketplace render the same programs.
- Add a new Python FastAPI service (`ai-service/`) with a deterministic orchestrator that: receives a message → queries ChromaDB RAG → falls back to Brave Search restricted to `*.go.id` domains if no relevant context → makes exactly one final LLM generation call → returns answer, citations, sources, and emergency flag.
- Implement ChromaDB-backed RAG with real embeddings (OpenAI or sentence-transformers) and an ingest script that ports the existing `social-programs.json`, `institutions.json`, and `document-templates.json` corpora into a vector collection.
- Add a Brave Search fallback tool restricted to trusted official Indonesian government domains.
- Add a swappable LLM abstraction layer (`LLMService.generate(...)`) so the provider (Gemini/OpenAI) can change without touching the orchestrator.
- Use LangChain only for lightweight primitives (Document objects, text splitters, prompt templates, embedding wrappers) — no Agents, Chains, Memory, or complex Runnables.
- The Python service is stateless except for ChromaDB (embedded `PersistentClient` on a persistent volume). No SQLAlchemy — the Next.js app keeps owning relational data via Prisma.
- The Python service streams tokens via FastAPI `StreamingResponse` using SSE; the Next.js proxy translates to the Vercel AI SDK wire format.

## Capabilities

### New Capabilities

- `ai-orchestration`: The deterministic Python orchestrator that routes a user message through RAG → fallback search → a single LLM generation call, plus the swappable LLM abstraction layer and tool dispatch.
- `rag-retrieval`: ChromaDB-backed retrieval-augmented generation — document chunking, embeddings, vector collection management, similarity search, and an ingest pipeline for the existing program/institution/document corpora.
- `official-web-search`: Brave Search API fallback tool restricted to trusted `*.go.id` domains, returning structured `{title, url, snippet}` results; used only when RAG yields no relevant context.
- `ai-service-integration`: The Next.js-side changes — the `/api/chat` streaming proxy translating Python SSE to the Vercel AI SDK UI message stream format, deletion of moved TS AI logic, and reconciliation of the two program datasets.

### Modified Capabilities

<!-- No existing specs in openspec/specs/ to modify. The feature-consolidation change has not synced specs to the main specs dir yet, so no delta specs are required here. -->

## Impact

**Affected Code (Next.js)**:
- `/src/app/api/chat/route.ts` — rewritten as a streaming proxy to the Python service
- `/src/lib/ai/providers.ts` — **deleted** (moves to Python `services/llm.py`)
- `/src/lib/ai/rag.ts` — **deleted** (replaced by Python `tools/rag.py` + ChromaDB)
- `/src/lib/ai/escalation.ts` — **deleted** (moves to Python orchestrator logic)
- `/src/lib/eligibility.ts` — **deleted** (dead code; the marketplace uses `eligibility-calculator.ts` instead)
- `/src/lib/eligibility-calculator.ts` — **KEPT** (marketplace eligibility stays local and synchronous)
- `/src/lib/content-transformer.ts` — **deleted** (moves to Python post-LLM step)
- `/src/prompts/system-prompts.ts` — **deleted** (ports to Python `prompts/`)
- `/src/data/programs/social-programs.json` and `/src/data/social-programs.ts` — **reconciled** (aligned shapes for RAG corpus + marketplace)
- `/src/components/marketplace/` — unchanged (still calls `calculateEligibility` locally)
- `/src/components/unified-chat/` — unchanged (still `useChat()` hitting the proxy)

**New Code (Python)**:
- `ai-service/` — new top-level directory with FastAPI app, orchestrator, tools, services, database, schemas, prompts, and ingest script

**New Dependencies (Python)**:
- `fastapi`, `uvicorn`, `pydantic`, `chromadb`, `langchain` (core only), `openai` (or `google-generativeai`), Brave Search API client, `httpx`

**New External Service**:
- Brave Search API (for official web search fallback)
- Hosting: Railway or Fly.io with a persistent volume for ChromaDB (embedded `PersistentClient`), deployed in the same region as the Vercel frontend

**Coordination with `feature-consolidation`**:
- Both changes touch `/api/chat/route.ts` and `unified-chat`. This change owns the backend wiring; `feature-consolidation` owns the chat UI client. They run in parallel and must agree that `unified-chat` keeps using `useChat()` against `/api/chat`, which remains the Vercel AI SDK protocol boundary.

**Open Questions**:
- How to reconcile `social-programs.json` (rag.ts corpus) and `social-programs.ts` (marketplace `SOCIAL_PROGRAMS`) — merge into one source-of-truth dataset, or keep two with a shared `requirements` shape contract?
- Embedding model choice (OpenAI `text-embedding-3-small` vs. local sentence-transformers) — affects cost and whether the Python host needs a GPU.
- ChromaDB collection schema and chunk size for the ingest of the three existing JSON corpora.
