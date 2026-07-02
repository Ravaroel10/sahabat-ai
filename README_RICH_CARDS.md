# Rich Message Cards - Complete Implementation

## 🎉 What You Now Have

A smart, context-aware chat system that displays rich message cards with citations, program recommendations, action buttons, and next steps - **but only when relevant**.

---

## 🧠 The Smart System

### It Understands Context

Your system now detects **4 types of user intent**:

1. **📖 Simple Questions** - Just learning
   - Example: "Apa itu PKH?"
   - Shows: Answer + citations only
   - NO spam features

2. **📄 Document Requests** - Ready to generate
   - Example: "Buatkan SKTM"
   - Shows: ONE big button → Auto-Birokrasi
   - Direct path to what they want

3. **🏃 Application Requests** - Ready to apply
   - Example: "Saya buruh, 3 anak, penghasilan 1.5 juta"
   - Shows: Full journey (cards + actions + steps)
   - Complete guidance

4. **🚨 Emergencies** - Urgent help needed
   - Example: "Suami jatuh dari perancah"
   - Shows: RED alert + priority actions first
   - Immediate help

---

## 📦 What's Included

### Rich Message Parts

1. **📚 Citations**
   - Multiple types: regulations, websites, RAG docs, institutions
   - Smart grouping: "Dasar Hukum", "Sumber Web", etc.
   - Expandable sections

2. **📋 Program Cards**
   - Extracted from RAG knowledge base
   - Shows: name, description, benefits, regulations
   - Compact, scannable design

3. **🚨 Emergency Alerts**
   - RED priority display
   - Appears FIRST in message
   - Immediate action steps
   - Emergency contacts (clickable phone numbers)

4. **💡 Action Buttons**
   - Section: "💡 Langkah selanjutnya"
   - Smart suggestions:
     - 📄 Siapkan Dokumen Otomatis (Auto-Birokrasi)
     - 📋 Lihat Semua Program (Marketplace)
     - 🚨 Hubungi Darurat (emergencies)
   - Primary/outline styling for hierarchy

5. **✓ Next Steps**
   - Section: "✓ Cara mengajukan"
   - 5-6 step process for applications
   - Clear, actionable guidance
   - Priority steps for emergencies

---

## 🎯 The Smart Rules

| User Query Type | Cards | Actions | Next Steps | Why |
|----------------|-------|---------|------------|-----|
| "Apa itu PKH?" | ❌ No | ❌ No | ❌ No | Let them learn first |
| "Buatkan SKTM" | ❌ No | ✅ 1 button | ❌ No | Direct to tool |
| "Saya butuh bantuan" | ✅ 2-3 | ✅ 2 buttons | ✅ 5-6 steps | Full journey |
| "Suami jatuh" | ✅ 2-3 | ✅ Hotline first | ✅ Priority | Emergency! |

### Detection Keywords

**Simple Questions:**
- apa itu, bagaimana, berapa, kapan, dimana, siapa, kenapa, apakah, jelaskan, info

**Document Requests:**
- sktm, surat, dokumen, persyaratan, berkas, formulir, template, buatkan

**Emergencies:**
- Handled by `orchestrator/escalation.py`
- Medical, financial, violence, disaster keywords
- Red priority for critical situations

---

## 🔧 Technical Architecture

### Stack

**Frontend:**
- Next.js 15 (App Router)
- Vercel AI SDK (`@ai-sdk/react`)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui

