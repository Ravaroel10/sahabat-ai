# Inline Program Cards - Implementation Guide

## Overview

BantuArah now supports **two types of program cards** in chat responses:

### 1. **Reference Program Cards** (End of Message)
- Rendered at the **end** of the response as structured data
- Shown as collapsible cards with full details
- Used for comprehensive program lists and final recommendations
- Sent via metadata after streaming completes

### 2. **Inline Program Cards** (Dynamic Placement)
- Rendered **anywhere within** the LLM's response text
- Embedded directly in the conversation flow
- Used for contextual explanations and comparisons
- Triggered by special markers: `[PROGRAM:id]`

---

## How It Works

### Backend Flow (Python AI Service)

1. **LLM Generation**: The LLM can include special markers in its response:
   ```
   Berdasarkan situasi Anda, saya rekomendasikan:
   
   [PROGRAM:pkh]
   
   Program ini memberikan bantuan tunai untuk keluarga...
   ```

2. **Marker Detection** (`api/chat.py`):
   - Regex pattern: `\[PROGRAM:([a-z0-9\-]+)\]`
   - Buffer tokens to detect complete markers
   - Extract program ID from marker

3. **Program Data Lookup**:
   - Search for program in the `programs` list
   - If found, include full program data
   - If not found, send program ID only

4. **SSE Event Emission**:
   ```python
   {
       "type": "inline-program",
       "program_id": "pkh",
       "program": {
           "id": "pkh",
           "name": "Program Keluarga Harapan",
           "description": "...",
           "benefits": "...",
           "eligibilityCriteria": [...],
           ...
       }
   }
   ```

### Frontend Flow (Next.js)

1. **SSE Processing** (`src/app/api/chat/route.ts`):
   - Receives `inline-program` events from Python
   - Transforms to `data-program-inline` for Vercel AI SDK
   - Preserves both `program_id` and `program` data

2. **Message Rendering** (`unified-chat-interface.tsx`):
   - Parts are rendered in order (text, inline cards, more text)
   - Inline cards appear exactly where markers were placed
   - Uses `InlineProgramCardRenderer` component

3. **Component Rendering** (`message-parts.tsx`):
   - **InlineProgramCardRenderer**: Compact inline card
     - Shows program name, description, benefits
     - "Lihat Detail" button
     - Distinct styling (primary/5 background)
   - **ProgramCardRenderer**: Full collapsible card at end
     - Expandable details
     - Eligibility badge
     - Application button if eligible

---

## Available Program IDs

Use these IDs in `[PROGRAM:id]` markers:

| Marker | Program Name |
|--------|-------------|
| `[PROGRAM:pkh]` | Program Keluarga Harapan |
| `[PROGRAM:bpnt]` | Bantuan Pangan Non Tunai |
| `[PROGRAM:blt-dana-desa]` | BLT Dana Desa |
| `[PROGRAM:bpjs-kesehatan]` | BPJS Kesehatan PBI |
| `[PROGRAM:bpjs-ketenagakerjaan]` | BPJS Ketenagakerjaan |
| `[PROGRAM:kip]` | Kartu Indonesia Pintar |
| `[PROGRAM:bantuan-lansia]` | Bantuan Lansia |

---

## LLM Instructions (System Prompt)

The system prompt now includes instructions for using inline cards:

```
### Inline Program Cards:
Anda dapat menyematkan kartu program LANGSUNG di tengah respons Anda menggunakan marker khusus:

**Format**: `[PROGRAM:program-id]`

**Kapan Menggunakan Inline Cards**:
- ✅ Saat menjelaskan program spesifik di tengah narasi
- ✅ Saat membandingkan beberapa program secara berurutan
- ✅ Saat memberikan detail program di dalam langkah-langkah

**Contoh Penggunaan**:
```
Berdasarkan situasi Anda, saya rekomendasikan Program Keluarga Harapan (PKH):

[PROGRAM:pkh]

Program ini memberikan bantuan tunai bulanan untuk keluarga dengan anak sekolah...
```
```

---

## Example Scenarios

### Scenario 1: Single Program Recommendation

**User**: "Saya buruh dengan 3 anak sekolah, penghasilan 1.5 juta"

**LLM Response**:
```
Berdasarkan situasi Anda, program yang paling cocok adalah Program Keluarga Harapan (PKH):

[PROGRAM:pkh]

Program ini memberikan bantuan tunai bulanan sebesar Rp 550.000 - Rp 3 juta per keluarga, 
tergantung jumlah anak dan komponennya. Anda memenuhi syarat karena...
```

**Result**: 
- Inline PKH card appears right after "PKH:" text
- User sees card immediately in context
- Full PKH card also appears at end (from metadata)

