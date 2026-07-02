/**
 * Unit tests for PDF Template Filler
 * Tests filling form fields, handling missing mappings, and preserving formatting
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PDFDocument } from 'pdf-lib';
import {
  fillPdfTemplate,
  fillAndFlattenPdfTemplate,
  validateFieldMapping,
} from './template-filler';
import { PdfProcessingError } from './field-extractor';

describe('PDF Template Filler', () => {
  let simplePdfWithFields: Uint8Array;
  let pdfWithMultipleFieldTypes: Uint8Array;
  let pdfWithoutFields: Uint8Array;

  beforeEach(async () => {
    // Create a simple PDF with text field
    const doc1 = await PDFDocument.create();
    doc1.addPage();
    const form1 = doc1.getForm();
    const textField = form1.createTextField('name');
    textField.addToPage(doc1.getPage(0), { x: 50, y: 700, width: 200, height: 30 });
    simplePdfWithFields = await doc1.save();

    // Create PDF with multiple field types
    const doc2 = await PDFDocument.create();
    doc2.addPage();
    const form2 = doc2.getForm();
    
    // Add text field
    const textField2 = form2.createTextField('fullName');
    textField2.addToPage(doc2.getPage(0), { x: 50, y: 700, width: 200, height: 30 });

    // Add checkbox
    const checkbox = form2.createCheckBox('agreeTerms');
    checkbox.addToPage(doc2.getPage(0), { x: 50, y: 650, width: 20, height: 20 });

    // Add dropdown
    const dropdown = form2.createDropdown('country');
    dropdown.addOptions(['Indonesia', 'Malaysia', 'Singapore']);
    dropdown.addToPage(doc2.getPage(0), { x: 50, y: 600, width: 150, height: 30 });

    // Add radio group
    const radioGroup = form2.createRadioGroup('gender');
    radioGroup.addOptionToPage('male', doc2.getPage(0), { x: 50, y: 550, width: 20, height: 20 });
    radioGroup.addOptionToPage('female', doc2.getPage(0), { x: 100, y: 550, width: 20, height: 20 });

    pdfWithMultipleFieldTypes = await doc2.save();

    // Create PDF without form fields
    const doc3 = await PDFDocument.create();
    doc3.addPage();
    pdfWithoutFields = await doc3.save();
  });

  describe('fillPdfTemplate', () => {
    it('should fill text field correctly', async () => {
      const fieldValues = {
        name: 'John Doe',
      };

      const filledPdf = await fillPdfTemplate(simplePdfWithFields.buffer as ArrayBuffer, fieldValues);

      // Verify the PDF was filled by loading it and checking the field value
      const doc = await PDFDocument.load(filledPdf);
      const form = doc.getForm();
      const nameField = form.getTextField('name');
      expect(nameField.getText()).toBe('John Doe');
    });

    it('should fill multiple field types correctly', async () => {
      const fieldValues = {
        fullName: 'Jane Smith',
        agreeTerms: 'true',
        country: 'Malaysia',
        gender: 'male',
      };

      const filledPdf = await fillPdfTemplate(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      // Verify all fields were filled
      const doc = await PDFDocument.load(filledPdf);
      const form = doc.getForm();
      
      expect(form.getTextField('fullName').getText()).toBe('Jane Smith');
      expect(form.getCheckBox('agreeTerms').isChecked()).toBe(true);
      expect(form.getDropdown('country').getSelected()).toEqual(['Malaysia']);
      expect(form.getRadioGroup('gender').getSelected()).toBe('male');
    });

    it('should handle missing field mappings gracefully', async () => {
      const fieldValues = {
        fullName: 'Jane Smith',
        // Missing: agreeTerms, country, gender
      };

      // Should not throw error, just skip missing fields
      const filledPdf = await fillPdfTemplate(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      const doc = await PDFDocument.load(filledPdf);
      const form = doc.getForm();
      
      // Only fullName should be filled
      expect(form.getTextField('fullName').getText()).toBe('Jane Smith');
      // Other fields should remain empty
      expect(form.getCheckBox('agreeTerms').isChecked()).toBe(false);
    });

    it('should handle checkbox with various truthy values', async () => {
      const doc = await PDFDocument.create();
      doc.addPage();
      const form = doc.getForm();
      
      form.createCheckBox('check1').addToPage(doc.getPage(0), { x: 50, y: 700, width: 20, height: 20 });
      form.createCheckBox('check2').addToPage(doc.getPage(0), { x: 50, y: 650, width: 20, height: 20 });
      form.createCheckBox('check3').addToPage(doc.getPage(0), { x: 50, y: 600, width: 20, height: 20 });
      form.createCheckBox('check4').addToPage(doc.getPage(0), { x: 50, y: 550, width: 20, height: 20 });
      form.createCheckBox('check5').addToPage(doc.getPage(0), { x: 50, y: 500, width: 20, height: 20 });
      
      const pdfBytes = await doc.save();

      const fieldValues = {
        check1: 'true',
        check2: '1',
        check3: 'yes',
        check4: 'on',
        check5: 'false',
      };

      const filledPdf = await fillPdfTemplate(pdfBytes.buffer as ArrayBuffer, fieldValues);

      const resultDoc = await PDFDocument.load(filledPdf);
      const resultForm = resultDoc.getForm();
      
      expect(resultForm.getCheckBox('check1').isChecked()).toBe(true);
      expect(resultForm.getCheckBox('check2').isChecked()).toBe(true);
      expect(resultForm.getCheckBox('check3').isChecked()).toBe(true);
      expect(resultForm.getCheckBox('check4').isChecked()).toBe(true);
      expect(resultForm.getCheckBox('check5').isChecked()).toBe(false);
    });

    it('should handle case-insensitive dropdown matching', async () => {
      const fieldValues = {
        fullName: 'Test User',
        country: 'indonesia', // lowercase
      };

      const filledPdf = await fillPdfTemplate(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      const doc = await PDFDocument.load(filledPdf);
      const form = doc.getForm();
      
      expect(form.getDropdown('country').getSelected()).toEqual(['Indonesia']);
    });

    it('should handle case-insensitive radio matching', async () => {
      const fieldValues = {
        fullName: 'Test User',
        gender: 'FEMALE', // uppercase
      };

      const filledPdf = await fillPdfTemplate(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      const doc = await PDFDocument.load(filledPdf);
      const form = doc.getForm();
      
      expect(form.getRadioGroup('gender').getSelected()).toBe('female');
    });

    it('should skip fields with invalid dropdown options', async () => {
      const fieldValues = {
        fullName: 'Test User',
        country: 'Japan', // Not in available options
      };

      // Should not throw error, just skip invalid value
      const filledPdf = await fillPdfTemplate(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      const doc = await PDFDocument.load(filledPdf);
      const form = doc.getForm();
      
      expect(form.getTextField('fullName').getText()).toBe('Test User');
      // Country should remain unselected
      expect(form.getDropdown('country').getSelected()).toEqual([]);
    });

    it('should skip fields with invalid radio options', async () => {
      const fieldValues = {
        fullName: 'Test User',
        gender: 'other', // Not in available options
      };

      // Should not throw error, just skip invalid value
      const filledPdf = await fillPdfTemplate(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      const doc = await PDFDocument.load(filledPdf);
      const form = doc.getForm();
      
      expect(form.getTextField('fullName').getText()).toBe('Test User');
      // Gender should remain unselected
      expect(form.getRadioGroup('gender').getSelected()).toBeUndefined();
    });

    it('should not fill read-only fields', async () => {
      const doc = await PDFDocument.create();
      doc.addPage();
      const form = doc.getForm();
      
      const readOnlyField = form.createTextField('readonly');
      readOnlyField.setText('Original Value');
      readOnlyField.enableReadOnly();
      readOnlyField.addToPage(doc.getPage(0), { x: 50, y: 700, width: 200, height: 30 });
      
      const pdfBytes = await doc.save();

      const fieldValues = {
        readonly: 'New Value',
      };

      const filledPdf = await fillPdfTemplate(pdfBytes.buffer as ArrayBuffer, fieldValues);

      const resultDoc = await PDFDocument.load(filledPdf);
      const resultForm = resultDoc.getForm();
      
      // Should still have original value
      expect(resultForm.getTextField('readonly').getText()).toBe('Original Value');
    });

    it('should preserve PDF formatting and layout', async () => {
      const fieldValues = {
        name: 'Test User',
      };

      const filledPdf = await fillPdfTemplate(simplePdfWithFields.buffer as ArrayBuffer, fieldValues);

      // Verify PDF structure is preserved
      const doc = await PDFDocument.load(filledPdf);
      expect(doc.getPageCount()).toBe(1);
      
      const form = doc.getForm();
      const fields = form.getFields();
      expect(fields.length).toBe(1);
    });

    it('should throw PdfProcessingError for PDF without form fields', async () => {
      const fieldValues = {
        name: 'Test User',
      };

      await expect(fillPdfTemplate(pdfWithoutFields.buffer as ArrayBuffer, fieldValues)).rejects.toThrow(PdfProcessingError);
      await expect(fillPdfTemplate(pdfWithoutFields.buffer as ArrayBuffer, fieldValues)).rejects.toThrow(
        'PDF ini tidak punya kolom yang bisa diisi'
      );
    });

    it('should throw PdfProcessingError for corrupted PDF', async () => {
      const corruptedPdf = new ArrayBuffer(100);
      const fieldValues = { name: 'Test' };

      await expect(fillPdfTemplate(corruptedPdf, fieldValues)).rejects.toThrow(PdfProcessingError);
    });

    it('should handle empty field values object', async () => {
      const fieldValues = {};

      // Should not throw error, just skip all fields
      const filledPdf = await fillPdfTemplate(simplePdfWithFields.buffer as ArrayBuffer, fieldValues);

      const doc = await PDFDocument.load(filledPdf);
      const form = doc.getForm();
      
      // Field should remain with original value (undefined/empty)
      const fieldText = form.getTextField('name').getText();
      expect(fieldText === '' || fieldText === undefined).toBe(true);
    });

    it('should convert non-string values to strings for text fields', async () => {
      const fieldValues = {
        name: 12345 as any, // Number
      };

      const filledPdf = await fillPdfTemplate(simplePdfWithFields.buffer as ArrayBuffer, fieldValues);

      const doc = await PDFDocument.load(filledPdf);
      const form = doc.getForm();
      
      expect(form.getTextField('name').getText()).toBe('12345');
    });
  });

  describe('fillAndFlattenPdfTemplate', () => {
    it('should fill and flatten PDF form', async () => {
      const fieldValues = {
        fullName: 'Jane Smith',
        agreeTerms: 'true',
        country: 'Malaysia',
        gender: 'male',
      };

      const filledPdf = await fillAndFlattenPdfTemplate(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      // Verify the PDF was filled
      const doc = await PDFDocument.load(filledPdf);
      
      // After flattening, form fields become regular content
      // We can't access them as form fields anymore
      // Just verify the PDF loads successfully
      expect(doc.getPageCount()).toBe(1);
    });

    it('should throw PdfProcessingError for PDF without form fields', async () => {
      const fieldValues = {
        name: 'Test User',
      };

      await expect(fillAndFlattenPdfTemplate(pdfWithoutFields.buffer as ArrayBuffer, fieldValues)).rejects.toThrow(
        PdfProcessingError
      );
    });

    it('should handle missing field mappings gracefully', async () => {
      const fieldValues = {
        fullName: 'Jane Smith',
        // Missing other fields
      };

      // Should not throw error
      const filledPdf = await fillAndFlattenPdfTemplate(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      const doc = await PDFDocument.load(filledPdf);
      expect(doc.getPageCount()).toBe(1);
    });
  });

  describe('validateFieldMapping', () => {
    it('should return validation details for matching fields', async () => {
      const fieldValues = {
        fullName: 'Jane Smith',
        agreeTerms: 'true',
        country: 'Malaysia',
        gender: 'male',
      };

      const result = await validateFieldMapping(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      expect(result.valid).toBe(true);
      expect(result.availableFields).toEqual(['fullName', 'agreeTerms', 'country', 'gender']);
      expect(result.providedFields).toEqual(['fullName', 'agreeTerms', 'country', 'gender']);
      expect(result.matchingFields).toEqual(['fullName', 'agreeTerms', 'country', 'gender']);
      expect(result.missingFields).toEqual([]);
      expect(result.extraFields).toEqual([]);
    });

    it('should identify missing fields', async () => {
      const fieldValues = {
        fullName: 'Jane Smith',
        // Missing: agreeTerms, country, gender
      };

      const result = await validateFieldMapping(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      expect(result.valid).toBe(true); // Valid as long as there's at least one match
      expect(result.matchingFields).toEqual(['fullName']);
      expect(result.missingFields).toEqual(['agreeTerms', 'country', 'gender']);
      expect(result.extraFields).toEqual([]);
    });

    it('should identify extra fields', async () => {
      const fieldValues = {
        fullName: 'Jane Smith',
        agreeTerms: 'true',
        country: 'Malaysia',
        gender: 'male',
        extraField: 'value', // Not in PDF
        anotherExtra: 'value2',
      };

      const result = await validateFieldMapping(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      expect(result.valid).toBe(false); // Invalid when extra fields present
      expect(result.matchingFields).toEqual(['fullName', 'agreeTerms', 'country', 'gender']);
      expect(result.extraFields).toEqual(['extraField', 'anotherExtra']);
    });

    it('should return invalid when no matching fields', async () => {
      const fieldValues = {
        wrongField1: 'value1',
        wrongField2: 'value2',
      };

      const result = await validateFieldMapping(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      expect(result.valid).toBe(false);
      expect(result.matchingFields).toEqual([]);
      expect(result.extraFields).toEqual(['wrongField1', 'wrongField2']);
    });

    it('should handle empty field values', async () => {
      const fieldValues = {};

      const result = await validateFieldMapping(pdfWithMultipleFieldTypes.buffer as ArrayBuffer, fieldValues);

      expect(result.valid).toBe(false); // No matching fields
      expect(result.availableFields).toEqual(['fullName', 'agreeTerms', 'country', 'gender']);
      expect(result.providedFields).toEqual([]);
      expect(result.matchingFields).toEqual([]);
      expect(result.missingFields).toEqual(['fullName', 'agreeTerms', 'country', 'gender']);
    });

    it('should throw PdfProcessingError for corrupted PDF', async () => {
      const corruptedPdf = new ArrayBuffer(100);
      const fieldValues = { name: 'Test' };

      await expect(validateFieldMapping(corruptedPdf, fieldValues)).rejects.toThrow(
        PdfProcessingError
      );
    });
  });
});

