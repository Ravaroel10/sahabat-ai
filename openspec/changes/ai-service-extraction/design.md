## Context

BantuArah is a Next.js app helping Indonesian citizens access social assistance programs. Today, all AI logic lives in TypeScript inside the web app. The only real LLM call is a single `streamText` (Vercel AI SDK → Google Gemini) in `/api/chat/route.ts`. The "RAG" in `src/lib/ai/rag.ts` is keyword scoring over three static JSON files — no embeddings, no vectors. Escalation (`escalation.ts`), content transformation (`content-transformer.ts`), and the *dead* `eligibility.ts` are deterministic rule-based TypeScript. The marketplace's actual eligibility logic is `eligibility-calculator.ts` — a separate pure-comparison module that runs synchronously in `useMemo` on every filter keystroke and must stay local to preserve that UX. The `package.json` already lists `chromadb`, `langchain`, and `@langchain/*` as unused dependencies — someone started down a Node-side RAG path and didn't finish.

An existing OpenSpec change, `feature-consolidation`, is ~80% complete. It consolidates the UI (merges scanner into marketplace, unifies chat capabilities, adds cross-feature nav) and introduced the `unified-chat` component built on the Vercel AI SDK's `useChat()` hook. That change does not touch the AI backend. This change (`ai-service-extraction`) runs **in parallel** with it; both touch `/api/chat/route.ts` and `unified-chat`, so they must agree that `unified-chat` keeps using `useChat()` against `/api/chat`, which remains the Vercel AI SDK protocol boundary.

**Stakeholders**: Indonesian citizens (primary, mobile-first, low-bandwidth), government/NGO workers (secondary), and the development team (maintainability).

**Constraints**:
- Mobile-first, low-bandwidth, WCAG 2.1 AA — streaming UX must be preserved.
- Bahasa Indonesia throughout.
- No GPU assumed for the Python host (favors OpenAI embeddings or small local models).
- Prisma owns relational data in the Next.js app; the Python service is stateless except ChromaDB.

## Goals / Non-Goals

**Goals:**
- Extract the LLM call, RAG retrieval, and official web-search fallback into a dedicated Python FastAPI service with a deterministic orchestrator that makes exactly one final LLM generation call per request.
- Implement real ChromaDB-backed RAG with embeddings, replacing the current keyword-scoring pseudo-RAG.
- Keep the Next.js `useChat()` client unchanged by making `/api/chat` a streaming proxy that translates Python SSE into the Vercel AI SDK UI message stream format.
- Make the LLM provider swappable (Gemini/OpenAI) behind a single `LLMService.generate(...)` abstraction.
- Make content-transformation available as a Python orchestrator tool (post-LLM step).
- Give the Python orchestrator its own internal eligibility tool for chat context, while **keeping the marketplace's `eligibility-calculator.ts` local and synchronous** (no network call for filtering).
- Keep the architecture modular so future tools (OCR, fact-checking, document generation) can plug into the orchestrator without redesign.

**Non-Goals:**
- Multi-agent orchestration or agent loops — there is one deterministic orchestrator, one final LLM call.
- Using LangChain Agents, Chains, Memory, or complex Runnable pipelines. LangChain is used only for Document objects, text splitters, prompt templates, and optional embedding wrappers.
- Adding a relational database to the Python service (no SQLAlchemy). Prisma in Next.js remains the sole owner of relational data.
- Changing the `unified-chat` client component or the Vercel AI SDK protocol contract on the client side.
- Modifying authentication, authorization, or the Prisma schema.
- Re-architecting the marketplace UI or moving its eligibility calculation to a network call (it stays local and synchronous).
- Exposing a Python eligibility endpoint for the marketplace to call (the marketplace keeps using `eligibility-calculator.ts` directly).

## Decisions

### Decision 1: Streaming protocol — Next.js proxy translates SSE to Vercel AI SDK format
**Choice**: The Python service emits plain SSE (`data: <json>\n\n`) via FastAPI `StreamingResponse`. The Next.js `/api/chat/route.ts` proxy consumes this SSE and re-emits the Vercel AI SDK UI message stream format via `toUIMessageStream`/`createUIMessageStreamResponse`, so the client's `useChat()` hook is completely unchanged.

**Rationale**:
- The `unified-chat` component (from `feature-consolidation`) is built around `useChat()`. Rewriting the client to consume raw SSE would discard that work and lose streaming ergonomics.
- The Python service stays protocol-agnostic — it doesn't need to know about Vercel's wire format, avoiding version coupling to the TS SDK's internal protocol.
- The proxy is ~30-50 lines: parse Python SSE tokens, wrap in Vercel format, stream back. Low complexity, clean boundary.

