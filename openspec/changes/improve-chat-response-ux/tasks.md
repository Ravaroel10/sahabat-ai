## 1. Backend: Remove intent_classification from metadata stream

- [x] 1.1 Modify `ai-service/api/chat.py` to remove `intent_classification` from metadata dict before SSE emission
- [x] 1.2 Add assertion/log to verify intent_classification is not in final SSE payload
- [x] 1.3 Test chat endpoint with curl/Postman to confirm intent_classification is absent in metadata event
- [x] 1.4 Verify existing program filtering logic (filter_programs_by_intent, apply_intent_to_metadata) still works

## 2. Backend: Generate contextual next_steps

- [x] 2.1 Create `build_contextual_next_steps()` function in `ai-service/api/chat.py` that takes programs, emergency, user_situation as input
- [x] 2.2 Implement heuristics: eligible program → "Ajukan [program]", partial → "Lengkapi informasi", emergency → "Hubungi 119"
- [x] 2.3 Call `build_contextual_next_steps()` after program filtering and include result in metadata
- [ ] 2.4 Test next_steps generation with different scenarios (eligible, partial, emergency, multiple programs)

## 3. Frontend: Update Next.js proxy to handle next_steps

- [x] 3.1 Verify `src/app/api/chat/route.ts` already forwards next_steps from metadata (check existing code for data-steps handling)
- [ ] 3.2 If not present, add forwarding logic to emit `data-steps` event with next_steps array
- [ ] 3.3 Test proxy with mock SSE stream containing next_steps metadata

## 4. Frontend: Create collapsible program card component

- [x] 4.1 Install Radix UI Collapsible if not already present (`npm install @radix-ui/react-collapsible`)
- [x] 4.2 Create `CollapsibleProgramCard` component in `src/components/unified-chat/message-parts.tsx` wrapping existing ProgramCard internals
- [x] 4.3 Add collapsed state: show program name, category badge, eligibility indicator, and expand chevron
- [x] 4.4 Add expanded state: show full program details (benefits, requirements, gap analysis, actions)
- [x] 4.5 Add visual cue label "Berikut detail program, klik untuk melihat lebih lanjut" above collapsed card
- [x] 4.6 Add smooth transition animation (200-300ms) for expand/collapse

## 5. Frontend: Update ProgramCardRenderer to use collapsible component

- [x] 5.1 Modify `ProgramCardRenderer` in `src/components/unified-chat/message-parts.tsx` to use `CollapsibleProgramCard` instead of plain `ProgramCard`
- [x] 5.2 Pass program data and eligibility props to CollapsibleProgramCard
- [ ] 5.3 Test rendering of program cards in chat messages (should appear collapsed by default)

## 6. Frontend: Update NextStepsRenderer for contextual display

- [x] 6.1 Modify `NextStepsRenderer` in `src/components/unified-chat/message-parts.tsx` to handle new next_steps format (array of {text, action, target})
- [x] 6.2 Render numbered list with conditional styling (buttons for "apply" actions, links for "view" actions)
- [x] 6.3 Add "Langkah Selanjutnya" section heading
- [ ] 6.4 Test rendering with different next_steps scenarios (eligible, partial, emergency)

## 7. Testing and verification

- [ ] 7.1 Test end-to-end: send chat message, verify intent_classification is NOT in browser network tab
- [ ] 7.2 Test program cards: verify collapsed by default, expand on click, show correct details
- [ ] 7.3 Test next_steps: verify contextual steps appear for eligible/partial/emergency scenarios
- [ ] 7.4 Test mobile responsiveness: verify collapsible cards work on mobile, transitions are smooth
- [ ] 7.5 Test accessibility: verify keyboard navigation works for collapsible cards (Enter/Space to toggle)

## 8. Documentation and cleanup

- [x] 8.1 Update relevant code comments to reflect new behavior (remove references to intent_classification exposure)
- [x] 8.2 Add JSDoc comments to `build_contextual_next_steps()` function
- [x] 8.3 Update SMART_CONTEXT_AWARE_FEATURES.md or UX_IMPROVEMENTS_APPLIED.md with this change
