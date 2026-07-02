/**
 * Social Assistance Programs Data
 *
 * This module is the TypeScript accessor for the unified
 * social-programs.json dataset. The JSON file is now the single
 * source of truth — it contains both the structured `requirements`
 * fields (used by eligibility-calculator.ts) and the richer fields
 * (legalBasis, documents, contact, keywords) used by the Python
 * RAG ingest and the /api/programs route.
 *
 * Based on real Indonesian social assistance programs:
 * - PKH (Program Keluarga Harapan)
 * - BPNT (Bantuan Pangan Non Tunai)
 * - BPJS Kesehatan PBI / JKN-PBI
 * - KIP (Kartu Indonesia Pintar)
 * - etc.
 */

import type { SocialProgram } from '@/components/marketplace/program-card';
import socialProgramsData from './programs/social-programs.json';

/** Raw shape of a program record in social-programs.json. */
interface RawProgram {
  id: string;
  acronym: string;
  shortName?: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  ministry: string;
  benefits: string[];
  benefitsSummary: string;
  eligibility: string;
  requirements: SocialProgram['requirements'];
  documents: string;
  contact: string;
  legalBasis: string;
  regulationReference?: string;
  applicationUrl?: string;
  province: string | null;
  keywords: string[];
}

const validCategories = new Set<string>([
  'cash', 'food', 'health', 'education', 'housing', 'disability', 'elderly',
]);

/**
 * Map a raw JSON program record to the SocialProgram interface.
 * The JSON contains extra fields (legalBasis, documents, contact,
 * keywords, etc.) that are not part of SocialProgram — those are
 * used by the /api/programs route and the Python RAG ingest.
 */
function mapToSocialProgram(raw: RawProgram): SocialProgram {
  if (!validCategories.has(raw.category)) {
    throw new Error(`Invalid category "${raw.category}" for program "${raw.id}"`);
  }
  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.shortName || raw.acronym,
    description: raw.description,
    category: raw.category as SocialProgram['category'],
    provider: raw.provider,
    benefits: raw.benefits,
    requirements: raw.requirements,
    applicationUrl: raw.applicationUrl,
    regulationReference: raw.regulationReference || raw.legalBasis,
  };
}

export const SOCIAL_PROGRAMS: SocialProgram[] =
  socialProgramsData.programs.map(mapToSocialProgram);
