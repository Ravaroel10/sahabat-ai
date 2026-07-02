'use client';

/**
 * Unified Marketplace - Social assistance program discovery with eligibility filtering
 * 
 * Replaces the old peer-to-peer marketplace with government program listing
 * Integrates with UserContext for filter persistence
 * Shows eligibility indicators based on user criteria
 */

import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter,
  SortAsc, 
  Sparkles, 
  Check, 
  X, 
  DollarSign, 
  Users, 
  MapPin 
} from 'lucide-react';
import { EligibilitySearchModal } from '@/components/marketplace/eligibility-search-modal';
import { ProgramCard } from '@/components/marketplace/program-card';
import { SOCIAL_PROGRAMS } from '@/data/social-programs';
import { calculateEligibility, sortProgramsByEligibility } from '@/lib/eligibility-calculator';
import { useUserContext, type UserCriteria } from '@/contexts/user-context';
import { trackJourney } from '@/lib/analytics';
import { parseFilterParams } from '@/lib/filter-url';
import { Suspense } from 'react';

/**
 * ProgramWithEligibility — a social program paired with its computed
 * eligibility result and optional AI reasoning metadata.
 */
type ProgramWithEligibility = {
  program: any;
  eligibility: any;
  fromAI?: boolean;
  aiReasoning?: any;
  finalScore?: number;
  recommendation?: any;
};

/**
 * ProgramGroup — renders a labelled, color-coded section of program cards.
 * Extracted from the three repeated eligible/partial/ineligible blocks
 * that previously duplicated the same JSX structure with only color,
 * icon, and label differences.
 */
