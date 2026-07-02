# Enhanced Citations & Auto-Birokrasi Integration ✅

## What Was Added

Based on your feedback, I've enhanced the implementation with:

### 1. ✅ Multiple Citation Types

**Before:** Only "Dasar Hukum" (regulations)
**Now:** Four citation types with smart grouping

#### Citation Types:

1. **`regulation`** - Laws and regulations
   - Format: "Permensos No. 1/2024, Pasal 5, Ayat 2"
   - Label: "📜 Dasar Hukum"

2. **`website`** - Web sources (Exa API results)
   - Shows: Title, domain, URL, snippet
   - Label: "🌐 Sumber Web"
   - Clickable links with external icon

3. **`rag-document`** - RAG/ChromaDB results
   - Shows: Title, snippet, relevance score
   - Label: "📄 Dokumen Terkait"
   - From your ingested data

4. **`institution-info`** - Institution contacts
   - Shows: Name, contact number
   - Label: "🏛️ Informasi Institusi"

### 2. ✅ Dynamic Section Labels

**Before:** Always "Dasar Hukum"
**Now:** Customizable per context

```typescript
{
  type: 'data-citation',
  data: {
    sectionLabel: 'Sumber Informasi',  // ← Dynamic!
    citations: [...]
  }
}
```

Options:
- "Dasar Hukum" - for pure regulations
- "Sumber Informasi" - mixed sources
- "Referensi" - general references
- "Dasar Hukum & Sumber" - combined

### 3. ✅ Auto-Birokrasi Integration

**New action type:** `auto-birokrasi`

Features:
- **Primary CTA** - styled with default variant (stands out)
- **Document generation** - automatic form filling
- **Program context** - knows which program you're applying for
- **Multiple documents** - can generate SKTM, Surat Permohonan, etc.

#### Example Usage:

```typescript
{
  type: 'auto-birokrasi',
  label: '📄 Siapkan Dokumen Otomatis',
  href: '/auto-birokrasi?documents=sktm,surat-permohonan,kk&program=pkh',
  description: 'Generate SKTM, Surat Permohonan otomatis',
  documentType: 'multiple',
  programId: 'pkh',
}
```

### 4. ✅ Enhanced Next Steps

**Now includes Auto-Birokrasi as first step:**

```
1. 📄 Siapkan dokumen dengan fitur Auto-Birokrasi (klik tombol di atas)
2. Atau siapkan manual: KTP, KK, SKTM
3. Datang ke Dinas Sosial...
```

---

## Type Definitions

### New Types in `llm-response.ts`:

```typescript
// Base citation type
type CitationType = 'regulation' | 'website' | 'rag-document' | 'institution-info';

// Regulation citation (existing, enhanced)
interface RegulationCitation {
  type: 'regulation';
  title: string;
  regulation: string;
  article?: string;
  verse?: string;
  fullCitation: string;
  url?: string;
}

// Website citation (NEW)
interface WebsiteCitation {
  type: 'website';
  title: string;
  domain: string;
  url?: string;
  snippet?: string;
  publishedDate?: string;
}

// RAG document citation (NEW)
interface RAGDocumentCitation {
  type: 'rag-document';
  title: string;
  source: string; // e.g., "programs", "institutions"
  recordId: string;
  snippet?: string;
  score?: number;
}

// Institution citation (NEW)
interface InstitutionCitation {
  type: 'institution-info';
  title: string;
  institutionName: string;
  contact?: string;
  source: string;
}

// Union type
type Citation = 
  | RegulationCitation 
  | WebsiteCitation 
  | RAGDocumentCitation 
  | InstitutionCitation;
```

### Enhanced ActionSuggestion:

```typescript
interface ActionSuggestion {
  type: 'marketplace' | 'auto-birokrasi' | 'external' | 'document-template';
  label: string;
  href?: string;
  description?: string;
  icon?: string;
  // NEW: Auto-Birokrasi specific
  documentType?: string; // e.g., "sktm", "multiple", "jkk-claim"
  programId?: string;    // Related program
}
```

---

## UI Rendering

### Citation Renderer - Smart Grouping

Citations are automatically grouped by type and displayed with appropriate icons:

```
📚 Sumber Informasi:

📜 Dasar Hukum:
• Permensos No. 1/2024, Pasal 5, Ayat 2

🌐 Sumber Web:
• Program Keluarga Harapan - Kemensos (kemensos.go.id) [🔗]
  "Program PKH adalah bantuan sosial bersyarat..."

📄 Dokumen Terkait:
• PKH - Data Program Bantuan Sosial
  "Bantuan tunai bersyarat untuk keluarga miskin..."

🏛️ Informasi Institusi:
• Kementerian Sosial RI (021-7854 8000)
```

### Action Buttons - Visual Hierarchy

**Auto-Birokrasi** gets primary styling (default variant = filled button):

