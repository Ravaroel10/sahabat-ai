## Context

BantuArah currently has fragmented features (AI Rights Navigator, Evidence Citation Engine, Fact Checker, Emergency Escalation, Rights Marketplace, Eligibility Scanner, Auto-Birokrasi) spread across multiple routes and components. This creates navigation complexity that increases cognitive load for users with limited digital literacy. 

Current architecture has `/navigator` with a layout-heavy page containing sidebar panels, separate `/scanner` route, and disconnected feature experiences. The project uses Next.js (with breaking changes from standard Next.js), React, TypeScript, and shadcn/ui components.

Key constraints:
- Must maintain WCAG 2.1 AA accessibility compliance
- Mobile-first design for users on 3-5 year old Android devices
- Low bandwidth considerations
- Indonesian language throughout
- Cannot break existing Auto-Birokrasi functionality

Stakeholders:
- Primary: Indonesian citizens with varying digital literacy
- Secondary: Government and NGO workers assisting citizens

## Goals / Non-Goals

**Goals:**
- Consolidate 7+ features into 3 unified features
- Reduce navigation complexity from 5+ routes to 3 main routes
- Implement chat-first interface using OpenUI patterns
- Enable seamless cross-feature navigation with context preservation
- Maintain or improve current accessibility standards
- Simplify /navigator to focus on conversation without layout complexity

**Non-Goals:**
- Rewriting Auto-Birokrasi feature internals (only integration points change)
- Changing data models for programs or user profiles
- Modifying authentication or authorization systems
- Adding new AI models or changing LLM providers
- Backend API restructuring (focus is frontend consolidation)

## Implementation Strategy

**Context7 Power for All Documentation**: Throughout implementation, the AI agent uses Context7 Power (Kiro Power integration) to look up current documentation for any library, framework, or API. This ensures:
- Accurate, up-to-date code patterns
- Proper API usage aligned with latest versions
- Best practices from official documentation
- No reliance on potentially outdated training data

**Context7 will be used for:**
- React, Next.js, TypeScript patterns
- Vercel AI SDK implementation details
- shadcn/ui component usage
- Any third-party library integration

**Context7 Usage Pattern:**
1. Before implementing any feature with external libraries, query Context7 for latest documentation
2. Use library-specific queries (e.g., "Vercel AI SDK useChat streaming") not generic terms
3. Reference the exact Context7 library ID (e.g., /vercel/ai)
4. Cross-reference multiple sources when patterns vary
5. Document Context7 findings in code comments for team knowledge sharing
- No reliance on potentially outdated training data

Context7 will be used for:
- React, Next.js, TypeScript patterns
- Vercel AI SDK implementation details
- shadcn/ui component usage
- Any third-party library integration

## Decisions

### Decision 1: Vercel AI SDK for Chat Interface
**Choice:** Use Vercel AI SDK (`@ai-sdk/react`) with `useChat` hook for chat components instead of building custom or using existing ChatInterface.

**Rationale:**
- Vercel AI SDK provides built-in streaming response support
- Industry-standard React hooks (`useChat`) for managing chat state
- Excellent documentation and active maintenance (Benchmark Score: 84.97, 10K+ code snippets)
- Native support for tool calls and structured data rendering
- Better mobile responsiveness and accessibility than current implementation

**Alternatives considered:**
- Keep current custom ChatInterface: Rejected due to lack of streaming support and mobile optimization
- Build from scratch: Rejected due to time investment and reinventing solved problems
- Generic chat UI libraries: Rejected as they lack LLM-specific features like streaming and tool rendering

### Decision 2: Enhanced LLM Prompts for Multi-Capability Chat
**Choice:** Design comprehensive system prompts that enable the LLM to handle navigation, evidence citation, fact-checking, and emergency escalation in a single conversation context.

**Rationale:**
- Consolidating capabilities requires LLM awareness of all functions
- Clear instructions improve citation quality and emergency detection
- Structured response format ensures consistent user experience
- Prompt engineering is cost-effective vs. external API dependencies

**Implementation:**
```typescript
// System prompt structure
const systemPrompt = `
You are BantuArah AI assistant helping Indonesian citizens access social assistance.

Capabilities you provide:
1. Rights Navigation: Guide users to relevant programs
2. Evidence Citation: Always cite Permensos/Perpres/UU when making claims
3. Fact Checking: Verify user-mentioned information against regulations
4. Emergency Escalation: Detect urgent situations and prioritize immediate help

