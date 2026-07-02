## ADDED Requirements

### Requirement: Program cards MUST render below explanatory text with visual cues
Program cards SHALL appear as collapsible/expandable components positioned below the AI's explanatory text, with clear visual indicators that invite user interaction ("Berikut detail program, klik untuk melihat lebih lanjut").

#### Scenario: Program card appears below AI explanation
- **WHEN** AI mentions a program in its text response
- **THEN** the program card SHALL render immediately after the text content
- **AND** a visual cue or label SHALL indicate "Berikut detail program, klik untuk melihat lebih lanjut" or similar

#### Scenario: Program card is initially collapsed
- **WHEN** program card first renders in the chat
- **THEN** it SHALL appear in a collapsed/preview state showing only key information (program name, category, eligibility status)
- **AND** a chevron or expand icon SHALL indicate it can be expanded

#### Scenario: User expands program card
- **WHEN** user clicks on the collapsed program card or expand button
- **THEN** the card SHALL expand to show full details (benefits, requirements, gap analysis, actions)
- **AND** the expand icon SHALL change to indicate collapse action

### Requirement: Program cards MUST provide contextual guidance
Each program card SHALL include guidance text that explains why this program is relevant and what the user should do next, based on their eligibility status.

#### Scenario: Eligible program shows actionable guidance
- **WHEN** program card displays for an eligible program (status='eligible')
- **THEN** it SHALL show "Anda Memenuhi Syarat" indicator
- **AND** it SHALL include guidance like "Anda dapat mengajukan program ini sekarang"
- **AND** primary action button SHALL be "Ajukan Sekarang"

#### Scenario: Partial match program shows verification guidance
- **WHEN** program card displays for partial match (status='partial')
- **THEN** it SHALL show "Perlu Verifikasi Lebih Lanjut" indicator
- **AND** it SHALL list missing information fields
- **AND** guidance SHALL be "Lengkapi informasi berikut untuk verifikasi kelayakan"

#### Scenario: Ineligible program shows gap analysis
- **WHEN** program card displays for ineligible program (status='ineligible')
- **THEN** it SHALL show gap analysis if available
- **AND** guidance SHALL explain why user doesn't qualify
- **AND** it SHALL suggest related programs if possible

### Requirement: Program card SHALL be reusable across contexts
The program card component SHALL be reusable in both chat interface and marketplace page with consistent behavior and styling.

#### Scenario: Program card in chat message
- **WHEN** program card renders within a chat message (via ProgramCardRenderer)
- **THEN** it SHALL use collapsible behavior suitable for inline content
- **AND** it SHALL maintain compact preview state by default

#### Scenario: Program card in marketplace grid
- **WHEN** program card renders in marketplace page grid
- **THEN** it SHALL use the existing ProgramCard component
- **AND** behavior SHALL be consistent with chat variant (expand/collapse works the same way)

### Requirement: Visual hierarchy MUST emphasize interactivity
Program cards SHALL use visual design elements (shadows, borders, hover states, icons) to clearly communicate that they are interactive elements.

#### Scenario: Visual cues indicate interactivity
- **WHEN** program card is rendered in collapsed state
- **THEN** it SHALL have a hover state that changes cursor to pointer
- **AND** it SHALL have a subtle shadow or border to indicate clickability
- **AND** chevron/expand icon SHALL be visible and prominent

#### Scenario: Transition animations enhance UX
- **WHEN** user expands or collapses the program card
- **THEN** transition SHALL be smooth (200-300ms animation)
- **AND** content SHALL not jump or cause layout shift
