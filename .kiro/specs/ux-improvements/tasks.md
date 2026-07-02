# Implementation Plan: UX Improvements

## Overview

This feature enhances the BantuArah platform through four targeted improvements:
1. **Improved Eligibility Search Access** - Add modal access pattern alongside existing sidebar
2. **Natural Indonesian Language** - Transform content to natural, conversational Indonesian
3. **Optimized Chat Input Height** - Reduce input area size and improve message history visibility
4. **Custom PDF Template Upload** - Enable users to upload and use custom PDF templates

The implementation uses TypeScript/React with Next.js, shadcn/ui components, and pdf-lib for PDF processing.

## Tasks

- [ ] 1. Set up PDF processing infrastructure and dependencies
  - Install pdf-lib dependency (`npm install pdf-lib`)
  - Create `src/lib/pdf-processing` directory structure
  - Set up TypeScript types for PDF processing
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 2. Implement PDF field extraction utilities
  - [x] 2.1 Create PDF form field extractor module
    - Implement `extractPdfFormFields()` function using pdf-lib
    - Implement `hasFormFields()` validation function
    - Handle AcroForm field types (text, checkbox, radio, dropdown, signature)
    - Add error handling for corrupted or invalid PDFs
    - _Requirements: 4.4, 4.5_
  
  - [x] 2.2 Create PDF template filler module
    - Implement `fillPdfTemplate()` function to populate form fields
    - Preserve original PDF formatting and layout
    - Handle missing field mappings gracefully
    - _Requirements: 4.7, 4.8_
  
  - [ ]* 2.3 Write unit tests for PDF processing
    - Test valid PDF with AcroForm fields
    - Test PDF without form fields
    - Test file size validation (>5MB rejection)
    - Test invalid file types
    - Test corrupted PDF handling
    - _Requirements: 4.2, 4.3, 4.9_

- [ ] 3. Build PDF uploader component
  - [ ] 3.1 Create PdfUploader component with drag-and-drop
    - Implement file picker and drag-drop zone UI
    - Add file type validation (PDF only)
    - Add file size validation (5MB maximum)
    - Show upload progress indicator
    - Display clear error messages in Indonesian
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 3.2 Integrate PDF field extraction in uploader
    - Call `extractPdfFormFields()` after successful upload
    - Display extracted fields preview before confirmation
    - Show guidance message for PDFs without fillable fields
    - Handle extraction errors with user-friendly messages
    - _Requirements: 4.4, 4.5, 4.9_
  
  - [ ]* 3.3 Add accessibility features to PDF uploader
    - Ensure keyboard-accessible file picker fallback
    - Add ARIA labels and descriptions
    - Implement screen reader announcements for upload status
    - Add error announcements with role="alert"
    - _Requirements: 4.1_

- [ ] 4. Checkpoint - Verify PDF upload and extraction works
  - Test uploading various PDF formats
  - Ensure all tests pass
  - Ask user if questions arise about PDF processing

- [ ] 5. Implement custom template storage and selection
  - [ ] 5.1 Create CustomPdfTemplate data type and interfaces
    - Define `CustomPdfTemplate` and `PdfFormField` TypeScript interfaces
    - Create session-based storage in UserContext
    - Implement template ID generation (UUID)
    - _Requirements: 4.6_
  
  - [ ] 5.2 Build template selector component
    - Modify existing `template-selector.tsx` to support custom templates
    - Display both built-in and uploaded templates
    - Add template delete functionality
    - Show template metadata (name, upload date, field count)
    - _Requirements: 4.6, 4.7, 4.10_
  
  - [ ] 5.3 Integrate template filler in document generation flow
    - Connect template selector to PDF filler module
    - Map user data to PDF form fields
    - Generate filled PDF with preserved formatting
    - Handle download of completed document
    - _Requirements: 4.7, 4.8_

