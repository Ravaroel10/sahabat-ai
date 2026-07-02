# PDF Processing Module

This module provides utilities for extracting form fields from PDF files and filling them with user data.

## Features

- Extract form fields from PDF documents (AcroForm format)
- Fill PDF templates with user data
- Validate PDF file format and size
- Preserve original PDF formatting and layout
- Handle missing field mappings gracefully

## Installation

The module uses `pdf-lib` for PDF processing:

```bash
npm install pdf-lib
```

## Usage

### Basic Example: Extract and Fill

```typescript
import {
  extractPdfFormFields,
  fillPdfTemplate,
  validateFieldMapping,
} from '@/lib/pdf-processing';

// 1. Load PDF template
const pdfFile = await fetch('/templates/application-form.pdf');
const pdfArrayBuffer = await pdfFile.arrayBuffer();

// 2. Extract form fields
const fields = await extractPdfFormFields(pdfArrayBuffer);
console.log('Available fields:', fields.map(f => f.name));

// 3. Prepare user data
const userData = {
  fullName: 'Budi Santoso',
  birthDate: '15 Januari 1985',
  hasChildren: 'true',
  province: 'Jawa Barat',
  educationLevel: 'SMA',
};

// 4. Validate field mapping (optional)
const validation = await validateFieldMapping(pdfArrayBuffer, userData);
if (!validation.valid) {
  console.warn('Extra fields:', validation.extraFields);
}

// 5. Fill the template
const filledPdfBuffer = await fillPdfTemplate(pdfArrayBuffer, userData);

// 6. Download or save the filled PDF
const blob = new Blob([filledPdfBuffer], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'filled-application.pdf';
link.click();
```

### Field Extraction

```typescript
import { extractPdfFormFields, hasFormFields } from '@/lib/pdf-processing';

// Check if PDF has fillable fields
const hasFillableFields = await hasFormFields(pdfArrayBuffer);
if (!hasFillableFields) {
  console.log('This PDF does not have fillable form fields');
  return;
}

// Extract all form fields with their properties
const fields = await extractPdfFormFields(pdfArrayBuffer);

fields.forEach(field => {
  console.log(`Field: ${field.name}`);
  console.log(`Type: ${field.type}`);
  console.log(`Value: ${field.value}`);
  if (field.options) {
    console.log(`Options: ${field.options.join(', ')}`);
  }
});
```

### PDF Validation

```typescript
import { validatePdf } from '@/lib/pdf-processing';

// Validate file size and format
const validation = validatePdf(fileArrayBuffer, 5); // 5MB limit

if (!validation.valid) {
  console.error('Validation error:', validation.error);
  // Example errors:
  // - "File terlalu besar. Maksimal 5MB. File kamu: 6.50MB"
  // - "File harus berformat PDF"
}
```

### Filling PDF Templates

```typescript
import { fillPdfTemplate } from '@/lib/pdf-processing';

// Basic filling
const fieldValues = {
  name: 'John Doe',
  email: 'john@example.com',
};

const filledPdf = await fillPdfTemplate(templateBuffer, fieldValues);

// Checkbox fields - various truthy values are supported
const checkboxValues = {
  agreeTerms: 'true',    // ✓
  subscribe: '1',        // ✓
  notify: 'yes',         // ✓
  marketing: 'on',       // ✓
  privacy: 'false',      // ✗
};

// Dropdown and radio fields - case-insensitive matching
const selectionValues = {
  country: 'indonesia',  // Matches "Indonesia" in dropdown
  gender: 'MALE',        // Matches "male" in radio group
};
```

### Field Mapping Validation

```typescript
import { validateFieldMapping } from '@/lib/pdf-processing';

const validation = await validateFieldMapping(pdfBuffer, userData);

console.log('Available fields in PDF:', validation.availableFields);
console.log('Fields provided by user:', validation.providedFields);
console.log('Matching fields:', validation.matchingFields);
console.log('Missing fields:', validation.missingFields);
console.log('Extra fields:', validation.extraFields);

if (validation.missingFields.length > 0) {
  console.log('These fields will be left empty:', validation.missingFields);
}

if (validation.extraFields.length > 0) {
  console.log('These fields are not in the PDF:', validation.extraFields);
}
```

