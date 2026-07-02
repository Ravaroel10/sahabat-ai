# Inline Actions + "json" Word Fix

## Issues Fixed

### 1. ✅ "json" Word Appearing in Response

**Problem**: Sometimes the word "json" would leak into the response at the start.

**Root Cause**: The JSON block detection wasn't catching all formats.

**Solution**: Enhanced filtering in `ai-service/api/chat.py`:

```python
# Filter standalone "json" word that might leak
elif token_lower in ["json", "json\n", "\njson", "\njson\n"]:
    logger.info("   🔒 Filtering leaked 'json' keyword...")
    continue
```

**Now filters**:
- `json` (standalone)
- `json\n` (with newline)
- `\njson` (after newline)
- `\njson\n` (surrounded by newlines)

---

### 2. ✅ Dynamic Inline Action Buttons

**Problem**: Action buttons only appeared at the end (from metadata).

**Solution**: Added inline action markers like program cards!

**Format**: `[ACTION:action-type]`

**Available Actions**:
- `[ACTION:auto-birokrasi]` - Document generation
- `[ACTION:marketplace]` - Program exploration
- `[ACTION:emergency]` - Emergency contacts

---

## How Inline Actions Work

### Backend Detection (Python)

**File**: `ai-service/api/chat.py`

Detects both program and action markers:

```python
# Check for inline markers
program_marker_pattern = r'\[PROGRAM:([a-z0-9\-]+)\]'
action_marker_pattern = r'\[ACTION:([a-z0-9\-]+)\]'

program_match = re.search(program_marker_pattern, text_buffer)
action_match = re.search(action_marker_pattern, text_buffer)

if program_match:
    # Handle program card
    ...
elif action_match:
    # Handle action button
    action_type = action_match.group(1)
    logger.info(f"   💡 Detected inline action marker: {action_type}")
    action_event = {
        "type": "inline-action",
        "action_type": action_type
    }
    yield f"data: {json.dumps(action_event)}\n\n"
```

---

### Frontend Transformation (Next.js)

**File**: `src/app/api/chat/route.ts`

Transforms SSE events with proper part sequencing:

```typescript
else if (data.type === 'inline-action') {
  // Close current text part
  if (textStarted) {
    writer.write({ type: 'text-end', id: messageId });
    textStarted = false;
  }
  
  // Emit inline action
  writer.write({
    type: 'data-action-inline',
    data: { action_type: actionType },
  });
}
```

---

### Component Rendering (React)

**File**: `src/components/unified-chat/message-parts.tsx`

New `InlineActionButtonRenderer` component:

```typescript
export function InlineActionButtonRenderer({ actionType }: { actionType: string }) {
  const config = getActionConfig(actionType);
  
  return (
    <div className="my-3 inline-block w-full">
      <Card className="bg-accent/30 hover:bg-accent/50 border-primary/30">
        <div className="p-3">
          <Link href={config.href}>
            <Button variant={config.variant} className="w-full">
              {config.label}
            </Button>
          </Link>
          {config.description && (
            <p className="text-xs text-muted-foreground mt-2">
              {config.description}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
```

**Action Configs**:

```typescript
'auto-birokrasi': {
  label: '📝 Buat Dokumen dengan Auto-Birokrasi',
  href: '/auto-birokrasi',
  variant: 'default',
  description: 'Sistem otomatis akan membantu membuat dokumen...',
}

'marketplace': {
  label: '🛒 Jelajahi Marketplace Program',
  href: '/programs',
  variant: 'outline',
  description: 'Lihat semua program bantuan sosial...',
}

'emergency': {
  label: '🚨 Nomor Darurat',
  href: 'tel:119',
  variant: 'destructive',
  description: 'Hubungi layanan darurat: 119, 110, 113',
  isExternal: true,
}
```

---

## System Prompt Instructions

**File**: `ai-service/prompts/system_prompt.py`

Added prominent instructions:

```python
### 🔥 WAJIB: Gunakan Inline Action Buttons 🔥

**JIKA** intent classification mengatakan `show_action_buttons: true`, 
kamu **HARUS** menggunakan inline action button markers:

**Format Marker**: `[ACTION:action-type]`

**Contoh DOCUMENT_REQUEST**:
```
Saya bisa membantu membuat SKTM untuk Anda.

[ACTION:auto-birokrasi]

Klik tombol di atas untuk mulai.
```

**Contoh APPLICATION**:
```
Untuk melihat semua program:

[ACTION:marketplace]

Anda juga bisa langsung daftar di sana.
```

**Contoh EMERGENCY**:
```
Segera hubungi layanan darurat:

