'use client';

/**
 * Program Detail Page - Shows comprehensive information about a social assistance program
 * 
 * Dynamic route: /programs/[id]
 * Displays program details, eligibility requirements, benefits, application process, and documents needed
 */

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Phone, 
  ExternalLink,
  Building2,
  Wallet,
  Users,
  Calendar,
  Shield
} from 'lucide-react';
import { SOCIAL_PROGRAMS } from '@/data/social-programs';
import { calculateEligibility } from '@/lib/eligibility-calculator';
import { useUserContext } from '@/contexts/user-context';
import { trackJourney } from '@/lib/analytics';
import type { SocialProgram, EligibilityResult } from '@/components/marketplace/program-card';
import Link from 'next/link';

const categoryLabels: Record<SocialProgram['category'], { label: string; color: string; icon: string }> = {
  cash: { label: 'Bantuan Tunai', color: 'bg-green-500', icon: '💰' },
  food: { label: 'Bantuan Pangan', color: 'bg-orange-500', icon: '🍚' },
  health: { label: 'Kesehatan', color: 'bg-blue-500', icon: '🏥' },
  education: { label: 'Pendidikan', color: 'bg-purple-500', icon: '🎓' },
  housing: { label: 'Perumahan', color: 'bg-amber-500', icon: '🏠' },
  disability: { label: 'Disabilitas', color: 'bg-pink-500', icon: '♿' },
  elderly: { label: 'Lansia', color: 'bg-indigo-500', icon: '👴' },
};

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userCriteria } = useUserContext();
  const [program, setProgram] = useState<SocialProgram | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const programId = params.id as string;

  // Check if filter is active
  const hasActiveFilter = Object.values(userCriteria).some(v => v !== undefined && v !== null && v !== '');

  useEffect(() => {
    // Find the program by ID
    const foundProgram = SOCIAL_PROGRAMS.find(p => p.id === programId);
    
    if (foundProgram) {
      setProgram(foundProgram);
      const eligibilityResult = calculateEligibility(foundProgram, userCriteria);
      setEligibility(eligibilityResult);
    }
    
    setIsLoading(false);
  }, [programId, userCriteria]);

  const handleApply = () => {
    if (!program) return;

    // Track market→documents journey event
    trackJourney('market_to_doc', {
      programId: program.id,
      programName: program.name,
    });

    // Encode program details and user criteria in URL
    const params = new URLSearchParams({
      programId: program.id,
      programName: program.name,
      from: 'program-detail',
    });

    // Pass user criteria for pre-filling application forms
    if (userCriteria.income) params.set('income', String(userCriteria.income));
    if (userCriteria.familySize) params.set('familySize', String(userCriteria.familySize));
    if (userCriteria.location?.province) params.set('province', userCriteria.location.province);
    if (userCriteria.location?.city) params.set('city', userCriteria.location.city);

    router.push(`/documents?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded bg-muted animate-pulse" />
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/programs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar Program
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 gap-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="font-medium text-lg">Program tidak ditemukan</p>
              <p className="text-sm text-muted-foreground">
                Program dengan ID &quot;{programId}&quot; tidak tersedia
              </p>
            </div>
            <Button onClick={() => router.push('/programs')}>
              Lihat Semua Program
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryInfo = categoryLabels[program.category];

  // // Get eligibility indicator
  // const getEligibilityIndicator = () => {
  //   if (!eligibility) return null;

  //   switch (eligibility.status) {
  //     case 'eligible':
  //       return (
  //         <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
  //           <CheckCircle className="h-6 w-6 shrink-0" />
  //           <div>
  //             <p className="font-semibold">Anda Memenuhi Syarat</p>
  //             <p className="text-sm text-green-700">
  //               Kriteria Anda cocok dengan persyaratan program ini
  //             </p>
  //           </div>
  //         </div>
  //       );
  //     case 'ineligible':
  //       return (
  //         <div className="flex items-center gap-3 text-muted-foreground bg-muted p-4 rounded-lg">
  //           <XCircle className="h-6 w-6 shrink-0" />
  //           <div>
  //             <p className="font-semibold">Tidak Memenuhi Syarat</p>
  //             <p className="text-sm">
  //               Beberapa persyaratan tidak terpenuhi
  //             </p>
  //           </div>
  //         </div>
  //       );
  //     case 'partial':
  //       return (
  //         <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200">
  //           <AlertCircle className="h-6 w-6 shrink-0" />
  //           <div>
  //             <p className="font-semibold">Perlu Verifikasi Lebih Lanjut</p>
  //             <p className="text-sm text-amber-700">
  //               Informasi tambahan diperlukan untuk menentukan kelayakan
  //             </p>
  //           </div>
  //         </div>
  //       );
  //   }
  // };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/programs')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Daftar Program
      </Button>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-4xl">{categoryInfo.icon}</span>
                  <Badge className={categoryInfo.color}>
                    {categoryInfo.label}
                  </Badge>
                  <Badge variant="outline">
                    {program.provider}
                  </Badge>
                </div>
                <CardTitle className="text-3xl leading-tight">
                  {program.name}
                </CardTitle>
                <CardDescription className="text-base">
                  {program.description}
                </CardDescription>
              </div>
            </div>

            {/* Eligibility Status
            {eligibility && (
              <div className="pt-2">
                {getEligibilityIndicator()}
              </div>
            )} */}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {hasActiveFilter && eligibility?.status === 'eligible' && (
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApply}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ajukan Sekarang
                </Button>
              )}
              {program.applicationUrl && (
                <Button variant="outline" size="lg">
                  <Link className='flex flex-row gap-1' href={program.applicationUrl} target="_blank" rel="noopener noreferrer">
                    Situs Resmi
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Benefits Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Manfaat Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {program.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Requirements Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Persyaratan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {program.requirements.maxIncome && (
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-6 bg-primary rounded" />
                    <div>
                      <p className="font-medium">Pendapatan Maksimal</p>
                      <p className="text-sm text-muted-foreground">
                        Rp {program.requirements.maxIncome.toLocaleString('id-ID')} per bulan
                      </p>
                    </div>
                  </div>
                )}
                
                {program.requirements.minAge && (
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-6 bg-primary rounded" />
                    <div>
                      <p className="font-medium">Usia Minimal</p>
                      <p className="text-sm text-muted-foreground">
                        {program.requirements.minAge} tahun
                      </p>
                    </div>
                  </div>
                )}

                {program.requirements.maxAge && (
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-6 bg-primary rounded" />
                    <div>
                      <p className="font-medium">Usia Maksimal</p>
                      <p className="text-sm text-muted-foreground">
                        {program.requirements.maxAge} tahun
                      </p>
                    </div>
                  </div>
                )}

                {program.requirements.hasChildren && (
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-6 bg-primary rounded" />
                    <div>
                      <p className="font-medium">Memiliki Anak</p>
                      <p className="text-sm text-muted-foreground">
                        {program.requirements.minChildren 
                          ? `Minimal ${program.requirements.minChildren} anak`
                          : 'Memiliki anak'}
                      </p>
                    </div>
                  </div>
                )}

                {program.requirements.hasDisability && (
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-6 bg-primary rounded" />
                    <div>
                      <p className="font-medium">Penyandang Disabilitas</p>
                      <p className="text-sm text-muted-foreground">
                        Memiliki anggota keluarga penyandang disabilitas
                      </p>
                    </div>
                  </div>
                )}

                {program.requirements.isPregnant && (
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-6 bg-primary rounded" />
                    <div>
                      <p className="font-medium">Ibu Hamil</p>
                      <p className="text-sm text-muted-foreground">
                        Untuk ibu hamil atau menyusui
                      </p>
                    </div>
                  </div>
                )}

                {program.requirements.occupation && program.requirements.occupation.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-6 bg-primary rounded" />
                    <div>
                      <p className="font-medium">Pekerjaan</p>
                      <p className="text-sm text-muted-foreground">
                        {program.requirements.occupation.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Details */}
          {hasActiveFilter && eligibility && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Detail Kelayakan Anda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Matched Requirements */}
                {eligibility.matchedRequirements.length > 0 && (
                  <div>
                    <p className="font-medium text-sm text-green-600 mb-2">
                      ✓ Persyaratan Terpenuhi
                    </p>
                    <ul className="space-y-1 text-sm">
                      {eligibility.matchedRequirements.map((req, idx) => (
                        <li key={idx} className="text-muted-foreground">• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Unmatched Requirements */}
                {eligibility.unmatchedRequirements.length > 0 && (
                  <div>
                    <p className="font-medium text-sm text-red-600 mb-2">
                      ✗ Persyaratan Tidak Terpenuhi
                    </p>
                    <ul className="space-y-1 text-sm">
                      {eligibility.unmatchedRequirements.map((req, idx) => (
                        <li key={idx} className="text-muted-foreground">• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Information */}
                {eligibility.missingInformation.length > 0 && (
                  <div>
                    <p className="font-medium text-sm text-amber-600 mb-2">
                      ? Informasi Belum Lengkap
                    </p>
                    <ul className="space-y-1 text-sm">
                      {eligibility.missingInformation.map((info, idx) => (
                        <li key={idx} className="text-muted-foreground">• {info}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gap Analysis */}
                {eligibility.gapAnalysis && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium text-sm mb-2">Analisis Kesenjangan</p>
                    <p className="text-sm text-muted-foreground">
                      {eligibility.gapAnalysis.field} Anda{' '}
                      <strong>Rp {eligibility.gapAnalysis.difference.toLocaleString('id-ID')}</strong>{' '}
                      di atas batas kelayakan
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )} 
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Provider Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Penyelenggara
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{program.provider}</p>
              {program.regulationReference && (
                <div className="pt-3 border-t mt-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Dasar Hukum</p>
                      <p className="text-sm">{program.regulationReference}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Help Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="">
              <div className="space-y-3">
                <p className="text-sm font-medium">Butuh Bantuan?</p>
                <p className="text-sm text-muted-foreground">
                  Hubungi AI Assistant kami untuk mendapatkan panduan dalam mengajukan program ini.
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push('/chat')}
                >
                  Chat Sekarang
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
