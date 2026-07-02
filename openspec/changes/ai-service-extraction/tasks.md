## 1. Python Service Skeleton and Configuration

- [x] 1.1 Create `ai-service/` directory structure (`app/`, `api/`, `orchestrator/`, `tools/`, `services/`, `database/`, `schemas/`, `prompts/`, `ingest/`)
- [x] 1.2 Create `requirements.txt` with dependencies: fastapi, uvicorn, pydantic, chromadb, langchain, openai, httpx, python-dotenv
- [x] 1.3 Create `app/config.py` with environment-based config (LLM_PROVIDER, LLM_API_KEY, LLM_MODEL, EMBEDDING_MODEL, EMBEDDING_API_KEY, CHROMA_PATH, BRAVE_SEARCH_API_KEY, OFFICIAL_SEARCH_DOMAINS, FRONTEND_URL)
- [x] 1.4 Create `app/main.py` with FastAPI app, CORS middleware (FRONTEND_URL), and `GET /health` endpoint
- [ ] 1.5 Verify service starts with `uvicorn app.main:app` and `/health` returns 200
- [x] 1.6 Validate config fails fast on missing required env vars with a clear error message

## 2. ChromaDB and Embeddings Service

- [x] 2.1 Create `database/chroma.py` with PersistentClient (configurable path), collection get/create, add documents, query, and delete operations
- [x] 2.2 Create `services/embeddings.py` wrapping ChromaDB embedding functions (OpenAI `text-embedding-3-small` default, sentence-transformers fallback) selected by config
- [ ] 2.3 Verify ChromaDB persists data across service restarts (ingest a test doc, restart, query it)
- [x] 2.4 Verify no module outside `database/chroma.py` imports `chromadb` directly

## 3. Ingest Pipeline for Existing Corpora

- [x] 3.1 Create `ingest/ingest.py` script that reads `src/data/programs/social-programs.json`, `src/data/institutions/institutions.json`, and `src/data/documents/document-templates.json`
- [x] 3.2 Use LangChain `RecursiveCharacterTextSplitter` to chunk each JSON record into `Document` objects with metadata (source corpus, record id, record type, legal basis)
- [x] 3.3 Embed chunks via `services/embeddings.py` and store in ChromaDB via `database/chroma.py`
- [x] 3.4 Make ingest idempotent (upsert by id — re-running does not create duplicates)
- [ ] 3.5 Run ingest locally and verify all three corpora are indexed in ChromaDB

## 4. RAG Retrieval Tool

- [x] 4.1 Create `tools/rag.py` with `search_rag(query: str, k: int = 5)` function that embeds the query and performs similarity search via `database/chroma.py`
- [x] 4.2 Return results with score, document text, and metadata; filter out results below a configurable relevance threshold
- [x] 4.3 Return an empty list (not an error) when no results are above threshold
- [x] 4.4 Verify `tools/rag.py` has no imports of other tools or the orchestrator

## 5. Official Web Search Tool (Brave)

- [x] 5.1 Create `tools/official_search.py` with `search_official_web(query: str)` using the Brave Search API
- [x] 5.2 Restrict search to configured `*.go.id` domains (OFFICIAL_SEARCH_DOMAINS env var, with defaults: kemensos.go.id, kemkes.go.id, bpjs-kesehatan.go.id, bnpb.go.id, jdih.go.id, satudata.go.id)
- [x] 5.3 Return structured results as `[{title, url, snippet}]`, not raw HTML
- [x] 5.4 Add in-memory cache by query hash with configurable TTL (default 5 min)
- [x] 5.5 Handle Brave API errors (429 rate limit, timeouts, invalid responses) by returning empty results and logging the error
- [x] 5.6 Verify `tools/official_search.py` has no imports of other tools or the orchestrator

## 6. Escalation, Eligibility, and Content Transformer (Ported from TypeScript)

