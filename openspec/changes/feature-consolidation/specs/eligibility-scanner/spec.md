## MODIFIED Requirements

### Requirement: Scanner as marketplace filtering component
The system SHALL integrate eligibility scanning functionality as an advanced filtering mechanism within the unified marketplace, not as a standalone feature.

#### Scenario: Filter-based eligibility check
- **WHEN** user wants to scan eligibility
- **THEN** system provides filter controls within marketplace interface to assess eligibility across all programs

#### Scenario: No separate scanner route
- **WHEN** user navigates application
- **THEN** /scanner route redirects to marketplace or is removed entirely

### Requirement: Real-time eligibility indication on program cards
The system SHALL calculate and display eligibility status directly on marketplace program cards based on active filters.

#### Scenario: Eligible program highlighting
- **WHEN** user's filter criteria match program requirements
- **THEN** program card shows prominent eligibility indicator

#### Scenario: Ineligible program dimming
- **WHEN** user's criteria don't match program
- **THEN** program card appears muted with specific unmet requirements shown

### Requirement: Progressive disclosure of filter criteria
The system SHALL present eligibility criteria input using progressive disclosure to avoid overwhelming users with all questions at once.

#### Scenario: Essential criteria first
- **WHEN** user opens eligibility filter
- **THEN** system shows core criteria (income, family size, location) with "Tambah Detail" option

#### Scenario: Conditional criteria expansion
- **WHEN** user provides basic criteria
- **THEN** system intelligently shows relevant additional criteria based on potential program matches

## ADDED Requirements

### Requirement: Navigation removal from sidebar
The system SHALL remove "Eligibility Scanner" as a separate navigation item since it's now integrated into marketplace.

#### Scenario: Sidebar navigation update
- **WHEN** user views sidebar navigation
- **THEN** "Eligibility Scanner" item is not present, only unified marketplace option

#### Scenario: Deep link handling
- **WHEN** external links point to old /scanner route
- **THEN** system redirects to /marketplace with filter panel expanded

### Requirement: Filter state in URL parameters
The system SHALL persist filter criteria in URL query parameters for shareability and bookmarking.

#### Scenario: URL reflection of filters
- **WHEN** user applies income and location filters
- **THEN** URL updates to /marketplace?income=1500000&location=jakarta

#### Scenario: URL-based filter restoration
- **WHEN** user visits /marketplace with query parameters
- **THEN** system automatically applies specified filters and shows results