- [ ] 6. Create eligibility filter modal component
  - [x] 6.1 Build EligibilityFilterModal wrapper component
    - Use shadcn/ui Dialog component for accessibility
    - Implement modal open/close state management
    - Add modal trigger button with Filter icon
    - Render EligibilityFilter component inside Dialog
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 6.2 Ensure filter state synchronization
    - Share filter state between sidebar and modal via UserContext
    - Persist filter state when switching between access patterns
    - Maintain URL parameter synchronization
    - Test filter changes in modal reflect in sidebar and vice versa
    - _Requirements: 1.3, 1.4, 1.5_
  
  - [ ] 6.3 Add accessibility features to modal
    - Implement focus trap when modal is open
    - Ensure Escape key closes modal
    - Return focus to trigger button on close
    - Add proper ARIA attributes (aria-modal, aria-labelledby, aria-describedby)
    - _Requirements: 1.7_
  
  - [ ]* 6.4 Add responsive styling for modal
    - Full-screen on mobile devices
    - Centered dialog on desktop with max-width constraint
    - Ensure modal content scrolls if too tall
    - _Requirements: 1.1, 1.2_

- [ ] 7. Integrate modal into marketplace page
  - Add modal trigger button to marketplace header/toolbar
  - Provide visual affordances indicating active access pattern
  - Ensure both sidebar and modal are available simultaneously
  - Verify filter updates complete within 500ms performance budget
  - _Requirements: 1.1, 1.2, 1.6, 1.7_

- [ ] 8. Checkpoint - Test dual access patterns for filters
  - Verify sidebar and modal show identical filter functionality
  - Test state persistence across pattern switches
  - Check URL parameters sync correctly
  - Ensure performance budget met (<500ms)
  - Ask user if questions arise

- [ ] 9. Optimize chat input component height
  - [ ] 9.1 Replace Input with Textarea in UnifiedChatInterface
    - Replace `Input` component with `Textarea` in `unified-chat-interface.tsx`
    - Set `min-h-[48px]` for default state (≤60px requirement)
    - Set `max-h-[120px]` for maximum expansion
    - Add `overflow-y-auto` for internal scrolling
    - Set `resize-none` to prevent manual resizing
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 9.2 Implement auto-resize functionality
    - Create `handleAutoResize` function to adjust height based on content
    - Auto-expand up to 120px maximum as user types
    - Internal scroll when content exceeds max height
    - Reset height when input is cleared
    - _Requirements: 3.2, 3.3_
  
  - [ ] 9.3 Ensure message history visibility
    - Verify message history container uses `flex-1` to consume remaining space
    - Ensure at least 70% vertical space allocated to message history
    - Test layout proportions on mobile, tablet, and desktop
    - Keep Send button vertically centered relative to input
    - _Requirements: 3.4, 3.5, 3.7_
  
  - [ ]* 9.4 Test chat input accessibility
    - Ensure Textarea has descriptive aria-label
    - Verify Send button has clear label
    - Test screen reader behavior with auto-resize
    - Verify placeholder text fully visible when empty
    - _Requirements: 3.6_

