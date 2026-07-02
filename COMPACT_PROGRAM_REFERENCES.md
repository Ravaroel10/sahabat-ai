# Compact Program References - Implementation Summary

## Overview
Made the program cards in the references section (bottom of chat messages) more compact and removed redundant "Langkah selanjutnya" sections since Auto-Birokrasi and marketplace buttons are now handled dynamically inline.

## Changes Made

### 1. Replaced Collapsible Program Card with Compact Design
**File**: `src/components/unified-chat/message-parts.tsx`

**Before**: Large collapsible cards that took up significant space with expandable sections
**After**: Compact single-line cards with minimal spacing

#### New `CompactProgramReferenceCard` Features:
- **Single line layout**: Icon, program name, badge, and action button all on one compact row
- **Minimal padding**: Only `p-2` instead of `p-3` with multiple sections
- **Inline information**: All key info (name, eligibility, description) visible at once
- **No expansion**: Removed Collapsible/Radix UI components - users click "Detail" for more info
- **Smaller badges**: "✓ Eligible" instead of "✓ Anda Memenuhi Syarat" for space efficiency
- **Ghost button**: Subtle "Detail" button instead of prominent "Lihat Detail Lengkap"

#### Visual Structure:
```
[💼] [Program Name] [Badge] [Description...] [Detail Button]
```

### 2. Removed "Langkah selanjutnya" Header from ActionButtonsRenderer
**File**: `src/components/unified-chat/message-parts.tsx`

**Before**: 
- Had "💡 Langkah selanjutnya:" header
- Showed button descriptions below

**After**:
- No header (buttons now appear dynamically inline via LLM)
- Removed descriptions (kept for backward compatibility but minimized)
- Updated comment to clarify this is for backward compatibility only

### 3. Removed Unused Imports
- Removed `ChevronDown`, `ChevronUp` from lucide-react
- Removed `* as Collapsible from '@radix-ui/react-collapsible'`
- Removed `useState` hook

## Space Savings

### Before (Collapsible Card):
- Header: ~48px
- Collapsed content: ~60px  
- Border/padding: ~24px
- **Total per card: ~132px height**

### After (Compact Card):
- Single row: ~40px
- **Total per card: ~40px height**
- **~70% space reduction per program card**

## Component Architecture

### Three Distinct Program Card Types:

1. **`InlineProgramCardRenderer`** - Cards embedded within chat text
   - Used when LLM mentions programs inline
   - Larger, more prominent design
   - Shows benefits and full description

2. **`CompactProgramReferenceCard`** - Cards in references section
   - Used in "📚 Referensi" section at bottom of messages
   - Minimal, space-efficient design
   - One-line layout with truncated text

3. **`ProgramCard`** (marketplace) - Full program cards on `/programs` page
   - Detailed cards with eligibility, benefits, requirements
   - Apply button for eligible programs
   - Full-featured marketplace experience

## User Experience Impact

✅ **Cleaner references section** - No longer takes up significant screen space
✅ **Faster scanning** - All program info visible at a glance without expanding
✅ **Reduced redundancy** - Action buttons now only appear inline where contextually relevant
✅ **Better mobile experience** - Compact cards work better on smaller screens
✅ **Clearer hierarchy** - Inline cards are prominent, references are subtle

## Migration Notes

- No breaking changes to LLM response format
- Backward compatible with existing `program_cards` in references
- `ActionSuggestion[]` still supported but no longer shows "Langkah selanjutnya" header
- Auto-Birokrasi and marketplace buttons should now come from LLM dynamically inline

## Testing Recommendations

1. Verify program cards in references section appear compact
2. Check that inline program cards still appear prominent in text flow
3. Ensure Auto-Birokrasi buttons appear inline when contextually relevant
4. Test mobile view to confirm space savings are effective
5. Verify eligibility badges display correctly in compact format

## Related Files
- `src/components/unified-chat/message-parts.tsx` - Main implementation
- `src/components/marketplace/program-card.tsx` - Full marketplace cards (unchanged)
- `src/types/llm-response.ts` - Type definitions (unchanged)