### Flatten PDF (Non-editable)

```typescript
import { fillAndFlattenPdfTemplate } from '@/lib/pdf-processing';

// Fill and flatten the PDF to make it non-editable
const filledPdf = await fillAndFlattenPdfTemplate(templateBuffer, userData);

// The resulting PDF will have the form fields converted to regular content
// Users cannot edit the filled values
```

## Field Types

The module supports the following AcroForm field types:

- **Text fields**: Single-line or multi-line text input
- **Checkboxes**: Boolean true/false values
- **Dropdown**: Select from predefined options
- **Radio groups**: Select one option from a group
- **Signature fields**: Detected but not automatically filled

## Error Handling

The module throws `PdfProcessingError` for various error conditions:

```typescript
import { PdfProcessingError } from '@/lib/pdf-processing';

try {
  const filledPdf = await fillPdfTemplate(templateBuffer, userData);
} catch (error) {
  if (error instanceof PdfProcessingError) {
    // Handle PDF-specific errors
    console.error('PDF Error:', error.message);
    // Example messages (in Indonesian):
    // - "PDF ini tidak punya kolom yang bisa diisi"
    // - "File PDF rusak atau tidak bisa dibaca"
    // - "PDF ini dilindungi password. Silakan buka password dulu"
    // - "Gagal mengisi PDF. Coba template lain atau hubungi dukungan"
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

## Handling Missing Fields

The module gracefully handles missing field mappings:

```typescript
// PDF has fields: fullName, birthDate, province, educationLevel
// User only provides some fields
const partialData = {
  fullName: 'Siti Aminah',
  province: 'DKI Jakarta',
  // Missing: birthDate, educationLevel
};

// This will succeed - missing fields are simply skipped
const filledPdf = await fillPdfTemplate(pdfBuffer, partialData);
// Result: fullName and province are filled, others remain empty
```

## Limitations

- **XFA Forms Not Supported**: Only AcroForm (standard fillable PDFs) are supported. XFA (Adobe's XML Forms Architecture) is not supported by pdf-lib.
- **Signature Fields**: Signature fields are detected but not automatically filled (require manual signing).
- **Read-Only Fields**: Fields marked as read-only in the PDF will not be modified.
- **Complex PDF Structures**: Some PDFs with custom scripts or advanced features may not extract or fill correctly.

## Best Practices

1. **Validate before filling**: Use `validateFieldMapping()` to check field compatibility before filling.
2. **Handle errors gracefully**: Always wrap PDF operations in try-catch blocks.
3. **Show progress indicators**: PDF processing can take 2-3 seconds for large files (5MB).
4. **Provide guidance**: If a PDF has no form fields, guide users to create fillable PDFs using Adobe Acrobat or LibreOffice.
5. **Case-insensitive matching**: The module handles case-insensitive matching for dropdown and radio fields automatically.

## Example: React Component

```typescript
import { useState } from 'react';
import { fillPdfTemplate, extractPdfFormFields } from '@/lib/pdf-processing';

export function PdfFiller() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const extractedFields = await extractPdfFormFields(arrayBuffer);
      setFields(extractedFields);
    } catch (error) {
      console.error('Failed to extract fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFillPdf = async (userData: Record<string, string>) => {
    setLoading(true);
    try {
      const filledPdf = await fillPdfTemplate(templateBuffer, userData);
      
      // Download filled PDF
      const blob = new Blob([filledPdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'filled-document.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to fill PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept=".pdf" onChange={e => handleFileUpload(e.target.files[0])} />
      {loading && <p>Processing...</p>}
      {fields.length > 0 && (
        <div>
          <h3>Available Fields:</h3>
          <ul>
            {fields.map(field => (
              <li key={field.name}>
                {field.name} ({field.type})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Requirements Satisfied

This module satisfies the following requirements:

- **4.7**: Fill PDF form fields with user data
- **4.8**: Preserve original PDF formatting and layout
- **4.4**: Extract form fields from PDF templates
- **4.5**: Detect if PDF has fillable form fields

## License

This module is part of the BantuArah project and uses the MIT-licensed `pdf-lib` library.
