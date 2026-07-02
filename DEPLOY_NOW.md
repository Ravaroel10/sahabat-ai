# 🚀 Quick Deployment Guide

## ⚡ TL;DR - Deploy in 3 Steps

```bash
# 1. Rebuild Python service (code changed!)
cd ai-service
docker-compose down
docker-compose build
docker-compose up -d

# 2. Watch logs
docker-compose logs -f

# 3. Test in browser
# Open http://localhost:3000 (or your frontend URL)
```

---

## 📋 Quick Test Checklist

After deployment, test these 4 scenarios:

### ✅ Test 1: Simple Question
**Type:** "Apa itu PKH?"

**Expected:**
- Just answer + citations
- NO cards, NO actions, NO steps

**Log Check:**
```bash
docker-compose logs | grep "Actions generated: 0"
```

---

### ✅ Test 2: Document Request
**Type:** "Buatkan saya SKTM"

**Expected:**
- ONE big button: "📄 Buat Dokumen Sekarang"
- NO program cards
- NO next steps

**Log Check:**
```bash
docker-compose logs | grep "Actions generated: 1"
```

---

### ✅ Test 3: Application Request
**Type:** "Saya buruh penghasilan 1.5 juta, punya 3 anak sekolah"

**Expected:**
- Program cards (2-3)
- Two action buttons
- "💡 Langkah selanjutnya" section (actions)
- "✓ Cara mengajukan" section (steps)

**Log Check:**
```bash
docker-compose logs | grep "Programs extracted: [2-9]"
```

---

### ✅ Test 4: Emergency
**Type:** "Suami jatuh dari perancah"

**Expected:**
- RED alert box at top
- Emergency programs
- Hotline button first

**Log Check:**
```bash
docker-compose logs | grep "Priority: red"
```

---

## ✅ Success Indicators

### Good Signs ✅

**Simple Question:**
```
📋 Programs extracted: 0
   Actions generated: 0  ← Good!
   Next steps generated: 0  ← Good!
```

**Document Request:**
```
📋 Programs extracted: 0
   Actions generated: 1  ← Just Auto-Birokrasi
   Next steps generated: 0  ← Good!
```

**Application:**
```
📋 Programs extracted: 2
   Actions generated: 2  ← Auto-Birokrasi + Marketplace
   Next steps generated: 5  ← Full flow
```

### Bad Signs ❌

**If you see this for "Apa itu PKH?":**
```
Actions generated: 4  ← TOO MANY! Should be 0
Next steps generated: 6  ← Shouldn't exist!
```

**Then rebuild is needed:**
```bash
cd ai-service
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🐛 Quick Troubleshooting

### Container Won't Start
```bash
# Check what's wrong
docker-compose logs

# Nuclear option (rebuild from scratch)
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Health Check
```bash
# Should return OK
curl http://localhost:8000/health

# If fails, check logs
docker-compose logs
```

### Still Spamming Features?
```bash
# Check if code is actually updated
docker-compose exec ai-service cat orchestrator/orchestrator.py | grep "is_simple_question"

# Should see: is_simple_question = any(message_lower.startswith(kw)...
```

---

## 📊 What Changed?

### Python Files Modified:
1. `ai-service/orchestrator/orchestrator.py`
   - Added `_generate_actions()` with smart detection
   - Added `_generate_next_steps()` with smart detection
   - Question/document keyword detection

2. `ai-service/api/chat.py`
   - Enhanced metadata emission
   - Returns programs, actions, next_steps

### Frontend Files (No rebuild needed):
3. `src/types/llm-response.ts` - Types
4. `src/components/unified-chat/message-parts.tsx` - Renderers
5. `src/app/api/chat/route.ts` - API proxy

---

## ⚡ After Deployment

### Test Flow:
1. Open frontend (usually `http://localhost:3000`)
2. Type: "Apa itu PKH?"
3. Wait for response
4. Check: Should see ONLY text + citations
5. Check logs: `Actions generated: 0`

If you see ANY buttons/cards, the rebuild didn't work.

---

## 🎯 Expected Behavior Summary

| Query Type | Cards | Actions | Next Steps |
|------------|-------|---------|------------|
| Simple question | ❌ No | ❌ No | ❌ No |
| Document request | ❌ No | ✅ 1 button | ❌ No |
| Application | ✅ 2-3 | ✅ 2 buttons | ✅ 5-6 steps |
| Emergency | ✅ 2-3 | ✅ 2 buttons | ✅ 4-5 priority |

---

## 💡 Pro Tips

1. **Keep logs open** during testing:
   ```bash
   docker-compose logs -f | grep -E "(Programs|Actions|Next steps)"
   ```

2. **Clear browser cache** if frontend acts weird:
   ```
   Ctrl+Shift+R (Windows)
   Cmd+Shift+R (Mac)
   ```

3. **Check container is actually rebuilt**:
   ```bash
   docker-compose ps
   # Should show recent "Created" time
   ```

4. **If still having issues**, check this file:
   ```bash
   docker-compose exec ai-service python -c "
   message = 'apa itu pkh'
   question_keywords = ['apa itu', 'bagaimana']
   is_simple = any(message.lower().startswith(kw) for kw in question_keywords)
   print(f'Is simple question: {is_simple}')
   "
   # Should print: Is simple question: True
   ```

---

## 🎉 You're Done!

If all 4 tests pass, you're good to go! The system is now smart and context-aware.

**Questions?** Check:
- `IMPLEMENTATION_STATUS.md` - Full technical details
- `SMART_CONTEXT_AWARE_FEATURES.md` - Behavior rules
- `DEPLOY_SMART_FEATURES.md` - Extended troubleshooting

---

## 🚨 Emergency Rollback

If something breaks and you need to rollback:

```bash
# Stop containers
docker-compose down

# Checkout previous version (if using git)
git log --oneline  # Find commit before changes
git checkout <commit-hash>

# Rebuild
docker-compose build
docker-compose up -d
```

Then report the issue so we can fix it!

---

**🎯 Deploy now and enjoy smart, context-aware responses!**
