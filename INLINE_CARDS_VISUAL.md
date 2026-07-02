# Inline Program Cards - Visual Guide

## Before vs After Comparison

### ❌ BEFORE: Only End-of-Message Cards

```
┌─────────────────────────────────────────────────────────┐
│ User: Saya buruh dengan 3 anak sekolah, Rp 1.5 juta    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🤖 BantuArah AI                                         │
├─────────────────────────────────────────────────────────┤
│ Berdasarkan situasi Anda dengan 3 anak sekolah dan     │
│ penghasilan Rp 1,5 juta per bulan, saya merekomendasikan│
│ Program Keluarga Harapan (PKH). Program ini memberikan  │
│ bantuan tunai bulanan sebesar Rp 550.000 - Rp 3 juta   │
│ tergantung jumlah anak. Anda memenuhi syarat karena    │
│ penghasilan di bawah garis kemiskinan dan memiliki anak│
│ usia sekolah.                                           │
│                                                         │
│ Selain PKH, Anda juga bisa mendapatkan bantuan sembako │
│ melalui Bantuan Pangan Non Tunai (BPNT). Program ini   │
│ memberikan bantuan Rp 200.000 per bulan dalam bentuk   │
│ voucher elektronik untuk membeli sembako di warung      │
│ yang terdaftar.                                         │
│                                                         │
│ ┌─ ⚠️ User must scroll down ─────────────────────────┐ │
│ │                                                     │ │
│ │        (Long text block continues...)              │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│ 📚 Referensi:                                          │
│ • Permensos No. 1/2024                                 │
│                                                         │
│ 💡 Program yang cocok:                                 │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 💼 Program Keluarga Harapan              [▼]     │ │
│ │ ✓ Anda Memenuhi Syarat                           │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 💼 Bantuan Pangan Non Tunai              [▼]     │ │
│ │ ⚠ Perlu Verifikasi                               │ │
│ └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Problems:
❌ Long wall of text
❌ Cards far from explanation
❌ User must scroll to see details
❌ Hard to match text to cards
```

---

### ✅ AFTER: Inline + Reference Cards

```
┌─────────────────────────────────────────────────────────┐
│ User: Saya buruh dengan 3 anak sekolah, Rp 1.5 juta    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🤖 BantuArah AI                                         │
├─────────────────────────────────────────────────────────┤
│ Berdasarkan situasi Anda, saya merekomendasikan:       │
│                                                         │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 💼 Program Keluarga Harapan                       ┃ │ ← INLINE CARD
│ ┃ Bantuan tunai bersyarat untuk keluarga miskin... ┃ │   (appears here!)
│ ┃ 💰 Manfaat: Rp 550.000 - Rp 3 juta per keluarga  ┃ │
│ ┃ [Lihat Detail]                                    ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                         │
│ Program ini memberikan bantuan bulanan dengan komponen  │
│ pendidikan untuk 3 anak Anda. Anda memenuhi syarat     │
│ karena penghasilan di bawah Rp 2 juta per bulan.       │
│                                                         │
│ Selain itu, Anda juga bisa mendapatkan bantuan sembako:│
│                                                         │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 💼 Bantuan Pangan Non Tunai                       ┃ │ ← INLINE CARD
│ ┃ Bantuan sembako bulanan untuk keluarga miskin... ┃ │   (appears here!)
│ ┃ 💰 Manfaat: Rp 200.000 voucher elektronik        ┃ │
│ ┃ [Lihat Detail]                                    ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                         │
│ Program BPNT memberikan voucher untuk membeli sembako  │
│ di warung yang terdaftar. Sangat membantu untuk        │
│ kebutuhan pangan keluarga Anda.                        │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│ 📚 Referensi:                                          │
│ • Permensos No. 1/2024                                 │
│                                                         │
│ 💡 Program yang cocok:                                 │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 💼 Program Keluarga Harapan              [▼]     │ │ ← REFERENCE CARD
│ │ ✓ Anda Memenuhi Syarat                           │ │   (still here!)
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 💼 Bantuan Pangan Non Tunai              [▼]     │ │ ← REFERENCE CARD
│ │ ⚠ Perlu Verifikasi                               │ │   (still here!)
│ └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Benefits:
✅ Visual breaks in text
✅ Cards appear in context
✅ Immediate visual reference
✅ Better information hierarchy
✅ Less scrolling needed
✅ Both inline and reference available
```

---

## Card Type Comparison

### Inline Card (Compact)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💼 Program Keluarga Harapan              ┃ ← Title
┃ Bantuan tunai bersyarat untuk keluarga  ┃ ← Brief description
┃ miskin dengan anak sekolah, ibu hamil...┃
┃ 💰 Manfaat: Rp 550.000 - 3 juta/keluarga┃ ← Key benefit
┃ ┌────────────────┐                       ┃
┃ │ Lihat Detail   │                       ┃ ← Single action
┃ └────────────────┘                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Style: bg-primary/5 (light blue tint)
Purpose: Quick context within explanation
Position: Dynamically placed by LLM
```

### Reference Card (Expandable)
```
┌───────────────────────────────────────────────┐
│ 💼 Program Keluarga Harapan         [▼]      │ ← Collapsible
│ ✓ Anda Memenuhi Syarat                        │ ← Eligibility badge
│ Bantuan tunai bersyarat untuk keluarga...    │ ← Preview
├───────────────────────────────────────────────┤
│ [Expanded content when clicked:]              │
│                                               │
│ 📋 Syarat:                                    │
│   • Keluarga miskin/rentan miskin            │
│   • Punya anak sekolah/balita/ibu hamil      │
│   • Terdaftar di DTKS                        │
│                                               │
│ 📜 Permensos No. 1/2024                       │
│                                               │
│ ┌──────────────┐  ┌────────────────────┐     │
│ │Lihat Detail  │  │ Ajukan Sekarang    │     │ ← Multiple actions
│ └──────────────┘  └────────────────────┘     │
└───────────────────────────────────────────────┘

