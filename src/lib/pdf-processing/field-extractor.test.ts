/**
 * Unit tests for PDF Form Field Extractor
 * Tests extraction of form fields, validation, and error handling
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';
import {
  extractPdfFormFields,
  hasFormFields,
  validatePdfSize,
  validatePdfFormat,
  validatePdf,
  PdfProcessingError,
  type PdfFormField,
} from './field-extractor';

describe('PDF Field Extractor', () => {
  let simplePdfWithFields: Uint8Array;
  let pdfWithoutFields: Uint8Array;
  let pdfWithMultipleFieldTypes: Uint8Array;

  beforeEach(async () => {
    // Create a simple PDF with text field
    const doc1 = await PDFDocument.create();
    doc1.addPage();
    const form1 = doc1.getForm();
    const textField = form1.createTextField('name');
    textField.setText('John Doe');
    textField.addToPage(doc1.getPage(0), { x: 50, y: 700, width: 200, height: 30 });
    simplePdfWithFields = await doc1.save();

    // Create PDF without form fields
    const doc2 = await PDFDocument.create();
    doc2.addPage();
    pdfWithoutFields = await doc2.save();

    // Create PDF with multiple field types
    const doc3 = await PDFDocument.create();
    doc3.addPage();
    const form3 = doc3.getForm();
    
    // Add text field
    const textField3 = form3.createTextField('fullName');
    textField3.setText('Jane Smith');
    textField3.addToPage(doc3.getPage(0), { x: 50, y: 700, width: 200, height: 30 });

    // Add checkbox
    const checkbox = form3.createCheckBox('agreeTerms');
    checkbox.check();
    checkbox.addToPage(doc3.getPage(0), { x: 50, y: 650, width: 20, height: 20 });

    // Add dropdown
    const dropdown = form3.createDropdown('country');
    dropdown.addOptions(['Indonesia', 'Malaysia', 'Singapore']);
    dropdown.select('Indonesia');
    dropdown.addToPage(doc3.getPage(0), { x: 50, y: 600, width: 150, height: 30 });

    // Add radio group
    const radioGroup = form3.createRadioGroup('gender');
    radioGroup.addOptionToPage('male', doc3.getPage(0), { x: 50, y: 550, width: 20, height: 20 });
    radioGroup.addOptionToPage('female', doc3.getPage(0), { x: 100, y: 550, width: 20, height: 20 });
    radioGroup.select('female');

    pdfWithMultipleFieldTypes = await doc3.save();
  });

  describe('hasFormFields', () => {
    it('should return true for PDF with form fields', async () => {
      const result = await hasFormFields(simplePdfWithFields.buffer as ArrayBuffer);
      expect(result).toBe(true);
    });

    it('should return false for PDF without form fields', async () => {
      const result = await hasFormFields(pdfWithoutFields.buffer as ArrayBuffer);
      expect(result).toBe(false);
    });

    it('should throw PdfProcessingError for corrupted PDF', async () => {
      const corruptedPdf = new ArrayBuffer(100);
      await expect(hasFormFields(corruptedPdf)).rejects.toThrow(PdfProcessingError);
      await expect(hasFormFields(corruptedPdf)).rejects.toThrow('File PDF rusak atau tidak bisa dibaca');
    });

    it('should throw PdfProcessingError for invalid data', async () => {
      const invalidData = new TextEncoder().encode('This is not a PDF').buffer;
      await expect(hasFormFields(invalidData)).rejects.toThrow(PdfProcessingError);
    });
  });

  describe('extractPdfFormFields', () => {
    it('should extract text field correctly', async () => {
      const fields = await extractPdfFormFields(simplePdfWithFields.buffer as ArrayBuffer);
      
      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'name',
        type: 'text',
        value: 'John Doe',
        defaultValue: 'John Doe',
      });
    });

    it('should return empty array for PDF without fields', async () => {
      const fields = await extractPdfFormFields(pdfWithoutFields.buffer as ArrayBuffer);
      expect(fields).toEqual([]);
    });

    it('should extract multiple field types correctly', async () => {
      const fields = await extractPdfFormFields(pdfWithMultipleFieldTypes.buffer as ArrayBuffer);
      
      expect(fields).toHaveLength(4);

      // Check text field
      const textField = fields.find(f => f.name === 'fullName');
      expect(textField).toMatchObject({
        type: 'text',
        value: 'Jane Smith',
      });

      // Check checkbox
      const checkboxField = fields.find(f => f.name === 'agreeTerms');
      expect(checkboxField).toMatchObject({
        type: 'checkbox',
        value: 'true',
      });

      // Check dropdown
      const dropdownField = fields.find(f => f.name === 'country');
      expect(dropdownField).toMatchObject({
        type: 'dropdown',
        value: 'Indonesia',
        options: ['Indonesia', 'Malaysia', 'Singapore'],
      });

      // Check radio group
      const radioField = fields.find(f => f.name === 'gender');
      expect(radioField).toMatchObject({
        type: 'radio',
        value: 'female',
        options: ['male', 'female'],
      });
    });

    it('should handle empty text fields', async () => {
      const doc = await PDFDocument.create();
      doc.addPage();
      const form = doc.getForm();
      const emptyTextField = form.createTextField('emptyField');
      emptyTextField.addToPage(doc.getPage(0), { x: 50, y: 700, width: 200, height: 30 });
      const pdfBytes = await doc.save();

      const fields = await extractPdfFormFields(pdfBytes.buffer as ArrayBuffer);
      
      expect(fields[0]).toMatchObject({
        name: 'emptyField',
        type: 'text',
        value: undefined,
      });
    });

    it('should handle unchecked checkbox', async () => {
      const doc = await PDFDocument.create();
      doc.addPage();
      const form = doc.getForm();
      const checkbox = form.createCheckBox('unchecked');
      checkbox.addToPage(doc.getPage(0), { x: 50, y: 700, width: 20, height: 20 });
      const pdfBytes = await doc.save();

      const fields = await extractPdfFormFields(pdfBytes.buffer as ArrayBuffer);
      
      expect(fields[0]).toMatchObject({
        name: 'unchecked',
        type: 'checkbox',
        value: 'false',
      });
    });

    it('should handle dropdown without selection', async () => {
      const doc = await PDFDocument.create();
      doc.addPage();
      const form = doc.getForm();
      const dropdown = form.createDropdown('unselected');
      dropdown.addOptions(['Option 1', 'Option 2', 'Option 3']);
      dropdown.addToPage(doc.getPage(0), { x: 50, y: 700, width: 150, height: 30 });
      const pdfBytes = await doc.save();

      const fields = await extractPdfFormFields(pdfBytes.buffer as ArrayBuffer);
      
      expect(fields[0]).toMatchObject({
        name: 'unselected',
        type: 'dropdown',
        options: ['Option 1', 'Option 2', 'Option 3'],
        value: undefined,
      });
    });

    it('should handle radio group without selection', async () => {
      const doc = await PDFDocument.create();
      doc.addPage();
      const form = doc.getForm();
      const radioGroup = form.createRadioGroup('unselectedRadio');
      radioGroup.addOptionToPage('option1', doc.getPage(0), { x: 50, y: 700, width: 20, height: 20 });
      radioGroup.addOptionToPage('option2', doc.getPage(0), { x: 100, y: 700, width: 20, height: 20 });
      const pdfBytes = await doc.save();

      const fields = await extractPdfFormFields(pdfBytes.buffer as ArrayBuffer);
      
      expect(fields[0]).toMatchObject({
        name: 'unselectedRadio',
        type: 'radio',
        options: ['option1', 'option2'],
        value: undefined,
      });
    });

    it('should throw PdfProcessingError for corrupted PDF', async () => {
      const corruptedPdf = new ArrayBuffer(100);
      await expect(extractPdfFormFields(corruptedPdf)).rejects.toThrow(PdfProcessingError);
    });

    it('should include readOnly property', async () => {
      const doc = await PDFDocument.create();
      doc.addPage();
      const form = doc.getForm();
      const readOnlyField = form.createTextField('readOnly');
      readOnlyField.enableReadOnly();
      readOnlyField.addToPage(doc.getPage(0), { x: 50, y: 700, width: 200, height: 30 });
      const pdfBytes = await doc.save();

      const fields = await extractPdfFormFields(pdfBytes.buffer as ArrayBuffer);
      
      expect(fields[0].readOnly).toBe(true);
    });
  });

  describe('validatePdfSize', () => {
    it('should return true for file within size limit', () => {
      // Create 1MB buffer
      const buffer = new ArrayBuffer(1024 * 1024);
      expect(validatePdfSize(buffer, 5)).toBe(true);
    });

    it('should return false for file exceeding size limit', () => {
      // Create 6MB buffer
      const buffer = new ArrayBuffer(6 * 1024 * 1024);
      expect(validatePdfSize(buffer, 5)).toBe(false);
    });

    it('should use default 5MB limit when not specified', () => {
      const buffer = new ArrayBuffer(4 * 1024 * 1024);
      expect(validatePdfSize(buffer)).toBe(true);
    });

    it('should handle edge case at exact limit', () => {
      // Create exactly 5MB buffer
      const buffer = new ArrayBuffer(5 * 1024 * 1024);
      expect(validatePdfSize(buffer, 5)).toBe(true);
    });
  });

  describe('validatePdfFormat', () => {
    it('should return true for valid PDF magic number', () => {
      const pdfHeader = '%PDF-1.7\n';
      const buffer = new TextEncoder().encode(pdfHeader).buffer;
      expect(validatePdfFormat(buffer)).toBe(true);
    });

    it('should return false for invalid file format', () => {
      const textFile = 'This is a text file';
      const buffer = new TextEncoder().encode(textFile).buffer;
      expect(validatePdfFormat(buffer)).toBe(false);
    });

    it('should return false for empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      expect(validatePdfFormat(buffer)).toBe(false);
    });

    it('should return false for buffer smaller than magic number', () => {
      const buffer = new ArrayBuffer(3);
      expect(validatePdfFormat(buffer)).toBe(false);
    });
  });

  describe('validatePdf', () => {
    it('should return valid for proper PDF within size limit', () => {
      const pdfHeader = '%PDF-1.7\n';
      const buffer = new TextEncoder().encode(pdfHeader).buffer;
      const result = validatePdf(buffer, 5);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for file exceeding size limit', () => {
      const buffer = new ArrayBuffer(6 * 1024 * 1024);
      const result = validatePdf(buffer, 5);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File terlalu besar');
      expect(result.error).toContain('6.00MB');
    });

    it('should return error for invalid file format', () => {
      const textFile = 'This is not a PDF';
      const buffer = new TextEncoder().encode(textFile).buffer;
      const result = validatePdf(buffer, 5);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File harus berformat PDF');
    });

    it('should use custom size limit', () => {
      // Create a valid PDF header with size exceeding custom limit (12MB > 10MB)
      const pdfHeader = '%PDF-1.7\n';
      const headerBytes = new TextEncoder().encode(pdfHeader);
      const buffer = new ArrayBuffer(12 * 1024 * 1024);
      const view = new Uint8Array(buffer);
      view.set(headerBytes);
      
      const result = validatePdf(buffer, 10);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maksimal 10MB');
    });
  });

  describe('PdfProcessingError', () => {
    it('should create error with message', () => {
      const error = new PdfProcessingError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('PdfProcessingError');
    });

    it('should store cause', () => {
      const cause = new Error('Original error');
      const error = new PdfProcessingError('Test error', cause);
      expect(error.cause).toBe(cause);
    });
  });
});
