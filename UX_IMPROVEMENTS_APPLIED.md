# UX Improvements Applied ✅

## Issues Fixed

### 1. ❌ Intent JSON Showing in Response
**Problem:** The JSON classification block was visible to users

**Fix:** Improved regex pattern in `intent_parser.py` to properly strip the JSON block
```python
# More aggressive regex to remove JSON with surrounding whitespace
cleaned_response = re.sub(r'\s*```json\s*\n?.*?\n?```\s*', '\n', response_text, ...)
```

**Result:** Users now only see the actual text response, no technical JSON

---

### 2. ❌ Generic "Cara mengajukan" Steps
**Problem:** Generic steps like "Datang ke Dinas Sosial" are not helpful

**Fix:** Removed generic next steps from intent parser
```python
# Skip generic steps - let the LLM text provide context-specific guidance
# Only show steps for emergencies (priority steps)
if escalation.get("detected") and escalation.get("priority") == "red":
    # Show emergency-specific steps
else:
    # Skip generic application steps
    pass
```

**Result:** 
- ✅ Emergency situations: Show priority steps (specific)
- ✅ Application queries: No "Cara mengajukan" section (LLM text provides context)
- ✅ Questions: No steps (as intended)

---

### 3. ✅ Citations at Bottom
**Problem:** Citations appeared in random order, not at the end

**Fix:** Reordered message part rendering in `unified-chat-interface.tsx`

**New Order:**
1. 🚨 Emergency alerts (if any) - **FIRST**
2. 💬 Text content
3. 📋 Program cards
4. 💡 Action buttons
5. ✓ Next steps (if any - emergency only)
6. 📚 Citations/References - **LAST** (at bottom)

**Result:** Clean visual hierarchy, references always at bottom

---

### 4. ✅ Program Cards Clickable
**Problem:** Program cards were not interactive

**Fix:** Wrapped cards with Link component in `message-parts.tsx`
```tsx
<Link href={`/programs/${program.id}`} className="block">
  <Card className="hover:bg-accent transition-colors cursor-pointer">
    {/* card content */}
  </Card>
</Link>
```

**Result:** 
- ✅ Cards now clickable
- ✅ Redirect to `/programs/{id}`
- ✅ Hover effect for visual feedback
- ✅ Cursor changes to pointer

---

## Visual Flow Now

```
┌─────────────────────────────────────────┐
│ 🚨 EMERGENCY ALERT (if critical)        │  ← TOP (if emergency)
├─────────────────────────────────────────┤
│ 💬 Text Response                        │
│                                         │
│ PKH adalah Program Keluarga Harapan... │
├─────────────────────────────────────────┤
│ 📋 Program Card (clickable)             │  ← Click → /programs/pkh
│ ┌─────────────────────────────────────┐ │
│ │ PKH - Program Keluarga Harapan      │ │
│ │ Benefit: Rp 3 juta/tahun...         │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 💡 Langkah selanjutnya:                 │
│ [📄 Siapkan Dokumen] [📋 Lihat Program] │
├─────────────────────────────────────────┤
│ ✓ Cara mengajukan: (emergency only)    │  ← Only if emergency
│ 1. 🚨 PRIORITAS: Hubungi darurat        │
│ 2. 📞 Telepon: 119                      │
├─────────────────────────────────────────┤
│ 📚 Referensi:                           │  ← BOTTOM (always last)
│ 📜 Dasar Hukum:                         │
│ • Permensos No. 1/2024                  │
│ 🌐 Sumber Web:                          │
│ • kemensos.go.id                        │
└─────────────────────────────────────────┘
```

---

## Files Modified

### 1. `ai-service/orchestrator/intent_parser.py`
- ✅ Improved JSON regex pattern
- ✅ Removed generic next steps
- ✅ Only show steps for emergencies

### 2. `src/components/unified-chat/unified-chat-interface.tsx`
- ✅ Reordered message part rendering
- ✅ Citations always at bottom

### 3. `src/components/unified-chat/message-parts.tsx`
- ✅ Made program cards clickable
- ✅ Added hover effect
- ✅ Link to `/programs/{id}`

---

## Testing Checklist

### Test 1: Intent JSON Not Visible
**Query:** "Apa itu PKH?"

**Check:**
- ✅ Should NOT see ```json { ... } ``` in response
- ✅ Should only see clean text

---

### Test 2: No Generic Steps
**Query:** "Saya buruh penghasilan 1.5 juta, 3 anak"