**Alternatives considered**:
- *(a) Reimplement Vercel format in Python*: Rejected — fragile, version-coupled to the TS SDK's internal protocol.
- *(c) Plain SSE end-to-end, drop `useChat()`*: Rejected — loses the `unified-chat` investment and streaming UX; requires rewriting message handling.
- *(d) No streaming, full JSON*: Rejected — poor UX for slow Gemini generations on mobile/low-bandwidth.

### Decision 2: Escalation and content-transformer move to Python; eligibility stays split
**Choice**: Move `escalation.ts` and `content-transformer.ts` into the Python service. Delete the dead `eligibility.ts`. The marketplace's `eligibility-calculator.ts` **stays in the Next.js app** and keeps computing synchronously. The Python orchestrator gets its own `tools/eligibility.py` for internal chat-context use only, interpreting the same `requirements` data shape that the marketplace's `SocialProgram` type defines.

**Rationale**:
- The orchestrator needs escalation and content-transformation as tools to compose the LLM context and post-process output. Keeping them in TS would require the Python service to call back into Next.js — inverting the dependency.
- `content-transformer` is inherently a post-LLM-output step; it belongs next to the LLM.
- The marketplace eligibility logic (`eligibility-calculator.ts`) is pure, synchronous, and fast (field comparisons in `useMemo`). Moving it to a network call would regress UX on a mobile-first, low-bandwidth civic app — every filter keystroke would add a round-trip. There is no AI or external data involved; it doesn't need a server.
- "Single source of truth" for eligibility is achieved by the shared `requirements` data shape (the contract), not by forcing one code location. The algorithm is simple enough (compare income, age, children, disability, occupation against `requirements{}`) that two implementations won't realistically drift.

**Alternatives considered**:
- *Move all eligibility to Python, marketplace calls the service*: Rejected — network latency regression on an interactive synchronous filter; caching mitigates repeats but not first-call per profile.
- *Keep eligibility in TS, Python calls Next.js*: Rejected — inverts the service dependency.

**Data reconciliation**: `src/data/programs/social-programs.json` (old rag.ts corpus) and `src/data/social-programs.ts` (marketplace `SOCIAL_PROGRAMS`) have different shapes today. They must be reconciled so the RAG corpus and marketplace render the same programs with the same `requirements` fields. This is a data task, not an architecture decision.

### Decision 3: ChromaDB embedded PersistentClient, no separate DB server
**Choice**: Use `chromadb.PersistentClient` inside the FastAPI process, with a persistent volume mounted at `/data` on the hosting platform (Railway or Fly.io). No separate Chroma server, no `HttpClient`.

**Rationale**:
- For a low-traffic civic app, one container (FastAPI + embedded Chroma) is cheaper and simpler than two (FastAPI + Chroma server).
- Local disk access is faster than a network DB round-trip.
- Persistent volumes on Railway/Fly.io survive restarts and redeployments.

**Alternatives considered**:
- *ChromaDB HttpClient + separate server container*: Rejected for now — adds operational complexity and cost without benefit at current scale. Can migrate later if the index grows or if multi-process scaling is needed.
- *SQLite-VSS or pgvector*: Rejected — ChromaDB is already a dependency (listed in `package.json`), its Python API is first-class, and it encapsulates the vector store behind a swappable service per the proposal.

### Decision 4: No SQLAlchemy — Python service is stateless except ChromaDB
**Choice**: The Python service has no relational database. All relational data (users, auth, app state) stays in Prisma on the Next.js side. The Python service keeps only the ChromaDB vector index and ephemeral state (request-scoped, in-memory caches).

**Rationale**:
- Adding a second relational DB creates a split-brain data ownership problem and sync complexity.
- The orchestrator is request-scoped; it doesn't need to persist conversations (the client holds history via `useChat` and the user context).
- Fewer moving parts = easier to debug and deploy (a stated goal).

**Alternatives considered**:
- *Python-side SQL for conversation logs/analytics*: Deferred — if needed later, it can be added without redesigning the orchestrator. For now, the Next.js app can log via its own Prisma DB.

### Decision 5: Brave Search for official web-search fallback
**Choice**: Use the Brave Search API with a `site:`/domain restriction to `*.go.id` (and specific subdomains: `kemensos.go.id`, `kemkes.go.id`, `bpjs-kesehatan.go.id`, `bnpb.go.id`, `jdih.go.id`, `satudata.go.id`). The tool returns structured `{title, url, snippet}` results, not raw HTML.

**Rationale**:
- Brave Search has a generous free tier and a clean REST API with domain restriction parameters.
- Returns structured results (title, URL, snippet) matching the proposal's "structured search results rather than raw HTML" requirement.
- Domain whitelist ensures only official Indonesian government sources are used as fallback context.