[ACTION:emergency]

Nomor: 119 (ambulans), 110 (polisi)
```
```

---

## When to Use Action Buttons

Based on intent classification:

| Intent | `show_action_buttons` | Action to Use |
|--------|----------------------|---------------|
| `question` | `false` | ❌ No actions |
| `document_request` | `true` | ✅ `[ACTION:auto-birokrasi]` only |
| `application` | `true` | ✅ `[ACTION:marketplace]` + optionally `[ACTION:auto-birokrasi]` |
| `emergency` | `true` | ✅ `[ACTION:emergency]` first, then others |
| `general_help` | `true` | ✅ `[ACTION:marketplace]` at minimum |

---

## Example Usage

### Document Request

```
User: "Buatkan SKTM untuk saya"

AI:
──────────────────────────────────
Baik, saya akan bantu membuat Surat Keterangan Tidak Mampu (SKTM).

┌────────────────────────────────┐
│ 📝 Buat Dokumen dengan         │ ← Inline action
│    Auto-Birokrasi              │
│ ────────────────────────────── │
│ Sistem otomatis akan membantu  │
│ membuat dokumen yang Anda      │
│ butuhkan                       │
└────────────────────────────────┘

Klik tombol di atas untuk memulai proses pembuatan dokumen.
──────────────────────────────────
```

### Application with Multiple Actions

```
User: "Saya buruh dengan 3 anak"

AI:
──────────────────────────────────
Saya rekomendasikan PKH:

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💼 Program Keluarga Harapan ┃ ← Inline program
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Program ini cocok untuk Anda...

Untuk melihat program lainnya:

┌────────────────────────────────┐
│ 🛒 Jelajahi Marketplace        │ ← Inline action
│    Program                     │
└────────────────────────────────┘

Jika perlu dokumen pendukung:

┌────────────────────────────────┐
│ 📝 Buat Dokumen dengan         │ ← Inline action
│    Auto-Birokrasi              │
└────────────────────────────────┘
──────────────────────────────────

💡 Program yang cocok:
┌────────────────────────────┐
│ 💼 PKH [▼]                 │ ← Reference card
└────────────────────────────┘
```

### Emergency

```
User: "Suami jatuh dari perancah!"

AI:
──────────────────────────────────
🚨 SITUASI DARURAT TERDETEKSI

Segera hubungi layanan darurat:

┌────────────────────────────────┐
│ 🚨 Nomor Darurat               │ ← Emergency action
│ ────────────────────────────── │
│ Hubungi layanan darurat:       │
│ 119, 110, 113                  │
└────────────────────────────────┘

Sambil menunggu, program yang bisa membantu:

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💼 BPJS Ketenagakerjaan     ┃ ← Inline program
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
──────────────────────────────────
```

---

## Testing

### Test with Mock Route

Use `/api/chat-test-inline` which now includes action buttons:

```typescript
// Change API temporarily
api: '/api/chat-test-inline'
```

**Expected**: See both inline program cards AND inline action buttons within text.

### Test with Real LLM

Watch Python logs for:
```
💡 Detected inline action marker: auto-birokrasi
💡 Detected inline program marker: pkh
```

---

## Files Modified

### Backend (Python)
- ✏️ `ai-service/api/chat.py`
  - Added action marker detection
  - Enhanced "json" word filtering
  - Updated buffer flushing logic

- ✏️ `ai-service/prompts/system_prompt.py`
  - Added inline action button instructions
  - Examples for each intent type

### Frontend (React/TypeScript)
- ✏️ `src/app/api/chat/route.ts`
  - Added inline-action event handling
  - Proper text part sequencing

- ✏️ `src/components/unified-chat/message-parts.tsx`
  - Added `InlineActionButtonRenderer` component
  - Fixed eligibilityStatus type errors

- ✏️ `src/components/unified-chat/unified-chat-interface.tsx`
  - Added rendering for `data-action-inline` parts
  - Imported InlineActionButtonRenderer

- ✏️ `src/app/api/chat-test-inline/route.ts`
  - Added action button examples to mock

---

## Summary

✅ **Fixed "json" leak** - Enhanced filtering  
✅ **Added inline actions** - Dynamic placement like program cards  
✅ **Updated system prompt** - LLM knows when/how to use actions  
✅ **Created component** - InlineActionButtonRenderer  
✅ **Updated test mock** - Includes action examples  

**Three types of inline elements now**:
1. `[PROGRAM:id]` - Program cards
2. `[ACTION:type]` - Action buttons
3. Text - Markdown formatted

All dynamically placed by the LLM! 🎯
