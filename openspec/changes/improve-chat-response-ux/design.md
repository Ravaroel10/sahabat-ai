## Context

Saat ini, chat interface BantuArah memiliki tiga masalah UX utama:

1. **intent_classification leak**: Backend (Python AI service) mengirim `intent_classification` metadata ke client melalui SSE stream. Field ini digunakan internal untuk routing dan filtering programs (`filter_programs_by_intent`, `apply_intent_to_metadata`), tapi tidak seharusnya terekspos ke user.

2. **Program cards tidak kontekstual**: Program cards saat ini di-render sebagai standalone components dalam chat message tanpa petunjuk interaktif. User tidak tahu apakah bisa di-klik atau apa yang harus dilakukan dengan card tersebut. Cards muncul sebagai "referensi" bukan sebagai actionable UI element.

3. **Next steps terlalu generic**: Saat ini, next_steps hanya berisi langkah generic seperti "Siapkan Dokumen Otomatis" dan "Lihat semua program" tanpa konteks spesifik program atau situasi user. Ini mengurangi actionability dan relevansi.

**Current stack:**
- Backend: Python FastAPI dengan SSE streaming (`ai-service/api/chat.py`)
- Frontend: Next.js 15 dengan Vercel AI SDK (`src/app/api/chat/route.ts` sebagai proxy)
- Streaming format: Python emits `data: {"type":"token","data":"..."}\n\n`, proxy transforms to Vercel AI SDK format

**Key files involved:**
- Backend: `ai-service/api/chat.py` (streaming handler), `ai-service/orchestrator/intent_parser.py` (extracts intent), `ai-service/prompts/system_prompt.py` (LLM instructions)
- Frontend: `src/app/api/chat/route.ts` (proxy), `src/components/unified-chat/unified-chat-interface.tsx` (message renderer), `src/components/unified-chat/message-parts.tsx` (part renderers)

## Goals / Non-Goals

**Goals:**
1. Remove `intent_classification` from client-facing metadata while preserving its internal use for program filtering
2. Make program cards interactive with clear visual cues and collapsible behavior
3. Generate contextual next_steps based on mentioned programs, user eligibility, and conversation state
4. Maintain backward compatibility with existing message parts (citations, emergency, actions)
5. Improve actionability and clarity of chat responses

