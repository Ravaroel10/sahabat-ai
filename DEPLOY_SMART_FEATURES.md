# Deploy Smart Context-Aware Features

## 🚀 Quick Deploy

```bash
# 1. Rebuild Python service (code changed)
cd ai-service
docker-compose down
docker-compose build
docker-compose up -d

# 2. Watch logs
docker-compose logs -f
```

---

## 🧪 Test Scenarios

### Scenario 1: Simple Question (No Spam)

**Query:**
> "Apa itu PKH?"

**Expected:**
- ✅ Text answer about PKH
- ✅ Citations (Permensos, websites)
- ❌ NO program cards
- ❌ NO "Langkah selanjutnya" buttons
- ❌ NO "Cara mengajukan" steps

**Logs to check:**
```
📋 Programs extracted: 0
   Actions generated: 0  ← Should be 0!
   Next steps generated: 0  ← Should be 0!
```

---

### Scenario 2: Document Request (Direct Link)

**Query:**
> "Buatkan saya SKTM"

**Expected:**
- ✅ Text: "Tentu! Saya bisa membantu..."
- ✅ **ONE button:** "📄 Buat Dokumen Sekarang" (primary/filled style)
- ✅ Link goes to: `/auto-birokrasi?documents=sktm&program=general`
- ❌ NO program cards
- ❌ NO "Cara mengajukan" steps

**Logs to check:**
```
📋 Programs extracted: 0 (or some, doesn't matter)
   Actions generated: 1  ← Just Auto-Birokrasi
   Next steps generated: 0  ← Should be 0!
```

---

### Scenario 3: Application Request (Full Journey)

**Query:**
> "Saya buruh bangunan, penghasilan Rp 1,5 juta/bulan, punya 3 anak sekolah"

**Expected:**
- ✅ Text explanation
- ✅ **Program cards** (2-3 cards: PKH, KIP, etc.)
- ✅ Citations section (grouped by type)
- ✅ **💡 Langkah selanjutnya:**
  - 📄 Siapkan Dokumen Otomatis (primary)
  - 📋 Lihat Semua Program
- ✅ **✓ Cara mengajukan:** (5-6 steps)
  1. Gunakan Auto-Birokrasi...
  2. Atau siapkan manual...

**Logs to check:**
```
✅ RAG returned 5 results
📋 Programs extracted: 2
   Actions generated: 2  ← Auto-Birokrasi + Marketplace
   Next steps generated: 5  ← Full steps
```

---

### Scenario 4: Emergency (Priority Actions)

**Query:**
> "Suami saya jatuh dari perancah dan sekarang di rumah sakit"

**Expected:**
- ✅ **RED emergency alert** (appears FIRST)
- ✅ Text response
- ✅ Program cards (JKK, BSU)
- ✅ **💡 Langkah selanjutnya:**
  - 🚨 Hubungi Layanan Darurat (FIRST)
  - 📄 Siapkan Dokumen Klaim
- ✅ **✓ Cara mengajukan:** (priority steps)
  1. 🚨 PRIORITAS: Hubungi darurat
  2. 📞 Telepon: 119

**Logs to check:**
```
⚠️  Escalation detected: True
   Priority: red
📋 Programs extracted: 2
   Actions generated: 2  ← Emergency hotline first
   Next steps generated: 4  ← Priority steps only
```

---

## 🔍 What to Look For

### Good Signs:

✅ **Simple questions:**
```
Actions generated: 0
Next steps generated: 0
```

✅ **Document requests:**
```
Actions generated: 1  (just Auto-Birokrasi)
Next steps generated: 0  (button is the only step)
```

✅ **Applications:**
```
Programs extracted: 2+
Actions generated: 2  (Auto-Birokrasi + Marketplace)
Next steps generated: 5+  (full application flow)
```

### Bad Signs:

❌ **Simple question with spam:**
```
Actions generated: 4  ← Too many! Should be 0
Next steps generated: 6  ← Shouldn't exist!
```

❌ **Two "Langkah selanjutnya" in UI**
Should see:
- "💡 Langkah selanjutnya" (ActionButtons)
- "✓ Cara mengajukan" (NextSteps)

NOT:
- "💡 Langkah selanjutnya"
- "✓ Langkah berikutnya" (old duplicate)

---

## 🐛 Troubleshooting

### Issue: Still Showing Actions for Simple Questions

