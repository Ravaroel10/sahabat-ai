# 🚀 Quick Start: AI Intent Classification

## TL;DR

System now uses **AI to understand intent** instead of keyword matching. More scalable, flexible, and intelligent.

---

## ⚡ Deploy in 3 Steps

```bash
# 1. Rebuild
cd ai-service
docker-compose down && docker-compose build && docker-compose up -d

# 2. Test
# Open frontend, try: "bisa jelasin pkh gak?"

# 3. Monitor
docker-compose logs -f | grep "Intent classification"
```

---

## 🧪 Quick Test Matrix

| Query | Expected Intent | Cards | Actions | Steps |
|-------|----------------|-------|---------|-------|
| "bisa jelasin pkh?" | `question` | ❌ | ❌ | ❌ |
| "gw butuh sktm" | `document_request` | ❌ | ✅ 1 | ❌ |
| "Saya perlu bantuan" | `general_help` | ❌ | ✅ 1 | ❌ |
| "Penghasilan 1.5 juta, 3 anak" | `application` | ✅ | ✅ 2 | ✅ |
| "Suami jatuh" | `emergency` | ✅ | ✅ 2 | ✅ |

---

## ✅ Success Indicators

```bash
# Should see in logs:
✅ Intent classification extracted successfully
   Primary intent: question
   Confidence: 0.95
   Show cards: False
   Show actions: False
   Show steps: False

# Should NOT see often:
⚠️  Using fallback heuristic approach
```

---

## 📊 Quick Monitor

```bash
# Watch classifications
docker-compose logs -f | grep "Primary intent"

# Check success rate
docker-compose logs | grep "Intent classification extracted successfully" | wc -l

# Check fallback rate (should be <5%)
docker-compose logs | grep "Using fallback heuristic" | wc -l
```

---

## 🐛 Quick Troubleshooting

### Problem: Intent not extracted

**Check:**
```bash
docker-compose logs | grep "Failed to parse intent JSON"
```

**Fix:** Verify system prompt has "INSTRUKSI METADATA" section

### Problem: Too many fallbacks

**Check:**
```bash
docker-compose logs | grep "Using fallback heuristic" | wc -l
```

**Fix:** LLM model may not follow instructions well, check logs for what it's outputting

### Problem: Wrong classifications

**Check:**
```bash
docker-compose logs | grep -A 3 "Intent classification extracted"
```

**Fix:** Adjust system prompt guidelines for that intent type

---

## 📁 Files Changed

1. `ai-service/prompts/system_prompt.py` - Added intent instructions
2. `ai-service/orchestrator/intent_parser.py` - NEW module
3. `ai-service/orchestrator/orchestrator.py` - Use AI intent

---

## 🔄 Rollback if Needed

```bash
cd ai-service
docker-compose down
git checkout HEAD~1 ai-service/
docker-compose build && docker-compose up -d
```

---

## 📚 Full Docs

- `AI_DRIVEN_INTENT_CLASSIFICATION.md` - Complete technical guide
- `DEPLOY_AI_INTENT.md` - Detailed deployment guide
- `OPTION_1_COMPLETE.md` - Implementation summary

---

## 🎉 That's It!

**The AI now decides what features to show based on true understanding, not keyword matching.**

**Test it, monitor it, enjoy it! 🚀**