- [x] 6.1 Port `src/lib/ai/escalation.ts` keyword detection logic into `orchestrator/escalation.py` (red/yellow/green priority, hotlines)
- [x] 6.2 Port `src/lib/eligibility-calculator.ts` comparison logic into `tools/eligibility.py` for **orchestrator-internal use only** (chat context). This is NOT exposed as an endpoint — the marketplace keeps its own TS `eligibility-calculator.ts` and computes synchronously. Both interpret the same `requirements` data shape.
- [x] 6.3 Port `src/lib/content-transformer.ts` into `orchestrator/content_transformer.py` (removeEnglishMixing, convertToConversational, removeAiPatterns)
- [ ] 6.4 Verify ported Python escalation and content-transformer logic produces identical outputs to the TS originals for a set of test inputs

## 7. LLM Service (Swappable Provider)

- [x] 7.1 Create `services/llm.py` with `LLMService` class exposing `generate(prompt, context, system_prompt) -> Iterator[str]` (streaming) and a non-streaming variant
- [x] 7.2 Implement Gemini and OpenAI providers selected by `LLM_PROVIDER` env var
- [x] 7.3 Fail fast at startup if `LLM_PROVIDER` is set to an unsupported value
- [x] 7.4 Verify no module outside `services/llm.py` imports an LLM provider SDK directly

## 8. System Prompt Port

- [x] 8.1 Port `BANTUARAH_SYSTEM_PROMPT` from `src/prompts/system-prompts.ts` into `prompts/system_prompt.py`
- [x] 8.2 Add instructions to the prompt for distinguishing web-sourced claims ("berdasarkan informasi dari [URL]") from regulation citations
- [x] 8.3 Add instructions for the `emergency` response field and prioritizing immediate-action guidance when escalation is detected

## 9. Orchestrator

- [x] 9.1 Create `orchestrator/orchestrator.py` with the deterministic flow: receive message → search_rag → (if empty) search_official_web → build prompt → one LLM call → content_transform → return response
- [x] 9.2 Run escalation detection (deterministic) before the LLM call; inject emergency instructions into the prompt if detected
- [x] 9.3 Include conversation history and user_context in the LLM prompt when provided
- [x] 9.4 Extract citations from RAG metadata and sources from web-search results; set the `emergency` boolean
- [x] 9.5 Verify exactly one LLM generation call is made per request (no LLM calls in routing stages)
- [x] 9.6 Verify the orchestrator is the only module that calls tools; tools do not import each other

## 10. API Endpoint and Schemas

- [x] 10.1 Create Pydantic schemas in `schemas/` for ChatRequest (message, conversation, user_context), ChatResponse (answer, citations, sources, emergency), Citation, WebSource
- [x] 10.2 Create `api/chat.py` with `POST /chat` accepting ChatRequest, returning an SSE stream via `StreamingResponse`
- [x] 10.3 Ensure `/chat` routes contain no business logic (delegated to orchestrator/tools)
- [ ] 10.4 Verify CORS headers are present for FRONTEND_URL and absent for unknown origins

> **Note**: No `/eligibility` endpoint is exposed by the Python service. The marketplace keeps using `src/lib/eligibility-calculator.ts` synchronously in the browser. The Python `tools/eligibility.py` is an internal orchestrator module, not an API.

## 11. Next.js /api/chat Proxy

- [x] 11.1 Rewrite `src/app/api/chat/route.ts` to forward `{message, conversation, user_context}` to the Python `POST /chat` endpoint (URL from `AI_SERVICE_URL` env var)
- [x] 11.2 Consume the Python SSE stream and re-emit it as a Vercel AI SDK UI message stream via `toUIMessageStream`/`createUIMessageStreamResponse`
- [x] 11.3 Handle Python service unreachable (return Vercel-format Indonesian error, HTTP 500)
- [x] 11.4 Handle Python stream mid-stream interruption (append graceful termination in Vercel format, close stream)
- [ ] 11.5 Verify `useChat()` in `unified-chat` works unchanged against the proxy (end-to-end streaming test)

## 12. Reconcile Program Datasets

