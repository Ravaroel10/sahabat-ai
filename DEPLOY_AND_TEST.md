# Deploy and Test - Quick Reference

## 🚀 Deployment Steps

### 1. Rebuild Python Service

```bash
cd ai-service
docker-compose down
docker-compose build
docker-compose up -d
```

**Why rebuild?** Code changes require rebuild, not just restart.

### 2. Verify Service Started

```bash
docker-compose -f ai-service/docker-compose.yml logs --tail=50
```

**Expected:**
```
ai-service-1  | INFO:     Uvicorn running on http://0.0.0.0:8000
ai-service-1  | [startup] Configuration validated successfully.
ai-service-1  | [startup] ChromaDB connected.
```

### 3. Check Frontend is NOT Using Mock

**File:** `src/components/unified-chat/unified-chat-interface.tsx`

**Line 45 should be:**
```typescript
api: '/api/chat',  // ✅ Real API
```

**NOT:**
```typescript
api: '/api/chat-mock',  // ❌ Mock API
```

---

## 🧪 Testing

### Test 1: Normal Query (Program Recommendations)

**Query:**
> "Saya buruh bangunan, penghasilan Rp 1,5 juta/bulan, punya 3 anak sekolah"

**Expected Result:**
- ✅ Streaming text response
- ✅ **Program cards** (2-3 cards from RAG)
  - PKH (Program Keluarga Harapan)
  - KIP (Kartu Indonesia Pintar)
  - Or other relevant programs
- ✅ **Citations section** showing:
  - 📜 Dasar Hukum (if regulations found)
  - 📄 Dokumen Terkait (RAG sources)
- ✅ **Action buttons** (4 buttons):
  - 📄 Siapkan Dokumen Otomatis (primary/filled)
  - 📋 Lihat Semua Program
  - 📝 Download Template (maybe)
  - 🌐 Website Kemensos
- ✅ **Next steps** (6 steps):
  - Starting with "📄 Siapkan dokumen dengan Auto-Birokrasi"

### Test 2: Emergency Query

**Query:**
> "Suami saya jatuh dari perancah dan sekarang di rumah sakit"

**Expected Result:**
- ✅ **RED emergency alert box** (appears first)
  - "⚠️ 🏥 Situasi Darurat Terdeteksi"
  - Immediate action steps
  - Emergency contacts with phone numbers
- ✅ Streaming text
- ✅ **Program cards** (JKK, BSU)
- ✅ **Action buttons** with emergency hotline first
- ✅ **Next steps** with "🚨 PRIORITAS" step

### Test 3: No Programs Found

**Query:**
> "Apa itu bantuan sosial?"

**Expected Result:**
- ✅ Streaming text (general explanation)
- ❌ No program cards (none match query)
- ✅ **Citations** (may have web sources)
- ✅ **Action buttons** (generic):
  - 📋 Lihat Semua Program
  - 🌐 Website Kemensos
- ✅ **Next steps** (generic):
  - "Hubungi Dinas Sosial untuk informasi"

---

## 📊 Monitoring

### Watch Logs in Real-Time

```bash
docker-compose -f ai-service/docker-compose.yml logs -f
```

### What to Look For

**During query processing:**
```
🔍 STEP 2: RAG knowledge base search...
✅ RAG returned 5 results
📚 Citations extracted: 2
📋 Programs extracted: 2  ← Check this!
   Result 1: score=0.850, source=programs, type=program
   Result 2: score=0.823, source=programs, type=program

🎯 STEP 6: Generating actions and next steps...
   Actions generated: 4  ← Check this!
   Next steps generated: 6  ← Check this!
```

**If problems:**
```
📋 Programs extracted: 0  ← No programs found!
   Actions generated: 2  ← Only generic actions
```

---

## 🐛 Troubleshooting

### Issue: No Program Cards

**Symptoms:**
- Text streams fine
- Citations show
- But no program cards

**Debug Steps:**

1. **Check RAG has data:**
```bash
docker-compose -f ai-service/docker-compose.yml exec ai-service python -c "from database.chroma import get_chroma_service; print(get_chroma_service().collection.count())"
```

**Expected:** `44` (or more)

2. **Check RAG returns results:**
Look in logs for:
```
✅ RAG returned 5 results
📋 Programs extracted: 0  ← Problem here!
```

