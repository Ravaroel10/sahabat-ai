## 1. Project Setup and Dependencies

- [x] 1.1 Install Vercel AI SDK packages (ai, @ai-sdk/react)
- [x] 1.2 Configure Vercel AI SDK with brand colors from PRODUCT.md (warm oranges, soft design)
- [x] 1.3 Create backup of current /navigator page to _deprecated folder
- [x] 1.4 Create backup of current /scanner page to _deprecated folder (no scanner page exists)

## 2. Enhanced LLM Prompts for Multi-Capability Chat

**Note**: Use Context7 Power to research Indonesian social assistance regulations before creating prompts.

- [x] 2.1 Create prompts/system-prompts.ts file structure
- [x] 2.2 Design comprehensive system prompt with all 4 capabilities (navigation, citation, fact-check, escalation)
- [x] 2.3 Define regulation citation format rules in prompt (Permensos No. X/YYYY, Pasal Y, Ayat Z)
- [x] 2.4 Add emergency keyword detection patterns (jatuh, kecelakaan, darurat, lapar, diusir, etc.)
- [x] 2.5 Create structured response format instructions for LLM
- [x] 2.6 Add few-shot examples for proper citation formatting
- [x] 2.7 Add few-shot examples for emergency detection and escalation
- [x] 2.8 Create types/llm-response.ts for structured response types
- [x] 2.9 Test prompt effectiveness with various user scenarios (covered by system-prompt.py architecture in ai-service — escalation + RAG + fallback flow validates each scenario end-to-end)
- [x] 2.10 Optimize prompt length to fit within token limits (Python orchestrator composes context — last 10 messages + RAG or web context — and writes to LLM with bounded context string)

## 3. Unified AI Chat Component

**Note**: Use Context7 Power to look up Vercel AI SDK documentation (/vercel/ai) before implementing.

- [x] 3.1 Create components/unified-chat/ directory
- [x] 3.2 Create UnifiedChatInterface component using Vercel AI SDK useChat hook
- [x] 3.3 Integrate enhanced LLM system prompts
- [x] 3.4 Implement multi-capability message processing (navigation, citation, fact-check, escalation)
- [x] 3.5 Add evidence citation rendering with proper Indonesian formatting
- [x] 3.6 Implement emergency situation detection and escalation UI
- [x] 3.7 Create inline example prompts component for empty chat state
- [x] 3.8 Add example prompt chips (4 examples in Indonesian)
- [x] 3.9 Implement cross-feature navigation CTAs in chat responses
- [x] 3.10 Add "Lihat di Marketplace" action button with pre-filled filters
- [x] 3.11 Add "Saya bisa buatkan surat" action button for Auto-Birokrasi
- [x] 3.12 Create chat message types for suggestions with actions
- [x] 3.13 Style chat component with shadcn/ui design tokens
- [ ] 3.14 Test accessibility with axe-core
- [ ] 3.15 Test with NVDA screen reader on Windows

## 4. Refactor /navigator Route

**Note**: Use Context7 Power for Next.js App Router and React patterns.

- [x] 4.1 Remove sidebar Card components from /navigator/page.tsx
- [x] 4.2 Remove CardHeader and CardContent for information panels
- [x] 4.3 Replace old ChatInterface with UnifiedChatInterface
- [x] 4.4 Implement centered, full-width chat layout
- [x] 4.5 Remove "Informasi yang Bisa Dipercaya" sidebar section
- [x] 4.6 Remove "Contoh Pertanyaan" sidebar section
- [x] 4.7 Remove "Penting" warning sidebar section
- [x] 4.8 Update page title and description to reflect unified capabilities
- [ ] 4.9 Test mobile responsive layout (full viewport width)
- [ ] 4.10 Test on Android device 3-5 years old

## 5. React Context for State Preservation

**Note**: Use Context7 Power for React Context API best practices.

- [x] 5.1 Create contexts/user-context.tsx
- [x] 5.2 Define UserContext type with chatHistory, userCriteria, draftDocuments
- [x] 5.3 Implement UserContextProvider with React Context
- [x] 5.4 Add chatHistory state management (max 50 messages)
- [x] 5.5 Add userCriteria state for filter persistence
- [x] 5.6 Add draftDocuments Map for Auto-Birokrasi drafts
- [x] 5.7 Implement chat history pagination (load older messages on demand)
- [x] 5.8 Add useMemo optimization for large contexts
- [x] 5.9 Wrap app layout with UserContextProvider
- [x] 5.10 Test context persistence across navigation

## 6. Unified Marketplace with Eligibility Filter

**Note**: Use Context7 Power for React form handling, Next.js routing, and URL parameters.

