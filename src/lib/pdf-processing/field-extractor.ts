/**
 * PDF Form Field Extractor Module
 * 
 * Uses pdf-lib to extract form fields from PDF files.
 * Handles AcroForm field types (text, checkbox, radio, dropdown, signature).
 * 
 * Requirements: 4.4, 4.5
 */

import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFSignature } from 'pdf-lib';

/**
 * Represents a form field extracted from a PDF
 */
export interface PdfFormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
  value?: string;
  defaultValue?: string;
  options?: string[]; // For dropdown/radio fields
  required?: boolean;
  readOnly?: boolean;
}

/**
 * Error class for PDF processing errors
 */
export class PdfProcessingError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'PdfProcessingError';
  }
}

/**
 * Validates if PDF has fillable form fields
 * 
 * @param pdfArrayBuffer - The PDF file as ArrayBuffer
 * @returns Promise<boolean> - True if PDF has form fields, false otherwise
 * @throws PdfProcessingError if PDF is corrupted or invalid
 */
export async function hasFormFields(pdfArrayBuffer: ArrayBuffer): Promise<boolean> {
  try {
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    return fields.length > 0;
  } catch (error) {
    if (error instanceof Error) {
      throw new PdfProcessingError(
        'File PDF rusak atau tidak bisa dibaca',
        error
      );
    }
    throw new PdfProcessingError('Gagal membaca PDF');
  }
}

/**
 * Extracts form fields from PDF using pdf-lib
 * Handles AcroForm fields (standard fillable PDFs)
 * XFA forms are not supported (limitation of pdf-lib)
 * 
 * @param pdfArrayBuffer - The PDF file as ArrayBuffer
 * @returns Promise<PdfFormField[]> - Array of extracted form fields
 * @throws PdfProcessingError if PDF is corrupted, invalid, or extraction fails
 */
export async function extractPdfFormFields(
  pdfArrayBuffer: ArrayBuffer
): Promise<PdfFormField[]> {
  try {
    // Load PDF document with error handling options
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    if (fields.length === 0) {
      return [];
    }

    const extractedFields: PdfFormField[] = [];

    for (const field of fields) {
      try {
        const fieldName = field.getName();
        
        // Determine field type and extract relevant information
        if (field instanceof PDFTextField) {
          const textField = field as PDFTextField;
          extractedFields.push({
            name: fieldName,
            type: 'text',
            value: textField.getText() || undefined,
            defaultValue: textField.getText() || undefined,
            readOnly: textField.isReadOnly(),
          });
        } else if (field instanceof PDFCheckBox) {
          const checkboxField = field as PDFCheckBox;
          extractedFields.push({
            name: fieldName,
            type: 'checkbox',
            value: checkboxField.isChecked() ? 'true' : 'false',
            defaultValue: checkboxField.isChecked() ? 'true' : 'false',
            readOnly: checkboxField.isReadOnly(),
          });
        } else if (field instanceof PDFDropdown) {
          const dropdownField = field as PDFDropdown;
          const options = dropdownField.getOptions();
          const selected = dropdownField.getSelected();
          
          extractedFields.push({
            name: fieldName,
            type: 'dropdown',
            value: selected.length > 0 ? selected[0] : undefined,
            defaultValue: selected.length > 0 ? selected[0] : undefined,
            options: options,
            readOnly: dropdownField.isReadOnly(),
          });
        } else if (field instanceof PDFRadioGroup) {
          const radioField = field as PDFRadioGroup;
          const options = radioField.getOptions();
          const selected = radioField.getSelected();
          
          extractedFields.push({
            name: fieldName,
            type: 'radio',
            value: selected || undefined,
            defaultValue: selected || undefined,
            options: options,
            readOnly: radioField.isReadOnly(),
          });
        } else if (field instanceof PDFSignature) {
          extractedFields.push({
            name: fieldName,
            type: 'signature',
            readOnly: false,
          });
        }
        // Note: Other field types are skipped
      } catch (fieldError) {
        // Skip individual fields that fail to extract
        console.error(`Failed to extract field: ${fieldError}`);
        continue;
      }
    }

    return extractedFields;
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
        'Gagal membaca kolom dari PDF. Coba file lain atau gunakan template bawaan',
        error
      );
    }

    throw new PdfProcessingError('Gagal membaca PDF');
  }
}

/**
 * Validates PDF file size
 * 
 * @param arrayBuffer - The file as ArrayBuffer
 * @param maxSizeMB - Maximum allowed size in MB (default: 5)
 * @returns boolean - True if file size is within limit
 */
export function validatePdfSize(arrayBuffer: ArrayBuffer, maxSizeMB: number = 5): boolean {
  const fileSizeInMB = arrayBuffer.byteLength / (1024 * 1024);
  return fileSizeInMB <= maxSizeMB;
}

/**
 * Validates PDF file type by checking magic number
 * 
 * @param arrayBuffer - The file as ArrayBuffer
 * @returns boolean - True if file appears to be a valid PDF
 */
export function validatePdfFormat(arrayBuffer: ArrayBuffer): boolean {
  // Check for PDF magic number: %PDF-
  const uint8Array = new Uint8Array(arrayBuffer);
  const header = String.fromCharCode(...uint8Array.slice(0, 5));
  return header === '%PDF-';
}

/**
 * Comprehensive PDF validation
 * 
 * @param arrayBuffer - The file as ArrayBuffer
 * @param maxSizeMB - Maximum allowed size in MB (default: 5)
 * @returns Object with validation result and error message if invalid
 */
export function validatePdf(
  arrayBuffer: ArrayBuffer,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  // Check file size
  if (!validatePdfSize(arrayBuffer, maxSizeMB)) {
    const fileSizeInMB = (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File terlalu besar. Maksimal ${maxSizeMB}MB. File kamu: ${fileSizeInMB}MB`,
    };
  }

  // Check file format
  if (!validatePdfFormat(arrayBuffer)) {
    return {
      valid: false,
      error: 'File harus berformat PDF',
    };
  }

  return { valid: true };
}
