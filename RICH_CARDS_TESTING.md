# Rich Message Cards - Testing Guide

## ✅ Phase 1 & 2 Complete!

I've implemented:
1. ✅ Fixed frontend types (using `data-*` prefix)
2. ✅ Created mock API endpoints for testing
3. ✅ Removed TypeScript errors

---

## 🧪 How to Test

### Step 1: Use Mock API

**File:** `src/components/unified-chat/unified-chat-interface.tsx`

**Change line 45 from:**
```typescript
const { messages, sendMessage, status, error } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',  // ← Current (real API)
  }),
});
```

**To:**
```typescript
const { messages, sendMessage, status, error } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat-mock',  // ← Use mock API
  }),
});
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Test Normal Scenario

1. Navigate to the chat interface
2. Type ANY message (the mock ignores input and returns fake data)
3. Send the message

**Expected Result:**
- ✅ Text streams character by character
- ✅ Two program cards appear (PKH and KIP)
- ✅ Citations section shows 2 regulations
- ✅ Action buttons appear with links
- ✅ Next steps checklist appears with 5 items

### Step 4: Test Emergency Scenario

**Change to emergency mock:**
```typescript
api: '/api/chat-mock-emergency',  // ← Emergency scenario
```

Then send any message.

**Expected Result:**
- ✅ **RED emergency alert appears FIRST** with:
  - Emergency type icon (🏥)
  - Priority level
  - Keywords detected
  - Immediate action steps (5 items)
  - Emergency contacts (3 contacts with phone numbers)
- ✅ Text streams after emergency alert
- ✅ Two program cards (JKK and BSU)
- ✅ Citations for regulations
- ✅ Action buttons
- ✅ Next steps with PRIORITY highlighted

---

## 📸 What You Should See

### Normal Scenario:

```
┌────────────────────────────────────────────────┐
│ BantuArah AI                                   │
├────────────────────────────────────────────────┤
│ Berdasarkan situasi Anda sebagai buruh        │
│ bangunan dengan penghasilan Rp 1,5 juta/bulan │
│ dan 3 anak sekolah, Anda memenuhi syarat:     │
│                                                 │
│ ┌──────────────────────────────────────────┐  │
│ │ Program Keluarga Harapan (PKH)      PKH  │  │
│ │ Bantuan tunai bersyarat untuk...         │  │
│ │ 💰 Benefit: Rp 3.000.000/tahun           │  │
│ │ 📜 Permensos No. 1/2024, Pasal 5         │  │
│ └──────────────────────────────────────────┘  │
│                                                 │
│ ┌──────────────────────────────────────────┐  │
│ │ Kartu Indonesia Pintar (KIP)        KIP  │  │
│ │ Bantuan pendidikan untuk anak...         │  │
│ │ 💰 Benefit: Rp 1.000.000/tahun/anak      │  │
│ └──────────────────────────────────────────┘  │
│                                                 │
│ Kedua program ini sangat sesuai dengan...     │
│                                                 │
│ ──────────────────────────────────────────    │
│ 📜 Dasar Hukum:                                │
│ • Permensos No. 1/2024, Pasal 5, Ayat 2       │
│ • Permendikbud No. 10/2020                     │
│                                                 │
│ ──────────────────────────────────────────    │
│ 💡 Langkah selanjutnya:                        │
│ [📋 Lihat Semua Program di Marketplace]        │
│ [🌐 Website Resmi Kemensos]                    │
│                                                 │
│ ──────────────────────────────────────────    │
│ ✓ Langkah berikutnya:                          │
│ 1. Siapkan dokumen: KTP, KK, SKTM              │
│ 2. Datang ke Dinas Sosial terdekat             │
│ 3. Isi formulir pendaftaran                    │
│ 4. Tunggu proses verifikasi 7-14 hari          │
│ 5. Jika lolos, Anda akan dihubungi            │
└────────────────────────────────────────────────┘
```

### Emergency Scenario:

```
┌────────────────────────────────────────────────┐
│ BantuArah AI                                   │
├────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐  │
│ │ ⚠️ 🏥 Situasi Darurat Terdeteksi          │  │
│ │ Kata kunci: jatuh, perancah, rumah sakit  │  │
│ │                                            │  │
│ │ Langkah SEKARANG:                          │  │
│ │ 1. Pastikan korban dalam kondisi aman     │  │
│ │ 2. Hubungi ambulans 119                    │  │
│ │ 3. Laporkan ke perusahaan SEGERA          │  │
│ │ 4. Hubungi BPJS TK di 1500-410            │  │
│ │ 5. Simpan semua bukti                      │  │
│ │                                            │  │
│ │ 📞 Kontak Darurat:                         │  │
│ │ Ambulans Darurat: 119                      │  │
│ │ BPJS Ketenagakerjaan: 1500-410            │  │
│ │ Posko Kesehatan: 021-5210411              │  │
│ └──────────────────────────────────────────┘  │
│                                                 │
│ Saya memahami ini situasi darurat. Suami      │
│ Anda mengalami kecelakaan kerja yang serius.  │
│                                                 │
│ Selain langkah darurat di atas, berikut       │
│ bantuan yang bisa Anda akses:                  │
│                                                 │
│ ┌──────────────────────────────────────────┐  │
│ │ Jaminan Kecelakaan Kerja (JKK)       JKK │  │
│ │ Perlindungan bagi pekerja yang...         │  │
│ │ 💰 Biaya pengobatan penuh + santunan      │  │
│ └──────────────────────────────────────────┘  │
│                                                 │
│ [continuing with more cards, citations, etc.]  │
└────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Cards Not Showing
1. Check browser console for errors
2. Verify you changed to `/api/chat-mock`
3. Restart dev server: `Ctrl+C` then `npm run dev`
4. Clear browser cache: `Ctrl+Shift+R`

