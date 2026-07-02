/**
 * PDF Template Filler Module
 * 
 * Uses pdf-lib to fill PDF form fields with user data while preserving formatting.
 * Handles missing field mappings gracefully.
 * 
 * Requirements: 4.7, 4.8
 */

import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';
import { PdfProcessingError } from './field-extractor';

/**
 * Fills PDF form fields with user data
 * Returns new PDF as ArrayBuffer with filled fields
 * 
 * @param templateArrayBuffer - The original PDF template as ArrayBuffer
 * @param fieldValues - Record mapping field names to values
 * @returns Promise<ArrayBuffer> - The filled PDF as ArrayBuffer
 * @throws PdfProcessingError if PDF is corrupted, invalid, or filling fails
 * 
 * Requirement 4.7: Fill PDF form fields with user data
 * Requirement 4.8: Preserve original PDF formatting and layout
 */
export async function fillPdfTemplate(
  templateArrayBuffer: ArrayBuffer,
  fieldValues: Record<string, string>
): Promise<ArrayBuffer> {
  try {
    // Load PDF document with error handling options
    const pdfDoc = await PDFDocument.load(templateArrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false, // Preserve original metadata
    });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    if (fields.length === 0) {
      throw new PdfProcessingError(
        'PDF ini tidak punya kolom yang bisa diisi. Gunakan template lain atau buat PDF dengan kolom isian.'
      );
    }

    // Track which fields were successfully filled and which were skipped
    let filledCount = 0;
    let skippedCount = 0;
    const skippedFields: string[] = [];

    // Fill each field with provided values
    for (const field of fields) {
      try {
        const fieldName = field.getName();
        const fieldValue = fieldValues[fieldName];

        // Skip fields that don't have a value provided (handle missing mappings gracefully)
        if (fieldValue === undefined || fieldValue === null) {
          skippedCount++;
          skippedFields.push(fieldName);
          continue;
        }

        // Fill field based on its type
        if (field instanceof PDFTextField) {
          const textField = field as PDFTextField;
          if (!textField.isReadOnly()) {
            textField.setText(String(fieldValue));
            filledCount++;
          }
        } else if (field instanceof PDFCheckBox) {
          const checkboxField = field as PDFCheckBox;
          if (!checkboxField.isReadOnly()) {
            // Accept various truthy values: 'true', '1', 'yes', 'on', true
            const isChecked = ['true', '1', 'yes', 'on', 'checked'].includes(
              String(fieldValue).toLowerCase()
            );
            if (isChecked) {
              checkboxField.check();
            } else {
              checkboxField.uncheck();
            }
            filledCount++;
          }
        } else if (field instanceof PDFDropdown) {
          const dropdownField = field as PDFDropdown;
          if (!dropdownField.isReadOnly()) {
            const options = dropdownField.getOptions();
            const valueStr = String(fieldValue);
            
            // Only set if value is in available options
            if (options.includes(valueStr)) {
              dropdownField.select(valueStr);
              filledCount++;
            } else {
              // Try case-insensitive match
              const matchingOption = options.find(
                opt => opt.toLowerCase() === valueStr.toLowerCase()
              );
              if (matchingOption) {
                dropdownField.select(matchingOption);
                filledCount++;
              } else {
                skippedCount++;
                skippedFields.push(fieldName);
              }
            }
          }
        } else if (field instanceof PDFRadioGroup) {
          const radioField = field as PDFRadioGroup;
          if (!radioField.isReadOnly()) {
            const options = radioField.getOptions();
            const valueStr = String(fieldValue);
            
            // Only set if value is in available options
            if (options.includes(valueStr)) {
              radioField.select(valueStr);
              filledCount++;
            } else {
              // Try case-insensitive match
              const matchingOption = options.find(
                opt => opt.toLowerCase() === valueStr.toLowerCase()
              );
              if (matchingOption) {
                radioField.select(matchingOption);
                filledCount++;
              } else {
                skippedCount++;
                skippedFields.push(fieldName);
              }
            }
          }
        }
        // Note: PDFSignature fields are not filled automatically (require manual signing)
      } catch (fieldError) {
        // Continue filling other fields even if one fails
        console.error(`Failed to fill field "${field.getName()}":`, fieldError);
        skippedCount++;
        skippedFields.push(field.getName());
        continue;
      }
    }

    // Log summary of filling operation
    console.log(`PDF filling complete: ${filledCount} filled, ${skippedCount} skipped`);
    if (skippedFields.length > 0) {
      console.log('Skipped fields:', skippedFields.join(', '));
    }

    // Flatten the form to prevent further editing (optional, preserves formatting)
    // Commenting out for now to allow users to edit the filled PDF if needed
    // form.flatten();

    // Save and return the filled PDF
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false, // Better compatibility with older PDF readers
    });

    return pdfBytes.buffer as ArrayBuffer;
  } catch (error) {
    if (error instanceof PdfProcessingError) {
      throw error;
    }

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('encrypted') || error.message.includes('password')) {
        throw new PdfProcessingError(
          'PDF ini dilindungi password. Silakan buka password dulu',
          error
        );
      }

      if (error.message.includes('Invalid PDF') || error.message.includes('corrupted')) {
        throw new PdfProcessingError(
          'File PDF rusak atau tidak bisa dibaca',
          error
        );
      }

      throw new PdfProcessingError(
        'Gagal mengisi PDF. Coba template lain atau hubungi dukungan',
        error
      );
    }

    throw new PdfProcessingError('Gagal mengisi PDF');
  }
}