**Backend:**
- Python FastAPI
- **LiteLLM** (NOT Vercel AI SDK - that's frontend only!)
- OpenRouter free models (`openrouter/owl-alpha`)
- ChromaDB (RAG with HuggingFace embeddings)
- Exa API (web search)

**Key Point:** Vercel AI SDK is ONLY for frontend streaming UI. LiteLLM handles actual LLM calls in Python.

### Data Flow

```
User Query
    ↓
[Frontend] Vercel AI SDK useChat
    ↓
[Next.js API] /api/chat/route.ts (proxy)
    ↓
[Python] FastAPI /chat (SSE stream)
    ↓
[Orchestrator] orchestrator.py
    ├─ Escalation Detection
    ├─ RAG Search (ChromaDB)
    ├─ Extract Programs
    ├─ Context Detection (SMART!)
    ├─ Generate Actions (SMART!)
    ├─ Generate Steps (SMART!)
    └─ LLM Call (LiteLLM)
    ↓
[Stream Back] SSE events
    ├─ data: {"type":"token","data":"..."}
    ├─ data: {"type":"metadata","programs":[...],"actions":[...],...}
    └─ data: {"type":"done"}
    ↓
[Next.js API] Transform to Vercel AI SDK format
    ├─ {type: 'text-delta', ...}
    ├─ {type: 'data-citation', data: {...}}
    ├─ {type: 'data-program', data: {...}}
    ├─ {type: 'data-actions', data: {...}}
    └─ {type: 'data-steps', data: {...}}
    ↓
[Frontend] React components render
    ├─ CitationRenderer
    ├─ ProgramCardRenderer
    ├─ EmergencyAlertRenderer
    ├─ ActionButtonsRenderer
    └─ NextStepsRenderer
```

---

## 📁 File Structure

### Python Backend (Requires Docker rebuild!)

```
ai-service/
├── orchestrator/
│   ├── orchestrator.py          ← SMART LOGIC HERE
│   ├── escalation.py            ← Emergency detection
│   └── content_transformer.py
├── api/
│   └── chat.py                  ← SSE emission
├── tools/
│   ├── rag.py                   ← ChromaDB
│   └── official_search.py       ← Exa API
└── services/
    └── llm.py                   ← LiteLLM
```

### Next.js Frontend (Hot reload, no rebuild needed)

```
src/
├── types/
│   └── llm-response.ts          ← Type definitions
├── components/
│   └── unified-chat/
│       ├── unified-chat-interface.tsx  ← Main component
│       └── message-parts.tsx          ← Renderers
└── app/
    └── api/
        └── chat/
            └── route.ts         ← Backend proxy
```

---

## 🚀 Deployment

### Step 1: Rebuild Python Service

**CRITICAL:** Code changed in `orchestrator.py` - Docker rebuild required!

```bash
# Navigate to project
cd k:\projects\dev\bantu-arah

# Navigate to ai-service
cd ai-service

# Stop containers
docker-compose down

# Rebuild (forces new image with updated code)
docker-compose build

# Start services
docker-compose up -d

# Watch logs
docker-compose logs -f
```

### Step 2: Verify Services

```bash
# Check containers running
docker-compose ps

# Test health endpoint
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

### Step 3: Test in Browser

1. Open frontend (usually `http://localhost:3000`)
2. Run the 4 test scenarios below

---

## 🧪 Testing Guide

### Test 1: Simple Question ❌ NO SPAM

**Query:**
```
Apa itu PKH?
```

**Expected Response:**
- ✅ Text answer explaining PKH
- ✅ 📚 Sumber Informasi section
  - 📜 Dasar Hukum (if available)
  - 🌐 Sumber Web (if available)
- ❌ NO program cards
- ❌ NO "Langkah selanjutnya" buttons
- ❌ NO "Cara mengajukan" steps

**Verify Logs:**
```bash
docker-compose logs | grep "Actions generated"
# Should show: Actions generated: 0
```

---

### Test 2: Document Request 📄 DIRECT LINK

**Query:**
```
Buatkan saya SKTM
```

**Expected Response:**
- ✅ Text confirmation
- ✅ **ONE big button:**
  - "📄 Buat Dokumen Sekarang" (primary/filled style)
  - Links to: `/auto-birokrasi?documents=sktm&program=general`
- ❌ NO program cards
- ❌ NO "Cara mengajukan" steps

**Verify Logs:**
```bash
docker-compose logs | grep "Actions generated"
# Should show: Actions generated: 1
```

---

### Test 3: Application 📋 FULL JOURNEY

**Query:**
```
Saya buruh bangunan, penghasilan Rp 1,5 juta per bulan, punya 3 anak sekolah
```

**Expected Response:**
- ✅ Text explanation
- ✅ **Program cards** (2-3 cards)
  - PKH, KIP, BPNT, etc.
  - Shows: name, description, benefits
- ✅ **📚 Sumber Informasi**
  - Citations grouped by type
- ✅ **💡 Langkah selanjutnya** (ACTION BUTTONS)
  - 📄 Siapkan Dokumen Otomatis (primary)
  - 📋 Lihat Semua Program (outline)
- ✅ **✓ Cara mengajukan** (PROCESS STEPS)
  1. Gunakan Auto-Birokrasi...
  2. Atau siapkan manual: KTP, KK...
  3. Datang ke Dinas Sosial...

**Verify Logs:**
```bash
docker-compose logs | grep -E "(Programs|Actions|Next steps)"
# Should show:
# Programs extracted: 2
# Actions generated: 2
# Next steps generated: 5 (or more)
```

---

### Test 4: Emergency 🚨 PRIORITY FIRST

**Query:**
```
Suami saya jatuh dari perancah dan sekarang di rumah sakit
```

**Expected Response:**
- ✅ **🚨 RED ALERT BOX** (appears FIRST, before any text)
  - "Situasi Darurat Terdeteksi"
  - Keywords detected
- ✅ Text response
- ✅ Program cards (JKK, BSU)
- ✅ **💡 Langkah selanjutnya**
  - 🚨 Hubungi Layanan Darurat (FIRST, primary)
  - 📄 Siapkan Dokumen Klaim
- ✅ **✓ Cara mengajukan**
  - 🚨 PRIORITAS: Hubungi darurat...
  - 📞 Telepon: 119

**Verify Logs:**
```bash
docker-compose logs | grep -E "(Escalation|Priority)"
# Should show:
# Escalation detected: True
# Priority: red
```

---

## ✅ Success Checklist

After deployment, all these should be true:

- [ ] **Container rebuilt successfully**
  ```bash
  docker-compose ps
  # Shows recent "Created" timestamp
  ```

- [ ] **Health endpoint works**
  ```bash
  curl http://localhost:8000/health
  # Returns: {"status": "ok"}
  ```

- [ ] **Simple question → NO spam**
  - Query: "Apa itu PKH?"
  - See: Answer + citations only
  - Log: `Actions generated: 0`

- [ ] **Document request → Direct link**
  - Query: "Buatkan SKTM"
  - See: ONE button only
  - Log: `Actions generated: 1`

- [ ] **Application → Full journey**
  - Query: "Penghasilan 1.5 juta, 3 anak"
  - See: Cards + 2 buttons + steps
  - Log: `Programs extracted: 2`, `Actions generated: 2`

- [ ] **Emergency → Alert first**
  - Query: "Suami jatuh"
  - See: RED box at top
  - Log: `Priority: red`

- [ ] **NO duplicate sections**
  - ActionButtons: "💡 Langkah selanjutnya"
  - NextSteps: "✓ Cara mengajukan"
  - NOT: Two "Langkah selanjutnya/berikutnya"

---

## 🐛 Troubleshooting

### Issue: Simple questions still show actions

**Symptom:** "Apa itu PKH?" shows buttons/cards

**Solution:**
```bash
# Check if rebuild worked
docker-compose exec ai-service cat orchestrator/orchestrator.py | grep "is_simple_question"

# If not found, rebuild failed - try again
cd ai-service
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Container won't start

**Symptom:** `docker-compose up -d` fails

**Solution:**
```bash
# Check what's wrong
docker-compose logs

# Nuclear option
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Programs not extracted

**Symptom:** Application queries show 0 programs

**Debug:**
```bash
# Test RAG directly
docker-compose exec ai-service python -c "
from tools.rag import search_rag
results = search_rag('bantuan keluarga miskin')
print(f'Found: {len(results)} results')
for r in results:
    print(r.get('metadata', {}).get('record_type'))
"

# Expected: Should see multiple 'program' types
```

**Fix:** Check RAG data ingestion (see `ai-service/INGEST_GUIDE.md`)

### Issue: Two "Langkah selanjutnya" showing

**Symptom:** Duplicate section labels

**Check:**
```typescript
// In: src/components/unified-chat/message-parts.tsx
// Line ~349

// ActionButtons should say:
"💡 Langkah selanjutnya"

// NextSteps should say:
"✓ Cara mengajukan"
```

If still wrong, check git status and ensure all files committed.

---

## 📚 Documentation Files

**Quick Start:**
- `DEPLOY_NOW.md` - 3-step deployment
- `START_HERE.md` - Quick overview

**Technical Details:**
- `IMPLEMENTATION_STATUS.md` - Complete implementation report
- `SMART_CONTEXT_AWARE_FEATURES.md` - Smart behavior rules
- `ENHANCED_CITATIONS_AND_AUTOBIROKRASI.md` - Citation types
- `PHASE_3_4_IMPLEMENTATION_COMPLETE.md` - Backend details

**Extended Guides:**
- `DEPLOY_SMART_FEATURES.md` - Extended deployment guide
- `RICH_CARDS_TESTING.md` - Testing instructions
- `RICH_CARDS_ARCHITECTURE.md` - Architecture diagrams

---

## 🎯 Key Features

### 1. Context-Aware Display
- Detects user intent: question, document, application, emergency
- Shows only relevant features
- No spam, no overwhelming users

### 2. Multiple Citation Types
- Regulations (Permensos, UU, Perpres)
- Web sources (Kemensos, official sites)
- RAG documents (program database)
- Institution info (Dinsos contacts)
- Smart grouping with custom section labels

### 3. Auto-Birokrasi Integration
- Direct links for document requests
- Pre-filled document types and program IDs
- One-click document generation

### 4. Emergency Prioritization
- RED alert boxes for critical situations
- Hotline buttons with `tel:` links
- Priority action ordering
- Immediate steps first

### 5. Smart Action Generation
- Context detection before generation
- Respects user intent
- Primary/outline styling hierarchy
- Action buttons vs process steps (clear separation)

---

## 🏆 What Makes This Special

### Before (SPAM):
```
User: "Apa itu PKH?"

System:
- Answer
- [PKH Card] ← Didn't ask for this
- [KIP Card] ← Didn't ask for this
- 💡 Langkah selanjutnya: ← Pushy
  [📄 Siapkan Dokumen]
  [📋 Lihat Program]
- ✓ Langkah berikutnya: ← DUPLICATE!
  1. Siapkan dokumen...
```

**User thinks:** "Too much! I just asked what it is!"

### After (SMART):
```
User: "Apa itu PKH?"

System:
- Answer (clear explanation)
- 📚 Sumber Informasi:
  - 📜 Permensos No. 1/2024
  - 🌐 kemensos.go.id

[NOTHING ELSE]
```

**User thinks:** "Perfect! If I want more, I'll ask."

---

## 💡 Next Steps (Optional)

These are NOT required but could enhance the system:

1. **User Feedback** - "Was this helpful?" buttons
2. **Analytics** - Track which actions users click most
3. **A/B Testing** - Test different button placements
4. **Personalization** - Remember user preferences
5. **Smart Recommendations** - ML-based program matching

---

## 🎉 You're Ready!

Your system is now **smart, context-aware, and user-friendly**.

**Deploy now:**
```bash
cd ai-service
docker-compose down
docker-compose build
docker-compose up -d
docker-compose logs -f
```

**Then test the 4 scenarios above.**

Questions? Check the docs or logs!

🚀 **Happy deploying!**
