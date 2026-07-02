## ADDED Requirements

### Requirement: Metadata stream MUST NOT include intent_classification
The chat response metadata stream SHALL NOT include the `intent_classification` field in any metadata events sent to the client. This field is internal to the LLM service and should not be exposed to end users.

#### Scenario: Chat response without intent_classification
- **WHEN** the Python AI service sends metadata event in SSE stream
- **THEN** the metadata SHALL NOT contain an `intent_classification` field
- **AND** the Next.js proxy SHALL forward the metadata without adding intent_classification

#### Scenario: Existing metadata fields are preserved
- **WHEN** the Python AI service sends metadata with citations, sources, emergency, programs, actions, and next_steps
- **THEN** all these fields SHALL be included in the response
- **AND** intent_classification SHALL be absent

### Requirement: Metadata structure MUST be clean and user-facing
The metadata structure sent to the client SHALL contain only fields that are relevant for rendering user-facing UI components. All internal classification or routing fields MUST be removed before streaming to client.

#### Scenario: Metadata contains only renderable fields
- **WHEN** the backend constructs the metadata event
- **THEN** it SHALL include only: citations, sources, emergency, programs, actions, next_steps
- **AND** it SHALL NOT include: intent_classification, confidence_scores, routing_hints, or any other internal fields

#### Scenario: Backward compatibility with existing metadata consumers
- **WHEN** frontend receives metadata event
- **THEN** existing message parts renderers (CitationRenderer, EmergencyAlertRenderer, etc.) SHALL continue to work without modification
- **AND** no breaking changes to the metadata schema SHALL occur (only removal of intent_classification)

### Requirement: Backend SHALL remove intent_classification before streaming
The Python AI service SHALL filter out the intent_classification field before emitting the metadata SSE event to ensure it never reaches the Next.js proxy or client.

#### Scenario: Intent classification filtered in Python service
- **WHEN** LLM service generates response metadata including intent_classification
- **THEN** the streaming handler SHALL remove intent_classification before constructing SSE data
- **AND** the SSE event SHALL emit with type='metadata' containing only client-safe fields

#### Scenario: Next.js proxy receives clean metadata
- **WHEN** Next.js proxy consumes SSE stream from Python service
- **THEN** it SHALL NOT encounter intent_classification in any metadata event
- **AND** it SHALL forward metadata parts (data-citation, data-emergency, etc.) as-is
