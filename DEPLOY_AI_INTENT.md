# 🚀 Deploy AI-Driven Intent Classification

## Quick Deploy

```bash
# 1. Navigate to ai-service
cd ai-service

# 2. Rebuild (system prompt and orchestrator changed)
docker-compose down
docker-compose build
docker-compose up -d

# 3. Watch logs
docker-compose logs -f
```

---

## 🧪 Test Scenarios

### Test 1: Informal Question
**Query:** "bisa jelasin pkh gak?"

**Watch logs for:**
```
✅ Intent classification extracted successfully
   Primary intent: question
   Confidence: 0.9+
   Show cards: False
   Show actions: False
   Show steps: False
```

**Expected in UI:**
- Text answer only
- Citations
- NO cards, NO buttons, NO steps

---

### Test 2: Casual Document Request
**Query:** "gw butuh sktm dong"

**Watch logs for:**
```
✅ Intent classification extracted successfully
   Primary intent: document_request
   Confidence: 0.9+
   Show cards: False
   Show actions: True
   Show steps: False
```

**Expected in UI:**
- Text confirmation
- ONE button: "📄 Buat Dokumen Sekarang"
- NO cards, NO steps

---

### Test 3: Ambiguous Help Request
**Query:** "Saya perlu bantuan"

**Watch logs for:**
```
✅ Intent classification extracted successfully
   Primary intent: general_help
   Confidence: 0.6-0.8
   Show cards: False
   Show actions: True
   Show steps: False
```

**Expected in UI:**
- Clarifying questions
- Marketplace button for exploration
- NO cards yet (until more context)

---

### Test 4: Detailed Application
**Query:** "Saya buruh harian, istri hamil, penghasilan 1 juta sebulan, punya 2 anak"

**Watch logs for:**
```
✅ Intent classification extracted successfully
   Primary intent: application
   Confidence: 0.9+
   Show cards: True
   Show actions: True
   Show steps: True
```

**Expected in UI:**
- Full response with program cards
- Action buttons (2)
- Next steps (5-6)

---

## ✅ Success Indicators

### Good Signs ✅

```bash
# High success rate
grep "Intent classification extracted successfully" logs | wc -l
# Should be close to 100% of requests

# Low fallback usage
grep "Using fallback heuristic approach" logs | wc -l
# Should be <5% of requests

# Confident classifications
grep "Confidence: 0.9" logs | wc -l
# Most should be 0.9+
```

### Bad Signs ❌

```bash
# Frequent fallbacks
grep "Using fallback heuristic approach" logs | wc -l
# If >20% → LLM not following instructions

# Failed JSON parsing
grep "Failed to parse intent JSON" logs
# If frequent → prompt needs adjustment

# Low confidence
grep "Confidence: 0.[0-5]" logs
# If common → ambiguous queries or bad prompt
```

---

## 🐛 Troubleshooting

### Issue: Intent extraction failing frequently

**Check logs:**
```bash
docker-compose logs | grep -A 5 "Failed to parse intent JSON"
```

**Possible causes:**
1. LLM not outputting JSON
2. JSON malformed
3. Response truncated

**Solution:**
```bash
# Check what LLM is actually outputting
docker-compose logs | grep -A 20 "Collecting LLM response"

# If LLM not following prompt:
# - Check system_prompt.py was updated
# - Verify LLM model supports structured output
# - Increase temperature if responses too rigid
```

---

### Issue: Fallback used too often

**Check logs:**
```bash
docker-compose logs | grep "Using fallback heuristic"
```

**Possible causes:**
1. JSON not at start of response
2. Prompt instructions unclear
3. Model doesn't follow instructions well

**Solution:**
1. Verify system prompt has "INSTRUKSI METADATA" section
2. Check LLM model (some models better at following instructions)
3. Consider adding few-shot examples in prompt

---

### Issue: Wrong intent classification

**Example:** User asks question but system shows full journey

**Debug:**
```bash
# Check what LLM classified
docker-compose logs | grep -A 10 "Intent classification extracted"
```

**Solution:**
1. Check LLM's reasoning field
2. Adjust system prompt guidelines
3. Add edge case examples to prompt

---

## 📊 Monitoring Commands

```bash
# Watch intent classifications in real-time
docker-compose logs -f | grep "Primary intent"

# Count intent types
docker-compose logs | grep "Primary intent:" | awk '{print $NF}' | sort | uniq -c

# Check confidence distribution
docker-compose logs | grep "Confidence:" | awk '{print $NF}' | sort -n

# Success vs fallback ratio
echo "Success:" $(docker-compose logs | grep "Intent classification extracted successfully" | wc -l)
echo "Fallback:" $(docker-compose logs | grep "Using fallback heuristic" | wc -l)
```

---

## 🔄 Rollback Plan

If AI intent doesn't work well:

```bash
# 1. Stop containers
docker-compose down

# 2. Revert changes
git log --oneline  # Find commit before changes
git checkout <commit-hash> ai-service/

# 3. Rebuild
docker-compose build
docker-compose up -d
```

The old keyword-based approach will resume.

---

## 💡 Fine-Tuning Tips

### If too many false "questions":

Update `system_prompt.py`:
```python
# Add stricter question definition
**"question"** - ONLY if user EXPLICITLY asks "what is", "how does", "explain"
- NOT if describing situation
- NOT if seeking help
```

### If too many false "applications":

Update `system_prompt.py`:
```python
# Add clearer application signals
**"application"** - ONLY if user:
- Describes personal situation with specifics
- Explicitly asks for program recommendations
- Shows readiness to apply
```

### If confidence too low:

Update `system_prompt.py`:
```python
# Add confidence guidelines
- High confidence (0.9+): Clear, unambiguous intent
- Medium confidence (0.7-0.9): Reasonable inference
- Low confidence (<0.7): Ambiguous, use general_help
```

---

## 🎯 Expected Behavior Summary

| Query Type | Intent | Cards | Actions | Steps | Confidence |
|------------|--------|-------|---------|-------|------------|
| "Apa itu PKH?" | question | ❌ | ❌ | ❌ | 0.95+ |
| "bisa jelasin pkh?" | question | ❌ | ❌ | ❌ | 0.90+ |
| "Buatkan SKTM" | document_request | ❌ | ✅ (1) | ❌ | 0.98+ |
| "gw butuh sktm" | document_request | ❌ | ✅ (1) | ❌ | 0.95+ |
| "Penghasilan 1.5 juta, 3 anak" | application | ✅ | ✅ (2) | ✅ | 0.92+ |
| "Saya perlu bantuan" | general_help | ❌ | ✅ (1) | ❌ | 0.70-0.80 |
| "Suami jatuh" | emergency | ✅ | ✅ (2) | ✅ | 0.99+ |

---

## 🎉 You're Done!

The system now uses **AI to understand intent** instead of keyword matching. 

It's:
- ✅ More scalable
- ✅ More flexible  
- ✅ More intelligent
- ✅ More robust

**Test it with various phrasings and enjoy the improved UX!** 🚀
