# Requirements Document

## Introduction

BantuArah is a social assistance platform helping Indonesian citizens discover and apply for government benefit programs. This feature enhancement addresses usability issues identified through user feedback, focusing on improving the marketplace eligibility search experience, content localization and tone, chat input sizing, and document template flexibility.

These improvements directly support the product's core mission of reducing barriers between citizens and government programs by making the interface clearer, more natural, and more flexible to diverse user needs.

## Glossary

- **Marketplace**: The program discovery page where users browse social assistance programs and filter by eligibility criteria
- **Eligibility_Filter**: The sidebar component allowing users to input personal criteria to find matching programs
- **Chat_Interface**: The unified AI chat component used throughout the application for conversational assistance
- **Input_Area**: The text input field where users type messages to the AI assistant
- **Auto_Birokrasi**: The document generation feature that helps users create required application documents
- **Document_Template**: Pre-defined PDF or text templates used to generate application documents
- **User**: Indonesian citizens seeking social assistance programs
- **Modal**: An overlay dialog that appears on top of the current page
- **UX**: User experience - how users interact with and perceive the application

## Requirements

### Requirement 1: Improved Eligibility Search Access

**User Story:** As a User, I want better access to eligibility filtering options, so that I can quickly find programs that match my situation without feeling overwhelmed.

#### Acceptance Criteria

1. THE Marketplace SHALL provide at least two access patterns for eligibility filtering (sidebar and alternative view)
2. WHEN a User accesses the Marketplace, THE Eligibility_Filter SHALL be visible without requiring additional interaction
3. THE alternative access pattern (modal or dedicated page) SHALL display identical filter functionality to the sidebar
4. WHEN a User interacts with filters in any access pattern, THE filter state SHALL persist across pattern switches
5. THE Eligibility_Filter SHALL maintain URL parameter synchronization regardless of access pattern used
6. WHEN a User submits filter criteria, THE Marketplace SHALL update the program list within 500ms
7. THE Marketplace SHALL provide visual affordances indicating which access pattern is currently active

### Requirement 2: Natural Indonesian Language and Tone

**User Story:** As a User, I want content that feels natural and conversational in Indonesian, so that I feel comfortable and understood when using the platform.

#### Acceptance Criteria

1. THE System SHALL use pure Indonesian language without mixing English terms in user-facing content
2. WHEN generating or displaying text content, THE System SHALL use informal conversational tone appropriate for peer-to-peer communication
3. THE System SHALL avoid formal bureaucratic language patterns (overly formal pronouns, rigid sentence structures)
4. THE System SHALL avoid AI-generated language patterns (overly enthusiastic tone, unnatural phrasing, robotic transitions)
5. THE Chat_Interface SHALL use natural Indonesian conversation patterns that match how Indonesians actually speak
6. THE Marketplace SHALL use colloquial Indonesian terms for benefits and programs where appropriate
7. THE Auto_Birokrasi interface SHALL balance conversational guidance with necessary formal document generation
8. WHEN displaying error messages, THE System SHALL use empathetic and clear Indonesian without technical jargon
9. THE System SHALL use active voice and direct address (kamu/Anda) consistently based on defined brand voice guidelines

### Requirement 3: Optimized Chat Input Height

**User Story:** As a User, I want the chat input area to be appropriately sized, so that I can see more conversation history and don't feel like the input dominates the screen.

#### Acceptance Criteria

1. THE Chat_Interface input field SHALL have a height no greater than 60 pixels in its default state
2. THE Input_Area SHALL support multi-line text entry with automatic expansion up to 120 pixels maximum height
3. WHEN a User types text exceeding the Input_Area visible space, THE Input_Area SHALL scroll internally rather than expanding further
4. THE Chat_Interface SHALL allocate at least 70% of vertical space to message history display
5. THE Input_Area height SHALL remain consistent across different screen sizes (mobile, tablet, desktop)
6. WHEN the Input_Area is empty, THE placeholder text SHALL be fully visible without truncation
7. THE Send button SHALL remain vertically centered relative to the Input_Area regardless of text content

### Requirement 4: Custom PDF Template Upload

**User Story:** As a User, I want to upload my own PDF templates for document generation, so that I can use specific formats required by my local government office.

#### Acceptance Criteria

1. THE Auto_Birokrasi SHALL provide an interface for uploading custom PDF templates
2. WHEN a User uploads a PDF file, THE System SHALL validate that the file is a valid PDF format
3. THE System SHALL reject files larger than 5MB with a clear error message
4. WHEN a User uploads a PDF template, THE System SHALL extract text fields and form elements from the PDF
5. THE Auto_Birokrasi SHALL display extracted fields from custom PDFs alongside standard template fields
6. THE System SHALL store uploaded PDF templates associated with the User's session or account
7. WHEN generating documents, THE System SHALL allow Users to select between built-in templates and uploaded custom templates
8. THE System SHALL preserve the original PDF formatting and layout when filling in custom templates
9. WHEN a User uploads a PDF without fillable form fields, THE System SHALL provide guidance on creating fillable PDFs or alternative approaches
10. THE Auto_Birokrasi SHALL allow Users to delete their uploaded custom templates

## Special Requirements Guidance

### Content Localization Parser and Generator

This requirement involves parsing existing content strings throughout the application and regenerating them with improved Indonesian language quality. This is a transformation task requiring systematic content review and rewriting.

**Content Transformation Requirements**:
```markdown
### Requirement 5: Content Localization System

**User Story:** As a developer, I want a systematic approach to identify and update all user-facing text, so that language improvements are consistent across the entire application.

#### Acceptance Criteria

1. THE System SHALL provide a content audit mechanism to identify all user-facing text strings
2. WHEN auditing content, THE System SHALL classify strings as: UI labels, messages, instructions, or AI-generated responses
3. THE System SHALL generate a content transformation report showing original and improved Indonesian versions
4. THE Content_Transformer SHALL apply natural Indonesian language rules to all identified strings
5. THE Content_Transformer SHALL remove English word mixing and replace with Indonesian equivalents
6. WHEN transforming formal language, THE Content_Transformer SHALL convert to conversational equivalents
7. THE Content_Transformer SHALL identify and flag AI-pattern language for manual review
8. THE System SHALL validate that transformed content maintains semantic meaning of original text
9. THE System SHALL preserve technical terms and proper nouns (program names, legal references) that should not be translated
```

**Implementation Note**: This requirement benefits from a code transformation tool or script that can scan React components, identify text content, and propose replacements. The round-trip property (audit → transform → validate semantic equivalence) ensures content quality is maintained.
