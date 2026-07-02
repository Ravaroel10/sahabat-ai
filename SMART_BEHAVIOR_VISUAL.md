# Smart Context-Aware Behavior - Visual Guide

## 🎯 The Four Paths

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER QUERY ANALYSIS                           │
│                                                                       │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────┐│
│  │  Question   │   │  Document   │   │ Application │   │Emergency││
│  │  Keywords   │   │  Keywords   │   │  Keywords   │   │Detection││
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └────┬────┘│
│         │                 │                  │                │     │
│    apa itu?         sktm, surat      buruh, 3 anak    jatuh, sakit│
│   bagaimana?        buatkan          penghasilan          darurat │
└─────────┼─────────────────┼──────────────────┼──────────────┼──────┘
          │                 │                  │              │
          ▼                 ▼                  ▼              ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PATH 1:       │  │   PATH 2:       │  │   PATH 3:       │  │   PATH 4:       │
│  LEARN ONLY     │  │  DIRECT TOOL    │  │  FULL JOURNEY   │  │  EMERGENCY      │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 📖 PATH 1: Simple Question (Learn Only)

### Query Pattern
```
"Apa itu PKH?"
"Bagaimana cara kerja bantuan sosial?"
"Berapa besaran BPNT?"
"Kapan dibuka pendaftaran PKH?"
```

### Detection Logic
```python
question_keywords = ['apa itu', 'bagaimana', 'berapa', 'kapan', 'dimana']
is_simple_question = any(message.lower().startswith(kw) for kw in question_keywords)

if is_simple_question and not programs:
    actions = []      # NO ACTIONS
    next_steps = []   # NO STEPS
```

### Response Structure
```
┌─────────────────────────────────────────────┐
│  💬 Text Answer                             │
│                                             │
│  PKH adalah Program Keluarga Harapan,       │
│  bantuan tunai bersyarat untuk keluarga     │
│  miskin dan rentan...                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📚 Sumber Informasi                        │
│                                             │
│  📜 Dasar Hukum:                            │
│  • Permensos No. 1/2024                     │
│                                             │
│  🌐 Sumber Web:                             │
│  • Program PKH - Kemensos                   │
└─────────────────────────────────────────────┘

[NOTHING ELSE - CLEAN!]
```

### Logs
```
📋 Programs extracted: 0
   Actions generated: 0  ✅
   Next steps generated: 0  ✅
```

### Why?
User is just exploring. Don't be pushy. Let them ask follow-up questions naturally.

---

## 📄 PATH 2: Document Request (Direct Tool)

### Query Pattern
```
"Buatkan saya SKTM"
"Saya butuh surat permohonan bantuan"
"Gimana cara buat dokumen persyaratan?"
"Generate formulir pendaftaran"
```

### Detection Logic
```python
document_keywords = ['sktm', 'surat', 'dokumen', 'buatkan', 'formulir']
is_document_request = any(kw in message.lower() for kw in document_keywords)

if is_document_request:
    actions = [direct_autobirokrasi_link]  # DIRECT LINK
    next_steps = []  # Button IS the step
```

### Response Structure
```
┌─────────────────────────────────────────────┐
│  💬 Text Confirmation                       │
│                                             │
│  Tentu! Saya bisa membantu menyiapkan SKTM  │
│  untuk Anda. Klik tombol di bawah untuk     │
│  membuat dokumen secara otomatis.           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ┌───────────────────────────────────────┐  │
│  │  📄 Buat Dokumen Sekarang            │  │  ← PRIMARY BUTTON
│  │  (filled/primary style)               │  │     ONE CLICK!
│  └───────────────────────────────────────┘  │
│  Link: /auto-birokrasi?documents=sktm       │
└─────────────────────────────────────────────┘

[NO CARDS, NO STEPS - DIRECT!]
```

### Logs
```
📋 Programs extracted: 0 (doesn't matter)
   Actions generated: 1  ✅ (just Auto-Birokrasi)
   Next steps generated: 0  ✅
```

### Why?
User knows exactly what they want. Give them the tool immediately. Don't make them wade through program cards and application steps.

---

## 🏃 PATH 3: Application Request (Full Journey)

### Query Pattern
```
"Saya buruh bangunan, penghasilan 1.5 juta, 3 anak sekolah"
"Program apa yang cocok untuk keluarga saya?"
"Anak saya mau sekolah tapi tidak ada biaya"
"Saya butuh bantuan untuk keluarga miskin"
```

### Detection Logic
```python
# No question keywords, no document keywords
# AND programs found in RAG
if not is_simple_question and not is_document_request and programs:
    actions = [autobirokrasi_action, marketplace_action]  # 2 ACTIONS
    next_steps = full_application_steps  # 5-6 STEPS
```

