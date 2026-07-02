## ADDED Requirements

### Requirement: Next.js /api/chat becomes a streaming proxy
The Next.js `/api/chat/route.ts` SHALL be rewritten as a streaming proxy. It SHALL accept the Vercel AI SDK's `UIMessage[]` format from the client, forward the request to the Python service's `POST /chat` endpoint, consume the Python SSE stream, and re-emit it as a Vercel AI SDK UI message stream via `toUIMessageStream`/`createUIMessageStreamResponse`. The client's `useChat()` hook SHALL remain unchanged.

#### Scenario: Streaming chat through the proxy
- **WHEN** the client sends a chat request to `/api/chat` via `useChat()`
- **THEN** the proxy forwards `{message, conversation, user_context}` to the Python service, receives SSE tokens, translates them to the Vercel AI SDK UI message stream format, and returns a streaming response that `useChat()` consumes transparently

#### Scenario: Python service unreachable
- **WHEN** the Python service is unreachable or returns an error before streaming begins
- **THEN** the proxy returns a Vercel AI SDK formatted error response (a user-friendly Indonesian message) with HTTP 500, and the client's `useChat()` error handling displays it

#### Scenario: Python service drops mid-stream
- **WHEN** the Python SSE stream is interrupted after partial tokens have been forwarded
- **THEN** the proxy appends a graceful termination message in Vercel format and closes the stream, so the client sees a partial answer followed by a fallback notice rather than a hang

### Requirement: Deleted TypeScript AI modules are replaced by Python equivalents
The following Next.js modules SHALL be deleted: `src/lib/ai/providers.ts`, `src/lib/ai/rag.ts`, `src/lib/ai/escalation.ts`, `src/lib/eligibility.ts` (dead code), `src/lib/content-transformer.ts`, and `src/prompts/system-prompts.ts`. Their logic SHALL be ported to the Python service. Any remaining imports referencing these modules in the Next.js codebase SHALL be updated or removed. The marketplace's `src/lib/eligibility-calculator.ts` SHALL be **kept** and continue to compute eligibility synchronously in the browser.

#### Scenario: No dangling imports after deletion
- **WHEN** the TS AI modules are deleted (but `eligibility-calculator.ts` is kept)
- **THEN** `next build` and `tsc` succeed with no "module not found" errors, and all references to the deleted modules are either removed or repointed to the Python service proxy

#### Scenario: System prompt lives only in Python
- **WHEN** the Python service starts
- **THEN** the `BANTUARAH_SYSTEM_PROMPT` is loaded from the Python `prompts/` module, and no copy of the prompt exists in the Next.js codebase

#### Scenario: Marketplace eligibility stays local
- **WHEN** a user adjusts a filter in the marketplace UI
- **THEN** the marketplace calls `calculateEligibility` from `eligibility-calculator.ts` synchronously in `useMemo` (no network call), and the Python service is not involved in marketplace filtering

### Requirement: Program datasets are reconciled
The two program datasets — `src/data/programs/social-programs.json` (destined for the ChromaDB RAG corpus) and `src/data/social-programs.ts` (the marketplace's `SOCIAL_PROGRAMS`) — SHALL be reconciled into a shared shape so the RAG corpus and marketplace render the same programs with the same `requirements` fields. Both the TS `eligibility-calculator.ts` and the Python `tools/eligibility.py` SHALL interpret this shared `requirements` contract.

#### Scenario: Same programs in RAG and marketplace
- **WHEN** the ChromaDB ingest runs and the marketplace renders
- **THEN** both use the same set of programs with matching IDs, names, and `requirements` fields — no program appears in one but not the other

#### Scenario: Shared requirements shape
- **WHEN** a program's `requirements` define `maxIncome`, `minAge`, `hasChildren`, etc.
- **THEN** both the TS eligibility calculator and the Python eligibility tool interpret those same fields identically

### Requirement: Python service CORS and HTTPS
The Python FastAPI service SHALL configure CORS to allow requests only from the configured Next.js frontend origin (via environment variable). When deployed, the service SHALL be served over HTTPS (provided by the hosting platform or a reverse proxy).

#### Scenario: CORS allows frontend origin
- **WHEN** the Next.js frontend (origin matching `FRONTEND_URL`) makes a request to the Python service
- **THEN** the response includes the appropriate CORS headers and the request succeeds

#### Scenario: CORS blocks unknown origin
- **WHEN** a request arrives from an origin not matching `FRONTEND_URL`
- **THEN** the response does not include CORS headers and the browser blocks the cross-origin request

### Requirement: Health check endpoint
The Python service SHALL expose a `GET /health` endpoint returning HTTP 200 with a JSON body indicating service status and ChromaDB connectivity. The Next.js proxy and deployment platform SHALL use this endpoint for health checks and cold-start mitigation.

#### Scenario: Healthy service
- **WHEN** `/health` is called and the service is running with ChromaDB accessible
- **THEN** it returns 200 with `{"status": "healthy", "chromadb": "connected"}`

#### Scenario: ChromaDB unreachable
- **WHEN** `/health` is called and ChromaDB is not accessible
- **THEN** it returns 503 with `{"status": "degraded", "chromadb": "disconnected"}`

### Requirement: Environment-based configuration
The Python service SHALL be configured via environment variables including: `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `EMBEDDING_MODEL`, `EMBEDDING_API_KEY`, `CHROMA_PATH`, `BRAVE_SEARCH_API_KEY`, `OFFICIAL_SEARCH_DOMAINS`, `FRONTEND_URL`, and `AI_SERVICE_URL` (for the Next.js proxy). No secrets SHALL be hardcoded.

#### Scenario: Missing required environment variable at startup
- **WHEN** the Python service starts without a required environment variable (e.g. `LLM_API_KEY`)
- **THEN** the service fails fast with a clear error message naming the missing variable, rather than failing at first request

#### Scenario: Next.js proxy configured with AI service URL
- **WHEN** the `AI_SERVICE_URL` environment variable is set on the Next.js app
- **THEN** `/api/chat/route.ts` forwards requests to that URL; if unset, it falls back to a legacy direct-LLM path (during migration) or returns a configuration error
