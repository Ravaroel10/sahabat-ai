## ADDED Requirements

### Requirement: Exa API with government domain whitelist
The official web-search tool (`search_official_web(query)`) SHALL use the Exa API to perform a web search restricted to trusted official Indonesian government domains. The whitelist SHALL include at minimum: `*.go.id`, `kemensos.go.id`, `kemkes.go.id`, `bpjs-kesehatan.go.id`, `bnpb.go.id`, `jdih.go.id`, `satudata.go.id`. The whitelist SHALL be configurable via environment variable or config file.

#### Scenario: Search restricted to government domains
- **WHEN** `search_official_web` is called with a query (e.g. "persyaratan PKH terbaru")
- **THEN** the Exa API is queried with a domain restriction to `*.go.id` (and the configured subdomains), and results from non-government domains are excluded

#### Scenario: Custom domain whitelist via config
- **WHEN** the `OFFICIAL_SEARCH_DOMAINS` environment variable is set to a comma-separated list of domains
- **THEN** the web-search tool restricts results to only those domains, overriding the defaults

### Requirement: Structured search results (not raw HTML)
The web-search tool SHALL return structured results as an array of objects with `title`, `url`, and `snippet` fields. It SHALL NOT return raw HTML or full page content. The orchestrator uses these structured results as LLM context.

#### Scenario: Structured results returned
- **WHEN** the Exa API returns results for a query
- **THEN** the tool maps each result to `{title: string, url: string, snippet: string}` and returns the array, using highlights or text excerpts for snippets, and discarding any raw HTML or metadata not relevant to citation

### Requirement: Fallback only — not used when RAG has relevant context
The web-search tool SHALL only be invoked by the orchestrator when the RAG retrieval returns no relevant documents (empty result set or all scores below threshold). It SHALL NOT be called in parallel with RAG or when RAG succeeds.

#### Scenario: RAG succeeds, web search not called
- **WHEN** the RAG retrieval returns relevant documents for a user query
- **THEN** the orchestrator does not invoke `search_official_web`, and the response citations come from RAG only

#### Scenario: RAG empty, web search invoked
- **WHEN** the RAG retrieval returns no relevant documents
- **THEN** the orchestrator invokes `search_official_web` and uses the results as context for the LLM call

### Requirement: Web-sourced content marked as URLs, not regulation citations
The orchestrator SHALL instruct the LLM (via the system prompt) to distinguish web-sourced claims from regulation citations. When the answer uses web-search context, the LLM SHALL mark claims as "berdasarkan informasi dari [URL]" and include the URLs in the `sources` field of the response, not in `citations`.

#### Scenario: Web fallback answer cites URLs
- **WHEN** the orchestrator generates an answer using web-search fallback context
- **THEN** the response `sources` array contains the URLs of the web results used, and the `citations` array is empty or contains only regulation references (not URLs)

### Requirement: Search result caching with short TTL
The web-search tool SHALL cache results by query hash with a short TTL (configurable, default 5 minutes) to avoid redundant API calls and respect rate limits. Cached results SHALL be returned for identical queries within the TTL.

#### Scenario: Cache hit for repeated query
- **WHEN** `search_official_web` is called with a query identical to one made within the TTL window
- **THEN** the cached result array is returned without calling the Exa API

#### Scenario: Cache miss for new query
- **WHEN** `search_official_web` is called with a query not in the cache or expired
- **THEN** the Exa API is called and the result is cached before returning

### Requirement: Graceful handling of API errors and rate limits
The web-search tool SHALL handle Exa API errors (timeouts, rate limits, invalid responses) gracefully. On failure, it SHALL return an empty result set and log the error, allowing the orchestrator to proceed with an LLM call using only the system prompt (no web context) rather than failing the entire request.

#### Scenario: Exa API rate limit exceeded
- **WHEN** the Exa API returns a rate-limit error (HTTP 429)
- **THEN** the tool logs the error, returns an empty result set, and the orchestrator generates an answer without web context (using only the system prompt and conversation history)
