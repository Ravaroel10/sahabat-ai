## ADDED Requirements

### Requirement: Next steps MUST be contextual to user situation and mentioned programs
The system SHALL generate next steps that are specific to the user's situation, mentioned programs, and current conversation context, instead of generic steps like "Siapkan Dokumen Otomatis" and "Lihat semua program".

#### Scenario: Next steps for eligible program mention
- **WHEN** AI mentions a program where user is eligible
- **THEN** next steps SHALL include program-specific actions like "Ajukan [Program Name]", "Siapkan dokumen: KTP, KK, Surat Keterangan Penghasilan"
- **AND** steps SHALL reference the specific program by name

#### Scenario: Next steps for multiple programs
- **WHEN** AI mentions multiple programs in response
- **THEN** next steps SHALL be ordered by eligibility (eligible first, then partial, then ineligible)
- **AND** each step SHALL clearly indicate which program it relates to

#### Scenario: Next steps for information gathering
- **WHEN** user situation is unclear or missing key information
- **THEN** next steps SHALL guide user to provide specific missing fields (e.g., "Berapa penghasilan bulanan Anda?", "Apakah Anda memiliki anak?")
- **AND** steps SHALL explain why this information is needed

### Requirement: Next steps MUST be actionable and specific
Each next step SHALL be a concrete, actionable instruction that the user can immediately act upon, not vague suggestions.

#### Scenario: Steps include specific document names
- **WHEN** next step involves document preparation
- **THEN** it SHALL list exact document names required (e.g., "KTP", "Kartu Keluarga", "Surat Keterangan Tidak Mampu")
- **AND** it SHALL NOT use generic phrases like "dokumen persyaratan"

#### Scenario: Steps include navigation targets
- **WHEN** next step involves viewing more details
- **THEN** it SHALL include navigation target (e.g., "Lihat detail Program PKH", not "Lihat semua program")
- **AND** it SHALL be clickable/linkable if possible

#### Scenario: Steps prioritize immediate actions
- **WHEN** system generates multiple next steps
- **THEN** most immediate/important action SHALL be listed first
- **AND** secondary or future actions SHALL be listed after

### Requirement: Backend LLM service MUST generate contextual next steps
The Python LLM service SHALL analyze the conversation context, mentioned programs, user eligibility, and generate contextual next steps as part of the metadata response.

#### Scenario: LLM includes next_steps in metadata
- **WHEN** LLM generates a response mentioning programs or requiring user action
- **THEN** metadata SHALL include a `next_steps` array with 2-4 specific steps
- **AND** each step SHALL be a dict with fields: `text` (step description), `action` (optional action type), `target` (optional navigation/program ID)

#### Scenario: Next steps reflect program eligibility
- **WHEN** LLM mentions an eligible program
- **THEN** next_steps SHALL include application action for that program
- **WHEN** LLM mentions partial-match program
- **THEN** next_steps SHALL include information gathering steps for missing fields

#### Scenario: Emergency situations bypass generic steps
- **WHEN** emergency is detected (emergency flag is true)
- **THEN** next_steps SHALL focus on immediate safety actions (e.g., "Hubungi 119", "Pergi ke UGD terdekat")
- **AND** SHALL NOT include generic program browsing steps

### Requirement: Frontend MUST render next steps with clear visual hierarchy
The frontend NextStepsRenderer component SHALL display next steps in a clear, scannable list with visual emphasis on priority.

#### Scenario: Next steps appear after program cards
- **WHEN** chat message includes both program cards and next steps
- **THEN** next steps SHALL render after program cards
- **AND** SHALL be visually distinct (e.g., in a card or section with heading "Langkah Selanjutnya")

#### Scenario: Steps are numbered and scannable
- **WHEN** next steps are rendered
- **THEN** each step SHALL be numbered (1, 2, 3, etc.)
- **AND** SHALL use clear typography for easy scanning
- **AND** action-related steps SHALL have button/link styling if interactive

#### Scenario: Empty or missing next_steps gracefully handled
- **WHEN** metadata does not include next_steps or array is empty
- **THEN** NextStepsRenderer SHALL not render anything
- **AND** no error or placeholder SHALL be shown