### Response Structure
```
┌─────────────────────────────────────────────┐
│  💬 Text Explanation                        │
│                                             │
│  Berdasarkan situasi Anda sebagai buruh     │
│  bangunan dengan 3 anak sekolah, ada        │
│  beberapa program yang relevan...           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📋 Program Keluarga Harapan (PKH)          │  ← PROGRAM CARD 1
│  Bantuan tunai bersyarat Rp 3 juta/tahun... │
│  💰 Benefit: Rp 3.000.000/tahun             │
│  📜 Permensos No. 1/2024                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📋 Kartu Indonesia Pintar (KIP)            │  ← PROGRAM CARD 2
│  Bantuan pendidikan untuk anak sekolah...   │
│  💰 Benefit: Hingga Rp 1.000.000/tahun      │
│  📜 Perpres No. 63/2017                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📚 Sumber Informasi                        │
│                                             │
│  📜 Dasar Hukum:                            │
│  • Permensos No. 1/2024 (PKH)               │
│  • Perpres No. 63/2017 (KIP)                │
│                                             │
│  🌐 Sumber Web:                             │
│  • Program PKH - Kemensos                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  💡 Langkah selanjutnya:                    │  ← ACTION BUTTONS
│                                             │     (what to DO)
│  ┌──────────────────────────────────────┐   │
│  │ 📄 Siapkan Dokumen Otomatis         │   │  ← PRIMARY
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 📋 Lihat Semua Program              │   │  ← OUTLINE
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ✓ Cara mengajukan:                        │  ← PROCESS STEPS
│                                             │     (HOW to do it)
│  1. Gunakan fitur Auto-Birokrasi untuk      │
│     menyiapkan dokumen (tombol di atas)     │
│                                             │
│  2. Atau siapkan manual: KTP, KK, SKTM      │
│                                             │
│  3. Datang ke Dinas Sosial terdekat dengan  │
│     dokumen lengkap                         │
│                                             │
│  4. Isi formulir pendaftaran dan serahkan   │
│     ke petugas                              │
│                                             │
│  5. Tunggu proses verifikasi 7-14 hari kerja│
└─────────────────────────────────────────────┘
```

### Logs
```
✅ RAG returned 5 results
📋 Programs extracted: 2
   Actions generated: 2  ✅ (Auto-Birokrasi + Marketplace)
   Next steps generated: 5  ✅ (Full application flow)
```

### Why?
User is ready to apply. Show them everything: what programs they qualify for, how to prepare, and clear next steps.

---

## 🚨 PATH 4: Emergency (Priority First!)

### Query Pattern
```
"Suami jatuh dari perancah, di rumah sakit"
"Rumah saya kebakaran, kehilangan semua"
"Anak saya sakit keras, tidak punya biaya"
"Korban kekerasan dalam rumah tangga"
```

### Detection Logic
```python
# Already exists in escalation.py
escalation = detect_escalation(message)

if escalation['detected'] and escalation['priority'] == 'red':
    # Emergency alert FIRST
    # Hotline action FIRST
    # Priority steps with 🚨 markers
```

### Response Structure
```
┌─────────────────────────────────────────────┐
│  🚨 SITUASI DARURAT TERDETEKSI              │  ← RED ALERT BOX
│  (border-destructive, bg-destructive/10)    │     APPEARS FIRST!
│                                             │
│  🏥 Situasi Darurat Terdeteksi              │
│  Kata kunci: jatuh, perancah, rumah sakit   │
│                                             │
│  Langkah Segera:                            │
│  • Hubungi layanan darurat: 119             │
│  • Pastikan kondisi aman                    │
│                                             │
│  📞 Kontak Darurat:                         │
│  • Ambulans: 119 [Tap to call]              │
│  • BPJS Kesehatan: 1500 400                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  💬 Text Response                           │
│                                             │
│  Saya memahami ini adalah situasi darurat.  │
│  Ada beberapa program bantuan yang bisa     │
│  membantu Anda...                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📋 Jaminan Kecelakaan Kerja (JKK)          │  ← EMERGENCY PROGRAMS
│  Bantuan untuk kecelakaan kerja...          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  💡 Langkah selanjutnya:                    │  ← PRIORITY ACTIONS
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 🚨 Hubungi Layanan Darurat          │   │  ← FIRST! URGENT!
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 📄 Siapkan Dokumen Klaim            │   │  ← THEN this
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ✓ Cara mengajukan:                        │  ← PRIORITY STEPS
│                                             │
│  1. 🚨 PRIORITAS: Hubungi layanan darurat   │
│     segera (119)                            │
│                                             │
│  2. 📞 Telepon: 119                         │
│                                             │
│  3. Pastikan kondisi aman dan stabil        │
│                                             │
│  4. Simpan semua bukti dan dokumen terkait  │
└─────────────────────────────────────────────┘
```