**Check:**
- ✅ Should see program cards
- ✅ Should see action buttons
- ✅ Should NOT see "Cara mengajukan" section
- ✅ LLM text should provide context-specific guidance

---

### Test 3: Citations at Bottom
**Query:** Any query

**Check:**
- ✅ Text appears first
- ✅ Program cards (if any)
- ✅ Action buttons (if any)
- ✅ Citations appear LAST (at bottom)

---

### Test 4: Program Cards Clickable
**Query:** "Saya buruh penghasilan 1.5 juta, 3 anak"

**Check:**
- ✅ Hover over program card → background changes
- ✅ Cursor changes to pointer
- ✅ Click card → redirects to `/programs/pkh` (or other program ID)

---

### Test 5: Emergency Still Works
**Query:** "Suami jatuh dari perancah"

**Check:**
- ✅ RED emergency alert at TOP
- ✅ Text response
- ✅ Program cards
- ✅ Action buttons (emergency hotline first)
- ✅ "Cara mengajukan" with priority steps (🚨 PRIORITAS)
- ✅ Citations at BOTTOM

---

## 🚀 Deploy

```bash
# Backend changes (intent parser)
cd ai-service
docker-compose down
docker-compose build
docker-compose up -d

# Frontend changes (hot reload, no rebuild needed)
# Just refresh browser
```

---

## 🎯 Summary

All feedback implemented:
1. ✅ Intent JSON hidden from users
2. ✅ No generic "Cara mengajukan" steps
3. ✅ Citations always at bottom
4. ✅ Program cards clickable → `/programs/{id}`

**Much cleaner UX now! 🎉**


---

## 5. ✅ Collapsible Program Cards (December 2024)

**Problem:** Program cards appeared as large, standalone components that cluttered chat messages. Users weren't sure if they were interactive or just reference information.

**Fix:** Implemented collapsible/expandable program cards with clear visual cues

**Changes:**
1. **Backend (`ai-service/api/chat.py`):**
   - ✅ Added `build_contextual_next_steps()` function with smart heuristics
   - ✅ Generates contextual next steps based on program eligibility, emergency status, and user situation
   - ✅ Ensures `intent_classification` is never exposed to client (internal use only)

2. **Frontend (`src/components/unified-chat/message-parts.tsx`):**
   - ✅ Created `CollapsibleProgramCard` component using Radix UI Collapsible
   - ✅ Added visual cue: "💡 Berikut detail program, klik untuk melihat lebih lanjut"
   - ✅ Collapsed state shows: program name, eligibility badge, chevron icon
   - ✅ Expanded state shows: full description, benefits, requirements, regulations, actions
   - ✅ Smooth animations (200ms transition)

3. **Next Steps Enhancement:**
   - ✅ Updated `NextStepsRenderer` to handle structured format: `{text, action, target}`
   - ✅ Renders action buttons for interactive steps:
     - "Ajukan" button for eligible programs
     - "Lihat" button for program details
     - "Hubungi" button for emergency contacts
   - ✅ Changed section heading from "Cara mengajukan" to "Langkah Selanjutnya"

**Heuristics for Contextual Next Steps:**
- **Emergency:** Prioritize safety actions ("Hubungi 119", "Pergi ke UGD")
- **Eligible programs:** "Ajukan [Program Name]", "Siapkan dokumen: KTP, KK, Surat Keterangan Penghasilan"
- **Partial match:** "Lengkapi informasi untuk [Program Name]: [missing fields]"
- **No eligible programs:** "Lihat semua program bantuan sosial", "Ceritakan lebih detail..."

**Result:**
- ✅ Chat messages are less cluttered (cards start collapsed)
- ✅ Clear affordance - users know cards are interactive
- ✅ Next steps are specific to user's situation, not generic
- ✅ Better mobile experience (collapsed state is compact)
- ✅ Accessible (keyboard navigation with Enter/Space)

**Visual Example:**

