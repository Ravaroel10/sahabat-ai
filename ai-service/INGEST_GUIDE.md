# RAG Data Ingestion Guide

## Overview

The RAG system needs to ingest your knowledge base (social programs, institutions, document templates) into ChromaDB before it can answer questions.

## Quick Start

### Option 1: Run from Docker Container (Recommended)

```bash
# From the project root
docker-compose -f ai-service/docker-compose.yml exec ai-service python -m ingest.ingest
```

### Option 2: Run Locally (if you have Python installed)

```bash
cd ai-service
python -m ingest.ingest
```

## What Gets Ingested

The script reads three JSON files from your Next.js `src/data` directory:

1. **Social Programs**: `src/data/programs/social-programs.json`
   - Program names, descriptions, eligibility, benefits, etc.
   
2. **Institutions**: `src/data/institutions/institutions.json`
   - Government institutions, addresses, contacts, services
   
3. **Document Templates**: `src/data/documents/document-templates.json`
   - Document types, descriptions, required fields

## Expected Output

```
Starting BantuArah knowledge base ingest...
  Data directory: K:\projects\dev\bantu-arah\src\data
  ChromaDB path: /data/chroma

  Programs: 45 chunks ingested
  Institutions: 23 chunks ingested
  Document templates: 12 chunks ingested

Ingest complete: 80 total chunks in ChromaDB.
```

## How It Works

1. **Reads JSON files** from `src/data/`
2. **Converts to text** - Each record becomes a searchable text document
3. **Chunks the text** - Large documents are split into smaller chunks (800 chars with 200 overlap)
4. **Creates embeddings** - Uses HuggingFace `thenlper/gte-large` model
5. **Stores in ChromaDB** - Embeddings + metadata saved to `/data/chroma`

## Configuration

Check your `ai-service/.env` file:

```bash
# Chunking settings
CHUNK_SIZE=800              # Size of each text chunk
CHUNK_OVERLAP=200           # Overlap between chunks

# RAG settings
RAG_RELEVANCE_THRESHOLD=0.6 # Minimum similarity score (0-1)

# Embeddings
HUGGINGFACE_API_KEY=your_key_here  # Get from huggingface.co/settings/tokens
EMBEDDING_MODEL=thenlper/gte-large # Free, high-quality model
```

## Re-ingesting Data

The ingestion is **idempotent** - you can run it multiple times safely:
- Same document IDs are updated (no duplicates)
- Modified content is refreshed
- New documents are added

To re-ingest after updating your data files:
```bash
docker-compose -f ai-service/docker-compose.yml exec ai-service python -m ingest.ingest
```

## Checking if Data is Loaded

### Method 1: Check ChromaDB collection
```bash
docker-compose -f ai-service/docker-compose.yml exec ai-service python -c "
from database.chroma import get_chroma_service
chroma = get_chroma_service()
collection = chroma.client.get_collection('bantuarah_knowledge')
print(f'Total documents: {collection.count()}')
"
```

### Method 2: Send a test query
Send a message through your frontend and check the logs:
```bash
docker-compose -f ai-service/docker-compose.yml logs -f ai-service | grep RAG
```

You should see:
```
📚 RAG: Searching knowledge base...
   ✅ Returned 3 documents
```

If you see:
```
❌ RAG returned no results
🌐 STEP 3: Falling back to web search...
```

Then the RAG database is empty or the query didn't match any documents.

## Troubleshooting

### "No such file or directory"
Make sure the volume mount in `docker-compose.yml` includes the data directory:
```yaml
volumes:
  - ../src/data:/app/src/data:ro
```

### "HuggingFace API error"
Check your `HUGGINGFACE_API_KEY` in `.env`. Get a free token from:
https://huggingface.co/settings/tokens

### "ChromaDB connection error"
Restart the service:
```bash
docker-compose -f ai-service/docker-compose.yml restart ai-service
```

### No results from RAG
- Check if documents were actually ingested (see "Checking if Data is Loaded" above)
- Lower the `RAG_RELEVANCE_THRESHOLD` in `.env` (try 0.4)
- Check your query is in Indonesian (data is in Indonesian)

## Data Format

Your JSON files should follow this structure:

**social-programs.json:**
```json
{
  "programs": [
    {
      "id": "pkh",
      "name": "Program Keluarga Harapan",
      "acronym": "PKH",
      "description": "Program bantuan sosial...",
      "legalBasis": "Peraturan Menteri...",
      "ministry": "Kementerian Sosial",
      "benefits": "Rp 3.000.000/tahun",
      "eligibility": "Keluarga miskin...",
      "documents": "KTP, KK, SKTM",
      "contact": "Hotline: 1500-899",
      "keywords": ["bantuan", "sosial", "keluarga"]
    }
  ]
}
```

**institutions.json:**
```json
{
  "institutions": [
    {
      "id": "kemensos",
      "name": "Kementerian Sosial RI",
      "acronym": "Kemensos",
      "type": "Kementerian",
      "address": "Jakarta",
      "phone": "021-12345",
      "email": "info@kemensos.go.id",
      "website": "https://kemensos.go.id",
      "hotline": "1500-899",
      "services": ["PKH", "BPNT", "Sembako"]
    }
  ]
}
```

**document-templates.json:**
```json
{
  "templates": [
    {
      "id": "sktm",
      "name": "Surat Keterangan Tidak Mampu",
      "type": "Surat Keterangan",
      "description": "Dokumen untuk mengajukan bantuan",
      "fields": ["Nama", "NIK", "Alamat", "Pekerjaan"]
    }
  ]
}
```

## Next Steps

After ingesting:
1. Test with a query: "Apa itu PKH?"
2. Check logs to see RAG returning results
3. If RAG returns no results, web search will kick in automatically
4. Monitor relevance scores in the logs to tune `RAG_RELEVANCE_THRESHOLD`

## Automation

To auto-ingest on startup, add to `docker-compose.yml`:
```yaml
services:
  ai-service:
    command: sh -c "python -m ingest.ingest && uvicorn app.main:app --host 0.0.0.0 --port 8000"
```

Or create a separate ingestion job that runs periodically.
