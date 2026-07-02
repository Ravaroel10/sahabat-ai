## ADDED Requirements

### Requirement: Integrated marketplace and scanner interface
The system SHALL combine Rights Marketplace and Eligibility Scanner into a single unified interface where scanning functions as advanced filtering.

#### Scenario: Single feature access
- **WHEN** user navigates to rights programs
- **THEN** system displays one unified marketplace interface, not separate marketplace and scanner pages

#### Scenario: Scanner as filter
- **WHEN** user wants to check eligibility
- **THEN** system provides advanced filtering options within the marketplace view

### Requirement: Advanced eligibility filtering
The system SHALL provide filtering controls that assess user eligibility criteria (income, family size, location, employment status) and display matching programs.

#### Scenario: Multi-criteria filter
- **WHEN** user enters income Rp 1.5 juta/month, 3 children, Jakarta location
- **THEN** system filters and displays only programs matching all criteria

#### Scenario: Partial match indication
- **WHEN** user's criteria partially match a program
- **THEN** system shows program with indication of which requirements are not met

#### Scenario: Filter persistence
- **WHEN** user applies filters
- **THEN** system persists filter state across page navigation and browser sessions

### Requirement: Program card display with eligibility indicators
The system SHALL display program cards with clear visual indicators of eligibility status based on applied filters.

#### Scenario: Eligible program display
- **WHEN** user meets all program criteria
- **THEN** program card shows green check indicator with "Anda Memenuhi Syarat"

#### Scenario: Ineligible program display
- **WHEN** user doesn't meet program criteria
- **THEN** program card shows muted appearance with specific unmet requirements listed

#### Scenario: Unknown eligibility
- **WHEN** insufficient filter data to determine eligibility
- **THEN** program card shows neutral state with "Perlu Verifikasi Lebih Lanjut"

### Requirement: Filter input form design
The system SHALL provide an accessible, progressive disclosure form for entering eligibility criteria without overwhelming users.

#### Scenario: Basic criteria first
- **WHEN** user opens filter interface
- **THEN** system shows primary fields (income, family size, location) with option to expand for detailed criteria

#### Scenario: Contextual field display
- **WHEN** user selects employment status "Petani"
- **THEN** system shows agriculture-specific fields (land ownership, crop type)

#### Scenario: Mobile-optimized input
- **WHEN** user accesses filters on mobile
- **THEN** system uses native input types (number pads for income, location picker for area)

### Requirement: Program detail with eligibility breakdown
The system SHALL display detailed program information with specific eligibility requirement checklist based on user's filter data.

#### Scenario: Requirement-by-requirement check
- **WHEN** user views PKH program detail
- **THEN** system shows each requirement (income limit, family composition, etc.) with user's status for each

#### Scenario: Gap identification
- **WHEN** user is close but not eligible
- **THEN** system highlights specific gaps (e.g., "Penghasilan Anda Rp 200rb di atas batas")

### Requirement: Auto-Birokrasi integration from marketplace
The system SHALL provide direct access to document automation for eligible programs from within the marketplace interface.

#### Scenario: Application document generation
- **WHEN** user views eligible program and clicks "Ajukan"
- **THEN** system navigates to Auto-Birokrasi with program context pre-filled

#### Scenario: Required document checklist
- **WHEN** user prepares to apply
- **THEN** system shows which documents can be auto-generated vs. must be obtained manually

### Requirement: Save and compare programs
The system SHALL allow users to save programs of interest and compare eligibility requirements side-by-side.

#### Scenario: Program bookmarking
- **WHEN** user clicks bookmark icon on program card
- **THEN** system saves program to user's saved list

#### Scenario: Comparison view
- **WHEN** user selects 2-3 saved programs and clicks "Bandingkan"
- **THEN** system displays side-by-side comparison of eligibility criteria and benefits

### Requirement: Filter preset templates
The system SHALL provide preset filter templates for common situations to reduce input burden.

#### Scenario: Template selection
- **WHEN** user clicks "Gunakan Template"
- **THEN** system shows options like "Ibu Rumah Tangga dengan Anak", "Pekerja Informal", "Lansia"

#### Scenario: Template application
- **WHEN** user selects "Pekerja Informal" template
- **THEN** system pre-fills relevant criteria with typical values user can adjust