**Non-Goals:**
- Redesign entire program card component (we'll make minimal changes for interactivity)
- Change LLM prompt engineering or intent detection logic (only how we expose it)
- Modify embeddings/RAG system
- Add new metadata types beyond contextual next_steps

## Decisions

### Decision 1: Filter intent_classification in Python before SSE emission

**Choice:** Remove `intent_classification` from metadata dict before constructing SSE event in `ai-service/api/chat.py`.

**Why:** This is the safest place to filter—closer to source means less chance of leaking through other code paths. Next.js proxy should never receive this field.

**Alternatives considered:**
- Filter in Next.js proxy: Too late, we've already exposed field over network
- Filter in LLM service: Too early, we need intent_classification for internal routing logic (filter_programs_by_intent)

**Implementation:** In `ai-service/api/chat.py`, after calling `extract_intent_from_response` and using it for filtering, pop `intent_classification` from metadata dict before yielding SSE event.

### Decision 2: Use collapsible/expandable pattern for program cards

**Choice:** Render program cards as initially collapsed components with preview info (name, category, eligibility status) and expand button. On click, expand to show full details.

**Why:** 
- Reduces visual clutter in chat (can have 3-4 programs in one response)
- Clear affordance (expand icon) signals interactivity
- Maintains mobile-friendliness (collapsed state is compact)

**Alternatives considered:**
- Modal/dialog on click: Too heavy, removes context from conversation
- Tooltip on hover: Not discoverable on mobile, no room for full details
- Always expanded: Chat becomes too long and overwhelming

**Implementation:** Create new `CollapsibleProgramCard` component in `src/components/unified-chat/message-parts.tsx` that wraps existing `ProgramCard` internals with Radix UI Collapsible primitive. Render via `ProgramCardRenderer`.

### Decision 3: Generate contextual next_steps in Python LLM service

**Choice:** Add logic to `ai-service/api/chat.py` to construct `next_steps` array based on:
- Programs mentioned in response (from `programs` metadata)
- User eligibility status for each program
- Emergency flag (if emergency, prioritize safety steps)
- Conversation context (if missing info, guide information gathering)

**Why:**
- Backend has full context (programs, eligibility, emergency state)
- Python is easier for complex conditional logic than frontend rendering
- LLM can assist in generating step text (via prompt engineering)
- Keeps frontend simple (just render what backend sends)

**Alternatives considered:**
- Generate in frontend based on metadata: Frontend doesn't have eligibility calculation logic or conversation history
- Let LLM generate next_steps in text: Too unreliable, can't guarantee structure or actionability

**Implementation:** 
1. Add `build_contextual_next_steps(programs, emergency, user_situation)` function in `ai-service/api/chat.py`
2. Call it after program filtering and before SSE metadata emission
3. Include `next_steps` array in metadata (format: `[{"text": "...", "action": "apply", "target": "program-id"}, ...]`)
4. Frontend `NextStepsRenderer` renders numbered list with conditional styling (buttons for "apply" actions, links for "view" actions)

### Decision 4: Use data-program SSE event for program cards (no change to existing flow)

**Choice:** Keep existing `data-program` event emission from Next.js proxy. Only change how `ProgramCardRenderer` renders the card (add collapsible wrapper).

**Why:** Existing flow works well, no need to break it. Collapsible behavior is a presentation-layer concern.

**Implementation:** Modify `ProgramCardRenderer` in `src/components/unified-chat/message-parts.tsx` to use `CollapsibleProgramCard` instead of plain `ProgramCard`.

### Decision 5: Add visual cue text "Berikut detail program, klik untuk melihat lebih lanjut"

**Choice:** Render a small label/caption above each program card in collapsed state with this text.

**Why:** Explicit instruction reduces confusion, especially for non-tech-savvy users (our target demographic).

**Implementation:** Add `<p className="text-xs text-muted-foreground mb-2">Berikut detail program, klik untuk melihat lebih lanjut</p>` in `CollapsibleProgramCard` above the collapsible trigger.

## Risks / Trade-offs

### Risk 1: Collapsible adds complexity to chat UI
**Mitigation:** Use Radix UI Collapsible (battle-tested, accessible). Keep animation simple (200ms). Test on mobile devices.

### Risk 2: Contextual next_steps logic becomes complex and brittle
**Mitigation:** 
- Start with simple heuristics (eligible → "Ajukan [program]", partial → "Lengkapi info", emergency → "Hubungi 119")
- Add unit tests for `build_contextual_next_steps` function
- Log next_steps generation for observability

### Risk 3: Removing intent_classification breaks existing filtering logic
**Mitigation:**
- intent_classification is used BEFORE metadata emission (for `filter_programs_by_intent`, `apply_intent_to_metadata`)
- We only remove it from the final metadata dict sent to client
- No changes to internal routing logic
- Add assertion to verify intent_classification is not in SSE event payload

### Risk 4: Collapsed cards reduce discoverability of program details
**Mitigation:**
- Use clear visual affordance (chevron icon, hover state, caption text)
- Highlight eligible programs (green border) even in collapsed state
- Consider auto-expanding first eligible program (optional enhancement)

## Migration Plan

**Deployment steps:**
1. Deploy backend changes first (remove intent_classification, add contextual next_steps)
2. Verify via curl/Postman that SSE events no longer contain intent_classification
3. Deploy frontend changes (collapsible cards, next_steps renderer)
4. Test end-to-end in staging environment

**Rollback strategy:**
- Backend rollback: Revert to previous version, intent_classification will reappear (harmless but not ideal)
- Frontend rollback: Cards will render as before (non-collapsible), next_steps will render as before (if array format is backward-compatible)

**No database migrations needed.**

## Open Questions

1. **Should collapsed state show eligibility indicator?** 
   - Proposal: Yes, show green check / amber warning / gray X even when collapsed
   - Decision needed: Include in task or defer to future iteration?

2. **Should first eligible program auto-expand?**
   - Proposal: Auto-expand first eligible program to reduce clicks
   - Decision needed: Include in this change or separate UX enhancement?

3. **Should next_steps be clickable/interactive?**
   - Proposal: Yes, "Ajukan [program]" should be a button that triggers application flow
   - Decision needed: Full implementation or just visual styling for now?

**Resolution approach:** Start conservative (all collapsed, next_steps as text), iterate based on user testing.
