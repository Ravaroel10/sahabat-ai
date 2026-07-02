/**
 * Type definitions for LLM responses in SAHABAT AI
 */

/**
 * Emergency types detected in user messages
 */
export type EmergencyType = 'medical' | 'financial' | 'violence' | 'disaster';

/**
 * Emergency detection result
 */
export interface EmergencyDetection {
  isEmergency: boolean;
  type?: EmergencyType;
  keywords: string[];
}

/**
 * Social assistance program information
 */
export interface SocialProgram {
  id: string;
  name: string;
  description: string;
  eligibilityCriteria: string[];
  benefits: string;
  regulations: string[]; // e.g., ["Permensos No. 1/2024, Pasal 5"]
}

/**
 * Citation/Source types - can be from laws, websites, or RAG documents
 */
export type CitationType = 'regulation' | 'website' | 'rag-document' | 'institution-info';

/**
 * Base citation interface
 */
interface BaseCitation {
  type: CitationType;
  title: string;
  url?: string;
}

/**
 * Regulation/Law citation
 */
export interface RegulationCitation extends BaseCitation {
  type: 'regulation';
  regulation: string; // e.g., "Permensos No. 1/2024"
  article?: string; // e.g., "Pasal 5"
  verse?: string; // e.g., "Ayat 2"
  fullCitation: string; // e.g., "Permensos No. 1/2024, Pasal 5, Ayat 2"
}

/**
 * Website source citation
 */
export interface WebsiteCitation extends BaseCitation {
  type: 'website';
  domain: string; // e.g., "kemensos.go.id"
  snippet?: string; // Brief excerpt
  publishedDate?: string;
}

/**
 * RAG document citation
 */
export interface RAGDocumentCitation extends BaseCitation {
  type: 'rag-document';
  source: string; // e.g., "programs", "institutions"
  recordId: string;
  snippet?: string;
  score?: number; // Relevance score
}

/**
 * Institution information citation
 */
export interface InstitutionCitation extends BaseCitation {
  type: 'institution-info';
  institutionName: string;
  contact?: string;
  source: string; // Where this info came from
}

/**
 * Union type for all citation types
 */
export type Citation = 
  | RegulationCitation 
  | WebsiteCitation 
  | RAGDocumentCitation 
  | InstitutionCitation;

/**
 * Action suggestion for cross-feature navigation
 */
export interface ActionSuggestion {
  type: 'marketplace' | 'auto-birokrasi' | 'external' | 'document-template';
  label: string; // e.g., "Lihat di Marketplace"
  href?: string; // e.g., "/marketplace?income=1500000"
  description?: string;
  icon?: string; // Emoji or lucide icon name
  // For auto-birokrasi document generation
  documentType?: string; // e.g., "sktm", "surat-permohonan"
  programId?: string; // Related program for context
}

/**
 * Structured LLM response
 */
export interface StructuredLLMResponse {
  // Main text content
  content: string;
  
  // Emergency detection (if any)
  emergency?: EmergencyDetection;
  
  // Recommended programs
  programs?: SocialProgram[];
  
  // Regulation citations
  citations?: RegulationCitation[];
  
  // Next steps / actionable advice
  nextSteps?: string[];
  
  // Cross-feature navigation suggestions
  actions?: ActionSuggestion[];
  
  // Confidence level (0-1)
  confidence?: number;
  
  // Whether user should verify with official sources
  requiresVerification: boolean;
}

/**
 * User criteria extracted from conversation for marketplace filters
 */
export interface UserCriteria {
  income?: number; // Monthly income in IDR
  familySize?: number;
  location?: string;
  employment?: 'formal' | 'informal' | 'unemployed' | 'petani' | 'buruh';
  hasChildren?: boolean;
  childrenInSchool?: number;
  hasElderly?: boolean;
  hasPregnant?: boolean;
  hasDisability?: boolean;
  // Add more as needed
}

/**
 * Message part types for rendering
 * Using data-* prefix for compatibility with Vercel AI SDK
 */
export type MessagePartType = 
  | 'text'
  | 'data-citation'
  | 'data-program'
  | 'data-actions'
  | 'data-emergency'
  | 'data-steps';

/**
 * Base message part
 */
interface BaseMessagePart {
  type: MessagePartType;
}

/**
 * Text content part
 */
export interface TextPart extends BaseMessagePart {
  type: 'text';
  text: string;
}

/**
 * Citation part - wraps data in 'data' property for AI SDK compatibility
 */
export interface CitationPart extends BaseMessagePart {
  type: 'data-citation';
  data: {
    citations: Citation[];
    sectionLabel?: string; // e.g., "Dasar Hukum", "Sumber Informasi", "Referensi"
  };
}

/**
 * Program card part
 */
export interface ProgramCardPart extends BaseMessagePart {
  type: 'data-program';
  data: {
    program: SocialProgram;
  };
}

/**
 * Action buttons part
 */
export interface ActionButtonsPart extends BaseMessagePart {
  type: 'data-actions';
  data: {
    actions: ActionSuggestion[];
  };
}

/**
 * Emergency alert part
 */
export interface EmergencyAlertPart extends BaseMessagePart {
  type: 'data-emergency';
  data: {
    emergency: EmergencyDetection;
    immediateSteps: string[];
    contacts: Array<{
      name: string;
      phone?: string;
      description?: string;
    }>;
  };
}

/**
 * Next steps part
 */
export interface NextStepsPart extends BaseMessagePart {
  type: 'data-steps';
  data: {
    steps: string[];
  };
}

/**
 * Union type for all message parts
 */
export type MessagePart = 
  | TextPart
  | CitationPart
  | ProgramCardPart
  | ActionButtonsPart
  | EmergencyAlertPart
  | NextStepsPart;