> The marketplace reads `src/data/social-programs.ts` (`SOCIAL_PROGRAMS`) and the old rag.ts read `src/data/programs/social-programs.json`. These have different shapes. They must be reconciled so the ChromaDB RAG corpus and the marketplace render the same programs.

- [x] 12.1 Audit both datasets: compare fields, program IDs, and `requirements` structures between `social-programs.ts` and `social-programs.json`
- [x] 12.2 Merged into a single `social-programs.json` (14 unique programs) — `social-programs.ts` now imports from JSON and maps to `SocialProgram[]`
- [x] 12.3 Aligned the `requirements` field shape so both the TS `eligibility-calculator.ts` and the Python `tools/eligibility.py` interpret the same contract. Programs without structured requirements (jamkesda, pis, bansos-darurat, bkk) now show 'partial' instead of incorrectly showing 'eligible'
- [x] 12.4 Verified marketplace renders correctly — typecheck passes, all 14 programs present, eligibility indicators work

## 13. Delete Moved TypeScript Modules

- [x] 13.1 Delete `src/lib/ai/providers.ts`
- [x] 13.2 Delete `src/lib/ai/rag.ts`
- [x] 13.3 Delete `src/lib/ai/escalation.ts`
- [x] 13.4 Delete `src/lib/eligibility.ts` (dead code — NOT used by the marketplace)
- [x] 13.5 Delete `src/lib/content-transformer.ts`
- [x] 13.6 Delete `src/prompts/system-prompts.ts`
- [x] 13.7 **Keep** `src/lib/eligibility-calculator.ts` — the marketplace still uses it synchronously
- [x] 13.8 Run `tsc` / `next build` and fix any dangling imports referencing deleted modules
- [x] 13.9 Remove unused npm dependencies from `package.json` (chromadb, langchain, @langchain/*) if no longer used by the Next.js app

## 14. Dockerization and Deployment

- [x] 14.1 Create `ai-service/Dockerfile` for the Python FastAPI service
- [x] 14.2 Create `ai-service/docker-compose.yml` for local dev (with a volume mount for `/data`)
- [ ] 14.3 Deploy to Railway or Fly.io with a persistent volume mounted at `/data` (ChromaDB path)
- [ ] 14.4 Configure environment variables on the hosting platform (LLM provider, keys, Brave key, CORS origin, Chroma path)
- [ ] 14.5 Set `AI_SERVICE_URL` on the Vercel Next.js deployment to point to the deployed Python service
- [ ] 14.6 Verify `/health` endpoint returns healthy after deployment

## 15. End-to-End Testing

- [ ] 15.1 Test chat with RAG context (query about a known program → answer with regulation citations)
- [ ] 15.2 Test chat with web-search fallback (query not in corpus → answer with URL sources)
- [ ] 15.3 Test emergency escalation (message with red-priority keywords → emergency=true, hotline guidance)
- [ ] 15.4 Test streaming end-to-end (client `useChat()` receives tokens incrementally)
- [ ] 15.5 Test marketplace eligibility still works locally (filter change → correct `EligibilityResult` from `eligibility-calculator.ts`, no network call)
- [ ] 15.6 Test Python orchestrator eligibility tool (chat with user_context → eligibility informs the LLM answer)
- [ ] 15.7 Test web-search cache (repeated query → cache hit, no Brave API call)
- [ ] 15.8 Test Python service down → Next.js proxy returns friendly Indonesian error; marketplace eligibility still works (it's local)
- [ ] 15.9 Test CORS (frontend origin allowed, unknown origin blocked)

## 16. Coordination with feature-consolidation

- [ ] 16.1 Confirm both changes agree: `unified-chat` uses `useChat({ api: '/api/chat' })` and `/api/chat` speaks Vercel AI SDK protocol
- [ ] 16.2 Merge both changes' edits to `/api/chat/route.ts` without conflict (this change owns backend proxy wiring; feature-consolidation owns chat UI)
- [ ] 16.3 Run the full test suite (jest) to ensure no regressions from the parallel changes
