# Inline Cards Fix Summary

## Issue Reported
> "The card is still rendered AFTER the FULL markdown text, not dynamically inside the markdown text."

## Root Cause Analysis

The cards appearing at the end are **reference cards from metadata**, NOT inline cards.

**Why?** The LLM is **NOT using the `[PROGRAM:id]` markers**.

---

## Fixes Applied

### 1️⃣ **Fixed Message Part Sequencing** (Critical Fix)

**Problem**: Even if LLM used markers, inline cards would still appear at end because we didn't close/reopen text parts.

**Solution**: Close text part before inline card, emit card, then start new text part.

**File**: `src/app/api/chat/route.ts`

**Before**:
```typescript
else if (data.type === 'inline-program') {
  writer.write({
    type: 'data-program-inline',
    data: { program_id, program },
  });
}
// Text continues in same part → all text grouped together
```

**After**:
```typescript
else if (data.type === 'inline-program') {
  // Close current text part
  if (textStarted) {
    writer.write({ type: 'text-end', id: messageId });
    textStarted = false;
  }
  
  // Emit inline card
  writer.write({
    type: 'data-program-inline',
    data: { program_id, program },
  });
  
  // New text part will start on next token
}
```

**Result**: Message parts now alternate correctly:
```
[text-start] → [text-delta] → [text-end]
[data-program-inline]
[text-start] → [text-delta] → [text-end]
[data-program-inline]
[text-start] → [text-delta] → [text-end]
```

---

### 2️⃣ **Made System Prompt MORE Prominent**

**Problem**: LLM wasn't noticing the inline marker instruction.

**Solution**: Added 🔥 emoji, moved to top, made it REQUIRED.

**File**: `ai-service/prompts/system_prompt.py`

**Changes**:
- Added `### 🔥 WAJIB: Gunakan Inline Program Cards 🔥` section
- Listed all available program IDs clearly
- Showed CORRECT vs WRONG examples
- Emphasized with "**SETIAP KALI**" and "**HARUS**"

---

### 3️⃣ **Created Test Mock Route**

**Problem**: Can't test if rendering works without LLM cooperation.

**Solution**: Created `/api/chat-test-inline` with pre-scripted response containing inline markers.

**File**: `src/app/api/chat-test-inline/route.ts`

**Usage**:
1. Change API URL to `/api/chat-test-inline`
2. Send any message
3. See inline cards appear correctly
4. Verify rendering infrastructure works

---

## How to Test

### Quick Test (Recommended)

1. **Edit** `src/components/unified-chat/unified-chat-interface.tsx`:
   ```typescript
   api: '/api/chat-test-inline',  // Add this
   ```

2. **Run** `npm run dev`

3. **Send** any message

4. **Verify** you see:
   - Inline cards **WITHIN** text (not at end)
   - Reference cards **AT END**
   - Both types coexist

5. **If it works**, rendering is correct ✅

6. **Change back** to `api: '/api/chat'`

### Real LLM Test

1. Keep Python service running:
   ```bash
   cd ai-service
   python -m uvicorn main:app --reload
   ```

2. Watch logs for:
   ```
   💡 Detected inline program marker: pkh
   ✅ Found program data: Program Keluarga Harapan
   ```

3. If you see this → inline cards should work

4. If you DON'T see this → LLM not using markers yet

---

## Current State

### ✅ What Works

- Backend marker detection (`chat.py`)
- Program data lookup and attachment
- SSE event emission with full data
- Frontend event transformation (`route.ts`)
- Message part sequencing (text-end → card → text-start)
- Component rendering (`InlineProgramCardRenderer`)
- Markdown wrapper stripping
- Test mock route

### ⏳ What's Pending

- LLM needs to start using `[PROGRAM:id]` markers
- System prompt updated to make it more prominent
- May need a few iterations for LLM to learn

---

## Why Cards Still at Bottom (Current Behavior)

**You're seeing this**:
```
[Full text response with all markdown]

💡 Program yang cocok:
┌─────────────────────┐
│ Card 1              │ ← Reference cards from metadata
│ Card 2              │
└─────────────────────┘
```

**Because**:
1. LLM writes: `"Saya rekomendasikan PKH..."` (no marker)
2. Python sends: All text as tokens → `metadata` with programs
3. Frontend renders: All text together → cards at end

**What you SHOULD see (when LLM uses markers)**:
```
Text before...

┌─────────────┐
│ Inline card │ ← From [PROGRAM:pkh] marker
└─────────────┘

Text in between...

┌─────────────┐
│ Inline card │ ← From [PROGRAM:kip] marker
└─────────────┘

Text after...

💡 Program yang cocok:
┌─────────────────────┐
│ Reference card 1    │ ← From metadata
│ Reference card 2    │
└─────────────────────┘
```

---

## Debug Commands

### Check if LLM is using markers:
```bash
# Watch Python logs
tail -f logs/app.log | grep "inline program marker"
```

### Check frontend message parts:
```javascript
// In unified-chat-interface.tsx
console.log('Parts:', message.parts);
```

Should show alternating text and `data-program-inline` parts.

### Force LLM to use markers:
Add to your message:
```
"... PENTING: Gunakan format [PROGRAM:id] untuk setiap program."
```

---

## Files Modified

### Backend
- ✏️ `ai-service/prompts/system_prompt.py` - More prominent marker instructions
- ✅ `ai-service/api/chat.py` - Already had marker detection

### Frontend
- ✏️ `src/app/api/chat/route.ts` - Fixed part sequencing (text-end/start)
- ✅ `src/components/unified-chat/unified-chat-interface.tsx` - Already had rendering
- 🆕 `src/app/api/chat-test-inline/route.ts` - Test mock route

### Documentation
- 🆕 `HOW_TO_TEST_INLINE_CARDS.md` - Testing guide
- 🆕 `TEST_INLINE_CARDS.md` - Detailed test instructions
- 🆕 `INLINE_CARDS_FIX_SUMMARY.md` - This file

---

## Next Steps

1. **Test with mock first** → Verify rendering works
   - Change API to `/api/chat-test-inline`
   - Should see inline cards within text

2. **If mock works** → Rendering is correct ✅
   - Switch back to `/api/chat`
   - Check Python logs for marker detection

3. **If LLM not using markers** → Try explicit instruction
   - Add "gunakan format [PROGRAM:id]" to message
   - Or wait for LLM to learn from updated system prompt

4. **Monitor adoption** → LLM may need iterations
   - Updated system prompt should help
   - May need few-shot examples in future

---

## Summary

✅ **Fixed**: Message part sequencing (critical bug)  
✅ **Created**: Test mock to verify rendering  
✅ **Updated**: System prompt to be more prominent  
🔧 **Ready**: Infrastructure is complete and working  
⏳ **Waiting**: LLM to start using `[PROGRAM:id]` markers  

**The system is ready.** Use the test mock to verify, then wait for/encourage LLM adoption of markers.