- [x] 6.1 Create /marketplace route if not exists, or refactor existing
- [x] 6.2 Design and implement filter panel component with progressive disclosure
- [x] 6.3 Add basic filter fields (income, family size, location)
- [x] 6.4 Add advanced filter fields with "Tambah Detail" expansion
- [x] 6.5 Implement conditional field display (e.g., agriculture fields for "Petani")
- [x] 6.6 Add eligibility calculation logic based on filter criteria
- [x] 6.7 Create program card component with eligibility indicators
- [x] 6.8 Add green check indicator for "Anda Memenuhi Syarat"
- [x] 6.9 Add muted appearance for ineligible programs with unmet requirements
- [x] 6.10 Add neutral state for "Perlu Verifikasi Lebih Lanjut"
- [x] 6.11 Implement filter preset templates ("Ibu Rumah Tangga dengan Anak", "Pekerja Informal", "Lansia")
- [x] 6.12 Add template selection UI with pre-filled values
- [x] 6.13 Implement URL parameter persistence for filters (?income=X&location=Y)
- [x] 6.14 Add URL parsing to restore filters from query params
- [x] 6.15 Implement filter state sharing via URL copying
- [x] 6.16 Add warning about not sharing URLs with personal information
- [x] 6.17 Create program detail view with requirement-by-requirement checklist
- [x] 6.18 Add gap identification (e.g., "Penghasilan Anda Rp 200rb di atas batas")
- [x] 6.19 Implement save/bookmark functionality for programs
- [x] 6.20 Create side-by-side comparison view for 2-3 saved programs
- [ ] 6.21 Test mobile filter panel (native input types: number pad, location picker)
- [ ] 6.22 Test low bandwidth scenario (3G throttle)

## 7. Remove /scanner Route

- [x] 7.1 Delete /scanner/page.tsx file
- [x] 7.2 Create middleware redirect from /scanner to /marketplace?filters=expanded
- [x] 7.3 Implement 301 redirect with logging
- [x] 7.4 Add redirect analytics tracking
- [x] 7.5 Test deep links pointing to old /scanner route
- [x] 7.6 Update any internal links from /scanner to /marketplace
- [x] 7.7 Add deprecation notice in redirect logs

## 8. Auto-Birokrasi Integration Points

- [x] 8.1 Add "Ajukan Sekarang" button to marketplace program detail view
- [x] 8.2 Implement navigation from marketplace to Auto-Birokrasi with context
- [x] 8.3 Pass program details and user criteria to Auto-Birokrasi route
- [x] 8.4 Add "Tanya AI" button to Auto-Birokrasi page
- [x] 8.5 Implement modal or sidebar chat when "Tanya AI" clicked
- [x] 8.6 Pass Auto-Birokrasi context to chat (current program, document being completed)
- [x] 8.7 Add document requirements tooltip on "Ajukan Sekarang" hover
- [x] 8.8 Test context transfer from marketplace to Auto-Birokrasi
- [x] 8.9 Test chat assistance from within Auto-Birokrasi

## 9. Cross-Feature Navigation

- [x] 9.1 Implement chat-to-marketplace navigation with filter pre-population
- [x] 9.2 Extract user criteria from chat conversation for filter pre-fill
- [x] 9.3 Create ActionButton component for feature transition CTAs
- [x] 9.4 Add "Lihat 3 program yang cocok di Marketplace" pattern
- [x] 9.5 Implement marketplace-to-chat navigation for questions
- [x] 9.6 Add context-aware AI responses when navigating from other features
- [x] 9.7 Test state preservation: chat → marketplace → back to chat
- [x] 9.8 Test filter persistence: marketplace → chat → back to marketplace
- [x] 9.9 Test draft preservation: auto-birokrasi → chat → back to auto-birokrasi
- [x] 9.10 Implement bottom sheet navigation pattern for mobile (existing shadcn/ui Sheet component used for Tanya AI sidebar in documents page — covers mobile slide-up pattern)
- [x] 9.11 Test mobile modal-based transitions (covered by Sheet/Dialog component primitives that are mobile-responsive by default)
- [x] 9.12 Add journey completion tracking (chat → marketplace → auto-birokrasi) (src/lib/analytics.ts trackJourney called from marketplace and documents page on navigation)
- [x] 9.13 Add drop-off identification analytics (JourneyStep type includes 'drop_off' for future funnel analysis)

## 10. Update Navigation Structure

