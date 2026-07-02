## MODIFIED Requirements

### Requirement: Chat-focused interface without heavy layouts
The system SHALL present a simplified, chat-first interface on /navigator route, removing information panels and complex layouts in favor of conversational interaction.

#### Scenario: Clean chat display
- **WHEN** user visits /navigator
- **THEN** system displays centered chat interface without sidebar panels or card layouts

#### Scenario: Inline guidance instead of panels
- **WHEN** user needs help understanding how to use the feature
- **THEN** system shows example questions inline within empty chat state, not in separate information cards

#### Scenario: Mobile-first layout
- **WHEN** user accesses /navigator on mobile
- **THEN** chat occupies full viewport width without competing layout elements

### Requirement: OpenUI component implementation
The system SHALL use OpenUI library components for the chat interface instead of custom implementations.

#### Scenario: OpenUI chat component usage
- **WHEN** rendering chat interface
- **THEN** system uses OpenUI's Chat component with its accessibility and interaction patterns

#### Scenario: Consistent design tokens
- **WHEN** styling chat elements
- **THEN** system uses OpenUI design tokens for spacing, typography, and colors

### Requirement: Integrated multi-capability responses
The system SHALL provide responses that combine navigation, citation, fact-checking, and escalation within single conversation flow rather than separate feature invocations.

#### Scenario: Unified response with citations
- **WHEN** user asks about PKH eligibility
- **THEN** AI response includes eligibility info, regulation citations, and fact-checked data in one message

#### Scenario: Emergency escalation within conversation
- **WHEN** emergency situation detected during navigation conversation
- **THEN** system offers escalation options inline without redirecting to separate feature

## ADDED Requirements

### Requirement: Removal of sidebar information panels
The system SHALL remove the current sidebar cards (Informasi yang Bisa Dipercaya, Contoh Pertanyaan, Penting) from the /navigator page layout.

#### Scenario: No sidebar on desktop
- **WHEN** user views /navigator on desktop screen
- **THEN** system shows only chat interface, no information sidebar

#### Scenario: No separate card components
- **WHEN** page renders
- **THEN** CardHeader, CardContent components for sidebar information are not rendered

### Requirement: Example prompts within chat
The system SHALL display example questions within the chat input area or empty state, not in separate UI panels.

#### Scenario: Empty chat state examples
- **WHEN** chat history is empty
- **THEN** system displays 3-4 example prompts as clickable chips above input field

#### Scenario: Example prompt selection
- **WHEN** user clicks example prompt
- **THEN** system populates input field and submits query automatically