### TypeScript Errors
1. Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. Check you saved all files
3. Run `npm run lint` to see errors

### Emergency Alert Not Red
- Check Tailwind is generating classes: `destructive` color should be defined in `tailwind.config.ts`

### Citations Not Collapsing
- This is expected - the current implementation shows them expanded
- You can enhance later with collapse functionality

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Program cards render with correct styling
- [ ] Program name, description, and benefits display
- [ ] Citations section appears with regulation list
- [ ] Action buttons are clickable
- [ ] External links open in new tab (have `ExternalLink` icon)
- [ ] Next steps show as numbered list
- [ ] Emergency alert has red/destructive styling
- [ ] Emergency contacts are phone-linkable (clickable `tel:` links)
- [ ] Text streams smoothly without jarring jumps
- [ ] Loading animation shows while streaming

---

## 📊 Performance Notes

The mock API includes artificial delays:
- `await new Promise(resolve => setTimeout(resolve, 30))` - between text chunks
- `await new Promise(resolve => setTimeout(resolve, 50))` - before cards

This simulates real network latency. Your actual Python service will have natural delays from:
- RAG search (~100-300ms)
- LiteLLM streaming (token by token)
- Network latency to OpenRouter

---

## 🚀 Next Steps After Testing

Once you verify the mock works:

### Phase 3: Update Real Backend API
**File:** `src/app/api/chat/route.ts`

Add transformation logic to emit `data-*` parts from Python metadata:

```typescript
if (data.type === 'metadata') {
  const metadata = data;
  
  // Emit citations
  if (metadata.citations?.length > 0) {
    writer.write({
      type: 'data-citation',
      data: { citations: metadata.citations },
    });
  }
  
  // Emit emergency
  if (metadata.emergency) {
    writer.write({
      type: 'data-emergency',
      data: {
        emergency: metadata.emergency,
        immediateSteps: metadata.immediateSteps || [],
        contacts: metadata.emergencyContacts || [],
      },
    });
  }
  
  // ... more transformations
}
```

### Phase 4: Update Python Service
**Files:** 
- `ai-service/api/chat.py`
- `ai-service/orchestrator/orchestrator.py`

Emit structured data parts from RAG and LLM:

```python
# After RAG search, emit program cards
for result in rag_results:
    if result.get('metadata', {}).get('record_type') == 'program':
        yield {
            "type": "data-program",
            "data": {
                "program": {
                    "id": metadata.get('record_id'),
                    "name": metadata.get('name'),
                    # ... more fields
                }
            }
        }
```

---

## 📸 Send Me Screenshots!

Once you see the cards rendering:
1. Take a screenshot of the normal scenario
2. Take a screenshot of the emergency scenario
3. Share with me so I can verify everything works!

Then we'll move to Phase 3 & 4 to integrate with your real backend. 🎉

---

**Happy testing! 🧪**