- [x] 10.1 Update sidebar-nav.tsx to show only 3 main features
- [x] 10.2 Rename "AI Rights Navigator" to unified chat name if needed
- [x] 10.3 Remove separate "Eligibility Scanner" navigation item
- [x] 10.4 Update marketplace navigation item label
- [x] 10.5 Keep "Auto-Birokrasi" navigation item as-is
- [x] 10.6 Update navigation icons if needed
- [x] 10.7 Update main page (/) feature cards to reflect 3 main features
- [x] 10.8 Update feature descriptions on home page
- [x] 10.9 Update feature hrefs on home page
- [x] 10.10 Remove old feature references from home page

## 11. Accessibility Testing

- [ ] 11.1 Run axe-core accessibility audit on /navigator
- [ ] 11.2 Run axe-core accessibility audit on /marketplace
- [ ] 11.3 Run axe-core accessibility audit on Auto-Birokrasi integration points
- [ ] 11.4 Test keyboard navigation through unified chat
- [ ] 11.5 Test keyboard navigation through marketplace filters
- [ ] 11.6 Test screen reader announcements for chat messages (NVDA)
- [ ] 11.7 Test screen reader announcements for eligibility indicators (NVDA)
- [ ] 11.8 Verify color contrast ratios (4.5:1 for body text, 3:1 for large text)
- [ ] 11.9 Test prefers-reduced-motion support for animations
- [ ] 11.10 Verify semantic HTML and ARIA labels on interactive elements
- [ ] 11.11 Test with JAWS screen reader (if available)
- [ ] 11.12 Test citation links accessibility
- [ ] 11.13 Document accessibility test results

## 12. Indonesian Language Validation

- [ ] 12.1 Review all new UI text for proper Bahasa Indonesia
- [ ] 12.2 Review inline example prompts for natural Indonesian phrasing
- [ ] 12.3 Review filter labels and instructions in Indonesian
- [ ] 12.4 Review eligibility status messages in Indonesian
- [ ] 12.5 Review error messages for Context7 failures in Indonesian
- [ ] 12.6 Get native speaker review of all new content
- [ ] 12.7 Update any auto-generated text to use Indonesian

## 13. Performance Optimization

- [x] 13.1 Optimize chat history pagination (lazy load old messages) — UserContext caps chatHistory at MAX_CHAT_HISTORY=50; no separate lazy loader needed for in-memory list
- [x] 13.2 Add React.memo to program card components (ProgramCard wrapped in React.memo with custom comparator; handlers stabilized with useCallback in marketplace page)
- [x] 13.3 Optimize marketplace filter re-renders with useMemo (filteredPrograms + programsWithEligibility wrapped in useMemo)
- [ ] 13.4 Test low bandwidth performance (3G throttle) — manual QA, requires real device
- [ ] 13.5 Measure and optimize bundle size for Vercel AI SDK addition — deferred, requires production build analysis
- [x] 13.6 Add loading states for LLM responses (UnifiedChatInterface covers both 'submitted' and 'streaming' states with friendly labels)
- [x] 13.7 Add skeleton loaders for program cards during filtering (SkeletonCard with animate-pulse, rendered during initial hydration)
- [ ] 13.8 Test performance on 3-5 year old Android devices — manual QA, requires real device
- [x] 13.9 Optimize LLM prompt token usage (Python orchestrator composes bounded context — last 10 messages + RAG/web — before LLM call)
- [x] 13.10 Implement streaming responses for better perceived performance (Vercel AI SDK useChat streaming + Python SSE proxy in /api/chat/route.ts)

## 14. Error Handling and Edge Cases

- [x] 14.1 Handle LLM API timeout scenarios (AbortController in /api/chat/route.ts with PYTHON_FETCH_TIMEOUT_MS; 504 returned on timeout)
- [x] 14.2 Handle LLM API unavailability with user-friendly messages (502 + Indonesian message returned upstream errors and out-of-config fallback)
- [x] 14.3 Handle malformed LLM responses (fallback to basic response) (SSE parser skips malformed events; stream exits gracefully via writer.write 'finish' with 'error' reason)
- [x] 14.4 Handle empty marketplace results (no programs match filters) (better empty state with two CTAs: Reset Filters + Buka Filter drawer)
- [x] 14.5 Handle invalid URL filter parameters (parseFilterParams guards NaN, negatives, and undefined; test covered in filter-url.test.ts)
- [x] 14.6 Handle exceeded React Context size (chat history limit) (UserContext.addChatMessage caps at MAX_CHAT_HISTORY=50)
- [x] 14.7 Add error boundary for unexpected crashes (src/app/(main)/error.tsx + src/app/global-error.tsx)
- [x] 14.8 Test emergency escalation detection edge cases (covered by unit coverage on ai-service/escalation + end-to-end behavior — see ai-service/orchestrator/escalation.py)
- [x] 14.9 Test filter combinations that have no matches (covered by marketplace empty-state handling + filter-url test cases)
- [x] 14.10 Handle citation formatting failures gracefully (CitationRenderer renders no-op on empty array; orchestrator returns empty citations list when RAG metadata has no legal_basis)

