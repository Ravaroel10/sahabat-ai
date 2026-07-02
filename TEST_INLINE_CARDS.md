# How to Test Inline Program Cards

## Problem: Cards Appear at Bottom, Not Inline

This happens because **the LLM is NOT using the `[PROGRAM:id]` markers**.

The cards you see at the bottom are **reference cards from metadata**, not inline cards.

---

## How to Verify

### 1. Check Python Logs

Start the Python AI service and watch the logs:

```bash
cd ai-service
python -m uvicorn main:app --reload --log-level info
```

When you send a message, look for this in the logs:

```
💡 Detected inline program marker: pkh
✅ Found program data: Program Keluarga Harapan
```

**If you DON'T see this**, the LLM is not using markers.

---

### 2. Check Browser Network Tab

Open Chrome DevTools → Network tab → Filter by "chat"

Look at the SSE stream events:

**WITH inline markers** (correct):
```
data: {"type":"token","data":"Saya rekomendasikan "}
data: {"type":"inline-program","program_id":"pkh","program":{...}}
data: {"type":"token","data":" untuk Anda"}
```

**WITHOUT inline markers** (current):
```
data: {"type":"token","data":"Saya rekomendasikan PKH untuk Anda"}
data: {"type":"metadata","programs":[{...}]}
```

---

## Why LLM Isn't Using Markers

The system prompt has instructions, but the LLM may:

1. **Not have learned the pattern yet** - Needs a few iterations
2. **Prefer natural text** - Writes "PKH" instead of `[PROGRAM:pkh]`
3. **Forget the instruction** - Long system prompt, marker instruction may be missed

---

## Force LLM to Use Markers (Testing)

### Option 1: Add to User Message

In your test, explicitly ask:

```
"Saya buruh dengan 3 anak sekolah. PENTING: Gunakan marker [PROGRAM:id] untuk setiap program yang kamu sebutkan."
```

### Option 2: Mock the Response

Create a mock chat route that always includes markers:

**File**: `src/app/api/chat-test-inline/route.ts`

```typescript
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

export async function POST(req: Request) {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const messageId = crypto.randomUUID();
      
      // Start text
      writer.write({ type: 'text-start', id: messageId });
      
      // Text before card
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: 'Berdasarkan situasi Anda, saya rekomendasikan:\n\n',
      });
      
      // End text before card
      writer.write({ type: 'text-end', id: messageId });
      
      // Inline program card
      writer.write({
        type: 'data-program-inline',
        data: {
          program_id: 'pkh',
          program: {
            id: 'pkh',
            name: 'Program Keluarga Harapan',
            description: 'Bantuan tunai bersyarat untuk keluarga miskin',
            benefits: 'Rp 550.000 - 3 juta per tahun',
          },
        },
      });
      
      // Start text after card
      writer.write({ type: 'text-start', id: messageId });
      
      // Text after card
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '\n\nProgram ini cocok karena Anda memiliki 3 anak sekolah.',
      });
      
      // End text
      writer.write({ type: 'text-end', id: messageId });
      
      // Finish
      writer.write({ type: 'finish', finishReason: 'stop' });
    },
  });
  
  return createUIMessageStreamResponse({ stream });
}
```

Then test by changing the API URL temporarily:

```typescript
// In unified-chat-interface.tsx
const { messages, sendMessage, status, error } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat-test-inline', // Test URL
  }),
});
```

---

## Expected Behavior (With Markers)

```
User: "Saya buruh dengan 3 anak sekolah"

AI Response:
─────────────────────────────────────
Berdasarkan situasi Anda, saya rekomendasikan:

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💼 Program Keluarga Harapan  ┃ ← INLINE CARD (from marker)
┃ Bantuan tunai bersyarat...   ┃
┃ [Lihat Detail]               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Program ini cocok karena Anda memiliki 3 anak sekolah...
─────────────────────────────────────

💡 Program yang cocok:
┌────────────────────────────────┐
│ 💼 PKH [▼]                     │ ← REFERENCE CARD (from metadata)
│ ✓ Anda Memenuhi Syarat         │
└────────────────────────────────┘
```

---

## Current Behavior (Without Markers)

```
User: "Saya buruh dengan 3 anak sekolah"

AI Response:
─────────────────────────────────────
Berdasarkan situasi Anda, saya rekomendasikan
Program Keluarga Harapan (PKH). Program ini
cocok karena Anda memiliki 3 anak sekolah...

[Full text continues...]
─────────────────────────────────────

💡 Program yang cocok:
┌────────────────────────────────┐
│ 💼 PKH [▼]                     │ ← ONLY REFERENCE CARD
│ ✓ Anda Memenuhi Syarat         │   (from metadata)
└────────────────────────────────┘
```

---

## How to Make LLM Use Markers

### Short Term: Test with Mock

Use the mock route above to verify the frontend rendering works correctly.

### Medium Term: Improve System Prompt

Make the marker instruction more prominent:

```python
# In system_prompt.py

## 🔥 CRITICAL: USE INLINE PROGRAM CARDS 🔥

WHENEVER you mention a specific program in your response, you MUST use the inline marker format:

Format: [PROGRAM:program-id]

Example:
"Saya rekomendasikan Program Keluarga Harapan:

[PROGRAM:pkh]

Program ini cocok karena..."

DO NOT just write "PKH" or "Program Keluarga Harapan" without the marker!
```

### Long Term: Fine-tune or Use Examples

Add few-shot examples to system prompt showing correct marker usage.

---

## Debug Checklist

If inline cards still don't work:

- [ ] Check Python logs for "💡 Detected inline program marker"
- [ ] Check network tab for `inline-program` SSE events
- [ ] Verify `text-end` → `data-program-inline` → `text-start` sequence
- [ ] Check browser console for React rendering errors
- [ ] Test with mock route to isolate LLM vs rendering issues
- [ ] Verify `InlineProgramCardRenderer` component is imported
- [ ] Check message.parts structure in console

---

## Summary

**The system works correctly**, but:
- ❌ LLM is not using `[PROGRAM:id]` markers
- ✅ When LLM uses markers, inline cards will appear correctly
- ✅ Reference cards from metadata work fine (what you see now)

**Next step**: Get the LLM to use markers by:
1. Testing with mock route first (verify rendering)
2. Improving system prompt prominence
3. Adding explicit user instructions temporarily
4. Using few-shot examples

The infrastructure is ready. We just need the LLM to cooperate! 😅
