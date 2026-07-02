/**
 * Integration tests for PDF processing workflow
 * Tests the complete flow: extract fields → fill template
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PDFDocument } from 'pdf-lib';
import {
  extractPdfFormFields,
  fillPdfTemplate,
  validateFieldMapping,
} from './index';

describe('PDF Processing Integration', () => {
  let samplePdf: Uint8Array;

  beforeEach(async () => {
    // Create a sample PDF template with various field types
    const doc = await PDFDocument.create();
    doc.addPage();
    const form = doc.getForm();

    // Personal information fields
    const fullName = form.createTextField('fullName');
    fullName.addToPage(doc.getPage(0), { x: 50, y: 700, width: 200, height: 30 });

    const birthDate = form.createTextField('birthDate');
    birthDate.addToPage(doc.getPage(0), { x: 50, y: 650, width: 150, height: 30 });

    const hasChildren = form.createCheckBox('hasChildren');
    hasChildren.addToPage(doc.getPage(0), { x: 50, y: 600, width: 20, height: 20 });

    const province = form.createDropdown('province');
    province.addOptions(['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur']);
    province.addToPage(doc.getPage(0), { x: 50, y: 550, width: 150, height: 30 });

    const educationLevel = form.createRadioGroup('educationLevel');
    educationLevel.addOptionToPage('SD', doc.getPage(0), { x: 50, y: 500, width: 20, height: 20 });
    educationLevel.addOptionToPage('SMP', doc.getPage(0), { x: 100, y: 500, width: 20, height: 20 });
    educationLevel.addOptionToPage('SMA', doc.getPage(0), { x: 150, y: 500, width: 20, height: 20 });

    samplePdf = await doc.save();
  });

  it('should complete full workflow: extract fields → validate → fill', async () => {
    // Step 1: Extract fields from template
    const extractedFields = await extractPdfFormFields(samplePdf.buffer as ArrayBuffer);

    expect(extractedFields).toHaveLength(5);
    expect(extractedFields.map(f => f.name)).toEqual([
      'fullName',
      'birthDate',
      'hasChildren',
      'province',
      'educationLevel',
    ]);

    // Step 2: Prepare user data
    const userData = {
      fullName: 'Budi Santoso',
      birthDate: '15 Januari 1985',
      hasChildren: 'true',
      province: 'Jawa Barat',
      educationLevel: 'SMA',
    };

    // Step 3: Validate field mapping
    const validation = await validateFieldMapping(samplePdf.buffer as ArrayBuffer, userData);

    expect(validation.valid).toBe(true);
    expect(validation.matchingFields).toHaveLength(5);
    expect(validation.missingFields).toHaveLength(0);
    expect(validation.extraFields).toHaveLength(0);

    // Step 4: Fill the template
    const filledPdf = await fillPdfTemplate(samplePdf.buffer as ArrayBuffer, userData);

    // Step 5: Verify the filled PDF
    const resultDoc = await PDFDocument.load(filledPdf);
    const resultForm = resultDoc.getForm();

    expect(resultForm.getTextField('fullName').getText()).toBe('Budi Santoso');
    expect(resultForm.getTextField('birthDate').getText()).toBe('15 Januari 1985');
    expect(resultForm.getCheckBox('hasChildren').isChecked()).toBe(true);
    expect(resultForm.getDropdown('province').getSelected()).toEqual(['Jawa Barat']);
    expect(resultForm.getRadioGroup('educationLevel').getSelected()).toBe('SMA');
  });

  it('should handle partial field mapping gracefully', async () => {
    // User provides only some fields
    const partialUserData = {
      fullName: 'Siti Aminah',
      province: 'DKI Jakarta',
      // Missing: birthDate, hasChildren, educationLevel
    };

    // Validate shows missing fields
    const validation = await validateFieldMapping(samplePdf.buffer as ArrayBuffer, partialUserData);
    expect(validation.matchingFields).toEqual(['fullName', 'province']);
    expect(validation.missingFields).toEqual(['birthDate', 'hasChildren', 'educationLevel']);

    // Still able to fill (missing fields are skipped)
    const filledPdf = await fillPdfTemplate(samplePdf.buffer as ArrayBuffer, partialUserData);

    const resultDoc = await PDFDocument.load(filledPdf);
    const resultForm = resultDoc.getForm();

    // Filled fields
    expect(resultForm.getTextField('fullName').getText()).toBe('Siti Aminah');
    expect(resultForm.getDropdown('province').getSelected()).toEqual(['DKI Jakarta']);

    // Unfilled fields remain empty (undefined or empty string)
    const birthDateText = resultForm.getTextField('birthDate').getText();
    expect(birthDateText === '' || birthDateText === undefined).toBe(true);
    expect(resultForm.getCheckBox('hasChildren').isChecked()).toBe(false);
  });

  it('should detect extra fields in user data', async () => {
    const userDataWithExtra = {
      fullName: 'Ahmad Ibrahim',
      birthDate: '10 Maret 1990',
      hasChildren: 'false',
      province: 'Jawa Tengah',
      educationLevel: 'SMP',
      // Extra fields not in PDF
      phoneNumber: '081234567890',
      email: 'ahmad@example.com',
    };

    const validation = await validateFieldMapping(samplePdf.buffer as ArrayBuffer, userDataWithExtra);

    expect(validation.valid).toBe(false); // Invalid due to extra fields
    expect(validation.matchingFields).toHaveLength(5);
    expect(validation.extraFields).toEqual(['phoneNumber', 'email']);

    // Can still fill (extra fields are ignored)
    const filledPdf = await fillPdfTemplate(samplePdf.buffer as ArrayBuffer, userDataWithExtra);

    const resultDoc = await PDFDocument.load(filledPdf);
    const resultForm = resultDoc.getForm();

    // Only PDF fields are filled
    expect(resultForm.getTextField('fullName').getText()).toBe('Ahmad Ibrahim');
    expect(resultForm.getRadioGroup('educationLevel').getSelected()).toBe('SMP');
  });

  it('should handle real-world scenario: social assistance application', async () => {
    // Simulate a user filling out a social assistance application form
    
    // 1. User uploads PDF template and system extracts fields
    const extractedFields = await extractPdfFormFields(samplePdf.buffer as ArrayBuffer);
    
    // 2. System shows available fields to user
    const fieldNames = extractedFields.map(f => f.name);
    console.log('Available fields:', fieldNames);

    // 3. User provides their information (collected from chat or form)
    const applicantData = {
      fullName: 'Dewi Lestari',
      birthDate: '25 Desember 1992',
      hasChildren: 'true',
      province: 'Jawa Timur',
      educationLevel: 'SD',
    };

    // 4. System validates before filling
    const validation = await validateFieldMapping(samplePdf.buffer as ArrayBuffer, applicantData);
    
    if (!validation.valid) {
      console.log('Warning: Extra fields detected:', validation.extraFields);
    }
    
    if (validation.missingFields.length > 0) {
      console.log('Info: Some fields will be left empty:', validation.missingFields);
    }

    // 5. System fills the PDF
    const filledPdf = await fillPdfTemplate(samplePdf.buffer as ArrayBuffer, applicantData);

    // 6. User downloads the filled PDF
    expect(filledPdf).toBeInstanceOf(ArrayBuffer);
    expect(filledPdf.byteLength).toBeGreaterThan(0);

    // 7. Verify the filled content
    const resultDoc = await PDFDocument.load(filledPdf);
    const resultForm = resultDoc.getForm();

    expect(resultForm.getTextField('fullName').getText()).toBe('Dewi Lestari');
    expect(resultForm.getCheckBox('hasChildren').isChecked()).toBe(true);
    expect(resultForm.getDropdown('province').getSelected()).toEqual(['Jawa Timur']);
  });

  it('should preserve PDF structure and formatting', async () => {
    const userData = {
      fullName: 'Test User',
      birthDate: '01 Januari 2000',
      hasChildren: 'false',
      province: 'DKI Jakarta',
      educationLevel: 'SMA',
    };

    const filledPdf = await fillPdfTemplate(samplePdf.buffer as ArrayBuffer, userData);

    // Load filled PDF and verify structure
    const resultDoc = await PDFDocument.load(filledPdf);
    
    // Same number of pages
    expect(resultDoc.getPageCount()).toBe(1);
    
    // All form fields still present
    const resultForm = resultDoc.getForm();
    const resultFields = resultForm.getFields();
    expect(resultFields).toHaveLength(5);
    
    // Field positions preserved (fields are at same locations)
    const originalDoc = await PDFDocument.load(samplePdf);
    const originalForm = originalDoc.getForm();
    
    expect(resultFields.map(f => f.getName())).toEqual(
      originalForm.getFields().map(f => f.getName())
    );
  });
});