/**
 * Fills PDF template and flattens the form to prevent further editing
 * This creates a final, non-editable version of the document
 * 
 * @param templateArrayBuffer - The original PDF template as ArrayBuffer
 * @param fieldValues - Record mapping field names to values
 * @returns Promise<ArrayBuffer> - The filled and flattened PDF as ArrayBuffer
 * @throws PdfProcessingError if PDF is corrupted, invalid, or filling fails
 */
export async function fillAndFlattenPdfTemplate(
  templateArrayBuffer: ArrayBuffer,
  fieldValues: Record<string, string>
): Promise<ArrayBuffer> {
  try {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(templateArrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
    });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    if (fields.length === 0) {
      throw new PdfProcessingError(
        'PDF ini tidak punya kolom yang bisa diisi. Gunakan template lain atau buat PDF dengan kolom isian.'
      );
    }

    // Fill fields (same logic as fillPdfTemplate)
    for (const field of fields) {
      try {
        const fieldName = field.getName();
        const fieldValue = fieldValues[fieldName];

        if (fieldValue === undefined || fieldValue === null) {
          continue;
        }

        if (field instanceof PDFTextField) {
          const textField = field as PDFTextField;
          if (!textField.isReadOnly()) {
            textField.setText(String(fieldValue));
          }
        } else if (field instanceof PDFCheckBox) {
          const checkboxField = field as PDFCheckBox;
          if (!checkboxField.isReadOnly()) {
            const isChecked = ['true', '1', 'yes', 'on', 'checked'].includes(
              String(fieldValue).toLowerCase()
            );
            if (isChecked) {
              checkboxField.check();
            } else {
              checkboxField.uncheck();
            }
          }
        } else if (field instanceof PDFDropdown) {
          const dropdownField = field as PDFDropdown;
          if (!dropdownField.isReadOnly()) {
            const options = dropdownField.getOptions();
            const valueStr = String(fieldValue);
            const matchingOption = options.find(
              opt => opt.toLowerCase() === valueStr.toLowerCase()
            ) || (options.includes(valueStr) ? valueStr : null);
            if (matchingOption) {
              dropdownField.select(matchingOption);
            }
          }
        } else if (field instanceof PDFRadioGroup) {
          const radioField = field as PDFRadioGroup;
          if (!radioField.isReadOnly()) {
            const options = radioField.getOptions();
            const valueStr = String(fieldValue);
            const matchingOption = options.find(
              opt => opt.toLowerCase() === valueStr.toLowerCase()
            ) || (options.includes(valueStr) ? valueStr : null);
            if (matchingOption) {
              radioField.select(matchingOption);
            }
          }
        }
      } catch (fieldError) {
        console.error(`Failed to fill field "${field.getName()}":`, fieldError);
        continue;
      }
    }

    // Flatten the form to make it non-editable (preserves formatting)
    form.flatten();

    // Save and return the filled PDF
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
    });

    return pdfBytes.buffer as ArrayBuffer;
  } catch (error) {
    if (error instanceof PdfProcessingError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message.includes('encrypted') || error.message.includes('password')) {
        throw new PdfProcessingError(
          'PDF ini dilindungi password. Silakan buka password dulu',
          error
        );
      }

      if (error.message.includes('Invalid PDF') || error.message.includes('corrupted')) {
        throw new PdfProcessingError(
          'File PDF rusak atau tidak bisa dibaca',
          error
        );
      }

      throw new PdfProcessingError(
        'Gagal mengisi PDF. Coba template lain atau hubungi dukungan',
        error
      );
    }

    throw new PdfProcessingError('Gagal mengisi PDF');
  }
}

/**
 * Validates that field values match available field names in PDF
 * Useful for pre-validation before filling
 * 
 * @param templateArrayBuffer - The PDF template as ArrayBuffer
 * @param fieldValues - Record mapping field names to values
 * @returns Promise with validation result and details
 */
export async function validateFieldMapping(
  templateArrayBuffer: ArrayBuffer,
  fieldValues: Record<string, string>
): Promise<{
  valid: boolean;
  availableFields: string[];
  providedFields: string[];
  matchingFields: string[];
  missingFields: string[];
  extraFields: string[];
}> {
  try {
    const pdfDoc = await PDFDocument.load(templateArrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const availableFields = fields.map(f => f.getName());
    const providedFields = Object.keys(fieldValues);
    const matchingFields = providedFields.filter(f => availableFields.includes(f));
    const missingFields = availableFields.filter(f => !providedFields.includes(f));
    const extraFields = providedFields.filter(f => !availableFields.includes(f));

    return {
      valid: extraFields.length === 0 && matchingFields.length > 0,
      availableFields,
      providedFields,
      matchingFields,
      missingFields,
      extraFields,
    };
  } catch (error) {
    throw new PdfProcessingError(
      'Gagal memvalidasi mapping field PDF',
      error
    );
  }
}
