## ADDED Requirements

### Requirement: Single unified chat interface
The system SHALL provide a single chat interface that integrates AI Rights Navigator, Evidence Citation, Fact Checking, and Emergency Escalation capabilities into one conversation flow.

#### Scenario: Multi-capability conversation
- **WHEN** user asks about their rights and requests evidence
- **THEN** system provides rights information with cited sources in the same conversation thread

#### Scenario: Emergency detection
- **WHEN** user describes an urgent situation (e.g., "suami saya jatuh dari perancah")
- **THEN** system detects emergency context and offers escalation options within the chat

### Requirement: Simplified chat-first UI
The system SHALL present a clean, chat-focused interface without heavy layout elements or sidebar information panels on the /navigator route.

#### Scenario: Mobile-first display
- **WHEN** user visits /navigator on mobile device
- **THEN** system displays full-width chat interface with no competing visual elements

#### Scenario: Inline example prompts
- **WHEN** chat is empty or user needs guidance
- **THEN** system displays example questions inline within the chat area, not in separate panels

### Requirement: Evidence citation within responses
The system SHALL automatically include evidence citations and source references within AI responses when providing rights information.

#### Scenario: Cited recommendation
- **WHEN** AI recommends a social assistance program
- **THEN** response includes specific regulation references with article numbers (e.g., "Permensos No. 1/2024, Pasal 3")

#### Scenario: Source transparency
- **WHEN** user receives AI response with program information
- **THEN** system displays which regulations were consulted for the answer

#### Scenario: Regulation formatting
- **WHEN** regulation is cited in response
- **THEN** system formats as "Permensos No. X/YYYY, Pasal Y, Ayat Z" in Indonesian format

### Requirement: Fact checking capability
The system SHALL verify claims and information about social assistance programs against authoritative sources during conversations.

#### Scenario: Misinformation detection
- **WHEN** user mentions incorrect eligibility information (e.g., false income limits)
- **THEN** system corrects the information with official regulation reference

#### Scenario: Verification confirmation
- **WHEN** user asks if information they heard is accurate
- **THEN** system confirms or denies with explanation and regulation sources

### Requirement: Emergency escalation integration
The system SHALL detect emergency situations and provide appropriate escalation options within the chat flow.

#### Scenario: Workplace injury detection
- **WHEN** user describes immediate medical emergency (e.g., construction accident)
- **THEN** system offers emergency contact information and BPJS Ketenagakerjaan guidance

#### Scenario: Critical financial crisis
- **WHEN** user indicates severe immediate need (e.g., no food, eviction threat)
- **THEN** system prioritizes emergency assistance programs and provides immediate action steps

### Requirement: Cross-feature navigation suggestions
The system SHALL suggest relevant features (Rights Marketplace, Auto-Birokrasi) when appropriate during conversations.

#### Scenario: Marketplace suggestion
- **WHEN** AI identifies programs user may qualify for
- **THEN** system suggests "Lihat di Rights Marketplace untuk detail lengkap" with direct link

#### Scenario: Document automation suggestion
- **WHEN** user needs to apply for identified program
- **THEN** system suggests "Saya bisa bantu buatkan surat permohonan" linking to Auto-Birokrasi

### Requirement: OpenUI implementation
The system SHALL use OpenUI patterns and components for the chat interface to ensure modern, accessible interaction patterns.

#### Scenario: Accessible chat controls
- **WHEN** user interacts with chat
- **THEN** all inputs, buttons, and interactive elements follow OpenUI accessibility patterns

#### Scenario: Responsive design
- **WHEN** user accesses chat from various screen sizes
- **THEN** OpenUI components adapt responsively maintaining usability

### Requirement: LLM prompt with multi-capability instructions
The system SHALL configure LLM prompts to handle navigation, citation, fact-checking, and escalation within single conversation context.

#### Scenario: Capability awareness in prompts
- **WHEN** LLM processes user message
- **THEN** system includes instructions for rights navigation, evidence citation requirements, fact-checking procedures, and emergency detection

#### Scenario: Structured response format
- **WHEN** LLM generates response
- **THEN** response follows structured format with citations, confidence levels, and action suggestions where appropriate