**Debug:**
```bash
docker-compose -f ai-service/docker-compose.yml logs | grep "Actions generated"
```

**If showing `Actions generated: 2+` for simple questions:**
1. Check message detection logic in orchestrator
2. Verify question keywords: 'apa itu', 'bagaimana', etc.
3. Check logs for: "is_simple_question: True"

### Issue: Not Detecting Document Requests

**Debug:**
```bash
# Test document detection
docker-compose -f ai-service/docker-compose.yml exec ai-service python -c "
message = 'buatkan saya sktm'
document_keywords = ['sktm', 'surat', 'dokumen', 'buatkan']
print(any(kw in message.lower() for kw in document_keywords))
"
```

**Expected:** `True`

### Issue: Two "Langkah selanjutnya" Still Showing

**Check frontend:**
- ActionButtons should say: "💡 Langkah selanjutnya"
- NextSteps should say: "✓ Cara mengajukan"

**File:** `src/components/unified-chat/message-parts.tsx` line ~140

### Issue: Programs Not Extracted

**Same as before:**
```bash
# Check RAG data
docker-compose -f ai-service/docker-compose.yml exec ai-service python -c "
from tools.rag import search_rag
results = search_rag('bantuan keluarga miskin')
print(f'Results: {len(results)}')
for r in results:
    print(r.get('metadata', {}).get('record_type'))
"
```

**Expected:** Should see `program` multiple times

---

## 📊 Comparison: Before vs After

### Simple Question: "Apa itu PKH?"

**Before:**
```
Text answer
[PKH Card] ← SPAM (they didn't ask for this)
[KIP Card] ← SPAM
💡 Langkah selanjutnya:
  [📄 Siapkan Dokumen] ← SPAM
  [📋 Lihat Program] ← SPAM
✓ Langkah berikutnya: ← DUPLICATE!
  1. Siapkan dokumen... ← SPAM
```

**After:**
```
Text answer
📚 Sumber Informasi:
  📜 Permensos...
  🌐 Website...

[NOTHING ELSE] ← Clean! Let them ask more
```

### Document Request: "Buatkan SKTM"

**Before:**
```
Text answer
💡 Langkah selanjutnya:
  [📄 Siapkan Dokumen] ← Too generic
  [📋 Lihat Program] ← Irrelevant
  [🌐 Website Kemensos] ← Not helpful
✓ Langkah berikutnya:
  1. Siapkan dokumen... ← They want it made!
```

**After:**
```
Text answer
[📄 Buat Dokumen Sekarang] ← PERFECT! Direct action

[NOTHING ELSE] ← They got what they need
```

### Application: "Penghasilan 1.5 juta, 3 anak"

**Before:**
```
Text answer
[PKH Card]
[KIP Card]
💡 Langkah selanjutnya:
  [📄 Siapkan Dokumen]
  [📋 Lihat Program]
  [🌐 Website]
✓ Langkah berikutnya: ← DUPLICATE!
  1. Siapkan dokumen...
```

**After:**
```
Text answer
[PKH Card]
[KIP Card]
📚 Sumber Informasi...

💡 Langkah selanjutnya:
  [📄 Siapkan Dokumen] ← Clear action
  [📋 Lihat Program] ← Exploration

✓ Cara mengajukan: ← Different label!
  1. Gunakan Auto-Birokrasi...
  2. Atau siapkan manual...
```

---

## ✅ Success Checklist

After deploy, verify:

- [ ] Simple question → NO actions, NO steps
- [ ] Document request → ONE primary button
- [ ] Application → Full journey with cards
- [ ] Emergency → Priority actions first
- [ ] NO duplicate "Langkah selanjutnya/berikutnya"
- [ ] ActionButtons say "💡 Langkah selanjutnya"
- [ ] NextSteps say "✓ Cara mengajukan"
- [ ] Logs show correct counts (0 for questions, etc.)

---

## 🎯 Test Commands

```bash
# Watch logs in real-time
docker-compose -f ai-service/docker-compose.yml logs -f | grep -E "(Programs extracted|Actions generated|Next steps)"

# Check service health
curl http://localhost:8000/health

# Test specific scenario (use frontend)
# Then check logs for the query

# If issues, rebuild
cd ai-service
docker-compose down
docker-compose build
docker-compose up -d
```

---

**Deploy it and test! The system should now be smart, not spammy! 🧠**
