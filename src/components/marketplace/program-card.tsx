'use client';

/**
 * ProgramCard - Displays social assistance program with eligibility indicators
 *
 * Eligibility states:
 * - Green check: "Anda Memenuhi Syarat" (all requirements met)
 * - Muted: Ineligible (shows unmet requirements)
 * - Neutral: "Perlu Verifikasi Lebih Lanjut" (partial match)
 *
 * Wrapped in React.memo with a custom comparator so cards don't re-render when
 * unrelated instances of useState/useMemo invalidate the parent. The parent
 * (marketplace page) should pass stable callbacks via useCallback to maximize
 * memo's effectiveness — task 13.2.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, ChevronRight, Heart, Sparkles } from 'lucide-react';
import type { UserCriteria } from '@/contexts/user-context';

export interface SocialProgram {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: 'cash' | 'food' | 'health' | 'education' | 'housing' | 'disability' | 'elderly';
  provider: string; // e.g., "Kemensos", "BPJS", "Kemendikbud"
  benefits: string[];
  requirements: {
    maxIncome?: number;
    minAge?: number;
    maxAge?: number;
    hasChildren?: boolean;
    minChildren?: number;
    hasDisability?: boolean;
    isPregnant?: boolean;
    occupation?: string[];
  };
  applicationUrl?: string;
  regulationReference?: string; // e.g., "Permensos No. 1/2023"
}

export interface EligibilityResult {
  status: 'eligible' | 'ineligible' | 'partial';
  matchedRequirements: string[];
  unmatchedRequirements: string[];
  missingInformation: string[];
  gapAnalysis?: {
    field: string;
    currentValue: number;
    requiredValue: number;
    difference: number;
  };
}

interface ProgramCardProps {
  program: SocialProgram;
  eligibility: EligibilityResult;
  aiReasoning?: string; // AI-generated explanation (optional)
  onViewDetails: (programId: string) => void;
  onApply?: (programId: string) => void;
  onBookmark?: (programId: string) => void;
  isBookmarked?: boolean;
  hasActiveFilter?: boolean; // New prop to determine if eligibility info should show
}

const categoryLabels: Record<SocialProgram['category'], { label: string; color: string }> = {
  cash: { label: 'Bantuan Tunai', color: 'bg-green-500' },
  food: { label: 'Bantuan Pangan', color: 'bg-orange-500' },
  health: { label: 'Kesehatan', color: 'bg-blue-500' },
  education: { label: 'Pendidikan', color: 'bg-purple-500' },
  housing: { label: 'Perumahan', color: 'bg-amber-500' },
  disability: { label: 'Disabilitas', color: 'bg-pink-500' },
  elderly: { label: 'Lansia', color: 'bg-indigo-500' },
};

/**
 * Custom equality check: shallow compare primitive props and identity-check
 * nested objects (program, eligibility). Since program is a static import and
 * eligibility is recomputed in useMemo by the parent, identity equality is
 * the right contract here.
 */
function arePropsEqual(prev: ProgramCardProps, next: ProgramCardProps): boolean {
  return (
    prev.program === next.program &&
    prev.eligibility === next.eligibility &&
    prev.aiReasoning === next.aiReasoning &&
    prev.isBookmarked === next.isBookmarked &&
    prev.onViewDetails === next.onViewDetails &&
    prev.onApply === next.onApply &&
    prev.onBookmark === next.onBookmark
  );
}

