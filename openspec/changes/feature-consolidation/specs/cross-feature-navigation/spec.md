## ADDED Requirements

### Requirement: AI chat to marketplace navigation
The system SHALL enable seamless navigation from AI chat conversations to the Rights Marketplace when relevant programs are identified.

#### Scenario: Program suggestion with link
- **WHEN** AI identifies eligible programs during conversation
- **THEN** system displays "Lihat 3 program yang cocok di Marketplace" button with direct link

#### Scenario: Pre-filtered marketplace navigation
- **WHEN** user clicks marketplace link from chat
- **THEN** marketplace opens with filters pre-populated from chat context (income, location, etc.)

### Requirement: AI chat to Auto-Birokrasi navigation
The system SHALL allow users to transition from chat conversation to document generation for identified programs.

#### Scenario: Document automation offer
- **WHEN** AI identifies user needs to apply for a program
- **THEN** system offers "Saya bisa buatkan surat permohonan" with Auto-Birokrasi link

#### Scenario: Context transfer to document generator
- **WHEN** user accepts document generation offer
- **THEN** Auto-Birokrasi opens with user information and program details from chat pre-filled

### Requirement: Marketplace to Auto-Birokrasi navigation
The system SHALL provide direct "next step" navigation from marketplace program details to document generation.

#### Scenario: Application initiation
- **WHEN** user views eligible program in marketplace
- **THEN** program detail shows "Ajukan Sekarang" button leading to Auto-Birokrasi

#### Scenario: Document requirements preview
- **WHEN** user hovers over "Ajukan Sekarang"
- **THEN** system shows tooltip listing which documents will be generated

### Requirement: Auto-Birokrasi to chat navigation
The system SHALL allow users to get AI assistance while completing document generation if they have questions.

#### Scenario: Question during document generation
- **WHEN** user is confused about a field in Auto-Birokrasi
- **THEN** system shows "Tanya AI" button opening chat in sidebar or modal

#### Scenario: Context-aware chat assistance
- **WHEN** user opens chat from Auto-Birokrasi
- **THEN** AI is aware of current program and document being completed

### Requirement: Navigation state preservation
The system SHALL preserve user context and progress when navigating between features.

#### Scenario: Chat history preservation
- **WHEN** user navigates to marketplace then returns to chat
- **THEN** conversation history and context are maintained

#### Scenario: Filter state preservation
- **WHEN** user applies marketplace filters, opens chat, returns to marketplace
- **THEN** previously applied filters remain active

#### Scenario: Draft document preservation
- **WHEN** user starts document in Auto-Birokrasi, navigates away, returns
- **THEN** document draft is preserved with all entered information

### Requirement: Contextual navigation suggestions
The system SHALL intelligently suggest feature transitions based on user's current activity and identified needs.

#### Scenario: Chat detects application readiness
- **WHEN** AI determines user has all information needed to apply
- **THEN** system proactively suggests "Siap mengajukan? Mari kita buat dokumennya"

#### Scenario: Marketplace suggests verification
- **WHEN** user views multiple programs but hasn't used filters
- **THEN** system suggests "Gunakan filter untuk melihat program yang sesuai dengan situasi Anda"

### Requirement: Mobile-optimized cross-feature navigation
The system SHALL ensure feature-to-feature navigation works seamlessly on mobile devices without losing context.

#### Scenario: Modal-based transitions on mobile
- **WHEN** user on mobile clicks chat-to-marketplace link
- **THEN** marketplace opens in optimized view with back button returning to chat

#### Scenario: Bottom sheet navigation on mobile
- **WHEN** mobile user needs quick access to another feature
- **THEN** system uses bottom sheet pattern for quick transitions without full page change

### Requirement: Navigation analytics and optimization
The system SHALL track cross-feature navigation patterns to identify and improve common user journeys.

#### Scenario: Journey completion tracking
- **WHEN** user completes chat → marketplace → auto-birokrasi journey
- **THEN** system records successful journey completion

#### Scenario: Drop-off identification
- **WHEN** users frequently navigate between features but don't complete actions
- **THEN** system identifies friction points for improvement
