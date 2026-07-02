# Rich Message Cards - Architecture Diagram

## 🏗️ Current Architecture (Broken)

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (unified-chat-interface.tsx)                           │
│                                                                  │
│ Expects:                                                         │
│   - 'citation' type          ❌ (doesn't exist in AI SDK)      │
│   - 'emergency-alert' type   ❌ (doesn't exist in AI SDK)      │
│   - 'program-card' type      ❌ (doesn't exist in AI SDK)      │
│   - 'action-buttons' type    ❌ (doesn't exist in AI SDK)      │
│                                                                  │
│ Result: TypeScript errors + nothing renders                     │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ SSE Stream
                              │
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (api/chat/route.ts)                                     │
│                                                                  │
│ Currently emits:                                                 │
│   { type: 'text-delta', delta: '...' }     ✅ Works           │
│   { type: 'message-metadata', ... }        ⚠️  Not used       │
│                                                                  │
│ Missing:                                                         │
│   { type: 'data-program', ... }            ❌ Not emitted      │
│   { type: 'data-citation', ... }           ❌ Not emitted      │
│   { type: 'data-emergency', ... }          ❌ Not emitted      │
│                                                                  │
│ Result: Only text messages sent to frontend                     │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ SSE Stream
                              │
┌─────────────────────────────────────────────────────────────────┐
│ PYTHON AI SERVICE (ai-service/api/chat.py)                      │
│                                                                  │
│ Currently returns:                                               │
│   {"type": "token", "data": "..."}         ✅ Works           │
│   {"type": "metadata", "citations": [...]} ⚠️  Sent but unused│
│   {"type": "done"}                         ✅ Works           │
│                                                                  │
│ Missing structured output for:                                   │
│   - Program cards                          ❌                  │
│   - Action buttons                         ❌                  │
│   - Next steps                             ❌                  │
│                                                                  │
│ Result: Plain text + minimal metadata                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Target Architecture (Working)

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (unified-chat-interface.tsx)                           │
│                                                                  │
│ Receives message.parts:                                          │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ { type: 'text', text: '...' }                        │     │
│   │ { type: 'data-program', data: { program: {...} } }   │     │
│   │ { type: 'data-citation', data: { citations: [...] }} │     │
│   │ { type: 'data-actions', data: { actions: [...] } }   │     │
│   │ { type: 'data-emergency', data: { emergency: {...} }}│     │
│   │ { type: 'data-steps', data: { steps: [...] } }       │     │
│   └──────────────────────────────────────────────────────┘     │
│                                                                  │
│ Switch cases handle each type:                                   │
│   'data-program'   → ProgramCardRenderer   ✅                 │
│   'data-citation'  → CitationRenderer      ✅                 │
│   'data-emergency' → EmergencyAlertRenderer ✅                 │
│   'data-actions'   → ActionButtonsRenderer  ✅                 │
│   'data-steps'     → NextStepsRenderer      ✅                 │
│                                                                  │
│ Result: Rich UI with cards, buttons, alerts                     │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ SSE Stream with data-* parts
                              │
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (api/chat/route.ts)                                     │
│                                                                  │
│ Transforms Python SSE → AI SDK format:                          │
│                                                                  │
│ Python: {"type": "token", "data": "..."}                        │
│    ↓                                                             │
│ AI SDK: { type: 'text-delta', delta: '...' }                   │
│                                                                  │
│ Python: {"type": "metadata", "programs": [...]}                 │
│    ↓                                                             │
│ AI SDK: { type: 'data-program', data: { program: {...} } }     │
│         { type: 'data-citation', data: { citations: [...] } }   │
│         { type: 'data-actions', data: { actions: [...] } }      │
│                                                                  │
│ Result: All rich data parts sent to frontend                    │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ SSE Stream
                              │
┌─────────────────────────────────────────────────────────────────┐
│ PYTHON AI SERVICE (ai-service/api/chat.py)                      │
│                                                                  │
│ Orchestrator flow:                                               │
│   1. RAG Search → Find relevant programs                        │
│   2. Emergency Detection → Check for urgent keywords            │
│   3. LLM Generation → Stream text response                      │
│   4. Post-processing → Extract citations, actions               │
│                                                                  │
│ Yields structured SSE events:                                    │
│   {"type": "token", "data": "..."}             ✅             │
│   {"type": "data-program", "data": {...}}      ✅             │
│   {"type": "data-citation", "data": {...}}     ✅             │
│   {"type": "data-emergency", "data": {...}}    ✅             │
│   {"type": "data-actions", "data": {...}}      ✅             │
│   {"type": "done"}                             ✅             │
│                                                                  │
│ Result: Structured output ready for rich UI                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Example

### User Query:
> "Saya buruh bangunan, penghasilan Rp 1,5 juta/bulan, punya 3 anak sekolah"

### 1. Python AI Service Processing:

```python
# RAG Search
programs = rag_search("buruh bangunan penghasilan rendah")
# Found: PKH, BPNT, KIP

# Emergency Detection
is_emergency = detect_emergency(message)
# Result: False (no emergency keywords)

# LLM Generation
stream = llm.generate(message, context=programs)
# Streaming: "Berdasarkan situasi Anda..."
```

### 2. Python SSE Output:

```json
{"type": "token", "data": "Berdasarkan"}
{"type": "token", "data": " situasi"}
{"type": "token", "data": " Anda"}
{"type": "token", "data": "..."}

{"type": "data-program", "data": {
  "program": {
    "id": "pkh",
    "name": "Program Keluarga Harapan (PKH)",
    "description": "Bantuan tunai bersyarat...",
    "benefits": "Rp 3.000.000/tahun"
  }
}}

{"type": "data-program", "data": {
  "program": {
    "id": "kip",
    "name": "Kartu Indonesia Pintar (KIP)",
    "description": "Bantuan pendidikan...",
    "benefits": "Rp 1.000.000/tahun per anak"
  }
}}

{"type": "data-citation", "data": {
  "citations": [
    {
      "regulation": "Permensos No. 1/2024",
      "article": "Pasal 5",
      "fullCitation": "Permensos No. 1/2024, Pasal 5"
    }
  ]
}}

{"type": "data-actions", "data": {
  "actions": [
    {
      "type": "marketplace",
      "label": "Lihat Semua Program",
      "href": "/marketplace?income=1500000&children=3"
    }
  ]
}}

{"type": "data-steps", "data": {
  "steps": [
    "Siapkan KTP dan Kartu Keluarga",
    "Datang ke Dinas Sosial",
    "Isi formulir pendaftaran"
  ]
}}

{"type": "done"}
```

### 3. Next.js Backend Transformation:

```typescript
// Input: Python SSE events
// Output: Vercel AI SDK stream

writer.write({ type: 'text-start', id: messageId });
writer.write({ type: 'text-delta', id: messageId, delta: 'Berdasarkan' });
writer.write({ type: 'text-delta', id: messageId, delta: ' situasi' });
// ... more text deltas

writer.write({
  type: 'data-program',
  data: {
    program: { id: 'pkh', name: 'PKH', ... }
  }
});

writer.write({
  type: 'data-program',
  data: {
    program: { id: 'kip', name: 'KIP', ... }
  }
});

writer.write({
  type: 'data-citation',
  data: { citations: [...] }
});

writer.write({
  type: 'data-actions',
  data: { actions: [...] }
});

writer.write({
  type: 'data-steps',
  data: { steps: [...] }
});

writer.write({ type: 'text-end', id: messageId });
writer.write({ type: 'finish', finishReason: 'stop' });
```

### 4. Frontend Rendering:

```tsx
{message.parts.map((part, index) => {
  switch (part.type) {
    case 'text':
      return <Markdown>{part.text}</Markdown>;
    
    case 'data-program':
      // Renders PKH card
      // Renders KIP card
      return <ProgramCardRenderer program={part.data.program} />;
    
    case 'data-citation':
      // Renders "📜 Dasar Hukum: Permensos No. 1/2024, Pasal 5"
      return <CitationRenderer citations={part.data.citations} />;
    
    case 'data-actions':
      // Renders "📋 Lihat Semua Program" button
      return <ActionButtonsRenderer actions={part.data.actions} />;
    
    case 'data-steps':
      // Renders numbered checklist
      return <NextStepsRenderer steps={part.data.steps} />;
  }
})}
```

### 5. Final UI:

```
┌────────────────────────────────────────────────┐
│ BantuArah AI                                   │
├────────────────────────────────────────────────┤
│ Berdasarkan situasi Anda sebagai buruh        │
│ bangunan dengan penghasilan Rp 1,5 juta/bulan │
│ dan 3 anak sekolah, Anda memenuhi syarat:     │
│                                                 │
│ ┌────────────────────────────────────────┐   │
│ │ Program Keluarga Harapan (PKH)    PKH  │   │
│ │ Bantuan tunai bersyarat...              │   │
│ │ 💰 Benefit: Rp 3.000.000/tahun         │   │
│ └────────────────────────────────────────┘   │
│                                                 │
│ ┌────────────────────────────────────────┐   │
│ │ Kartu Indonesia Pintar (KIP)      KIP  │   │
│ │ Bantuan pendidikan untuk anak...        │   │
│ │ 💰 Benefit: Rp 1.000.000/tahun/anak    │   │
│ └────────────────────────────────────────┘   │
│                                                 │
│ ──────────────────────────────────────────    │
│ 📜 Dasar Hukum:                                │
│ • Permensos No. 1/2024, Pasal 5                │
│                                                 │
│ ──────────────────────────────────────────    │
│ 💡 Langkah selanjutnya:                        │
│ [📋 Lihat Semua Program]                       │
│                                                 │
│ ──────────────────────────────────────────    │
│ ✓ Langkah berikutnya:                          │
│ 1. Siapkan KTP dan Kartu Keluarga              │
│ 2. Datang ke Dinas Sosial                      │
│ 3. Isi formulir pendaftaran                    │
└────────────────────────────────────────────────┘
```

---

## 🎨 Component Breakdown

### Text Content
```typescript
<Markdown>{part.text}</Markdown>
```

### Program Card
```tsx
<Card className="mt-3 bg-accent/50">
  <div className="p-3">
    <h4>Program Keluarga Harapan (PKH)</h4>
    <Badge>PKH</Badge>
    <p>Bantuan tunai bersyarat...</p>
    <div>💰 Benefit: Rp 3.000.000/tahun</div>
  </div>
</Card>
```

### Citation Section
```tsx
<div className="border-t">
  <p>📜 Dasar Hukum:</p>
  <div>• Permensos No. 1/2024, Pasal 5</div>
</div>
```

### Action Buttons
```tsx
<div className="flex gap-2">
  <Button variant="outline">
    📋 Lihat Semua Program
  </Button>
</div>
```

### Next Steps Checklist
```tsx
<ol>
  <li>1. Siapkan KTP dan Kartu Keluarga</li>
  <li>2. Datang ke Dinas Sosial</li>
  <li>3. Isi formulir pendaftaran</li>
</ol>
```

---

## 📊 Implementation Phases

### Phase 1: Frontend Fix ✅
- Update types to use `data-*` prefix
- Update component switch cases
- **Time:** 30 minutes
- **Result:** TypeScript errors gone

### Phase 2: Mock Testing ✅
- Create mock API endpoint
- Test with fake data
- **Time:** 15 minutes
- **Result:** See cards rendering!

### Phase 3: Backend Transform 🔄
- Transform Python metadata to data-* parts
- **Time:** 2 hours
- **Result:** Real citations display

### Phase 4: Python Enhancement 🚀
- Structure LLM output for rich UI
- Add RAG program extraction
- **Time:** 3-4 hours
- **Result:** Full rich experience

---

## 🔑 Key Takeaways

1. **Vercel AI SDK requires `data-*` prefix** for custom structured data
2. **Your renderers are perfect** - they just need the right data format
3. **Backend is the bridge** - transforms Python SSE to AI SDK format
4. **Test incrementally** - mock first, then real backend, then Python
5. **Data flow is:** Python → Next.js API → Frontend → Renderers

---

**Ready to start? Begin with Phase 1! 🚀**
