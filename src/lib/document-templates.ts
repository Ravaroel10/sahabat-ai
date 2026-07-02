/**
 * Document templates data accessor.
 *
 * Previously this was exported from src/lib/ai/rag.ts alongside the RAG
 * logic. With the AI extraction to the Python service, rag.ts is deleted
 * and the document templates (which are just static JSON data, no AI)
 * get their own simple accessor module.
 */

import documentTemplates from "@/data/documents/document-templates.json";

export interface DocumentTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  fields: string[];
  content: string;
}

export function getAllDocumentTemplates(): DocumentTemplate[] {
  return documentTemplates.templates as DocumentTemplate[];
}

export function getDocumentTemplate(templateId: string): DocumentTemplate | null {
  const templates = documentTemplates.templates as DocumentTemplate[];
  return templates.find((t) => t.id === templateId) || null;
}