### Scenario 2: Multiple Program Comparison

**User**: "Anak saya mau sekolah tapi saya tidak mampu bayar"

**LLM Response**:
```
Untuk pendidikan anak, ada 2 program yang bisa membantu:

1. Kartu Indonesia Pintar (KIP) - bantuan langsung untuk biaya sekolah:

[PROGRAM:kip]

2. Program Keluarga Harapan (PKH) - bantuan tunai bulanan dengan komponen pendidikan:

[PROGRAM:pkh]

Saya sarankan ajukan keduanya karena bisa diterima bersamaan...
```

**Result**:
- KIP card appears after KIP explanation
- PKH card appears after PKH explanation
- Both cards also in metadata at end

### Scenario 3: Step-by-Step with Inline Cards

**User**: "Langkah apa yang harus saya lakukan?"

**LLM Response**:
```
Berikut langkah-langkah yang bisa Anda lakukan:

1. **Daftar PKH** untuk bantuan bulanan keluarga

[PROGRAM:pkh]

2. **Daftar BPNT** untuk bantuan sembako setiap bulan

[PROGRAM:bpnt]

3. Hubungi RT/RW untuk pendaftaran bersama
```

**Result**:
- PKH card embedded in step 1
- BPNT card embedded in step 2
- Clear visual flow matching the steps

---

## Benefits of Inline Cards

### UX Improvements:
1. **Contextual Information**: Cards appear exactly where they're discussed
2. **Better Readability**: Break up long text with interactive elements
3. **Reduced Scrolling**: No need to scroll to end for program details
4. **Visual Hierarchy**: Important programs stand out in the flow

### Technical Benefits:
1. **Flexible Layout**: LLM controls card placement dynamically
2. **Dual Reference**: Both inline (context) and end cards (reference)
3. **Streaming Support**: Cards appear as LLM generates response
4. **Graceful Fallback**: If program data missing, shows placeholder

---

## Implementation Status

✅ **Completed**:
- Backend marker detection (regex parsing)
- Program data lookup and attachment
- SSE event emission with full data
- Frontend SSE to Vercel AI SDK transformation
- InlineProgramCardRenderer component
- System prompt instructions for LLM

🔄 **In Progress**:
- Testing with real LLM responses
- Refining inline card styling
- Adding more program metadata

📋 **Future Enhancements**:
- Cache program data for faster lookups
- Support for program variants (provincial programs)
- Analytics for inline card click-through rates
- A/B testing inline vs end-only cards

---

## Files Modified

### Python Backend:
- `ai-service/prompts/system_prompt.py` - Added inline card instructions
- `ai-service/api/chat.py` - Enhanced marker detection with program lookup

### Next.js Frontend:
- `src/app/api/chat/route.ts` - Transform inline-program events
- `src/components/unified-chat/unified-chat-interface.tsx` - Render inline cards
- `src/components/unified-chat/message-parts.tsx` - InlineProgramCardRenderer

### Documentation:
- `INLINE_PROGRAM_CARDS.md` - This guide

---

## Testing

To test inline program cards:

1. **Start the AI service**:
   ```bash
   cd ai-service
   python -m uvicorn main:app --reload
   ```

2. **Start the Next.js dev server**:
   ```bash
   npm run dev
   ```

3. **Test with prompts that trigger program recommendations**:
   - "Saya buruh dengan 3 anak sekolah, penghasilan 1.5 juta"
   - "Anak saya mau sekolah tapi tidak mampu bayar"
   - "Saya lansia 72 tahun tinggal sendiri"

4. **Verify**:
   - Check Python logs for "💡 Detected inline program marker"
   - Check browser network tab for inline-program events
   - Confirm inline cards render in correct positions
   - Confirm both inline and end cards appear

---

## Troubleshooting

### Cards Not Appearing Inline:
- Check Python logs for marker detection
- Verify program ID matches available programs
- Check browser console for rendering errors
- Ensure LLM is using correct marker format

### Program Data Missing:
- Verify program exists in orchestrator's programs list
- Check program ID spelling/formatting
- Review program data structure in logs

### Styling Issues:
- Check InlineProgramCardRenderer component
- Verify Tailwind classes are compiled
- Test with different message lengths

---

## Summary

Inline program cards provide a **dynamic, context-aware way** to present program information within the natural flow of conversation. By allowing the LLM to place cards anywhere in its response using simple markers, we create a more engaging and informative user experience that adapts to each user's unique situation.

The two-card system (inline + reference) gives us the best of both worlds:
- **Inline**: Immediate context and visual breaks
- **Reference**: Comprehensive details and final summary