function ProgramGroup({
  icon,
  badgeClassName,
  labelClassName,
  label,
  programs,
  onViewDetails,
  onApply,
  onBookmark,
  bookmarkedPrograms,
  hasActiveFilter,
}: {
  icon: ReactNode;
  badgeClassName: string;
  labelClassName: string;
  label: string;
  programs: ProgramWithEligibility[];
  onViewDetails: (programId: string) => void;
  onApply: (programId: string) => void;
  onBookmark: (programId: string) => void;
  bookmarkedPrograms: Set<string>;
  hasActiveFilter: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${badgeClassName}`}>
          {icon}
          <span className={`text-sm font-semibold ${labelClassName}`}>
            {label}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {programs.length} program
        </span>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {programs.map(({ program, eligibility, aiReasoning }) => (
          <ProgramCard
            key={program.id}
            program={program}
            eligibility={eligibility}
            aiReasoning={aiReasoning}
            onViewDetails={onViewDetails}
            onApply={onApply}
            onBookmark={onBookmark}
            isBookmarked={bookmarkedPrograms.has(program.id)}
            hasActiveFilter={hasActiveFilter}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonCard - Pulse placeholder used while data hydrates or when filtering
 * produces a noticeable recompute. Inline implementation avoids pulling a
 * dedicated skeleton component while still providing visual continuity
 * (task 13.7).
 */
function SkeletonCard() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex gap-2">
          <div className="h-5 w-24 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-full rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

function MarketplacePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userCriteria, updateUserCriteria, clearUserCriteria } = useUserContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'eligibility' | 'name'>('eligibility');
  const [showFilters, setShowFilters] = useState(true);
  const [bookmarkedPrograms, setBookmarkedPrograms] = useState<Set<string>>(new Set());
  const [isHydrating, setIsHydrating] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]); // Store AI search results

  // Set mounted flag on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load filters from URL parameters on mount (task 14.5: validate URL params)
  useEffect(() => {
    const criteriaFromUrl = parseFilterParams(searchParams);
    if (Object.keys(criteriaFromUrl).length > 0) {
      updateUserCriteria(criteriaFromUrl);
      // Track that the user arrived at marketplace with pre-populated filters
      // from another feature (chat). This is our chat→marketplace journey
      // analytics signal (task 9.12).
      trackJourney('chat_to_market', criteriaFromUrl);
    }
    setIsHydrating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcut for search modal (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update URL parameters when filters change
  const handleFilterChange = (criteria: UserCriteria, aiResults?: any[]) => {
    const params = new URLSearchParams();
    
    if (criteria.income) params.set('income', String(criteria.income));
    if (criteria.familySize) params.set('familySize', String(criteria.familySize));
    if (criteria.age) params.set('age', String(criteria.age));
    if (criteria.occupation) params.set('occupation', criteria.occupation);
    if (criteria.location?.province) params.set('province', criteria.location.province);
    if (criteria.location?.city) params.set('city', criteria.location.city);
    
    // Store AI results if provided
    if (aiResults && aiResults.length > 0) {
      setAiResults(aiResults);
    } else {
      setAiResults([]);
    }
    
    const queryString = params.toString();
    router.push(`/programs${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  // Calculate eligibility for all programs
  const programsWithEligibility = useMemo<ProgramWithEligibility[]>(() => {
    // If we have AI results, merge them with ALL programs
    if (aiResults.length > 0) {
      // Create a map of AI results by program ID
      const aiResultsMap = new Map(
        aiResults.map(result => [result.program.id, result])
      );
      
      // Process ALL programs from SOCIAL_PROGRAMS
      return SOCIAL_PROGRAMS.map(program => {
        const aiResult = aiResultsMap.get(program.id);
        
        if (aiResult) {
          // Use AI result if available (already has eligibility + AI scoring)
          return {
            program: aiResult.program,
            eligibility: aiResult.eligibility,
            aiReasoning: aiResult.aiReasoning,
            finalScore: aiResult.finalScore,
            recommendation: aiResult.recommendation,
            fromAI: true, // Flag to track source
          };
        } else {
          // Calculate normally for programs not in AI results
          return {
            program,
            eligibility: calculateEligibility(program, userCriteria),
            fromAI: false, // Not from AI, calculated locally
          };
        }
      });
    }
    
    // Otherwise, calculate normally for all programs (existing behavior)
    return SOCIAL_PROGRAMS.map(program => ({
      program,
      eligibility: calculateEligibility(program, userCriteria),
      fromAI: false,
    }));
  }, [userCriteria, aiResults]);

  // Filter and sort programs
  const filteredPrograms = useMemo(() => {
    let filtered = programsWithEligibility;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(({ program }) =>
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.shortName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(({ program }) => program.category === categoryFilter);
    }

    // Sort
    if (sortBy === 'eligibility') {
      filtered = sortProgramsByEligibility(filtered);
      
      // If we have AI results, do secondary sorting within each eligibility group
      // to put AI-ranked programs first (they have finalScore)
      if (aiResults.length > 0) {
        const grouped = {
          eligible: filtered.filter(p => p.eligibility.status === 'eligible'),
          partial: filtered.filter(p => p.eligibility.status === 'partial'),
          ineligible: filtered.filter(p => p.eligibility.status === 'ineligible'),
        };
        
        // Sort each group: AI results first (by finalScore), then non-AI (alphabetically)
        const sortGroup = (group: typeof filtered) => {
          const withAI = group.filter(p => p.fromAI).sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
          const withoutAI = group.filter(p => !p.fromAI).sort((a, b) => a.program.name.localeCompare(b.program.name, 'id'));
          return [...withAI, ...withoutAI];
        };
        
        filtered = [
          ...sortGroup(grouped.eligible),
          ...sortGroup(grouped.partial),
          ...sortGroup(grouped.ineligible),
        ];
      }
    } else {
      filtered = [...filtered].sort((a, b) => 
        a.program.name.localeCompare(b.program.name, 'id')
      );
    }

    return filtered;
  }, [programsWithEligibility, searchTerm, categoryFilter, sortBy, aiResults.length]);

  // Eligibility counts
  const eligibilityCounts = useMemo(() => {
    const counts = { eligible: 0, partial: 0, ineligible: 0 };
    filteredPrograms.forEach(({ eligibility }) => {
      const status = eligibility.status as keyof typeof counts;
      counts[status]++;
    });
    return counts;
  }, [filteredPrograms]);

  // Group programs by eligibility status for better display
  const groupedPrograms = useMemo(() => {
    const eligible = filteredPrograms.filter(p => p.eligibility.status === 'eligible');
    const partial = filteredPrograms.filter(p => p.eligibility.status === 'partial');
    const ineligible = filteredPrograms.filter(p => p.eligibility.status === 'ineligible');
    
    return { eligible, partial, ineligible };
  }, [filteredPrograms]);

  // Check if filter is active
  const hasActiveFilter = useMemo(() => {
    return Object.values(userCriteria).some(v => v !== undefined && v !== null && v !== '');
  }, [userCriteria]);

  // Stable callbacks (memo-friendly so ProgramCard.memo can skip re-renders)
  const handleViewDetails = useCallback((programId: string) => {
    router.push(`/programs/${programId}`);
  }, [router]);

  const handleApply = useCallback((programId: string) => {
    // Navigate to Auto-Birokrasi with program context
    const program = SOCIAL_PROGRAMS.find(p => p.id === programId);
    if (!program) return;

    // Track market→documents journey event (task 9.12)
    trackJourney('market_to_doc', {
      programId: program.id,
      programName: program.name,
    });

    // Encode program details and user criteria in URL
    const params = new URLSearchParams({
      programId: program.id,
      programName: program.name,
      from: 'marketplace',
    });

    // Pass user criteria as well for pre-filling application forms
    if (userCriteria.income) params.set('income', String(userCriteria.income));
    if (userCriteria.familySize) params.set('familySize', String(userCriteria.familySize));
    if (userCriteria.location?.province) params.set('province', userCriteria.location.province);
    if (userCriteria.location?.city) params.set('city', userCriteria.location.city);

    router.push(`/documents?${params.toString()}`);
  }, [router, userCriteria]);

  const handleBookmark = useCallback((programId: string) => {
    setBookmarkedPrograms(prev => {
      const updated = new Set(prev);
      if (updated.has(programId)) {
        updated.delete(programId);
      } else {
        updated.add(programId);
      }
      return updated;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Modal */}
      <EligibilitySearchModal
        open={showSearchModal}
        onOpenChange={setShowSearchModal}
        onApplyFilters={handleFilterChange}
      />

      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Program Bantuan Sosial</h1>
          <p className="text-muted-foreground">
            Temukan program bantuan pemerintah yang sesuai dengan kondisi Anda
          </p>
        </div>

        {/* Hero CTA - Only show when no filter active */}
        {isMounted && !Object.values(userCriteria).some(v => v !== undefined) && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  Tidak yakin program mana yang cocok?
                </p>
                <p className="text-sm text-muted-foreground">
                  Isi kriteria Anda dan kami akan menampilkan program yang sesuai
                </p>
              </div>
              <Button onClick={() => setShowSearchModal(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Filter Kelayakan
              </Button>
            </div>
          </div>
        )}

        {/* Filter Status Bar */}
        {isMounted && Object.values(userCriteria).some(v => v !== undefined) && (
          <div className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-sm font-medium shrink-0">Filter aktif:</span>
              <div className="flex flex-wrap items-center gap-2 text-sm min-w-0">
                {userCriteria.income && (
                  <Badge variant="secondary" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Rp {userCriteria.income.toLocaleString('id-ID')}
                  </Badge>
                )}
                {userCriteria.familySize && (
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {userCriteria.familySize} anggota
                  </Badge>
                )}
                {userCriteria.location?.province && (
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {userCriteria.location.province}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSearchModal(true)}
              >
                Ubah
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  clearUserCriteria();
                  setSearchTerm('');
                  setCategoryFilter('all');
                  // Force reload to clear URL and refresh state
                  window.location.href = '/programs';
                }}
                title="Hapus semua filter"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count with Eligibility Stats */}
      {isMounted && Object.values(userCriteria).some(v => v !== undefined) && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{eligibilityCounts.eligible}</strong> cocok
          </span>
          <span>•</span>
          <span>
            <strong className="text-foreground">{eligibilityCounts.partial}</strong> perlu verifikasi
          </span>
          <span>•</span>
          <span>
            <strong className="text-foreground">{eligibilityCounts.ineligible}</strong> tidak cocok
          </span>
        </div>
      )}

      <div>
        {/* Programs List */}
        <div className="space-y-4">
          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={categoryFilter} 
              onValueChange={(value) => setCategoryFilter(value || 'all')}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="cash">Bantuan Tunai</SelectItem>
                <SelectItem value="food">Bantuan Pangan</SelectItem>
                <SelectItem value="health">Kesehatan</SelectItem>
                <SelectItem value="education">Pendidikan</SelectItem>
                <SelectItem value="housing">Perumahan</SelectItem>
                <SelectItem value="disability">Disabilitas</SelectItem>
                <SelectItem value="elderly">Lansia</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-full sm:w-48">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eligibility">Urutkan: Kelayakan</SelectItem>
                <SelectItem value="name">Urutkan: Nama</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Programs Grid — task 13.7: skeleton during hydration, task 14.4: better empty state */}
          {isHydrating ? (
            <div className="grid md:grid-cols-2 gap-4" aria-busy="true" aria-live="polite">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredPrograms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="text-center space-y-1">
                  <p className="font-medium">Tidak ada program yang cocok dengan filter Anda</p>
                  <p className="text-sm text-muted-foreground">
                    Coba ubah filter atau pilih template preset
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearUserCriteria();
                      setSearchTerm('');
                      setCategoryFilter('all');
                      // Force reload to clear state
                      window.location.href = '/programs';
                    }}
                  >
                    Reset Semua Filter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden"
                  >
                    Buka Filter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Show grouped results when filters are active */}
              {hasActiveFilter && (groupedPrograms.eligible.length > 0 || groupedPrograms.partial.length > 0 || groupedPrograms.ineligible.length > 0) ? (
                <div className="space-y-8">
                  {/* AI Results Info Banner */}
                  {aiResults.length > 0 && (
                    <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div className="text-blue-900 dark:text-blue-100">
                          <p className="font-medium">AI Pencarian Cerdas Aktif</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                            Menampilkan {aiResults.length} program dengan analisis AI, plus semua program lainnya yang memenuhi kriteria Anda
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Eligible Programs */}
                  {groupedPrograms.eligible.length > 0 && (
                    <ProgramGroup
                      icon={<Check className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      badgeClassName="bg-green-100 dark:bg-green-900/30"
                      labelClassName="text-green-700 dark:text-green-300"
                      label="Cocok Untuk Anda"
                      programs={groupedPrograms.eligible}
                      onViewDetails={handleViewDetails}
                      onApply={handleApply}
                      onBookmark={handleBookmark}
                      bookmarkedPrograms={bookmarkedPrograms}
                      hasActiveFilter={hasActiveFilter}
                    />
                  )}

                  {/* Partial/Need Clarification Programs */}
                  {groupedPrograms.partial.length > 0 && (
                    <ProgramGroup
                      icon={<Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                      badgeClassName="bg-amber-100 dark:bg-amber-900/30"
                      labelClassName="text-amber-700 dark:text-amber-300"
                      label="Perlu Informasi Lebih Lanjut"
                      programs={groupedPrograms.partial}
                      onViewDetails={handleViewDetails}
                      onApply={handleApply}
                      onBookmark={handleBookmark}
                      bookmarkedPrograms={bookmarkedPrograms}
                      hasActiveFilter={hasActiveFilter}
                    />
                  )}

                  {/* Ineligible Programs */}
                  {groupedPrograms.ineligible.length > 0 && (
                    <ProgramGroup
                      icon={<X className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                      badgeClassName="bg-gray-100 dark:bg-gray-800"
                      labelClassName="text-gray-700 dark:text-gray-300"
                      label="Tidak Memenuhi Syarat"
                      programs={groupedPrograms.ineligible}
                      onViewDetails={handleViewDetails}
                      onApply={handleApply}
                      onBookmark={handleBookmark}
                      bookmarkedPrograms={bookmarkedPrograms}
                      hasActiveFilter={hasActiveFilter}
                    />
                  )}
                </div>
              ) : (
                /* Show all programs in grid when no filter */
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredPrograms.map(({ program, eligibility, aiReasoning }) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      eligibility={eligibility}
                      aiReasoning={aiReasoning}
                      onViewDetails={handleViewDetails}
                      onApply={handleApply}
                      onBookmark={handleBookmark}
                      isBookmarked={bookmarkedPrograms.has(program.id)}
                      hasActiveFilter={hasActiveFilter}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Results Count */}
          <p className="text-sm text-muted-foreground text-center">
            Menampilkan {filteredPrograms.length} dari {SOCIAL_PROGRAMS.length} program
          </p>
        </div>
      </div>

    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    }>
      <MarketplacePageContent />
    </Suspense>
  );
}
