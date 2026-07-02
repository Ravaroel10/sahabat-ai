# PDF Generation for Auto-Birokrasi

## Overview

The auto-birokrasi feature now generates professional PDF documents that follow the official Indonesian government letter format (surat resmi pemerintah). The documents are properly formatted with:

- **Letterhead (Kop Surat)** - Government office header with borders
- **Document Number** - Standard numbering format
- **Proper Layout** - Aligned text, data tables, and signature sections
- **Professional Typography** - Times Roman font for official appearance

## Features

### 1. PDF Templates

Located in `src/components/documents/pdf-templates.tsx`:

- **SKTMDocument** - Surat Keterangan Tidak Mampu (Certificate of Financial Incapacity)
- **PermohonanDocument** - Surat Permohonan Bantuan (Social Assistance Request Letter)
- **PengantarDocument** - Surat Pengantar (Cover Letter from Village Office)
- **AduanDocument** - Formulir Pengaduan (Complaint/Feedback Form)

Each template follows the standard Indonesian government document format with:
- Letterhead with triple line border
- Centered document title
- Data table with colon-aligned fields
- Multiple signature sections (applicant, village head, district head)
- Proper spacing and margins (2cm x 3cm)

### 2. PDF Generator

Located in `src/lib/pdf-generator.ts`:

- `generatePDFBlob(data)` - Creates PDF blob from template data
- `downloadPDF(data, filename)` - Downloads PDF with custom filename
- `generatePDFPreviewURL(data)` - Creates object URL for iframe preview
- `mapFormDataToPDFData(formData, type)` - Converts snake_case form fields to camelCase PDF data

### 3. Document Page Integration

The `/documents` page (`src/app/(main)/documents/page.tsx`) now:

1. **Generates PDF on form submit** instead of plain text
2. **Shows PDF preview** in an iframe before download
3. **Downloads professional PDF** with proper filename format
4. **Cleans up resources** automatically (revokeObjectURL)

## Usage

### For Users

1. Select a document template (SKTM, Permohonan, etc.)
2. Fill in all required fields in the form
3. Click "Generate PDF" button
4. Preview the PDF in the browser
5. Click "Download PDF" to save the file
6. Take the PDF to your local government office for official signatures and stamps

### For Developers

#### Creating a New Template

```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export function MyNewDocument({ data }: PDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.letterhead}>
          <Text style={styles.letterheadTitle}>
            PEMERINTAH {data.kabupatenKota?.toUpperCase()}
          </Text>
        </View>
        
        <Text style={styles.documentTitle}>
          DOCUMENT TITLE
        </Text>
        
        {/* Add your content here */}
      </Page>
    </Document>
  );
}
```

#### Adding Template to Generator

Update `src/lib/pdf-generator.ts`:

```typescript
export async function generatePDFBlob(data: PDFGenerationData): Promise<Blob> {
  let PDFComponent;
  
  switch (data.templateType) {
    case 'my-new-type':
      PDFComponent = MyNewDocument;
      break;
    // ... other cases
  }
  
  const doc = PDFComponent({ data }) as ReactElement;
  return await pdf(doc).toBlob();
}
```

## Technical Details

### Dependencies

- `@react-pdf/renderer` (v4.5.1) - React-based PDF generation library
- Uses React components to define PDF structure
- Supports styling similar to React Native (flexbox, etc.)

### Styling System

PDF styles use a subset of CSS:

```typescript
const styles = StyleSheet.create({
  page: {
    padding: '2cm 3cm',      // Standard letter margins
    fontSize: 12,             // Default government document size
    fontFamily: 'Times-Roman',// Official document font
    lineHeight: 1.5,
  },
  // ... more styles
});
```

### Data Flow

```
User Form Input (snake_case)
  ↓
mapFormDataToPDFData() → Converts to camelCase
  ↓
generatePDFBlob() → Creates PDF using template
  ↓
generatePDFPreviewURL() → Creates object URL for preview
  ↓
downloadPDF() → Downloads file to user's device
  ↓
URL.revokeObjectURL() → Cleanup (automatic via useEffect)
```

## File Structure

```
src/
├── components/
│   └── documents/
│       └── pdf-templates.tsx    # All PDF template components
├── lib/
│   └── pdf-generator.ts          # PDF generation utilities
├── app/
│   └── (main)/
│       └── documents/
│           └── page.tsx          # Main documents page with PDF integration
└── data/
    └── documents/
        └── document-templates.json  # Template metadata & field definitions
```

## Important Notes

### Legal Requirements

⚠️ **The generated PDF documents are DRAFTS only!**

- They must be signed by authorized officials (Lurah/Camat)
- They must be stamped with official government seals
- They are not legally valid without proper authorization

### Browser Compatibility

- PDF preview works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses native browser PDF viewer via `<iframe>` element
- Fallback: Users can still download and view externally

### Performance

- PDF generation is client-side (no server required)
- Typically takes 100-500ms depending on document complexity
- Memory efficient with automatic cleanup via useEffect

## Future Enhancements

Potential improvements:

1. **Digital Signatures** - Add QR codes with verification URLs
2. **Templates Customization** - Allow users to customize letterhead
3. **Batch Generation** - Generate multiple documents at once
4. **Cloud Storage** - Save PDFs to user account
5. **Email Integration** - Send PDFs directly to government offices
6. **OCR Integration** - Auto-fill from uploaded KTP/KK documents

## Troubleshooting

### PDF Not Generating

- Check browser console for errors
- Verify all required fields are filled
- Ensure @react-pdf/renderer is installed: `npm list @react-pdf/renderer`

### PDF Preview Not Showing

- Some browsers may block iframe content
- Try downloading the PDF instead
- Check if PDF preview URL is properly created

### Wrong Data in PDF

- Verify field name mapping in `mapFormDataToPDFData()`
- Check template field names match form field names
- Ensure snake_case to camelCase conversion is working

## Support

For issues or questions:
1. Check this documentation first
2. Review the code comments in the template files
3. Test with the example data provided in the templates
4. Contact the development team if issues persist