### Logs
```
⚠️  Escalation detected: True
   Priority: red
   Keywords: ['jatuh', 'perancah', 'rumah sakit']
   Hotlines: ['119']
📋 Programs extracted: 2
   Actions generated: 2  ✅ (Emergency hotline FIRST)
   Next steps generated: 4  ✅ (Priority steps only)
```

### Why?
In emergencies, every second counts. Show the alert FIRST, give immediate hotline access, and prioritize urgent actions over exploratory features.

---

## 🔄 Decision Tree

```
┌────────────────────────────────────────────────────────────────┐
│                     START: User Query                          │
└───────────────────────────────┬────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Emergency Keywords?  │
                    │  (escalation.py)      │
                    └───────┬───────────────┘
                            │
                ┌───────────┼───────────┐
                │                       │
               YES                     NO
                │                       │
                ▼                       ▼
        ┌───────────────┐     ┌────────────────┐
        │  PATH 4       │     │ Document       │
        │  EMERGENCY    │     │ Keywords?      │
        └───────────────┘     └───┬────────────┘
                                  │
                      ┌───────────┼───────────┐
                      │                       │
                     YES                     NO
                      │                       │
                      ▼                       ▼
              ┌───────────────┐     ┌────────────────┐
              │  PATH 2       │     │ Question       │
              │  DIRECT TOOL  │     │ Keywords?      │
              └───────────────┘     └───┬────────────┘
                                        │
                            ┌───────────┼───────────┐
                            │                       │
                           YES                     NO
                            │                       │
                            ▼                       ▼
                    ┌───────────────┐     ┌────────────────┐
                    │  Programs     │     │  Programs      │
                    │  Found?       │     │  Found?        │
                    └───┬───────────┘     └───┬────────────┘
                        │                     │
                ┌───────┼───────┐     ┌───────┼───────┐
                │               │     │               │
               NO              YES   YES             NO
                │               │     │               │
                ▼               ▼     ▼               ▼
        ┌───────────┐   ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  PATH 1   │   │  PATH 1  │ │  PATH 3  │ │  PATH 3  │
        │  LEARN    │   │  LEARN   │ │  FULL    │ │  FULL    │
        │  (no spam)│   │  (no     │ │  JOURNEY │ │  JOURNEY │
        │           │   │  spam)   │ │          │ │          │
        └───────────┘   └──────────┘ └──────────┘ └──────────┘
```

---

## 📊 Feature Matrix

|                | PATH 1 | PATH 2 | PATH 3 | PATH 4 |
|----------------|:------:|:------:|:------:|:------:|
| **Text Answer**    | ✅ | ✅ | ✅ | ✅ |
| **Citations**      | ✅ | ❌ | ✅ | ✅ |
| **Emergency Alert**| ❌ | ❌ | ❌ | ✅ |
| **Program Cards**  | ❌ | ❌ | ✅ | ✅ |
| **Action Buttons** | ❌ | ✅ (1) | ✅ (2) | ✅ (2) |
| **Next Steps**     | ❌ | ❌ | ✅ (5-6) | ✅ (4-5) |
| **Button Priority**| - | Primary | Primary+Outline | Emergency First |

---

## 💡 Label Differences

### Before Fix (DUPLICATE):
```
💡 Langkah selanjutnya:     ← Action buttons
[📄 Button 1]
[📋 Button 2]

✓ Langkah berikutnya:       ← Next steps (SAME MEANING!)
1. Step 1...
2. Step 2...
```

**Problem:** Users confused - "Langkah selanjutnya" and "Langkah berikutnya" mean the same thing!

### After Fix (CLEAR):
```
💡 Langkah selanjutnya:     ← ACTIONS (what to DO)
[📄 Button 1]
[📋 Button 2]

✓ Cara mengajukan:          ← PROCESS (HOW to do it)
1. Step 1...
2. Step 2...
```

**Benefit:** Clear separation of:
- **Actions** = What to DO (buttons to click)
- **Process** = HOW to do it (step-by-step instructions)

---

## 🎯 Summary

### The Smart System:

1. **Detects Intent**
   - Question? Document? Application? Emergency?

2. **Responds Appropriately**
   - Only shows relevant features
   - No spam, no overwhelming

3. **Guides Users**
   - Questions → Let them explore
   - Documents → Direct tool access
   - Applications → Full journey
   - Emergencies → Priority actions

4. **Clear Separation**
   - "Langkah selanjutnya" = Actions
   - "Cara mengajukan" = Process

### Result:
**A chat system that respects user intent and provides exactly what they need, when they need it.**

🎉 **Smart, not spammy!**