```
[📄 Siapkan Dokumen Otomatis]  ← Primary (filled)
[📋 Lihat di Marketplace]      ← Secondary (outline)
[📝 Download Template]          ← Secondary (outline)
[🌐 Website Kemensos]          ← External (outline + icon)
```

---

## Mock API Examples

### Normal Scenario (`/api/chat-mock`):

```typescript
// Mixed citation types
{
  type: 'data-citation',
  data: {
    sectionLabel: 'Sumber Informasi',
    citations: [
      {
        type: 'regulation',
        title: 'Permensos No. 1/2024',
        regulation: 'Permensos No. 1/2024',
        article: 'Pasal 5',
        fullCitation: 'Permensos No. 1/2024, Pasal 5, Ayat 2',
      },
      {
        type: 'website',
        title: 'Program PKH - Kemensos',
        domain: 'kemensos.go.id',
        url: 'https://kemensos.go.id/program-keluarga-harapan',
        snippet: 'Program PKH adalah...',
      },
      {
        type: 'rag-document',
        title: 'PKH - Data Program',
        source: 'programs',
        recordId: 'pkh',
        snippet: 'Bantuan tunai bersyarat...',
        score: 0.92,
      },
      {
        type: 'institution-info',
        title: 'Kementerian Sosial RI',
        institutionName: 'Kementerian Sosial RI',
        contact: '021-7854 8000',
        source: 'institutions',
      },
    ],
  },
}

// Auto-Birokrasi actions
{
  type: 'data-actions',
  data: {
    actions: [
      {
        type: 'auto-birokrasi',
        label: '📄 Siapkan Dokumen Otomatis',
        href: '/auto-birokrasi?documents=sktm,surat-permohonan,kk&program=pkh',
        description: 'Generate SKTM, Surat Permohonan otomatis',
        documentType: 'multiple',
        programId: 'pkh',
      },
      // ... more actions
    ],
  },
}
```

### Emergency Scenario (`/api/chat-mock-emergency`):

```typescript
// Emergency-specific documents
{
  type: 'auto-birokrasi',
  label: '📄 Siapkan Dokumen Klaim JKK',
  href: '/auto-birokrasi?documents=surat-keterangan-kecelakaan,kronologi,form-klaim-jkk&program=jkk',
  description: 'Generate dokumen klaim kecelakaan kerja',
  documentType: 'jkk-claim',
  programId: 'jkk',
}
```

---

## Python Backend Integration

### How to emit different citation types:

```python
# In orchestrator.py

# 1. From RAG results
for result in rag_results:
    metadata = result.get('metadata', {})
    
    yield {
        "type": "data-citation",
        "data": {
            "sectionLabel": "Dokumen Terkait",
            "citations": [{
                "type": "rag-document",
                "title": metadata.get('name', 'Document'),
                "source": metadata.get('source', 'unknown'),
                "recordId": metadata.get('record_id', ''),
                "snippet": result.get('text', '')[:150],
                "score": result.get('score', 0),
            }]
        }
    }

# 2. From web search (Exa API)
for result in web_results:
    yield {
        "type": "data-citation",
        "data": {
            "sectionLabel": "Sumber Web",
            "citations": [{
                "type": "website",
                "title": result['title'],
                "domain": result['domain'],
                "url": result['url'],
                "snippet": result['snippet'],
                "publishedDate": result.get('publishedDate'),
            }]
        }
    }

# 3. From extracted regulations (LLM parsing)
if citations:
    yield {
        "type": "data-citation",
        "data": {
            "sectionLabel": "Dasar Hukum",
            "citations": [{
                "type": "regulation",
                "title": citation['regulation'],
                "regulation": citation['regulation'],
                "article": citation.get('article'),
                "verse": citation.get('verse'),
                "fullCitation": citation['full_citation'],
            } for citation in citations]
        }
    }

# 4. Combined sources
yield {
    "type": "data-citation",
    "data": {
        "sectionLabel": "Sumber Informasi",
        "citations": [
            # Mix of all types
            *regulation_citations,
            *website_citations,
            *rag_citations,
            *institution_citations,
        ]
    }
}
```

### Auto-Birokrasi Action Generation:

```python
# After recommending programs, suggest document generation
if recommended_programs:
    # Determine required documents for the programs
    required_docs = []
    for program in recommended_programs:
        required_docs.extend(program.get('required_documents', []))
    
    # Map to document codes
    doc_codes = {
        'KTP': 'ktp',
        'Kartu Keluarga': 'kk',
        'SKTM': 'sktm',
        'Surat Permohonan': 'surat-permohonan',
    }
    
    document_params = ','.join([
        doc_codes.get(doc, '') 
        for doc in required_docs 
        if doc in doc_codes
    ])
    
    primary_program = recommended_programs[0]['id']
    
    yield {
        "type": "data-actions",
        "data": {
            "actions": [{
                "type": "auto-birokrasi",
                "label": "📄 Siapkan Dokumen Otomatis",
                "href": f"/auto-birokrasi?documents={document_params}&program={primary_program}",
                "description": f"Generate {', '.join(required_docs[:3])} secara otomatis",
                "documentType": "multiple",
                "programId": primary_program,
            }]
        }
    }
```