Citation format: "Permensos No. X/YYYY, Pasal Y, Ayat Z"
Emergency keywords: [jatuh, kecelakaan, darurat, lapar, diusir, etc.]
`;
```

**Alternatives considered:**
- External regulation API: Rejected, adds dependency, latency, and cost
- Separate AI instances per capability: Rejected, loses conversation context
- Rule-based system for citations: Rejected, too brittle and maintenance-heavy

### Decision 3: Unified Marketplace Route Structure
**Choice:** Merge `/scanner` into `/marketplace` with filter panel, remove `/scanner` route entirely.

**Rationale:**
- Scanner functionality is conceptually filtering/matching
- Users understand "marketplace with filters" more than "separate scanner tool"
- Reduces navigation cognitive load
- URL structure: `/marketplace?income=X&location=Y` makes filters shareable

**Migration:** Redirect `/scanner` → `/marketplace?filters=expanded`

**Alternatives considered:**
- Keep separate routes with better linking: Rejected, still creates mental model complexity
- Scanner as modal overlay: Considered but less accessible on mobile

### Decision 4: Context Preservation via React Context + URL State
**Choice:** Use React Context for app-wide user input state, URL params for shareable filter state.

**Rationale:**
- Chat conversations should persist when navigating away and back
- Marketplace filters should be shareable via URL
- Draft documents in Auto-Birokrasi should survive accidental navigation

**Implementation:**
```typescript
// contexts/user-context.tsx
type UserContext = {
  chatHistory: Message[]
  userCriteria: FilterCriteria
  draftDocuments: Map<string, DocumentDraft>
}

// URL structure for shareability
/marketplace?income=1500000&location=jakarta&family=4
```

**Alternatives considered:**
- localStorage only: Rejected, not shareable and privacy concerns
- Server-side session only: Rejected due to latency and offline scenarios

### Decision 5: Cross-Feature Navigation with Explicit CTAs
**Choice:** Use explicit call-to-action buttons for feature transitions rather than automatic redirects.

**Rationale:**
- User agency and control reduce anxiety
- Explicit actions are more accessible (screen reader announcements)
- Users can choose to continue conversation or transition

**Pattern:**
```typescript
// In chat response
{
  type: "suggestion",
  text: "Saya menemukan 3 program yang cocok",
  actions: [
    { label: "Lihat di Marketplace", href: "/marketplace?..." },
    { label: "Lanjut Obrolan", action: "continue" }
  ]
}
```

**Alternatives considered:**
- Automatic redirects: Rejected, removes user control and confusing
- Always modal overlays: Rejected, doesn't work well on mobile

### Decision 6: Component Library Strategy
**Choice:** Continue using shadcn/ui for base components, add Vercel AI SDK specifically for chat, keep existing pattern.

**Rationale:**
- shadcn/ui already integrated and working well for cards, buttons, forms
- Vercel AI SDK specializes in AI-powered conversational interfaces with streaming
- Mixing is acceptable as long as design tokens align

**Migration:**
- Replace `<ChatInterface />` with Vercel AI SDK's `useChat` hook
- Map shadcn/ui design tokens to chat component styling
- Use shadcn/ui for marketplace, filters, document forms

## Risks / Trade-offs

**Risk:** Removing /scanner route breaks external links (government sites, bookmarks)  
**Mitigation:** Implement 301 redirect from /scanner to /marketplace with query param `?filters=expanded` to open filter panel. Add redirect logging to monitor usage and communicate with partners.

**Risk:** Vercel AI SDK may have different accessibility patterns than our standard  
**Mitigation:** Audit Vercel AI SDK components against WCAG 2.1 AA before integration. Run axe-core tests. Test with actual screen readers (NVDA, JAWS). Budget time for customization if needed.

**Risk:** Consolidating features may make individual capabilities less discoverable  
**Mitigation:** Use inline example prompts in chat to educate users about multi-capability support. Add "What can I do here?" help tooltip. Monitor analytics for feature usage patterns.

**Risk:** React Context for state preservation could cause performance issues with large chat histories  
**Mitigation:** Implement pagination for chat history (load older messages on demand). Set maximum context size (e.g., last 50 messages). Use useMemo/useCallback appropriately.

**Risk:** URL-based filter state could leak sensitive user information if shared  
**Mitigation:** Never put PII in URL params (names, NIK, etc.). Only encode generic criteria (income ranges, location codes, family size). Add warning when copying/sharing marketplace URLs with filters.

