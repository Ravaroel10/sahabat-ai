## Why

Saat ini, chat interface memiliki beberapa masalah UX yang mengurangi kejelasan dan kegunaannya: (1) intent_classification dikirim ke response LLM yang tidak seharusnya terlihat oleh user, (2) program_card ditampilkan sebagai referensi utuh tanpa konteks, padahal seharusnya muncul sebagai komponen interaktif di bawah penjelasan dengan petunjuk jelas, dan (3) langkah selanjutnya terlalu generic (hanya "Siapkan Dokumen Otomatis" dan "Lihat semua program") tanpa konteks spesifik terhadap situasi user. Perbaikan ini akan meningkatkan kejelasan, relevansi, dan interaktivitas chat responses.

## What Changes

- Hapus intent_classification dari metadata yang dikirim ke client dalam chat response
- Ubah cara program_card di-render: dari standalone card menjadi komponen yang muncul di bawah teks penjelasan dengan petunjuk interaktif ("Berikut detail program, klik untuk melihat lebih lanjut")
- Buat sistem next_steps yang kontekstual: ganti langkah generic dengan langkah spesifik berdasarkan program, user situation, dan conversation context
- Perbarui backend (Python AI service) untuk mengirim next_steps yang kontekstual berdasarkan program yang disebutkan
- Perbarui frontend untuk merender program cards sebagai collapsible/expandable components dengan visual cues

## Capabilities

### New Capabilities
- `contextual-next-steps`: Sistem untuk menghasilkan langkah selanjutnya yang spesifik berdasarkan program, user context, dan conversation state (bukan langkah generic)
- `interactive-program-cards`: Program cards sebagai komponen interaktif yang dapat di-expand/collapse dengan petunjuk visual jelas

### Modified Capabilities
- `chat-response-metadata`: Menghilangkan intent_classification dari response stream dan menyempurnakan struktur metadata yang dikirim ke client

## Impact

**Backend (Python AI Service):**
- `/chat` endpoint route handler - modifikasi metadata response
- LLM service layer - logic untuk generate contextual next_steps
- Response streaming - hapus intent_classification dari metadata

**Frontend (Next.js):**
- `src/app/api/chat/route.ts` - proxy yang memproses metadata stream
- `src/components/unified-chat/unified-chat-interface.tsx` - rendering message parts
- `src/components/unified-chat/message-parts.tsx` - ProgramCardRenderer dan NextStepsRenderer
- `src/components/marketplace/program-card.tsx` - kemungkinan refactor untuk reusability

**User Experience:**
- Chat responses lebih bersih (tanpa technical metadata)
- Program cards lebih kontekstual dan interaktif
- Langkah selanjutnya lebih actionable dan relevan
