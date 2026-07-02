# Smart Context-Aware Features ✅

## Problem Fixed

**Before:** System was spamming ALL features on EVERY query:
- ❌ Giving program cards for non-sosial questions
- ❌ Showing "langkah selanjutnya" for simple questions
- ❌ TWO "langkah selanjutnya" sections (redundant!)
- ❌ Generic actions that didn't match user intent

**After:** Smart, context-aware feature display:
- ✅ Only show relevant features
- ✅ Single clear action path
- ✅ Respect user intent (question vs application vs document)

---

## Smart Rules Implemented

### Rule 1: Simple Questions → Minimal Response

**Query Type:** Informational questions
**Examples:**
- "Apa itu PKH?"
- "Bagaimana cara mendaftar KIP?"
- "Berapa bantuan BPNT?"

**Response:**
- ✅ Text answer
- ✅ Citations (source of info)
- ❌ NO program cards (they didn't ask for recommendations)
- ❌ NO action buttons (let them ask naturally)
- ❌ NO next steps (they're still exploring)

**Why:** Don't be pushy. They're just learning, not applying yet.

---

### Rule 2: Document Requests → Direct Auto-Birokrasi

**Query Type:** Asking for documents
**Examples:**
- "Buatkan SKTM"
- "Saya butuh surat permohonan bantuan"
- "Gimana cara buat surat keterangan?"

**Response:**
- ✅ Text confirmation
- ✅ **ONE big button: "📄 Buat Dokumen Sekarang"** (primary style)
- ✅ Direct link to Auto-Birokrasi with correct document type
- ❌ NO program cards (they want docs, not program info)
- ❌ NO next steps (button is the only step)

**Why:** They know what they want. Give them the tool immediately.

---

### Rule 3: Program Applications → Full Journey

**Query Type:** Seeking help/eligibility check
**Examples:**
- "Saya buruh penghasilan 1.5 juta, bisa dapat bantuan?"
- "Program apa yang cocok untuk saya?"
- "Anak saya mau sekolah tapi tidak ada biaya"

**Response:**
- ✅ Text explanation
- ✅ **Program cards** (2-3 relevant programs from RAG)
- ✅ Citations (regulations + sources)
- ✅ **Action buttons:**
  - 📄 Siapkan Dokumen Otomatis (Auto-Birokrasi)
  - 📋 Lihat Semua Program (Marketplace)
- ✅ **Next steps:** "Cara mengajukan" (5-6 steps)

**Why:** They're ready to apply. Show full path from eligibility to application.

---

### Rule 4: Emergencies → Priority Actions Only

**Query Type:** Critical/urgent situations
**Examples:**
- "Suami jatuh dari perancah"
- "Rumah saya kebakaran"
- "Anak saya sakit keras dan tidak punya biaya"

**Response:**
- ✅ **RED emergency alert box** (appears FIRST)
- ✅ Immediate action steps
- ✅ Emergency contacts (clickable phone numbers)
- ✅ **Priority action:** 🚨 Hubungi Layanan Darurat (first button)
- ✅ Relevant emergency programs (JKK, BSU)
- ✅ **Priority steps** starting with "🚨 PRIORITAS:"
- ❌ NO exploratory actions (marketplace, etc.)

**Why:** In emergencies, every second counts. Prioritize urgent actions.

---

### Rule 5: No Programs Found → Minimal Guidance

**Query Type:** Off-topic or no matching programs
**Examples:**
- "Gimana cara beli rumah?"
- "Saya pengusaha sukses, ada program?"
- "Tips investasi saham"

**Response:**
- ✅ Text answer (explain nicely)
- ❌ NO program cards (none match)
- ✅ **One action:** 📋 Jelajahi Program Bantuan (if relevant to sosial)
- ❌ OR NO actions (if completely off-topic)
- ❌ NO next steps (no clear path)

**Why:** Don't force actions when there's no good match.

---

## Fixed: Two "Langkah Selanjutnya"

**Before:**
```
💡 Langkah selanjutnya:  ← ActionButtons section
[📄 Siapkan Dokumen]
[📋 Lihat Program]

✓ Langkah berikutnya:    ← NextSteps section (DUPLICATE!)
1. Siapkan dokumen...
2. Datang ke Dinas Sosial...
```

**After:**
```
💡 Langkah selanjutnya:  ← ActionButtons (ACTIONS)
[📄 Siapkan Dokumen]
[📋 Lihat Program]

✓ Cara mengajukan:      ← NextSteps (PROCESS)
1. Gunakan fitur Auto-Birokrasi...
2. Atau siapkan manual: KTP, KK...
3. Datang ke Dinas Sosial...
```

**Changes:**
- ActionButtons: "💡 Langkah selanjutnya" (what to DO)
- NextSteps: "✓ Cara mengajukan" (HOW to do it)
- Clear separation of purpose

---

## Detection Logic

### Simple Question Detection

```python
question_keywords = [
    'apa itu', 'bagaimana', 'berapa', 'kapan', 
    'dimana', 'siapa', 'kenapa', 'apakah', 
    'jelaskan', 'info'
]

is_simple_question = any(
    message.lower().startswith(kw) 
    for kw in question_keywords
)

if is_simple_question and not programs:
    # Return only text + citations
    # NO actions, NO next steps
    return
```

### Document Request Detection

```python
document_keywords = [
    'sktm', 'surat', 'dokumen', 'persyaratan', 
    'berkas', 'formulir', 'template', 'buatkan'
]

is_document_request = any(
    kw in message.lower() 
    for kw in document_keywords
)

if is_document_request:
    # Return DIRECT Auto-Birokrasi link
    return [{
        "type": "auto-birokrasi",
        "label": "📄 Buat Dokumen Sekarang",
        "href": f"/auto-birokrasi?documents={doc_type}&program={program_id}",
    }]
```

### Emergency Detection

```python
# Already exists in escalation.py
if escalation['detected'] and escalation['priority'] == 'red':
    # Priority emergency actions
    # NO exploratory features
    return priority_actions
```

---

## Smart Action Generation Flow

```python
def _generate_actions(programs, escalation, message):
    """Context-aware action generation"""
    
    # 1. Check query type
    is_document_request = detect_document_request(message)
    is_simple_question = detect_simple_question(message)
    
    # 2. EMERGENCY → Hotline first
    if escalation['priority'] == 'red':
        return [emergency_hotline_action]
    
    # 3. DOCUMENT REQUEST → Direct link
    if is_document_request:
        return [direct_autobirokrasi_action]
    
    # 4. SIMPLE QUESTION → No actions
    if is_simple_question and not programs:
        return []
    
    # 5. PROGRAMS FOUND → Full journey
    if programs:
        return [
            autobirokrasi_action,
            marketplace_action,
        ]
    
    # 6. NO MATCH → Minimal guidance
    if not is_simple_question:
        return [marketplace_action]
    
    return []
```

---

## Mock API Examples

### Test 1: Simple Question

**Endpoint:** `/api/chat-mock-question`

**Query:** "Apa itu PKH?"

**Response:**
```
Text: "PKH adalah program bantuan sosial bersyarat..."

📚 Sumber Informasi:
📜 Dasar Hukum:
• Permensos No. 1/2024
🌐 Sumber Web:
• Program PKH - Kemensos

[NO ACTIONS]
[NO NEXT STEPS]
```

### Test 2: Document Request

**Endpoint:** `/api/chat-mock-document`

**Query:** "Buatkan SKTM"

**Response:**
```
Text: "Tentu! Klik tombol di bawah..."

[📄 Buat Dokumen Sekarang] ← PRIMARY BUTTON

📚 Referensi:
📄 Dokumen Terkait:
• Template SKTM

[NO PROGRAM CARDS]
[NO NEXT STEPS]
```

### Test 3: Program Application

**Endpoint:** `/api/chat-mock` (existing)

**Query:** "Penghasilan 1.5 juta, 3 anak"

**Response:**
```
Text: "Berdasarkan situasi Anda..."

[PKH Card]
[KIP Card]

📚 Sumber Informasi:
...

💡 Langkah selanjutnya:
[📄 Siapkan Dokumen]
[📋 Lihat Program]

✓ Cara mengajukan:
1. Gunakan Auto-Birokrasi...
2. Atau siapkan manual...
3. Datang ke Dinas Sosial...
```

### Test 4: Emergency

**Endpoint:** `/api/chat-mock-emergency` (existing)

**Query:** "Jatuh dari perancah"

**Response:**
```
[RED EMERGENCY ALERT BOX]

Text: "Saya memahami ini darurat..."

[JKK Card]
[BSU Card]

💡 Langkah selanjutnya:
[🚨 Hubungi Darurat] ← FIRST
[📄 Siapkan Dokumen Klaim]

✓ Cara mengajukan:
1. 🚨 PRIORITAS: Hubungi darurat
2. Pastikan kondisi aman...
```

---

## Benefits

### 1. Less Overwhelming
Users see only what's relevant to their current need.

### 2. Clear Intent Recognition
System understands: question, application, document, emergency.

### 3. Faster Path to Action
Direct links when intent is clear (document requests).

### 4. Natural Conversation
Simple questions don't force you into application flow.

### 5. Emergency Prioritization
Critical situations get immediate, focused help.

---

## Implementation Details

### Files Modified

1. **`ai-service/orchestrator/orchestrator.py`**
   - `_generate_actions()` - Added context detection
   - `_generate_next_steps()` - Added context detection
   - Both now accept `message` parameter

2. **`src/components/unified-chat/message-parts.tsx`**
   - Changed NextSteps label: "Langkah berikutnya" → "Cara mengajukan"
   - Clear separation from ActionButtons

3. **Mock APIs Created:**
   - `/api/chat-mock-question` - Simple question scenario
   - `/api/chat-mock-document` - Document request scenario

---

## Testing the Smart Behavior

### Test Simple Question

**Query:** "Apa itu PKH?"

**Expected:**
- ✅ Text answer
- ✅ Citations
- ❌ NO program cards
- ❌ NO actions
- ❌ NO next steps

**Logs:**
```
📋 Programs extracted: 0
   Actions generated: 0  ← Good!
   Next steps generated: 0  ← Good!
```

### Test Document Request

**Query:** "Buatkan saya SKTM"

**Expected:**
- ✅ Text confirmation
- ✅ ONE primary button: "📄 Buat Dokumen Sekarang"
- ❌ NO program cards
- ❌ NO next steps

**Logs:**
```
📋 Programs extracted: 0
   Actions generated: 1  ← Just Auto-Birokrasi
   Next steps generated: 0  ← Good!
```

### Test Application

**Query:** "Saya buruh penghasilan 1.5 juta"

**Expected:**
- ✅ Program cards (2-3)
- ✅ Actions (Auto-Birokrasi + Marketplace)
- ✅ Next steps (5-6 steps)

**Logs:**
```
📋 Programs extracted: 2
   Actions generated: 2  ← Auto-Birokrasi + Marketplace
   Next steps generated: 5  ← Full application flow
```

---

## Edge Cases Handled

### 1. Off-Topic Query

**Query:** "Gimana cara beli mobil?"

**Response:**
- Text: "Maaf, saya fokus pada bantuan sosial..."
- NO actions (completely off-topic)
- NO next steps

### 2. Eligibility Question (No Programs)

**Query:** "Saya penghasilan 10 juta, bisa dapat bantuan?"

**Response:**
- Text: "Berdasarkan penghasilan Anda yang cukup tinggi..."
- **One action:** 📋 Jelajahi Program (fallback)
- NO next steps (no clear path)

### 3. Mixed Intent

**Query:** "Apa itu PKH dan bagaimana cara daftar?"

**Response:**
- Text: "PKH adalah... Untuk mendaftar..."
- **Actions:** Auto-Birokrasi + Marketplace (they asked "how to apply")
- **Next steps:** Application process

---

## Summary

✅ **Context-aware feature display**
- Simple questions → minimal response
- Document requests → direct Auto-Birokrasi
- Applications → full journey
- Emergencies → priority actions

✅ **Fixed duplicate sections**
- ActionButtons: "💡 Langkah selanjutnya" (actions)
- NextSteps: "✓ Cara mengajukan" (process)

✅ **Smart detection**
- Question keywords
- Document keywords
- Emergency escalation

✅ **Better UX**
- Less overwhelming
- Clearer intent recognition
- Faster path to action
- Natural conversation flow

**The system is now smart, not spammy! 🧠**