**Alternatives considered**:
- *Google Programmable Search Engine*: Viable, but more complex setup (CSE configuration) and stricter free-tier limits.
- *Tavily*: Good for AI-native search but adds another dependency; Brave is simpler for a whitelist use case.
- *Bing Web Search API*: Deprecation uncertainty; fewer AI-focused features.

**Citation safety**: The web fallback provides *context* for the LLM, but citations in the final answer should prefer the curated RAG corpus. Web-sourced content is marked with its URL as a source, not as a regulation citation. The system prompt instructs the LLM to distinguish "based on official regulation X" (RAG) from "based on information from [URL]" (web fallback).

### Decision 6: LangChain as lightweight infrastructure only
**Choice**: Use `langchain` and `@langchain/core` Python packages only for: `Document` objects, text splitters (`RecursiveCharacterTextSplitter`), prompt templates, and optionally embedding wrappers. Do NOT use LangChain Agents, Chains, Memory, or complex Runnable pipelines.

**Rationale**:
- LangChain's Document/splitter/template primitives are stable and save boilerplate.
- The orchestrator is explicitly deterministic and single-pass (one LLM call). LangChain's agent/chain abstractions would obscure this and add hidden complexity — the exact anti-pattern the proposal warns against.
- Using only primitives keeps the implementation "simple and explicit" (a stated goal) and avoids lock-in to LangChain's evolving higher-level APIs.

**Alternatives considered**:
- *No LangChain at all*: Viable, but reimplementing text splitters and Document objects is unnecessary boilerplate.
- *Full LangChain (agents/chains)*: Explicitly rejected by the proposal.