---

## Testing the Enhancements

### 1. Test Mixed Citations

**Expected in normal scenario:**
- ✅ "📚 Sumber Informasi:" header
- ✅ Four sections: Dasar Hukum, Sumber Web, Dokumen Terkait, Informasi Institusi
- ✅ Website links are clickable with external icon
- ✅ RAG documents show snippets
- ✅ Institution shows phone number

### 2. Test Auto-Birokrasi Button

**Expected:**
- ✅ Primary button (filled, stands out)
- ✅ Shows 📄 icon
- ✅ Has description text below
- ✅ Link includes document query params

### 3. Test Next Steps

**Expected:**
- ✅ First step mentions Auto-Birokrasi
- ✅ Shows emoji 📄 for document step
- ✅ Provides fallback (manual preparation)

### 4. Test Emergency Scenario

**Expected:**
- ✅ Emergency-specific documents (JKK claim forms)
- ✅ Auto-Birokrasi for emergency docs
- ✅ Website citations for BPJS TK

---

## Benefits of This Approach

### 1. **Source Transparency**
Users see exactly where information comes from:
- Government regulations (authoritative)
- Official websites (verified)
- Database records (structured data)
- Institution contacts (direct help)

### 2. **Reduced Friction**
Auto-Birokrasi button as primary CTA:
- One click to start document generation
- No need to search for forms
- Context-aware (knows which program)

### 3. **Flexibility**
Can mix citation types in one response:
- RAG provides program details
- Web search fills gaps
- Regulations add authority
- Institutions provide contacts

### 4. **Scalability**
Easy to add new citation types:
- Just add a new type to the union
- Update renderer with new icon/styling
- Backend can emit it immediately

---

## Next Steps for Real Implementation

### Phase 3: Backend API Update

In `/api/chat/route.ts`, transform Python metadata:

```typescript
if (data.type === 'metadata') {
  // Transform citations with type awareness
  const citations = [];
  
  // Add regulation citations
  if (data.regulations) {
    citations.push(...data.regulations.map(r => ({
      type: 'regulation',
      ...r
    })));
  }
  
  // Add web citations
  if (data.sources) {
    citations.push(...data.sources.map(s => ({
      type: 'website',
      ...s
    })));
  }
  
  // Add RAG citations
  if (data.rag_sources) {
    citations.push(...data.rag_sources.map(r => ({
      type: 'rag-document',
      ...r
    })));
  }
  
  if (citations.length > 0) {
    writer.write({
      type: 'data-citation',
      data: {
        sectionLabel: 'Sumber Informasi',
        citations,
      },
    });
  }
}
```

### Phase 4: Python Orchestrator Enhancement

Emit structured citations from different sources as shown in the Python integration examples above.

---

## Visual Comparison

### Before:
```
───────────────────────────────
📜 Dasar Hukum:
• Permensos No. 1/2024
• Permendikbud No. 10/2020

───────────────────────────────
💡 Langkah selanjutnya:
[Lihat di Marketplace]
[Website Kemensos]
```

### After:
```
───────────────────────────────
📚 Sumber Informasi:

📜 Dasar Hukum:
• Permensos No. 1/2024, Pasal 5, Ayat 2

🌐 Sumber Web:
• Program PKH - Kemensos (kemensos.go.id) [🔗]

📄 Dokumen Terkait:
• PKH - Data Program Bantuan Sosial

🏛️ Informasi Institusi:
• Kementerian Sosial RI (021-7854 8000)

───────────────────────────────
💡 Langkah selanjutnya:
[📄 Siapkan Dokumen Otomatis]  ← Primary
[📋 Lihat di Marketplace]
[📝 Download Template]
[🌐 Website Kemensos]

• Siapkan Dokumen Otomatis: Generate SKTM, 
  Surat Permohonan otomatis
```

---

## Summary

✅ **Multiple citation types** - regulations, websites, RAG, institutions
✅ **Dynamic labels** - "Dasar Hukum", "Sumber Informasi", customizable
✅ **Auto-Birokrasi integration** - primary CTA for document generation
✅ **Enhanced next steps** - Auto-Birokrasi as first option
✅ **Smart grouping** - citations organized by type
✅ **Clickable sources** - web links with external icon
✅ **Context awareness** - program ID passed to Auto-Birokrasi

**Files Updated:**
- `src/types/llm-response.ts` - New citation types
- `src/components/unified-chat/message-parts.tsx` - Enhanced renderers
- `src/app/api/chat-mock/route.ts` - Demo implementation
- `src/app/api/chat-mock-emergency/route.ts` - Emergency demo

**Zero TypeScript errors ✅**

Ready to test! 🚀
