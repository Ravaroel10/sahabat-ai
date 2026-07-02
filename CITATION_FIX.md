# Citation Section Fix

## Problem
Citations were not showing up in chat responses even though the `CitationRenderer` component was properly implemented and integrated.

## Root Cause
**Bug in `src/app/api/chat/route.ts`** (Line 233-236)

The citation data was being emitted with an incorrect structure:

```typescript
// ❌ WRONG - sending string instead of object
writer.write({
  type: 'data-citation',
  data: 'Sumber Informasi'  // This should be an object!
});
```

The `CitationRenderer` component expects:
```typescript
{
  type: 'data-citation',
  data: {
    citations: Citation[],
    sectionLabel: string
  }
}
```

But it was receiving:
```typescript
{
  type: 'data-citation',
  data: 'Sumber Informasi'  // ❌ Just a string!
}
```

This caused the citations array to be undefined, triggering the early return in `CitationRenderer`:
```typescript
if (!citations || citations.length === 0) return null;
```

## Fix Applied

Changed the citation emission in `src/app/api/chat/route.ts`:

```typescript
// ✅ CORRECT - sending proper object structure
writer.write({
  type: 'data-citation',
  data: {
    citations: citations,
    sectionLabel: 'Referensi'
  }
});
```

## How Citations Work

### 1. Python AI Service Response
The Python service returns metadata in SSE format:
```json
data: {
  "type": "metadata",
  "citations": [
    {
      "regulation": "Permensos No. 1/2023",
      "article": "Pasal 5",
      "fullCitation": "Permensos No. 1/2023 Pasal 5"
    }
  ],
  "sources": [
    {
      "title": "Website Title",
      "url": "https://example.com",
      "snippet": "Relevant text..."
    }
  ]
}
```

### 2. Chat Route Processing (route.ts)
- Receives Python SSE stream
- Parses `metadata.citations` (regulations) and `metadata.sources` (web sources)
- Transforms them into Citation objects
- Emits as `data-citation` part with proper structure

### 3. Unified Chat Interface Rendering
- Receives message parts from Vercel AI SDK
- Finds `data-citation` parts
- Passes `data.citations` and `data.sectionLabel` to `CitationRenderer`

### 4. CitationRenderer Display (message-parts.tsx)
- Groups citations by type (regulations, websites, RAG docs, institutions)
- Renders each type with appropriate icons and formatting
- Shows in compact "📚 Referensi" section at bottom of messages

## Citation Types Supported

1. **Regulation Citations** (`type: 'regulation'`)
   - 📜 Dasar Hukum
   - Displays: Full citation text

2. **Website Citations** (`type: 'website'`)
   - 🌐 Sumber Web
   - Displays: Title, domain, clickable URL, snippet

3. **RAG Document Citations** (`type: 'rag-document'`)
   - 📄 Dokumen Terkait
   - Displays: Document title, snippet

4. **Institution Citations** (`type: 'institution-info'`)
   - 🏛️ Informasi Institusi
   - Displays: Institution name, contact info

## Testing

To verify citations are now working:

1. **Send a query that should return citations**
   - Example: "Apa dasar hukum PKH?"
   - Should return regulation citations

2. **Send a query that triggers web search**
   - Example: "Bagaimana cara daftar BPJS terbaru?"
   - Should return website citations from search results

3. **Check the browser console**
   - Look for citation data in the streamed message parts
   - Should see `data-citation` with proper object structure

4. **Verify UI display**
   - Citations should appear in "📚 Referensi:" section
   - Grouped by type with appropriate icons
   - Clickable links for web sources

## Related Files
- `src/app/api/chat/route.ts` - Citation emission (FIXED)
- `src/components/unified-chat/unified-chat-interface.tsx` - Citation part handling
- `src/components/unified-chat/message-parts.tsx` - CitationRenderer component
- `src/types/llm-response.ts` - Citation type definitions
