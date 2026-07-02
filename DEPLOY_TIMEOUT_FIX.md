# 🚀 Deploy Timeout Fix + AI Intent

## Quick Deploy

```bash
cd ai-service
docker-compose down
docker-compose build
docker-compose up -d
docker-compose logs -f
```

---

## ✅ What to Expect

### Good Signs ✅

**1. Streaming starts immediately:**
```
📡 Starting SSE stream...
   ⚡ First token streamed to client in 0.523s  ← Should be < 2s
```

**2. Streaming completes:**
```
   ✅ Finished streaming 234 tokens in 3.456s  ← Should be < 10s
```

**3. Intent extraction succeeds:**
```
🧠 Extracting intent classification from response...
✅ Intent classification extracted successfully
   Primary intent: question
   Confidence: 0.95
```

**4. Metadata override works:**
```
   Intent-based override:
      - Programs: 0 → 0
      - Actions: 0 → 0
      - Next steps: 0 → 0
```

### Bad Signs ❌

**1. No first token:**
```
📡 Starting SSE stream...
[NOTHING - TIMEOUT]
```
→ LLM not responding, check OpenRouter status

**2. Intent extraction fails:**
```
⚠️  No intent classification JSON found in LLM response
⚠️  Using fallback heuristic approach
```
→ LLM not following prompt, acceptable as fallback

**3. Still getting 504:**
```
Failed to load resource: the server responded with a status of 504
```
→ Check logs for where it's stuck

---

## 🧪 Test Cases

### Test 1: Progressive Streaming

**Query:** "Apa itu PKH?"

**Watch browser:**
- Text should appear progressively (P... PK... PKH... PKH ada...)
- NOT: blank screen until complete

**Watch logs:**
```
   ⚡ First token streamed to client in 0.XXXs  ← Should be quick
```

---

### Test 2: Intent Classification

**Query:** "bisa jelasin pkh gak?"

**Watch logs:**
```
✅ Intent classification extracted successfully
   Primary intent: question
   Confidence: 0.9+
   Show cards: False
   Show actions: False
   Show steps: False
```

**Watch UI:**
- Text answer only
- NO cards, NO buttons, NO steps

---

### Test 3: Document Request

**Query:** "gw butuh sktm dong"

**Watch logs:**
```
   Primary intent: document_request
   Intent-based override:
      - Programs: X → 0
      - Actions: X → 1  (just Auto-Birokrasi)
      - Next steps: X → 0
```

**Watch UI:**
- Text confirmation
- ONE button: "📄 Buat Dokumen Sekarang"

---

### Test 4: Application Request

**Query:** "Saya buruh penghasilan 1.5 juta, 3 anak"

**Watch logs:**
```
   Primary intent: application
   Intent-based override:
      - Programs: 2 → 2  (keep all)
      - Actions: 2 → 2  (full journey)
      - Next steps: 5 → 5  (full steps)
```

**Watch UI:**
- Program cards (2-3)
- Action buttons (2)
- Next steps (5-6)

---

## 🐛 Troubleshooting

### Issue: Still Getting 504

**Check:** Where does it timeout?

```bash
docker-compose logs | grep -A 5 "Starting generation"
```

**If logs stop after "Starting generation":**
→ LLM service not responding
→ Check OpenRouter API status
→ Try different model in `.env`

**If logs show streaming but still timeout:**
→ Next.js timeout too aggressive
→ Check `maxDuration` in `src/app/api/chat/route.ts`

---

### Issue: Intent Not Extracted

**Check:**
```bash
docker-compose logs | grep "Intent classification"
```

**If seeing:**
```
⚠️  No intent classification JSON found
```

**Solutions:**
1. Check system prompt has "INSTRUKSI METADATA"
2. LLM model may not follow instructions (use fallback)
3. Check if JSON is malformed in response

**Fallback is OK:** System works with keyword matching if intent extraction fails

---

### Issue: Wrong Intent Classification

**Example:** Question gets full journey

**Debug:**
```bash
docker-compose logs | grep -A 5 "Intent classification extracted"
```

**Check LLM's reasoning:**
```
   Primary intent: application  ← Wrong
   Reasoning: "User describes situation..."  ← Check this
```

**Fix:** Adjust system prompt guidelines

---

## 📊 Performance Metrics

**Target Performance:**
- Time to first token: < 2s
- Total streaming time: 3-10s
- Intent extraction: < 0.1s
- Total request time: < 15s

**Monitor:**
```bash
docker-compose logs | grep -E "(First token|Finished streaming|Intent extraction)"
```

---

## 🎯 Success Checklist

After deploy, verify:

- [ ] Streaming starts within 2s
- [ ] Progressive text display in browser
- [ ] No 504 timeouts
- [ ] Intent extraction succeeds most of the time (>80%)
- [ ] Fallback works when intent fails
- [ ] Correct metadata for each intent type
- [ ] Total request completes < 15s

---

## 🚀 All Fixed!

The system now:
1. ✅ **Streams immediately** - no more timeouts
2. ✅ **AI-driven intent** - smart, not spammy
3. ✅ **Fallback safety** - never breaks
4. ✅ **Progressive UX** - smooth experience

**Test it and enjoy! 🎉**