3. **Check metadata structure:**
```bash
docker-compose -f ai-service/docker-compose.yml exec ai-service python -c "
from tools.rag import search_rag
results = search_rag('bantuan keluarga miskin')
for r in results:
    print(r.get('metadata', {}))
"
```

**Expected to see:**
```python
{'record_type': 'program', 'record_id': 'pkh', 'name': 'PKH', ...}
```

4. **Re-ingest if metadata wrong:**
```bash
docker-compose -f ai-service/docker-compose.yml exec ai-service python -m ingest.ingest
```

### Issue: Actions Not Primary Styled

**Symptoms:**
- Auto-Birokrasi button looks same as others
- Not standing out

**Check:**
Frontend should render Auto-Birokrasi with `variant="default"` (filled style).

**File:** `src/components/unified-chat/message-parts.tsx`

```typescript
variant={action.type === 'auto-birokrasi' ? 'default' : 'outline'}
```

### Issue: Citations Not Grouped

**Symptoms:**
- All citations show as one list
- No "Dasar Hukum" vs "Sumber Web" separation

**Check:**
Backend should emit different citation types.

**Logs should show:**
```
Citations: regulations=2, websites=1
```

### Issue: Emergency Not Detected

**Symptoms:**
- Emergency query doesn't show red alert
- No priority in next steps

**Check escalation detection:**
```bash
docker-compose -f ai-service/docker-compose.yml exec ai-service python -c "
from orchestrator.escalation import detect_escalation
result = detect_escalation('jatuh dari perancah rumah sakit')
print(result)
"
```

**Expected:**
```python
{'detected': True, 'priority': 'red', 'keywords': ['jatuh', 'rumah sakit'], ...}
```

---

## 📈 Performance Metrics

### Expected Timing

**Normal query:**
- RAG search: 100-300ms
- Program extraction: 5-10ms
- LiteLLM TTFT: 500-1500ms
- Streaming: 1-3 seconds
- **Total:** 2-5 seconds

**Emergency query:**
- Escalation detection: 1-5ms
- RAG search: 100-300ms
- Emergency metadata: 1-2ms
- LiteLLM TTFT: 500-1500ms
- **Total:** 2-5 seconds

### If Slower Than Expected

**Check:**
1. Network latency to OpenRouter
2. ChromaDB performance
3. HuggingFace embedding API response time

**Optimize:**
- Use local embedding model instead of API
- Increase ChromaDB cache
- Use faster OpenRouter model

---

## ✅ Success Checklist

After testing, verify:

- [ ] Program cards appear for relevant queries
- [ ] Auto-Birokrasi button is primary (filled) style
- [ ] Citations grouped by type (regulations vs web)
- [ ] Next steps start with Auto-Birokrasi
- [ ] Emergency queries show red alert first
- [ ] Emergency contacts are clickable (tel: links)
- [ ] Action buttons navigate correctly
- [ ] Logs show program extraction working
- [ ] Response time under 5 seconds
- [ ] No errors in console or logs

---

## 🎯 Quick Commands

### Restart Service
```bash
docker-compose -f ai-service/docker-compose.yml restart
```

### View Logs
```bash
docker-compose -f ai-service/docker-compose.yml logs -f
```

### Check Service Health
```bash
curl http://localhost:8000/health
```

### Re-ingest Data
```bash
docker-compose -f ai-service/docker-compose.yml exec ai-service python -m ingest.ingest
```

### Check ChromaDB Count
```bash
docker-compose -f ai-service/docker-compose.yml exec ai-service python -c "from database.chroma import get_chroma_service; print(get_chroma_service().collection.count())"
```

---

## 📸 Send Me Screenshots!

Once everything works, take screenshots of:

1. **Normal query** showing:
   - 2-3 program cards
   - Citations section
   - Auto-Birokrasi button (primary)
   - Next steps

2. **Emergency query** showing:
   - Red emergency alert
   - Emergency contacts
   - Program cards
   - Priority steps

3. **Console logs** showing:
   - Programs extracted: 2+
   - Actions generated: 3+
   - Next steps: 5+

---

## 🚨 If Something Breaks

1. **Check logs first** - 90% of issues show in logs
2. **Verify RAG data** - no data = no cards
3. **Test with mock** - switch to `/api/chat-mock` to isolate frontend
4. **Check Python syntax** - run `python -m py_compile`
5. **Rebuild service** - code changes need rebuild

**Still stuck?** Share:
- Error message
- Relevant logs
- What you tried

---

**You're ready! Test it and let me know how it goes! 🚀**
