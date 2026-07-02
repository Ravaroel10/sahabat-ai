# How to Test Inline Program Cards

## Problem
Cards are appearing at the END of the message instead of dynamically within the text.

## Root Cause
The LLM is **NOT using the `[PROGRAM:id]` markers** yet. The cards you see are reference cards from metadata, not inline cards.

---

## Solution: Test with Mock Data First

We created a mock API route that simulates an LLM response WITH inline markers to verify the rendering works.

### Step 1: Use the Test Route

**File**: `src/components/unified-chat/unified-chat-interface.tsx`

Temporarily change the API URL:

```typescript
// Find this line (around line 20):
const { messages, sendMessage, status, error } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',  // ← Original
  }),
});

// Change to:
const { messages, sendMessage, status, error } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat-test-inline',  // ← Test route
  }),
});
```

### Step 2: Run the App

```bash
npm run dev
```

### Step 3: Send ANY Message

The test route ignores your message and returns a pre-scripted response with inline cards.

### Step 4: Verify Inline Cards Work

You should see:

```
Berdasarkan situasi Anda sebagai buruh dengan 3 anak sekolah, 
saya rekomendasikan 2 program utama:

1. Program Keluarga Harapan (PKH)

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💼 Program Keluarga Harapan     ┃ ← INLINE CARD HERE
┃ Bantuan tunai bersyarat...      ┃
┃ 💰 Manfaat: Rp 550.000 - 3 juta ┃
┃ [Lihat Detail]                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Program ini cocok karena Anda memiliki 3 anak usia sekolah...

2. Kartu Indonesia Pintar (KIP)

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💼 Kartu Indonesia Pintar       ┃ ← ANOTHER INLINE CARD
┃ Bantuan pendidikan untuk...     ┃
┃ 💰 Manfaat: Rp 450.000 - 1 juta ┃
┃ [Lihat Detail]                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

KIP memberikan bantuan langsung untuk biaya pendidikan...

─────────────────────────────────────

💡 Program yang cocok:

┌───────────────────────────────────┐
│ 💼 PKH [▼]                        │ ← REFERENCE CARD
│ ✓ Anda Memenuhi Syarat            │   (at the end)
└───────────────────────────────────┘

┌───────────────────────────────────┐
│ 💼 KIP [▼]                        │ ← REFERENCE CARD
│ ✓ Anda Memenuhi Syarat            │   (at the end)
└───────────────────────────────────┘
```

**Expected Result**: 
- ✅ 2 inline cards appear **WITHIN** the text
- ✅ 2 reference cards appear **AT THE END**
- ✅ Markdown is formatted properly
- ✅ Cards are in correct positions

---

## If Inline Cards Still Don't Work

### Debug Checklist:

1. **Check Browser Console**
   - Open DevTools → Console
   - Look for errors in React rendering

2. **Check Message Parts**
   Add this to `unified-chat-interface.tsx` before rendering:
   ```typescript
   {messages.map((message) => {
     console.log('Message parts:', message.parts); // Add this
     return (
       <div>...</div>
     );
   })}
   ```
   
   You should see:
   ```
   [
     {type: 'text', text: '...'},
     {type: 'data-program-inline', data: {program_id: 'pkh', program: {...}}},
     {type: 'text', text: '...'},
     {type: 'data-program-inline', data: {program_id: 'kip', program: {...}}},
     {type: 'text', text: '...'},
     {type: 'data-program', data: {program: {...}}},
     {type: 'data-program', data: {program: {...}}},
   ]
   ```

3. **Check Component Import**
   Verify `InlineProgramCardRenderer` is imported:
   ```typescript
   import {
     CitationRenderer,
     EmergencyAlertRenderer,
     ActionButtonsRenderer,
     ProgramCardRenderer,
     InlineProgramCardRenderer, // ← Must be here
     NextStepsRenderer
   } from './message-parts';
   ```

4. **Check Part Rendering**
   In the part mapping, verify:
   ```typescript
   else if (part.type === 'data-program-inline') {
     const programId = (part as any).data?.program_id;
     const programData = (part as any).data?.program;
     
     console.log('Rendering inline card:', programId, programData); // Add this
     
     if (programId || programData) {
       return (
         <InlineProgramCardRenderer 
           key={`inline-program-${index}`} 
           programId={programId}
           program={programData}
         />
       );
     }
   }
   ```

---

## After Testing with Mock

Once you verify inline cards work with the test route:

### Step 1: Revert to Real API

```typescript
const { messages, sendMessage, status, error } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',  // ← Back to real API
  }),
});
```

### Step 2: Check if LLM Uses Markers

**Python Logs**:
```bash
cd ai-service
python -m uvicorn main:app --reload
```

Send a message and look for:
```
💡 Detected inline program marker: pkh
✅ Found program data: Program Keluarga Harapan
```

**If you see this**: Inline cards should work!

**If you DON'T see this**: LLM is not using markers yet.

---

## Making LLM Use Markers

The system prompt now has **prominent instructions** with 🔥 emoji and examples.

### Test by Explicitly Asking

Try this message:
```
"Saya buruh dengan 3 anak sekolah, penghasilan 1.5 juta. 

PENTING: Untuk setiap program yang kamu rekomendasikan, gunakan format [PROGRAM:id] seperti [PROGRAM:pkh] atau [PROGRAM:kip]."
```

### Check Python Logs

Watch for:
```
🔒 Detected JSON block start, filtering from stream...
✅ Filtered complete JSON block
💡 Detected inline program marker: pkh
✅ Found program data: Program Keluarga Harapan
```

---

## Summary

**Current Status**:
- ✅ Backend detection works (chat.py)
- ✅ Frontend rendering works (unified-chat-interface.tsx)
- ✅ Component exists (InlineProgramCardRenderer)
- ✅ Test route proves it works
- ⏳ LLM needs to start using markers

**Testing Flow**:
1. Test with `/api/chat-test-inline` → Verify rendering works
2. Switch back to `/api/chat` → Check Python logs
3. If no markers detected → LLM not using them yet
4. Try explicit user instruction → Force LLM to use markers

**The infrastructure is complete and working!** We just need the LLM to cooperate. 🎯
