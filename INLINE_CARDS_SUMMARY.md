# Inline Program Cards - Quick Summary

## Two Types of Program Cards

### 1️⃣ **Reference Cards** (End of Message)
```
[User message]
[AI explanation...]
[AI explanation...]

┌─────────────────────────────────────┐
│ 💼 Program Keluarga Harapan    [▼] │ ← Collapsible
│ ✓ Anda Memenuhi Syarat              │ ← Badge
│ Bantuan tunai untuk keluarga...     │ ← Description
├─────────────────────────────────────┤
│ [Lihat Detail]  [Ajukan Sekarang]  │ ← Actions
└─────────────────────────────────────┘
```
- **Location**: Always at the end
- **Data Source**: Metadata after streaming
- **Use Case**: Final summary and reference

### 2️⃣ **Inline Cards** (Dynamic Placement)
```
[AI text explaining situation...]

Saya rekomendasikan Program Keluarga Harapan:

┌────────────────────────────────┐
│ 💼 Program Keluarga Harapan    │ ← Compact
│ Bantuan tunai bulanan untuk... │ ← Brief
│ 💰 Manfaat: Rp 550rb - 3 juta  │ ← Key info
│ [Lihat Detail]                 │ ← Single action
└────────────────────────────────┘

Program ini cocok karena Anda memiliki...

[More AI text...]
```
- **Location**: Anywhere in the text flow
- **Data Source**: LLM marker `[PROGRAM:id]`
- **Use Case**: Contextual explanation

---

## How LLM Uses Markers

### Before (Only End Cards):
```
Berdasarkan situasi Anda dengan 3 anak sekolah dan penghasilan 
Rp 1,5 juta per bulan, saya merekomendasikan Program Keluarga 
Harapan (PKH). Program ini memberikan bantuan tunai bulanan 
sebesar Rp 550.000 - Rp 3 juta tergantung jumlah anak. Anda 
memenuhi syarat karena penghasilan di bawah garis kemiskinan 
dan memiliki anak usia sekolah.

[Scroll down to see card...]
```

### After (With Inline Cards):
```
Berdasarkan situasi Anda dengan 3 anak sekolah dan penghasilan 
Rp 1,5 juta per bulan, saya merekomendasikan:

[PROGRAM:pkh] ← LLM writes this marker

Program ini memberikan bantuan tunai bulanan sebesar Rp 550.000 
- Rp 3 juta tergantung jumlah anak. Anda memenuhi syarat karena 
penghasilan di bawah garis kemiskinan dan memiliki anak usia 
sekolah.
```

**Result**: Card appears right where the marker is!

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. LLM generates text with marker:                           │
│    "Saya rekomendasikan [PROGRAM:pkh] untuk Anda"           │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Python detects marker (chat.py):                          │
│    - Regex: \[PROGRAM:([a-z0-9\-]+)\]                       │
│    - Extract ID: "pkh"                                        │
│    - Lookup program data from programs list                   │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Emit SSE event:                                            │
│    {                                                          │
│      "type": "inline-program",                               │
│      "program_id": "pkh",                                    │
│      "program": { id, name, description, benefits, ... }     │
│    }                                                          │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Next.js transforms (route.ts):                            │
│    {                                                          │
│      type: "data-program-inline",                            │
│      data: { program_id, program }                           │
│    }                                                          │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. React renders (message-parts.tsx):                        │
│    <InlineProgramCardRenderer                                │
│      programId="pkh"                                         │
│      program={...full data...}                               │
│    />                                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Comparison: Inline vs Reference Cards

| Feature | Inline Cards | Reference Cards |
|---------|-------------|-----------------|
| **Position** | Dynamic (anywhere) | Fixed (end) |
| **Styling** | Compact, brief | Full, expandable |
| **Trigger** | `[PROGRAM:id]` marker | Metadata |
| **When** | During streaming | After streaming |
| **Purpose** | Contextual explanation | Complete reference |
| **Interaction** | "Lihat Detail" button | "Lihat Detail" + "Ajukan" buttons |
| **Design** | `bg-primary/5` | `bg-accent/50` |
| **Count** | As many as LLM uses | All eligible programs |

---

## Example: Both Card Types Together

```
User: "Saya buruh dengan 3 anak sekolah, penghasilan 1.5 juta"

AI Response:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Berdasarkan situasi Anda, program yang paling cocok adalah:

┌─────────────────────────────────────┐
│ 💼 Program Keluarga Harapan         │ ← INLINE CARD
│ Bantuan tunai untuk keluarga...     │   (from marker)
│ 💰 Manfaat: Rp 550rb - 3 juta       │
│ [Lihat Detail]                      │
└─────────────────────────────────────┘

Program ini memberikan bantuan bulanan dengan komponen 
pendidikan untuk 3 anak Anda. Selain itu, Anda juga 
bisa mendapatkan bantuan sembako melalui BPNT.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Referensi:
• Permensos No. 1/2024

💡 Program yang cocok:

┌─────────────────────────────────────┐
│ 💼 Program Keluarga Harapan    [▼] │ ← REFERENCE CARD
│ ✓ Anda Memenuhi Syarat              │   (from metadata)
│ Bantuan tunai bersyarat...          │
│ [Detail expanded when clicked]      │
│ [Lihat Detail]  [Ajukan Sekarang]  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💼 Bantuan Pangan Non Tunai    [▼] │ ← REFERENCE CARD
│ ⚠ Perlu Verifikasi                  │   (from metadata)
│ Bantuan sembako bulanan...          │
│ [Lihat Detail Lengkap]              │
└─────────────────────────────────────┘

💡 Langkah selanjutnya:
1. Ajukan PKH - Anda memenuhi syarat
2. Siapkan dokumen: KTP, KK, Surat Keterangan Penghasilan
...
```

---

## Key Points

✅ **Two types complement each other**:
   - Inline = Context + immediacy
   - Reference = Completeness + comparison

✅ **LLM has full control**:
   - Decides where to place inline cards
   - Chooses which programs to highlight
   - Adapts to conversation flow

✅ **Data consistency**:
   - Same program can appear as both inline and reference
   - Inline uses metadata, reference uses metadata
   - Both link to same detail page

✅ **UX benefits**:
   - Less scrolling
   - Better readability
   - Contextual learning
   - Visual hierarchy

---

## Current Status

✅ Backend: Marker detection + program lookup  
✅ Frontend: SSE handling + component rendering  
✅ System prompt: LLM instructions  
🔄 Testing: Waiting for real LLM usage  

The implementation is **complete and ready** for the LLM to start using `[PROGRAM:id]` markers in its responses!
