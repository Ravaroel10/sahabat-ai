/**
 * PDF Processing Module
 * Exports form field extraction, validation, and template filling utilities
 */

export {
  extractPdfFormFields,
  hasFormFields,
  validatePdf,
  validatePdfSize,
  validatePdfFormat,
  PdfProcessingError,
  type PdfFormField,
} from './field-extractor';

export {
  fillPdfTemplate,
  fillAndFlattenPdfTemplate,
  validateFieldMapping,
} from './template-filler';
