## ADDED Requirements

### Requirement: ChromaDB-backed vector store with embeddings
The system SHALL use ChromaDB as the vector database, accessed via an embedded `PersistentClient` with a configurable persistent storage path. Documents SHALL be stored as embeddings computed by a pluggable embedding function. The embedding function SHALL be encapsulated behind a service module so it can be replaced without affecting retrieval logic.

#### Scenario: Persistent storage across restarts
- **WHEN** the Python service is restarted after documents have been ingested
- **THEN** the ChromaDB collection and all previously ingested documents are available without re-ingestion

#### Scenario: Swappable embedding function
- **WHEN** the `EMBEDDING_MODEL` configuration is changed from OpenAI to sentence-transformers
- **THEN** new documents are embedded with the new model without changes to the retrieval code, and a re-ingest is required to update existing vectors

### Requirement: Document ingest pipeline for existing corpora
The system SHALL provide an idempotent ingest script that reads the three existing JSON corpora (`social-programs.json`, `institutions.json`, `document-templates.json`) from the Next.js `src/data/` directory, chunks each record into text segments, embeds them, and stores them in ChromaDB with metadata (source corpus, record id, record type, legal basis where applicable).

#### Scenario: Ingest social programs
- **WHEN** the ingest script is run against `social-programs.json`
- **THEN** each program record is chunked, embedded, and stored in ChromaDB with metadata including program id, acronym, legal basis, and source="programs"

#### Scenario: Idempotent re-ingest
- **WHEN** the ingest script is run twice without changes to the source JSON
- **THEN** the second run does not create duplicate documents (existing ids are upserted/overwritten)

### Requirement: Similarity search returns relevant chunks with scores
The RAG tool (`search_rag(query)`) SHALL accept a query string, embed it, and perform a similarity search against the ChromaDB collection, returning the top-k most relevant document chunks with their similarity scores and metadata. The orchestrator uses these results as LLM context.

#### Scenario: Relevant results found
- **WHEN** `search_rag` is called with a query matching ingested program content (e.g. "bantuan untuk ibu hamil")
- **THEN** the function returns up to k=5 chunks with scores above the relevance threshold, including metadata (program name, legal basis)

#### Scenario: No relevant results
- **WHEN** `search_rag` is called with a query that has no matching content in the collection (all scores below threshold)
- **THEN** the function returns an empty result set, signaling the orchestrator to fall back to web search

### Requirement: ChromaDB service encapsulation
ChromaDB access SHALL be encapsulated behind a `database/chroma.py` service module exposing collection management, document ingestion, and query operations. No other module SHALL import `chromadb` directly. This enables replacing ChromaDB with another vector store without affecting the rest of the application.

#### Scenario: Replace ChromaDB with another vector store
- **WHEN** the vector store is changed from ChromaDB to an alternative (e.g. pgvector)
- **THEN** only `database/chroma.py` (or its replacement) needs modification — `tools/rag.py`, the orchestrator, and all other modules remain unchanged

### Requirement: LangChain primitives for chunking and documents
The system SHALL use LangChain's `Document` objects and `RecursiveCharacterTextSplitter` for document representation and chunking during ingest. The system SHALL NOT use LangChain Agents, Chains, Memory, or complex Runnable pipelines.

#### Scenario: Chunking a program record
- **WHEN** a program record's text content is chunked during ingest
- **THEN** LangChain's `RecursiveCharacterTextSplitter` is used with configurable chunk size and overlap, producing `Document` objects with metadata preserved