**Risk:** LLM may not consistently provide accurate regulation citations without external knowledge
**Mitigation:** Provide comprehensive regulation documentation in system prompts. Include examples of proper citation format. Test extensively with real user queries. Add disclaimer that citations should be verified with official sources.

**Trade-off:** Unified chat means all capabilities share same context window  
**Implication:** LLM prompt engineering must handle multiple capability types in single conversation. More complex system prompt. Benefit: More natural conversation flow for users.

**Trade-off:** Removing sidebar information panels simplifies UI but removes passive education  
**Implication:** Users may not know which regulations inform recommendations. Mitigation: Show citations inline in responses, add "How does this work?" expandable section in chat.

## Migration Plan

**Phase 1: Setup Dependencies**
1. Install Vercel AI SDK: `npm install ai @ai-sdk/react`
2. Configure environment variables in `.env` if needed

**Phase 2: Enhanced LLM Prompts**
1. Use Context7 to research Indonesian social assistance regulations (PKH, BPNT, BPJS, etc.)
2. Create system prompts for multi-capability chat (navigation + citation + fact-check + escalation)
3. Add structured response format instructions for LLM
4. Implement regulation citation formatting logic
5. Add emergency situation detection patterns in prompts
6. Test prompt effectiveness with various user scenarios

**Phase 3: Refactor Chat Interface**
1. Use Context7 to look up Vercel AI SDK useChat hook documentation
2. Create new `components/unified-chat/` directory
3. Implement Vercel AI SDK-based chat component with `useChat` hook
4. Use Context7 for React best practices and TypeScript patterns
5. Integrate enhanced LLM prompts with multi-capability support
6. Add evidence citation rendering in chat messages
7. Implement emergency situation detection patterns
8. Test accessibility with screen readers

**Phase 4: Redesign /navigator Route**
1. Use Context7 for Next.js App Router patterns
2. Remove sidebar card components from `/navigator/page.tsx`
3. Replace with centered Vercel AI SDK chat component
4. Add inline example prompts in empty state
5. Mobile responsiveness testing

**Phase 5: Merge Marketplace and Scanner**
1. Use Context7 for React form handling and state management patterns
2. Create unified `/marketplace` with filter panel
3. Implement advanced filtering UI (progressive disclosure)
4. Use Context7 for URL parameter handling in Next.js
5. Add eligibility indicators on program cards
6. Redirect `/scanner` → `/marketplace?filters=expanded`
7. Test URL parameter persistence

**Phase 6: Cross-Feature Navigation**
1. Use Context7 for React Context API best practices
2. Implement chat-to-marketplace navigation with pre-filled filters
3. Add Auto-Birokrasi access from marketplace program details
4. Implement React Context for state preservation
5. Test navigation flows on mobile and desktop

**Phase 7: Update Navigation**
1. Use Context7 for shadcn/ui navigation component patterns
2. Update `sidebar-nav.tsx` to show 3 main features
3. Remove separate scanner and navigator references (consolidate to unified names)
4. Update main page feature cards

**Rollback Strategy:**
- Keep old components in `/components/_deprecated/` during migration
- Feature flag for new unified interface: `ENABLE_UNIFIED_FEATURES=true`
- If critical issues: toggle flag to revert to original components
- Database/API unchanged, so rollback is frontend-only

**Testing Checklist:**
- [ ] Accessibility audit with axe-core
- [ ] Screen reader testing (NVDA on Windows, JAWS)
- [ ] Mobile device testing (Android 5-year-old devices)
- [ ] Low bandwidth simulation (throttle to 3G)
- [ ] Indonesian language validation by native speakers
- [ ] LLM prompt effectiveness with multi-capability scenarios
- [ ] Citation accuracy and formatting validation
- [ ] Cross-feature navigation flows
- [ ] URL sharing and filter restoration

## Open Questions

1. **Vercel AI SDK theming customization:** How much effort to align AI SDK components with current brand colors (warm oranges, soft design per PRODUCT.md)?

2. **Emergency escalation phone numbers:** Where to source and how to keep updated? Government contact database? Hardcoded list?

3. **Program data structure:** Do current program objects support eligibility criteria needed for advanced filtering? May need data model adjustments.

4. **Analytics integration:** What events to track for cross-feature navigation? Need to define before implementing.

5. **Backward compatibility:** How long to maintain /scanner redirect? Track usage and sunset after X months?

6. **LLM prompt length:** Will comprehensive multi-capability instructions fit within token limits? May need to optimize prompt engineering or use few-shot examples.