### Decision 7: Embedding model — OpenAI `text-embedding-3-small` (default), local fallback
**Choice**: Default to OpenAI's `text-embedding-3-small` for embeddings (via `chromadb`'s `OpenAIEmbeddingFunction`). If cost or offline constraints arise, fall back to `sentence-transformers/all-MiniLM-L6-v2` (Chroma's default, runs on CPU, no GPU needed).

**Rationale**:
- `text-embedding-3-small` is cheap, high-quality, and already aligned with the OpenAI provider option for the LLM.
- The embedding function is encapsulated behind `services/embeddings.py`, so switching is a config change, not an architecture change.
- The local sentence-transformers fallback needs no GPU and works on the cheapest Railway/Fly.io tier.

**Alternatives considered**:
- *Google Gemini embeddings*: Viable if Gemini is the chosen LLM, but less universal than OpenAI embeddings for a swappable-provider design.
- *Always-local embeddings*: Cheaper but lower quality for Indonesian-language content; deferred as a fallback.

## Risks / Trade-offs

**Risk**: Two services to deploy and monitor instead of one — added operational complexity.
→ **Mitigation**: Dockerize the Python service; deploy to Railway/Fly.io with persistent volume. Add a `/health` endpoint and configure Vercel to fail gracefully if the AI service is down (return a friendly Indonesian error, not a crash).

**Risk**: Streaming proxy adds a failure point between client and LLM — if the Python service drops mid-stream, the client sees a truncated response.
→ **Mitigation**: The proxy detects SSE stream errors and appends a graceful termination message. The client `useChat()` already handles stream errors.

**Risk**: ChromaDB PersistentClient on a persistent volume — if the volume is lost, the vector index is lost.
→ **Mitigation**: The ingest script is idempotent and re-runnable. Store the source JSON corpora in the repo (they already are). Re-ingesting from scratch takes minutes, not hours. Consider periodic volume snapshots on the hosting platform.

**Risk**: Brave Search free-tier rate limits could throttle the fallback during traffic spikes.
→ **Mitigation**: The fallback is only used when RAG yields no results (expected to be a minority of queries). Cache web-search results by query hash with a short TTL. Monitor API usage and upgrade tier if needed.

**Risk**: Coordinate with `feature-consolidation` — both changes edit `/api/chat/route.ts`.
→ **Mitigation**: This change owns the *backend wiring* of `/api/chat` (proxy to Python). `feature-consolidation` owns the *chat UI client* (`unified-chat`). The contract is: `unified-chat` calls `useChat({ api: '/api/chat' })`, and `/api/chat` always speaks the Vercel AI SDK protocol. As long as both sides honor that contract, parallel work is safe.

**Trade-off**: Web-search fallback context may include stale or repealed regulations from `.go.id` sites.
→ **Implication**: The system prompt explicitly instructs the LLM to mark web-sourced claims as "berdasarkan informasi dari [URL]" rather than citing them as regulations, and to recommend verification with Dinas Sosial. RAG (curated corpus) is the primary citation source.

**Trade-off**: Two eligibility implementations (TS `eligibility-calculator.ts` + Python `tools/eligibility.py`) could drift.
→ **Implication**: The matching *algorithm* is simple and stable (field comparisons). The thing that could drift — program-specific thresholds — lives in the `requirements` data, not the algorithm. Once `social-programs.json` and `social-programs.ts` are reconciled into a shared shape, both sides interpret the same data contract. Acceptable drift risk.

## Migration Plan

**Phase 1: Python service skeleton + ingest**
1. Create `ai-service/` directory with FastAPI app, config, `/health` endpoint.
2. Implement `database/chroma.py` (PersistentClient, collection management).
3. Implement `services/embeddings.py` (OpenAI embedding function wrapper).
4. Write `ingest/` script to chunk and embed the three existing JSON corpora (`social-programs.json`, `institutions.json`, `document-templates.json`) into ChromaDB.
5. Run ingest locally to populate the vector index.

**Phase 2: Orchestrator + tools**
6. Implement `tools/rag.py` (`search_rag(query)` → chunks from Chroma).
7. Implement `tools/official_search.py` (`search_official_web(query)` → Brave API, `*.go.id` whitelist).
8. Port `escalation.ts` into a Python orchestrator tool. Port the marketplace's `eligibility-calculator.ts` comparison logic into `tools/eligibility.py` for orchestrator-internal use (chat context only — the marketplace keeps its own TS copy).
9. Port `content-transformer.ts` into a Python post-LLM step.
10. Implement `services/llm.py` (`LLMService.generate(...)` — swappable Gemini/OpenAI).
11. Implement `orchestrator/orchestrator.py` — deterministic flow: RAG → fallback → one LLM call.
12. Port `BANTUARAH_SYSTEM_PROMPT` from `system-prompts.ts` into Python `prompts/`.

**Phase 3: API endpoint + streaming**
13. Implement `api/chat.py` — `POST /chat` accepting `{message, conversation, user_context}`, returning SSE stream or JSON.
14. Implement Pydantic schemas for request/response/citations.
15. Add CORS configuration for the Vercel frontend origin.

**Phase 4: Next.js proxy + deletions**
16. Rewrite `/api/chat/route.ts` as a streaming proxy: POST to Python `/chat`, consume SSE, re-emit Vercel AI SDK format via `toUIMessageStream`.
17. Reconcile `src/data/programs/social-programs.json` and `src/data/social-programs.ts` into a shared shape (same programs, same `requirements` fields) so the RAG corpus and marketplace agree.
18. Delete `src/lib/ai/providers.ts`, `src/lib/ai/rag.ts`, `src/lib/ai/escalation.ts`, `src/lib/eligibility.ts` (dead code), `src/lib/content-transformer.ts`, `src/prompts/system-prompts.ts`. **Keep** `src/lib/eligibility-calculator.ts`.
19. Update any remaining imports/references to deleted modules. Verify the marketplace still imports `eligibility-calculator.ts` and works unchanged.

**Phase 5: Deployment + testing**
20. Dockerize the Python service (`Dockerfile`, `requirements.txt`).
21. Deploy to Railway or Fly.io with a persistent volume for `/data`.
22. Configure environment variables (LLM provider, API keys, Brave Search key, CORS origin).
23. End-to-end test: chat → streaming → citations → emergency detection. Marketplace eligibility remains local (verify it works unchanged).
24. Coordinate with `feature-consolidation` to ensure both changes' `/api/chat` edits merge cleanly.

**Rollback Strategy**:
- The old `/api/chat/route.ts` (direct `streamText` to Gemini) is preserved in git history. If the Python service fails in production, revert `/api/chat/route.ts` to restore direct LLM calls.
- The deleted TS AI modules are in git history and can be restored.
- ChromaDB data is non-destructive — the Python service can be taken offline without affecting the Next.js app's non-AI features.
- Feature flag: `AI_SERVICE_URL` env var. If unset or pointing to an unreachable host, `/api/chat` falls back to the legacy direct-LLM path (kept as a code branch during migration).

## Open Questions

1. **Data reconciliation approach**: Merge `social-programs.json` and `social-programs.ts` into one source-of-truth file, or keep two with a codegen/sync step? Affects both the RAG ingest and the marketplace rendering.
2. **Embedding model final choice**: Start with OpenAI `text-embedding-3-small` for quality, or local sentence-transformers for zero-cost? Depends on budget and whether Indonesian-language embedding quality is acceptable with the small local model.
3. **Chunk size and overlap for ingest**: The JSON corpora are semi-structured (program records with fields). Chunk per-record or split field values? Needs experimentation with retrieval quality.
4. **ChromaDB collection schema**: One collection for all three corpora, or separate collections (programs, institutions, document-templates) with the orchestrator querying the relevant one? Separate collections are cleaner but require the orchestrator to decide which to query.
5. **Conversation history ownership**: The Python `/chat` receives `conversation: []` in the request. Should the orchestrator always trust it, or reconstruct context server-side? For now, trust the client-provided history (simpler), but consider server-side session persistence later.
