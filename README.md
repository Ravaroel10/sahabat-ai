# BantuArah

Platform AI untuk membantu warga Indonesia memahami dan mengakses hak-hak sosial mereka — bantuan PKH, BPNT, BPJS, bantuan lansia, dan program pemerintah lainnya.

## Fitur Utama (Setelah Konsolidasi)

Setelah konsolidasi fitur (lihat `openspec/changes/feature-consolidation/`), platform terdiri dari **3 fitur utama**:

1. **BantuArah AI** (`/chat`) — Chat AI multi-kemampuan: navigasi hak, sitasi peraturan (Permensos, Perpres, UU), fact-check, dan eskalasi darurat.
2. **Marketplace** (`/programs`) — Direktori program bantuan sosial dengan filter kelayakan (penghasilan, keluarga, lokasi). Menggantikan `/scanner` lama.
3. **Auto-Birokrasi** (`/documents`) — Pembuatan otomatis dokumen pendaftaran (surat permohonan, KTP, KK) dengan template yang sesuai.

## Memulai

### Prasyarat

- Node.js 20+
- Python 3.11+ (untuk AI service)\

### Development Server

```bash
# Frontend (Next.js)
bun install
bun run dev

# Backend AI service (Python)
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Buka [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
bun run dev       # Development
bun run build     # Production build
bun run test      # Jest test suite
bun run lint      # ESLint
```

## Konfigurasi

Lihat `.env.example`. Variabel penting:

- `AI_SERVICE_URL` — URL Python AI service (`http://localhost:8000` saat development)
- `NEXT_PUBLIC_ENABLE_UNIFIED_FEATURES` — feature flag untuk mengaktifkan/menonaktifkan UI konsolidasi (default: `true`)

## Arsitektur

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + shadcn/ui
- **Chat**: Vercel AI SDK (`useChat` hook) dengan streaming SSE
- **AI Service**: Python FastAPI + single-orchestrator LLM pipeline (lihat `ai-service/orchestrator/`)
- **State Persistence**: React Context (`UserContext`) — chat history max 50 pesan, filter persistence, Auto-Birokrasi drafts
- **Routing**: Legacy `/scanner` di-redirect 301 ke `/marketplace?filters=expanded`

## Perubahan Terbaru (Feature Consolidation)

Lihat `openspec/changes/feature-consolidation/` untuk proposal, design, dan tasks lengkap. Highlights:

- 3 fitur utama menggantikan 7+ fitur terpisah
- Chat AI multi-kemampuan dengan sitasi peraturan
- Filter kelayakan dengan URL persistence (shareable)
- Error boundaries per-route + global fallback
- AbortController timeout untuk upstream AI service
- React.memo + skeleton loaders untuk marketplace performance
- Journey analytics tracking (`src/lib/analytics.ts`)
- Unit tests untuk eligibility logic, filter URL, dan analytics buffer

## Deployment

Lihat [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