```
┌─────────────────────────────────────────────┐
│ 💬 Berdasarkan penghasilan Anda...         │
├─────────────────────────────────────────────┤
│ 💡 Berikut detail program, klik untuk      │
│    melihat lebih lanjut:                   │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ PKH - Program Keluarga Harapan   ▼     │ │  ← Collapsed
│ │ ✓ Anda Memenuhi Syarat                 │ │
│ │ Bantuan tunai untuk keluarga...        │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Click to expand]                           │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ BLT - Bantuan Langsung Tunai      ▲    │ │  ← Expanded
│ │ ✓ Anda Memenuhi Syarat                 │ │
│ │                                         │ │
│ │ Bantuan tunai sebesar Rp 600.000...    │ │
│ │                                         │ │
│ │ 💰 Manfaat: Rp 600.000/bulan           │ │
│ │ 📋 Syarat:                             │ │
│ │    • Penghasilan < Rp 2 juta           │ │
│ │    • Memiliki KTP                      │ │
│ │ 📜 Perpres No. 63/2017                 │ │
│ │                                         │ │
│ │ [Lihat Detail] [Ajukan Sekarang]      │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ ✓ Langkah Selanjutnya:                     │
│                                             │
│ 1. Ajukan PKH - Anda memenuhi syarat       │
│    [Ajukan]                                 │
│                                             │
│ 2. Siapkan dokumen: KTP, KK, Surat         │
│    Keterangan Penghasilan                   │
│                                             │
│ 3. Lihat detail lengkap PKH                │
│    [Lihat Detail]                           │
└─────────────────────────────────────────────┘
```

---

## Files Modified (December 2024)

### Backend
1. **`ai-service/api/chat.py`**
   - ✅ Added `build_contextual_next_steps()` function with JSDoc
   - ✅ Integrated contextual next steps generation
   - ✅ Added assertion to prevent `intent_classification` leakage

### Frontend
2. **`src/components/unified-chat/message-parts.tsx`**
   - ✅ Added `CollapsibleProgramCard` component
   - ✅ Updated `ProgramCardRenderer` to use collapsible variant
   - ✅ Enhanced `NextStepsRenderer` with action buttons and structured format support

3. **`package.json`**
   - ✅ Added `@radix-ui/react-collapsible` dependency

---

## Testing (December 2024)

### Test 1: Program Cards Collapsed by Default
**Query:** "Saya buruh penghasilan 1.5 juta, 3 anak"

**Check:**
- ✅ Program cards appear collapsed
- ✅ Visual cue text visible: "Berikut detail program, klik untuk melihat lebih lanjut"
- ✅ Chevron down icon indicates can expand

### Test 2: Click to Expand
**Action:** Click on collapsed program card

**Check:**
- ✅ Card expands smoothly (200ms transition)
- ✅ Full details visible (benefits, requirements, regulations)
- ✅ Action buttons appear ("Lihat Detail", "Ajukan Sekarang" if eligible)
- ✅ Chevron changes to up icon

### Test 3: Contextual Next Steps - Eligible
**Query:** "Saya buruh penghasilan 1.5 juta, 3 anak"

**Check:**
- ✅ Section heading is "Langkah Selanjutnya" (not "Cara mengajukan")
- ✅ First step: "Ajukan [Program Name] - Anda memenuhi syarat" with [Ajukan] button
- ✅ Second step: Specific documents listed
- ✅ Third step: "Lihat detail lengkap [Program Name]" with [Lihat Detail] button

### Test 4: Contextual Next Steps - Emergency
**Query:** "Suami jatuh dari perancah"

**Check:**
- ✅ First step: "Hubungi layanan darurat (119)..." with [Hubungi] button
- ✅ Second step: "Pergi ke UGD terdekat..."
- ✅ No generic program browsing steps

### Test 5: No intent_classification in Network Tab
**Query:** Any query

**Check:**
- ✅ Open browser DevTools → Network tab
- ✅ Find SSE stream response
- ✅ Verify metadata event does NOT contain `intent_classification` field

---

## 🚀 Deploy (December 2024)

```bash
# Backend (Python AI service)
cd ai-service
# Rebuild Docker container with new chat.py
docker-compose down
docker-compose build
docker-compose up -d

# Frontend (Next.js)
cd ..
# Install new dependency
npm install @radix-ui/react-collapsible
# Rebuild (or hot reload should pick up changes)
npm run build
npm run start
```

---

## 🎯 Summary (All Improvements)

1. ✅ Intent JSON hidden from users
2. ✅ No generic "Cara mengajukan" steps
3. ✅ Citations always at bottom
4. ✅ Program cards clickable
5. ✅ **NEW:** Collapsible program cards with visual cues
6. ✅ **NEW:** Contextual next steps based on eligibility and situation
7. ✅ **NEW:** Interactive action buttons in next steps
8. ✅ **NEW:** intent_classification secured (internal only)

**Clean, contextual, interactive UX! 🎉**
