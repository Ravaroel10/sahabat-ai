# Inline Program Cards - Quick Reference

## TL;DR

✅ **Previous AI started it** - Had marker detection working  
✅ **I completed it** - Added full program data flow + component + docs  
✅ **Now it's ready** - LLM can use `[PROGRAM:id]` markers anywhere  

---

## How It Works (Simple)

```
LLM writes:  "Saya rekomendasikan [PROGRAM:pkh] untuk Anda"
              
Python sees: "[PROGRAM:pkh]" → looks up PKH data → sends to frontend

React shows: 
              ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
              ┃ 💼 Program Keluarga Harapan ┃ ← Card appears here!
              ┃ Bantuan tunai untuk...      ┃
              ┃ [Lihat Detail]              ┃
              ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Available Markers

| Write This | Shows This |
|-----------|-----------|
| `[PROGRAM:pkh]` | Program Keluarga Harapan |
| `[PROGRAM:bpnt]` | Bantuan Pangan Non Tunai |
| `[PROGRAM:blt-dana-desa]` | BLT Dana Desa |
| `[PROGRAM:bpjs-kesehatan]` | BPJS Kesehatan PBI |
| `[PROGRAM:kip]` | Kartu Indonesia Pintar |
| `[PROGRAM:bantuan-lansia]` | Bantuan Lansia |

---

## When to Use

✅ **Use inline cards when**:
- Explaining a specific program in detail
- Comparing multiple programs side-by-side
- Showing program details within step-by-step instructions

❌ **Don't use when**:
- Just mentioning a program name in passing
- Program is already in the reference cards at the end
- User is asking a general question (not about specific programs)

---

## Example Usage

### Good ✅
```
Berdasarkan situasi Anda, saya rekomendasikan:

[PROGRAM:pkh]

Program ini cocok karena Anda memiliki 3 anak sekolah...
```

### Better ✅✅
```
Untuk Anda, ada 2 program utama:

1. PKH untuk bantuan tunai bulanan:
[PROGRAM:pkh]

2. KIP untuk biaya pendidikan anak:
[PROGRAM:kip]

Saya sarankan ajukan keduanya...
```

### Not Needed ❌
```
PKH, BPNT, dan KIP adalah program bantuan sosial.
```
→ Just listing names, no need for cards

---

## Two Card Types

### Inline (In Text)
- Compact design
- Shows name + brief description + key benefit
- One button: "Lihat Detail"
- Appears WHERE marker is placed

### Reference (At End)
- Full design with expandable details
- Shows eligibility badge
- Two buttons: "Lihat Detail" + "Ajukan Sekarang"
- Always appears at END in metadata section

**Both can appear for the same program!**

---

## Testing

### Quick Test
1. Start services: `npm run dev` and Python AI service
2. Ask: "Saya buruh dengan 3 anak sekolah, penghasilan 1.5 juta"
3. Check: Inline PKH card should appear in the middle of response
4. Verify: Reference PKH card also at the end

### Check Logs
- Python: `💡 Detected inline program marker: pkh`
- Python: `✅ Found program data: Program Keluarga Harapan`

---

## Files to Know

| File | What It Does |
|------|-------------|
| `ai-service/api/chat.py` | Detects markers, looks up data |
| `src/app/api/chat/route.ts` | Transforms SSE events |
| `src/components/unified-chat/message-parts.tsx` | `InlineProgramCardRenderer` |
| `ai-service/prompts/system_prompt.py` | LLM instructions |

---

## What Was Done

### Before (Mid-Implementation)
- ⚠️ Backend detected markers but only sent `program_id`
- ⚠️ Frontend received events but showed placeholder
- ❌ No actual card component
- ❌ No LLM instructions
- ❌ No docs

### After (Complete)
- ✅ Backend sends full program data
- ✅ Frontend renders proper inline cards
- ✅ `InlineProgramCardRenderer` component
- ✅ LLM has usage instructions
- ✅ Complete documentation

---

## Key Points

1. **Inline cards are OPTIONAL** - LLM decides when to use them
2. **Reference cards ALWAYS appear** - Metadata handles this
3. **Same program can appear TWICE** - Inline (context) + Reference (summary)
4. **Fallback gracefully** - If program not found, shows ID-only card
5. **Style is DIFFERENT** - Inline (blue tint) vs Reference (gray tint)

---

## Debug Checklist

If inline cards not showing:

- [ ] Check Python logs for "Detected inline program marker"
- [ ] Verify program ID is correct (lowercase, hyphens)
- [ ] Check program exists in orchestrator's programs list
- [ ] Verify SSE event has `program` field (not just `program_id`)
- [ ] Check browser console for rendering errors
- [ ] Verify `InlineProgramCardRenderer` is imported

---

## Summary

**What we have now**: A complete system where LLM can embed interactive program cards anywhere in its response using simple markers, creating a more engaging and contextual user experience.

**How to use**: Just write `[PROGRAM:id]` where you want a card to appear!

📚 **Full docs**: See `INLINE_PROGRAM_CARDS.md`, `INLINE_CARDS_SUMMARY.md`, `INLINE_CARDS_VISUAL.md`
