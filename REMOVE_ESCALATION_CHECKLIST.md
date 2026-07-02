# Remove Escalation/Emergency Feature - Checklist

## ✅ Completed

### Backend
- [x] Deleted `ai-service/orchestrator/escalation.py`
- [x] Updated `ai-service/orchestrator/orchestrator.py` - removed escalation import and references
- [x] Updated `ai-service/orchestrator/intent_parser.py` - removed escalation parameter

### Documentation  
- [ ] Update `AI_DRIVEN_INTENT_CLASSIFICATION.md` - remove Step 1 (Escalation Detection)

## ⏳ Remaining Backend Tasks

### System Prompt
- [ ] `ai-service/prompts/system_prompt.py`
  - Remove "4. ESKALASI DARURAT (Emergency Escalation)" section
  - Remove "RESPONS DARURAT" instructions
  - Remove `"emergency"` from intent types
  - Remove `[ACTION:emergency]` marker example

### API Layer
- [ ] `ai-service/api/chat.py`
  - Update `orchestrate_chat` call to remove `emergency` from return tuple
  - Remove `emergency` parameter from `build_contextual_next_steps()`
  - Remove emergency detection logic
  - Remove `data-emergency` SSE event emission
  - Update response metadata to remove `emergency` field

### Tests
- [ ] `ai-service/tests/test_contextual_next_steps.py`
  - Remove `test_emergency_scenario_prioritizes_safety_actions()` test
  - Remove `emergency` parameter from all test function calls
  - Update all assertions that check for emergency-related behavior

## ⏳ Remaining Frontend Tasks

### Type Definitions
- [ ] `src/types/llm-response.ts`
  - Remove `EmergencyType` type
  - Remove `EmergencyDetection` interface
  - Remove `emergency` field from `LLMChatResponse`
  - Remove `'data-emergency'` from `MessagePartType`
  - Remove `EmergencyAlertPart` interface
  - Remove `EmergencyAlertPart` from `MessagePart` union

### Components
- [ ] `src/components/unified-chat/message-parts.tsx`
  - Remove `EmergencyAlertRenderer` component
  - Remove `getEmergencyIcon()` helper
  - Remove emergency action type case

- [ ] `src/components/unified-chat/unified-chat-interface.tsx`
  - Remove `EmergencyAlertRenderer` import
  - Remove emergency alert rendering logic (`part.type === 'data-emergency'`)

- [ ] `src/components/unified-chat/unified-chat-with-history.tsx`
  - Remove `EmergencyAlertRenderer` import
  - Remove emergency alert rendering logic

### API Routes
- [ ] `src/app/api/chat/route.ts`
  - Remove emergency alert emission logic
  - Remove `metadata.emergency` checks
  - Remove emergency-related SSE events

- [ ] `src/app/api/chat-mock-emergency/route.ts`
  - Delete this entire file (it's just for testing emergency scenarios)

- [ ] `src/app/api/chat-mock/route.ts`
  - Remove emergency-related mock data

## Testing After Removal

### Backend Tests
```bash
cd ai-service
python -m pytest tests/ -v
```

### Frontend Build
```bash
npm run build
# Should have no TypeScript errors
```

### Manual Testing
1. Ask informational questions → Should work normally
2. Ask for document generation → Should show Auto-Birokrasi button
3. Describe eligibility scenario → Should show program cards
4. Try messages that previously triggered escalation (e.g., "anak sakit") → Should be handled as normal questions

## Rollback Plan

If you need to restore the escalation feature:
```bash
git checkout HEAD -- ai-service/orchestrator/escalation.py
git checkout HEAD -- ai-service/orchestrator/orchestrator.py
git checkout HEAD -- ai-service/orchestrator/intent_parser.py
# etc...
```

## Notes

- The escalation detection was keyword-based (not scalable)
- Removing it simplifies the codebase
- LLM can still handle urgent situations through its natural responses
- Intent classification (`application`, `question`, etc.) is sufficient for UX decisions
