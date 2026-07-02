/**
 * PDF Generator Utility
 * Handles PDF generation for government documents
 */

import { pdf } from '@react-pdf/renderer';
import { 
  SKTMDocument, 
  PermohonanDocument, 
  PengantarDocument, 
  AduanDocument,
  type PDFTemplateType 
} from '@/components/documents/pdf-templates';
import type { ReactElement } from 'react';

export interface PDFGenerationData {
  templateType: PDFTemplateType;
  [key: string]: string | undefined;
}

/**
 * Generate PDF blob from template data
 */
export async function generatePDFBlob(data: PDFGenerationData): Promise<Blob> {
  let PDFComponent: React.ComponentType<{ data: PDFGenerationData }>;
  
  switch (data.templateType) {
    case 'sktm':
      PDFComponent = SKTMDocument;
      break;
    case 'permohonan':
      PDFComponent = PermohonanDocument;
      break;
    case 'pengantar':
      PDFComponent = PengantarDocument;
      break;
    case 'aduan':
      PDFComponent = AduanDocument;
      break;
    default:
      throw new Error(`Unknown template type: ${data.templateType}`);
  }
  
  // Create the PDF document element
  const doc = PDFComponent({ data });
  
  // Generate blob
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(doc as any).toBlob();
  
  return blob;
}

/**
 * Generate and download PDF
 */
export async function downloadPDF(data: PDFGenerationData, filename?: string): Promise<void> {
  const blob = await generatePDFBlob(data);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Generate filename based on template type and date
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `${data.templateType}-${timestamp}.pdf`;
  link.download = filename || defaultFilename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert form field names from template format to PDF data format
 * Handles snake_case conversion and special mappings
 */
export function mapFormDataToPDFData(
  formData: Record<string, string>,
  templateType: PDFTemplateType
): PDFGenerationData {
  // Convert snake_case field names to camelCase for PDF templates
  const convertedData: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(formData)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    convertedData[camelKey] = value;
  }
  
  return {
    templateType,
    ...convertedData,
  };
}

/**
 * Generate PDF preview URL (for iframe/object embedding)
 */
export async function generatePDFPreviewURL(data: PDFGenerationData): Promise<string> {
  const blob = await generatePDFBlob(data);
  return URL.createObjectURL(blob);
}