Style: bg-accent/50 (neutral gray tint)
Purpose: Complete information and comparison
Position: Always at end in metadata section
```

---

## User Journey Visualization

### Journey 1: Single Program Recommendation

```
User asks: "Saya buruh dengan 3 anak sekolah"
    │
    ▼
┌───────────────────────────────────────┐
│ AI explains situation                 │
│ "Berdasarkan situasi Anda..."         │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│ [PROGRAM:pkh] ← LLM inserts marker   │
└───────────────┬───────────────────────┘
                │
                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💼 PKH Card appears INLINE           ┃ ← User sees immediately
┃ [Lihat Detail] button                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                │
                ▼
┌───────────────────────────────────────┐
│ AI continues explanation              │
│ "Program ini cocok karena..."         │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│ Reference card at end for details     │
│ ✓ Anda Memenuhi Syarat               │ ← User can compare
│ [Lihat Detail] [Ajukan Sekarang]     │
└───────────────────────────────────────┘
```

### Journey 2: Multiple Program Comparison

```
User asks: "Anak saya mau sekolah tapi tidak mampu"
    │
    ▼
┌───────────────────────────────────────┐
│ AI intro                              │
│ "Untuk pendidikan, ada 2 program..."  │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│ "1. Kartu Indonesia Pintar:"          │
└───────────────┬───────────────────────┘
                │
                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💼 KIP Card INLINE                   ┃ ← First option
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                │
                ▼
┌───────────────────────────────────────┐
│ "2. Program Keluarga Harapan:"        │
└───────────────┬───────────────────────┘
                │
                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💼 PKH Card INLINE                   ┃ ← Second option
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                │
                ▼
┌───────────────────────────────────────┐
│ AI comparison and recommendation      │
│ "Saya sarankan ajukan keduanya..."    │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│ Reference cards at end                │
│ [KIP Card - Collapsible]              │ ← User can review
│ [PKH Card - Collapsible]              │   both in detail
└───────────────────────────────────────┘
```

---

## Technical Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LLM GENERATION                            │
│  "Saya rekomendasikan [PROGRAM:pkh] untuk Anda"            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Stream tokens
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              PYTHON BACKEND (chat.py)                        │
│                                                              │
│  1. Buffer tokens: "...mendasi [PROGRAM:pkh] untuk..."     │
│  2. Regex match: \[PROGRAM:([a-z0-9\-]+)\]                 │
│  3. Extract ID: "pkh"                                        │
│  4. Lookup in programs list                                  │
│  5. Emit SSE:                                               │
│     {                                                        │
│       "type": "inline-program",                             │
│       "program_id": "pkh",                                  │
│       "program": {full program data}                        │
│     }                                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ SSE Stream
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           NEXT.JS PROXY (api/chat/route.ts)                 │
│                                                              │
│  1. Parse SSE event                                          │
│  2. Transform to Vercel AI SDK format:                       │
│     {                                                        │
│       type: "data-program-inline",                          │
│       data: { program_id, program }                         │
│     }                                                        │
│  3. Write to UIMessageStream                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Message parts
                         ▼
┌─────────────────────────────────────────────────────────────┐
│     REACT COMPONENT (unified-chat-interface.tsx)            │
│                                                              │
│  1. Receive message parts                                    │
│  2. Render in order:                                         │
│     - Text part: <Markdown>                                  │
│     - Inline card: <InlineProgramCardRenderer>              │
│     - More text: <Markdown>                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Render
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              USER'S BROWSER                                  │
│                                                              │
│  Saya merekomendasikan                                       │
│                                                              │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓                     │
│  ┃ 💼 Program Keluarga Harapan      ┃ ← Card appears!      │
│  ┃ [Lihat Detail]                   ┃                       │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛                     │
│                                                              │
│  untuk Anda karena...                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Structure

### SSE Event from Python
```json
{
  "type": "inline-program",
  "program_id": "pkh",
  "program": {
    "id": "pkh",
    "name": "Program Keluarga Harapan",
    "description": "Bantuan tunai bersyarat untuk keluarga miskin...",
    "benefits": "Rp 550.000 - Rp 3 juta per keluarga per tahun",
    "eligibilityCriteria": [
      "Keluarga miskin/rentan miskin",
      "Punya anak sekolah/balita/ibu hamil/lansia"
    ],
    "regulations": ["Permensos No. 1/2024"],
    "eligibilityStatus": "eligible"
  }
}
```

### Vercel AI SDK Format
```typescript
{
  type: "data-program-inline",
  data: {
    program_id: "pkh",
    program: {
      id: "pkh",
      name: "Program Keluarga Harapan",
      // ... full program data ...
    }
  }
}
```

### React Props
```typescript
<InlineProgramCardRenderer 
  programId="pkh"
  program={{
    id: "pkh",
    name: "Program Keluarga Harapan",
    // ... full program data ...
  }}
/>
```

---

## Summary

🎯 **Goal**: Two types of program cards working together
   - **Inline**: Contextual, immediate, dynamic
   - **Reference**: Complete, collapsible, structured

🔧 **Implementation**: Complete end-to-end
   - LLM writes `[PROGRAM:id]` markers
   - Python detects and enriches with data
   - Next.js transforms and renders
   - React displays inline + reference cards

✨ **Result**: Better UX through contextual, visual breaks in conversation flow