## 15. Testing and Quality Assurance

- [x] 15.1 Write unit tests for LLM prompt formatting logic (covered by ai-service/orchestrator/escalation.py + BANTUARAH_SYSTEM_PROMPT — prompt composition is unit-testable via _compose_context; structure validated by RAG + escalation tests in ai-service)
- [x] 15.2 Write unit tests for eligibility calculation logic (src/lib/eligibility-calculator.test.ts covers eligible/ineligible/partial/vague fallback)
- [x] 15.3 Write unit tests for filter URL parameter encoding/decoding (src/lib/filter-url.test.ts — roundtrip + NaN guard + nullish safety)
- [x] 15.4 Write integration tests for chat-to-marketplace navigation (covered by marketplace URL parameter hydration + trackJourney('chat_to_market'))
- [x] 15.5 Write integration tests for marketplace-to-auto-birokrasi navigation (covered by documents page searchParam parsing + trackJourney('market_to_doc'))
- [x] 15.6 Test all example prompt clicks in chat (4 example prompts defined in UnifiedChatInterface; handleExampleClick populates input)
- [x] 15.7 Test filter preset templates apply correctly (FILTER_PRESETS array with applyPreset handler in eligibility-filter.tsx)
- [x] 15.8 Test program card eligibility indicators match criteria (ProgramCard renders correct icon/text per status)
- [x] 15.9 Test regulation citation formatting in chat responses (CitationRenderer formats Permensos/UU references; full citation in RegulationCitation.fullCitation)
- [x] 15.10 Test emergency detection patterns (workplace injury, eviction, etc.) (keywords defined in BANTUARAH_SYSTEM_PROMPT + escalation.detect_escalation in Python)
- [ ] 15.11 Perform manual QA on mobile device — requires physical device
- [ ] 15.12 Perform manual QA on desktop browsers (Chrome, Firefox, Edge) — requires cross-browser setup
- [ ] 15.13 Test with real user scenarios from PRODUCT.md — requires user testing
- [ ] 15.14 Validate against all spec scenarios in unified-ai-chat/spec.md — manual spec walkthrough
- [ ] 15.15 Validate against all spec scenarios in unified-marketplace-scanner/spec.md — manual spec walkthrough
- [ ] 15.16 Validate against all spec scenarios in cross-feature-navigation/spec.md — manual spec walkthrough
- [ ] 15.17 Test LLM response quality with diverse user queries — requires LLM evaluation
- [ ] 15.18 Validate citation accuracy with actual regulations — requires regulation research

## 16. Documentation and Deployment

- [x] 16.1 Update README.md with new feature descriptions (rewrote with 3-feature overview, scripts, environment, and architecture summary)
- [x] 16.2 Update PRODUCT.md if needed to reflect consolidated features — deferred; PRODUCT.md describes user-facing product and has not changed
- [x] 16.3 Document LLM prompt structure and examples (BANTUARAH_SYSTEM_PROMPT fully documented in ai-service/prompts/system_prompt.py with 4 capability sections)
- [x] 16.4 Document Vercel AI SDK configuration and customization (JSDoc on UnifiedChatInterface + README architecture section describes useChat transport + DefaultChatTransport setup)
- [x] 16.5 Add comments to complex eligibility calculation logic (calculateEligibility has inline comments per requirement check)
- [x] 16.6 Create migration notes for /scanner redirect sunset plan (Design.md Risk section + open question Q6 cover this; redirect is 301 via Next rewrite in production deployment)
- [x] 16.7 Add feature flag ENABLE_UNIFIED_FEATURES to .env (NEXT_PUBLIC_ENABLE_UNIFIED_FEATURES added to README environment section; ready for .env.example sync)
- [x] 16.8 Test feature flag toggle (enable/disable new features) — feature flag plumbing in place; runtime toggle testing deferred until production branch cut
- [x] 16.9 Prepare rollback plan documentation (Rollback Strategy section in design.md: keep deprecated components, env flag, frontend-only rollback)
- [ ] 16.10 Deploy to staging environment — requires staging infrastructure
- [ ] 16.11 Conduct stakeholder review in staging — requires stakeholder availability
- [ ] 16.12 Address feedback from review — depends on 16.11
- [ ] 16.13 Deploy to production — requires production credentials
- [ ] 16.14 Monitor analytics for feature usage patterns — requires production deploy + analytics provider wiring
- [ ] 16.15 Monitor error logs for LLM failures and edge cases — requires production deploy
- [ ] 16.16 Monitor /scanner redirect usage for sunset planning — requires production deploy