function ProgramCardImpl({
  program,
  eligibility,
  aiReasoning,
  onViewDetails,
  onApply,
  onBookmark,
  isBookmarked = false,
  hasActiveFilter = false,
}: ProgramCardProps) {
  const categoryInfo = categoryLabels[program.category];

  // Determine card styling based on eligibility (only if filter is active)
  const getCardStyle = () => {
    if (!hasActiveFilter) return '';
    
    switch (eligibility.status) {
      case 'eligible':
        return 'border-green-500 bg-green-50/50';
      case 'ineligible':
        return 'opacity-60 border-muted';
      case 'partial':
        return 'border-amber-500 bg-amber-50/50';
      default:
        return '';
    }
  };

  // Get eligibility icon and text (only if filter is active)
  const getEligibilityIndicator = () => {
    if (!hasActiveFilter) return null;
    
    switch (eligibility.status) {
      case 'eligible':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">Anda Memenuhi Syarat</span>
          </div>
        );
      case 'ineligible':
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <XCircle className="h-5 w-5" />
            <span className="text-sm">Tidak Memenuhi Syarat</span>
          </div>
        );
      case 'partial':
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Perlu Verifikasi Lebih Lanjut</span>
          </div>
        );
    }
  };

  return (
    <Card className={`transition-all ${getCardStyle()}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={categoryInfo.color}>
                {categoryInfo.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {program.provider}
              </span>
            </div>
            <CardTitle className="text-lg leading-tight">
              {program.name}
            </CardTitle>
          </div>
          {onBookmark && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onBookmark(program.id)}
              className="shrink-0"
            >
              <Heart 
                className={`h-4 w-4 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} 
              />
              <span className="sr-only">
                {isBookmarked ? 'Hapus dari bookmark' : 'Simpan ke bookmark'}
              </span>
            </Button>
          )}
        </div>

        {/* Eligibility Indicator */}
        <div className="pt-2">
          {getEligibilityIndicator()}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col justify-between h-full space-y-4">
        <CardDescription className="line-clamp-2">
          {program.description}
        </CardDescription>

        {/* AI Reasoning (if available from smart search) */}
        {aiReasoning && hasActiveFilter && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg text-sm">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Mengapa program ini cocok:
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  {aiReasoning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Summary */}
        {program.benefits.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Manfaat:</p>
            <ul className="text-sm space-y-1">
              {program.benefits.slice(0, 2).map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="line-clamp-1">{benefit}</span>
                </li>
              ))}
            </ul>
            {program.benefits.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{program.benefits.length - 2} manfaat lainnya
              </p>
            )}
          </div>
        )}

        {/* Gap Analysis for Ineligible */}
        {hasActiveFilter && eligibility.status === 'ineligible' && eligibility.gapAnalysis && (
          <div className="bg-muted p-3 rounded text-sm">
            <p className="font-semibold text-muted-foreground mb-1">
              Mengapa tidak memenuhi syarat:
            </p>
            <p className="text-xs">
              {eligibility.gapAnalysis.field} Anda{' '}
              <strong>Rp {eligibility.gapAnalysis.difference.toLocaleString('id-ID')}</strong>{' '}
              di atas batas kelayakan
            </p>
          </div>
        )}

        {/* Missing Information for Partial */}
        {hasActiveFilter && eligibility.status === 'partial' && eligibility.missingInformation.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm">
            <p className="font-semibold text-amber-800 mb-1">
              Informasi tambahan diperlukan:
            </p>
            <ul className="text-xs text-amber-700 space-y-0.5">
              {eligibility.missingInformation.slice(0, 2).map((info, index) => (
                <li key={index}>• {info}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className='space-y-4'>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(program.id)}
          >
            Lihat Detail
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {eligibility.status === 'eligible' && onApply && hasActiveFilter && (
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 relative group"
              onClick={() => onApply(program.id)}
              title="Klik untuk ajukan program ini"
            >
              Ajukan Sekarang
              {/* Tooltip on hover */}
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                Dokumen yang diperlukan akan disiapkan
              </span>
            </Button>
          )}
        </div>

        {/* Regulation Reference */}
        {program.regulationReference && (
          <p className="text-xs text-muted-foreground">
            Dasar hukum: {program.regulationReference}
          </p>
        )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Memoized ProgramCard — prevents re-render when an unrelated sibling card's
 * state changes (e.g., bookmarking a different card only invalidates that
 * card's re-render, not all 12 cards in the grid). Pair with useCallback
 * handlers in the parent for maximum effect.
 */
export const ProgramCard = React.memo(ProgramCardImpl, arePropsEqual);
