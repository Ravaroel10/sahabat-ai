# UX Improvements for PDF Generation

## Summary

Improved the PDF generation user experience with cleaner output, better loading states, and form state persistence.

## Changes Made

### 1. Empty Field Handling in PDFs

**Before**: Empty fields showed placeholder text like `[Nama]`, `[NIK]`, `[Alamat]`

**After**: Empty fields are now either:
- Completely blank (for most fields)
- Show dots `.....................` (for labels/headings where context is needed)
- Show underscores `___/___/___` (for document numbers)
- Show parentheses `( ........................... )` (for signature lines)

**Files Modified**:
- `src/components/documents/pdf-templates.tsx`
  - SKTMDocument: All fields now show clean placeholders
  - PermohonanDocument: All fields now show clean placeholders
  - PengantarDocument: All fields now show clean placeholders
  - AduanDocument: All fields now show clean placeholders

**Examples**:
```typescript
// Before
<Text>{data.nama || '[Nama]'}</Text>

// After
<Text>{data.nama || ''}</Text>  // Blank if empty
<Text>{data.nama || '( ........................... )'}</Text>  // For signatures
```

### 2. Loading State & Button Disable

**Before**: Button stayed active during PDF generation, no visual feedback

**After**: 
- Button is disabled while generating PDF
- Shows loading spinner icon
- Text changes from "Generate PDF" to "Membuat PDF..."
- User cannot click button multiple times

**Implementation**:
```typescript
<Button 
  onClick={generateDocument} 
  disabled={isGenerating}
  className="flex-1 text-xs sm:text-sm"
  size="default"
>
  {isGenerating ? (
    <>
      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
      Membuat PDF...
    </>
  ) : (
    <>
      <FileCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
      Generate PDF
    </>
  )}
</Button>
```

### 3. Auto Switch to Preview Tab

**Before**: User had to manually click "Preview" tab after generating PDF

**After**: 
- Automatically switches to preview tab when PDF is ready
- Shows generated PDF immediately
- Better flow for users

**Implementation**:
```typescript
const [activeTab, setActiveTab] = useState<string>("form");

const generateDocument = async () => {
  // ... generate PDF
  setActiveTab("preview");  // Auto switch
};
```

### 4. Form State Persistence

**Before**: Switching between templates cleared all form data

**After**:
- Form data is saved when switching templates
- Restored when switching back
- Each template has independent saved state
- No data loss when exploring different templates

**Implementation**:
```typescript
const [savedFormStates, setSavedFormStates] = useState<Record<string, Record<string, string>>>({});

const handleTemplateSelect = (templateId: string) => {
  // Save current form before switching
  if (selectedTemplate) {
    setSavedFormStates(prev => ({
      ...prev,
      [selectedTemplate.id]: formData
    }));
  }
  
  // Restore saved form for new template
  setFormData(savedFormStates[templateId] || {});
};
```

### 5. Edit Kembali Button Fix

**Before**: "Edit Kembali" only cleared PDF but didn't switch tabs

**After**: 
- Clears PDF preview
- Switches back to form tab
- Better UX flow

## User Experience Flow

### Old Flow:
1. Fill form
2. Click "Generate Dokumen"
3. Wait (no feedback)
4. Click "Preview" tab manually
5. See PDF with `[Placeholders]`
6. Switch template → lose all data

### New Flow:
1. Fill form
2. Click "Generate PDF"
3. Button disables + shows loading spinner
4. **Auto-switch to preview**
5. See clean PDF (no ugly placeholders)
6. Download or click "Edit Kembali" → auto-back to form
7. Switch templates → **data preserved**

## Technical Details

### State Management

```typescript
// New state variables
const [savedFormStates, setSavedFormStates] = useState<Record<string, Record<string, string>>>({});
const [activeTab, setActiveTab] = useState<string>("form");

// State preservation structure
{
  "sktm": {
    "nama": "John Doe",
    "nik": "1234567890",
    // ... more fields
  },
  "permohonan": {
    "nama": "Jane Smith",
    // ... more fields
  }
}
```

### Placeholder Strategy

Different placeholder styles for different contexts:

1. **Empty string `''`**: Regular data fields (name, address, etc.)
2. **Dots `...`**: Section headers and labels
3. **Underscores `___`**: Document numbers
4. **Parentheses with dots `( ... )`**: Signature lines (to guide where to sign)

This makes blank PDFs look professional and print-ready.

## Testing Checklist

- [x] Empty fields don't show `[Placeholders]`
- [x] Button disables during generation
- [x] Loading spinner shows during generation
- [x] Auto-switch to preview after generation
- [x] Form data persists when switching templates
- [x] Edit Kembali button returns to form tab
- [x] Multiple template switches preserve all data
- [x] PDF preview loads correctly
- [x] Download still works
- [x] No console errors

## Files Changed

**Modified**:
1. `src/app/(main)/documents/page.tsx`
   - Added `savedFormStates` state
   - Added `activeTab` state
   - Updated `generateDocument()` to auto-switch tab
   - Updated `handleTemplateSelect()` to save/restore form state
   - Updated button to show loading state
   - Updated "Edit Kembali" to switch back to form tab

2. `src/components/documents/pdf-templates.tsx`
   - Updated all placeholder text in SKTMDocument
   - Updated all placeholder text in PermohonanDocument
   - Updated all placeholder text in PengantarDocument
   - Updated all placeholder text in AduanDocument
   - Used appropriate placeholder styles (empty, dots, underscores, parentheses)

## Benefits

1. **Professional Output**: PDFs look clean even with empty fields
2. **Better UX**: Clear loading states, no confusion
3. **Data Safety**: Form data preserved across template switches
4. **Faster Workflow**: Auto-preview reduces clicks
5. **Print Ready**: Empty PDFs can be filled by hand with proper guides

## User Impact

Users will notice:
- ✅ Cleaner, more professional-looking PDFs
- ✅ Clear feedback when generating PDFs
- ✅ No data loss when exploring templates
- ✅ Faster workflow (one less click)
- ✅ Better overall experience
