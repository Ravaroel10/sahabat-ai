# Removed Static Actions and Next Steps - Summary

## Overview
Removed `data-actions` (ActionButtonsRenderer) and `data-steps` (NextStepsRenderer) from both frontend and backend since action buttons and next steps are now handled dynamically inline by the LLM.

Kept inline variants: `data-action-inline` (InlineActionButtonRenderer) and `data-program-inline` (InlineProgramCardRenderer).

## Changes Made

### 1. Frontend - Removed Components and Imports

#### `src/components/unified-chat/message-parts.tsx`
- ❌ **Deleted**: `ActionButtonsRenderer` component (entire function)
- ❌ **Deleted**: `NextStepsRenderer` component (entire function)
- ✅ **Kept**: `InlineActionButtonRenderer` (for dynamic inline buttons)
- ✅ **Kept**: `InlineProgramCardRenderer` (for dynamic inline program cards)

#### Cleaned Up Imports:
- Removed unused icons: `CheckCircle2`, `FileText`, `ShoppingCart`, `DivideIcon`
- Removed unused type: `ActionSuggestion`
- Kept only: `AlertTriangle`, `ExternalLink`, `Phone`

#### `src/components/unified-chat/unified-chat-interface.tsx`
- Removed `ActionButtonsRenderer` from imports
- Removed `NextStepsRenderer` from imports
- No rendering code to remove (they weren't being used)

### 2. Backend - Removed Data Emission

#### `src/app/api/chat/route.ts`
Removed two sections that emitted metadata:

**Removed Section 1: Action Buttons**
```typescript
// ❌ REMOVED
if (metadata.actions?.length > 0) {
  writer.write({
    type: 'data-actions',
    data: {
      actions: metadata.actions,
    },
  });
}
```

**Removed Section 2: Next Steps**
```typescript
// ❌ REMOVED
if (metadata.nextSteps?.length > 0 || metadata.next_steps?.length > 0) {
  writer.write({
    type: 'data-steps',
    data: {
      steps: metadata.nextSteps || metadata.next_steps || [],
    },
  });
}
```

### 3. What Remains (Inline Variants)

#### Still Active - Inline Action Buttons
- **Component**: `InlineActionButtonRenderer`
- **Data Type**: `data-action-inline`
- **Usage**: LLM decides when to show Auto-Birokrasi or marketplace buttons inline within text
- **Example**: "Anda bisa [Auto-Birokrasi Button] untuk membuat dokumen..."

#### Still Active - Inline Program Cards
- **Component**: `InlineProgramCardRenderer`
- **Data Type**: `data-program-inline`
- **Usage**: LLM embeds program cards within text when contextually relevant
- **Example**: "Program yang cocok: [PKH Program Card inline]"

## Rationale

### Why Remove Static Actions/Steps?
1. **Redundant with inline buttons**: Auto-Birokrasi and marketplace buttons are now shown inline where contextually relevant
2. **Better UX**: Dynamic placement feels more natural than a fixed "Langkah selanjutnya" section at the end
3. **Cleaner references section**: No more duplicate buttons competing for attention
4. **LLM-driven flow**: The AI decides when and where to show actions, not a static template

### Before (Static)
```
[Chat response text]

📚 Referensi:
- Citations here

💡 Langkah selanjutnya:  ← Removed this entire section
[Auto-Birokrasi Button] [See Programs Button]

✓ Langkah Selanjutnya:  ← Removed this entire section
1. Kumpulkan dokumen...
2. Daftar ke program...
```

### After (Dynamic Inline)
```
[Chat response text with inline buttons]

Anda bisa menggunakan [📝 Auto-Birokrasi] untuk membuat dokumen.

Program yang cocok untuk Anda:
[PKH Program Card - inline]

📚 Referensi:
- Citations here
[Compact Program Cards]
```

## Migration Impact

### No Breaking Changes
- Old Python service responses with `actions` or `nextSteps` fields are simply ignored
- No frontend code breaks if those fields are present
- Inline variants still work exactly as before

### What LLM Should Do Now
Instead of returning:
```json
{
  "actions": [...],
  "nextSteps": [...]
}
```

The LLM should use inline markers in the streamed text:
```
"Anda bisa membuat dokumen dengan Auto-Birokrasi. [INLINE_ACTION:auto-birokrasi]

Program yang cocok: [INLINE_PROGRAM:pkh]"
```

Which emits:
- `data-action-inline` events
- `data-program-inline` events

## Files Changed

### Frontend
- ✅ `src/components/unified-chat/message-parts.tsx` - Removed 2 components, cleaned imports
- ✅ `src/components/unified-chat/unified-chat-interface.tsx` - Removed 2 imports

### Backend
- ✅ `src/app/api/chat/route.ts` - Removed 2 emission blocks

### Mock APIs (Not Changed)
- ⚠️ `src/app/api/chat-mock/route.ts` - Still has `data-actions` and `data-steps`
- ⚠️ `src/app/api/chat-mock-emergency/route.ts` - Still has them
- ⚠️ `src/app/api/chat-mock-document/route.ts` - Still has them

**Note**: Mock APIs can be updated separately or left as-is since they're for testing only.

## Testing Checklist

1. ✅ TypeScript compiles without errors
2. ⚠️ Test chat responses don't show broken "Langkah selanjutnya" sections
3. ✅ Inline Auto-Birokrasi buttons still appear dynamically
4. ✅ Inline program cards still appear dynamically
5. ✅ Citations section still works
6. ✅ Emergency alerts still work
7. ✅ Compact program cards in references still work

## Related Documentation
- See `INLINE_PROGRAM_CARDS.md` for inline card implementation
- See `COMPACT_PROGRAM_REFERENCES.md` for compact reference cards
- See `CITATION_FIX.md` for citation section fix
- See `ENHANCED_CITATIONS_AND_AUTOBIROKRASI.md` for overall UX strategy
