## ADDED Requirements

### Requirement: Orchestrator receives chat request and routes deterministically
The orchestrator SHALL accept a chat request containing a user message, optional conversation history, and optional user context. It SHALL route the request through a deterministic, single-pass flow: RAG retrieval → (fallback web search if RAG is empty) → exactly one LLM generation call → response with answer, citations, sources, and emergency flag.

#### Scenario: Normal chat with RAG context
- **WHEN** a user sends a message about a social assistance program and the RAG knowledge base returns relevant documents
- **THEN** the orchestrator uses the retrieved RAG context to build the LLM prompt, makes exactly one LLM generation call, and returns an answer with citations derived from the retrieved documents

#### Scenario: Chat with no RAG context triggers web fallback
- **WHEN** a user sends a message and the RAG knowledge base returns no relevant documents (score below threshold)
- **THEN** the orchestrator invokes the official web-search tool, uses the web-search results as context, makes exactly one LLM generation call, and returns an answer with sources marked as web URLs (not regulation citations)

#### Scenario: Chat request with conversation history
- **WHEN** the request includes a non-empty `conversation` array of prior messages
- **THEN** the orchestrator includes the prior conversation as context for the single LLM call to maintain conversational continuity

#### Scenario: Chat request with user context
- **WHEN** the request includes a `user_context` object (e.g. income, family size, location)
- **THEN** the orchestrator incorporates the user context into the LLM prompt to tailor the answer to the user's situation

### Requirement: Orchestrator makes exactly one LLM generation call per request
The orchestrator SHALL make exactly one final LLM generation call per request. It SHALL NOT perform repeated LLM reasoning steps between routing stages. Deterministic logic (RAG search, web search, escalation detection, eligibility calculation) SHALL be performed without LLM calls.

#### Scenario: Single LLM call for a complex query
- **WHEN** a user sends a complex query requiring both program lookup and eligibility assessment
- **THEN** the orchestrator performs program lookup (RAG) and eligibility calculation (deterministic tool) without LLM calls, then makes a single LLM call that incorporates both results into the final answer

### Requirement: LLM provider is swappable behind an abstraction
The system SHALL expose a single `LLMService.generate(...)` interface for LLM calls. The orchestrator and tools SHALL NOT import or use any LLM provider SDK directly. The provider (Google Gemini, OpenAI, etc.) SHALL be configurable via environment variable without code changes outside the LLM service module.

#### Scenario: Switch from Gemini to OpenAI
- **WHEN** the `LLM_PROVIDER` environment variable is changed from `gemini` to `openai` and the service is restarted
- **THEN** all LLM generation calls use OpenAI instead of Gemini, with no changes to the orchestrator or tool code

#### Scenario: Unknown provider configuration
- **WHEN** the `LLM_PROVIDER` environment variable is set to an unsupported value
- **THEN** the service fails fast at startup with a clear error message identifying the invalid provider

### Requirement: Orchestrator returns structured response with citations and metadata
The orchestrator SHALL return a response containing: `answer` (string), `citations` (array of regulation references from RAG), `sources` (array of URLs from web fallback, if used), and `emergency` (boolean indicating detected emergency situation).

#### Scenario: Response with RAG citations
- **WHEN** the orchestrator generates an answer using RAG context
- **THEN** the response includes citations as regulation references (e.g. "Permensos No. 1/2024, Pasal 5") derived from the retrieved documents' metadata

#### Scenario: Response with web sources
- **WHEN** the orchestrator generates an answer using web-search fallback context
- **THEN** the response includes sources as URLs and the answer marks web-sourced claims as "berdasarkan informasi dari [URL]" rather than regulation citations

#### Scenario: Emergency detected
- **WHEN** the user's message contains emergency keywords (e.g. "lapar", "kecelakaan", "darurat")
- **THEN** the `emergency` field is set to `true` and the answer prioritizes immediate-action guidance and hotline contacts

### Requirement: Tools are independent and unaware of each other
Each tool (`search_rag`, `search_official_web`, `generate_document`, `search_ngo`) SHALL be an independent module with no imports or references to other tools. The orchestrator SHALL be the only component that calls tools and composes their results.

#### Scenario: Adding a new tool without modifying existing tools
- **WHEN** a new tool (e.g. `check_fact`) is added to the `tools/` directory
- **THEN** no existing tool module requires modification — only the orchestrator is updated to call the new tool

### Requirement: Escalation detection runs as a deterministic tool
The orchestrator SHALL detect emergency situations using a deterministic keyword-matching tool (ported from the existing `escalation.ts` logic) BEFORE the LLM call, not via LLM reasoning. The detection result SHALL inform the LLM prompt (prioritizing emergency guidance) and the `emergency` response field.

#### Scenario: Red-priority emergency detected
- **WHEN** the user message contains red-priority keywords (e.g. "kelaparan", "bunuh diri", "bencana alam")
- **THEN** the escalation tool returns priority "red", the orchestrator injects emergency-response instructions into the LLM prompt, and the response `emergency` field is `true`

#### Scenario: No emergency detected
- **WHEN** the user message contains no emergency keywords
- **THEN** the escalation tool returns priority "green" and the orchestrator proceeds with the normal flow

### Requirement: Content transformation as post-LLM step
The orchestrator SHALL apply content transformation (ported from `content-transformer.ts`) to the LLM's output as a post-processing step: removing English mixing, converting formal bureaucratic language to conversational tone, and removing AI-generated patterns. This SHALL happen after the LLM call and before returning the response.

#### Scenario: Formal language converted to conversational
- **WHEN** the LLM output contains formal phrases like "Silakan Bapak/Ibu mengisi formulir"
- **THEN** the content transformer converts it to conversational Indonesian (e.g. "Isi formulir ini") before the response is returned

### Requirement: Eligibility calculation as an internal orchestrator tool
The orchestrator SHALL use eligibility calculation (ported from the marketplace's `eligibility-calculator.ts` comparison logic) as a deterministic internal tool for composing chat context. It SHALL interpret the same `requirements` data shape that the marketplace's `SocialProgram` type defines. This tool is NOT exposed as an API endpoint — the Next.js marketplace keeps its own local `eligibility-calculator.ts` and computes synchronously. The Python tool exists solely so the orchestrator can factor eligibility into the single LLM generation call.

#### Scenario: Orchestrator uses eligibility for chat context
- **WHEN** a user sends a chat message that includes `user_context` (income, family size, etc.) and the orchestrator retrieves relevant programs from RAG
- **THEN** the internal eligibility tool scores those programs against the user context, and the orchestrator incorporates the eligibility results into the LLM prompt so the answer can mention which programs the user likely qualifies for

#### Scenario: No eligibility endpoint exposed
- **WHEN** an external client attempts to call a `/eligibility` endpoint on the Python service
- **THEN** the service returns 404 (no such endpoint) — eligibility is an internal tool, not a public API