- [x] 10. Create content transformation system
  - [x] 10.1 Build content transformation utilities
    - Create `src/lib/content-transformer.ts` module
    - Implement `removeEnglishMixing()` function
    - Implement `convertToConversational()` function
    - Implement `removeAiPatterns()` function
    - Implement main `transformContent()` pipeline
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 10.2 Create Indonesian content mappings
    - Create `src/data/content-mappings.ts` file
    - Define `ENGLISH_TO_INDONESIAN` mapping object
    - Define `FORMAL_TO_CONVERSATIONAL` mapping object
    - Define `AI_PATTERNS_TO_REMOVE` regex patterns
    - Include technical terms whitelist (program names like PKH, BPNT)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 10.3 Write unit tests for content transformation
    - Test English mixing removal
    - Test formal to conversational conversion
    - Test AI pattern removal (Yuk!, multiple !!!, robotic transitions)
    - Test technical term preservation
    - Test empty string handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 11. Audit and transform application content
  - [ ] 11.1 Audit user-facing text across components
    - Scan all `.tsx` files in `src/components` for user-facing text
    - Identify text in marketplace components
    - Identify text in chat interface
    - Identify text in document generation (Auto Birokrasi)
    - Classify strings by category (ui-label, message, instruction, ai-response)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_
  
  - [ ] 11.2 Transform marketplace content
    - Apply transformations to marketplace page text
    - Update eligibility filter labels and placeholders
    - Update program card content
    - Update filter preset names and descriptions
    - Ensure colloquial Indonesian terms used appropriately
    - _Requirements: 2.1, 2.2, 2.6_
  
  - [ ] 11.3 Transform chat interface content
    - Update chat placeholders and example prompts
    - Ensure conversational Indonesian in system messages
    - Update error messages with empathetic, clear language
    - Remove any robotic or overly enthusiastic patterns
    - Use consistent direct address (kamu/Anda)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 2.9_
  
  - [ ] 11.4 Transform Auto Birokrasi (document generation) content
    - Update document generation interface guidance text
    - Balance conversational tone with formal document context
    - Ensure natural Indonesian in user instructions
    - Update PDF upload error messages
    - _Requirements: 2.1, 2.2, 2.7, 2.8_
  
  - [ ] 11.5 Verify semantic meaning preserved
    - Review all transformed content for semantic accuracy
    - Ensure no loss of meaning or important information
    - Verify technical terms and program names preserved
    - Flag any ambiguous transformations for manual review
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [ ] 12. Final checkpoint - Comprehensive testing
  - Test all four improvements together
  - Verify modal filter works with transformed Indonesian content
  - Test chat input with new layout and Indonesian placeholders
  - Test PDF upload with Indonesian error messages
  - Ensure all tests pass
  - Ask user if questions arise

- [ ] 13. Integration and polish
  - [ ] 13.1 Verify error message consistency
    - Ensure all error messages use empathetic Indonesian
    - Check PDF upload errors are clear and actionable
    - Verify filter error messages (timeout, invalid values)
    - Test network error handling in all components
    - _Requirements: 2.8_
  
  - [ ] 13.2 Performance validation
    - Measure filter update latency (must be <500ms)
    - Test PDF extraction time for various file sizes
    - Verify chat input auto-resize is smooth
    - Check no layout jank when switching between access patterns
    - _Requirements: 1.6_
  
  - [ ] 13.3 Cross-browser and responsive testing
    - Test modal on mobile, tablet, and desktop viewports
    - Verify chat input layout on different screen sizes
    - Test PDF upload on various browsers
    - Ensure transformed content displays correctly everywhere
    - _Requirements: 1.1, 1.2, 3.5_
  
  - [ ]* 13.4 Accessibility audit
    - Run screen reader testing on modal filter
    - Test keyboard navigation through all new components
    - Verify WCAG 2.1 AA color contrast standards
    - Test focus management in modal
    - Verify all interactive elements have proper labels
    - _Requirements: 1.2, 1.3, 1.7_

## Notes

- Tasks marked with `*` are optional test-related sub-tasks and can be skipped for faster MVP delivery
- Each task references specific requirements from the requirements document for traceability
- The design document uses TypeScript/React, so all implementation will use this stack
- shadcn/ui components (Dialog, Textarea, Button) are already available in the project
- pdf-lib is chosen for PDF processing (open-source, browser-compatible, MIT license)
- Content transformation should preserve official program names (PKH, BPNT, etc.) and technical terms
- Filter performance budget is <500ms for complete update cycle (Requirements 1.6)
- PDF processing may take 2-3 seconds for 5MB files - show loading indicators
- Session-based storage for custom PDF templates in Phase 1 (database storage is future enhancement)
- Manual testing required for visual design validation and Indonesian language quality (requires native speaker)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "10.1"] },
    { "id": 1, "tasks": ["2.1", "10.2", "6.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1", "10.3", "6.2"] },
    { "id": 3, "tasks": ["3.2", "5.1", "6.3", "6.4", "9.1"] },
    { "id": 4, "tasks": ["3.3", "5.2", "7.1", "9.2", "11.1"] },
    { "id": 5, "tasks": ["5.3", "9.3", "11.2"] },
    { "id": 6, "tasks": ["9.4", "11.3", "11.4"] },
    { "id": 7, "tasks": ["11.5", "13.1"] },
    { "id": 8, "tasks": ["13.2", "13.3", "13.4"] }
  ]
}
```
