'use client';

/**
 * EligibilitySearchModal - Simplified modal for eligibility search
 * 
 * Features:
 * - Two-step process: basic details then additional info
 * - Collects structured criteria and free-form context
 * - Results shown on main page, not in modal
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Users, 
  DollarSign, 
  MapPin, 
  Briefcase, 
  Baby,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useUserContext, type UserCriteria } from '@/contexts/user-context';

interface EligibilitySearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters?: (criteria: UserCriteria, aiResults?: any[]) => void;
}

export function EligibilitySearchModal({ 
  open, 
  onOpenChange, 
  onApplyFilters 
}: EligibilitySearchModalProps) {
  const { userCriteria, updateUserCriteria } = useUserContext();
  const [tempCriteria, setTempCriteria] = useState<UserCriteria>({});
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [step, setStep] = useState<'details' | 'additional'>('details');
  const [isSearching, setIsSearching] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (open) {
      setTempCriteria(userCriteria);
      setAdditionalInfo('');
      setStep('details');
      setIsSearching(false);
    }
  }, [open, userCriteria]);

  // Update individual criteria field
  const updateTempCriteria = (updates: Partial<UserCriteria>) => {
    setTempCriteria(prev => ({ ...prev, ...updates }));
  };

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [step]);

  // Apply filters and close modal
  const applyFilters = async () => {
    setIsSearching(true);
    
    try {
      // Call the new smart eligibility search API
      const response = await fetch('/api/eligibility-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          criteria: tempCriteria,
          additionalInfo: additionalInfo,
          topK: 50, // Get more results for proper grouping
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search programs');
      }

      const data = await response.json();
      
      // Update user context with the criteria
      updateUserCriteria(tempCriteria);
      
      // Pass both criteria and AI results to parent
      // Note: AI results may not include all programs, marketplace will merge with full list
      if (onApplyFilters) {
        onApplyFilters(tempCriteria, data.programs);
      }
      
      // Close modal
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error searching programs:', error);
      // Fallback: still update context and close modal
      updateUserCriteria(tempCriteria);
      onApplyFilters?.(tempCriteria);
      onOpenChange(false);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b shrink-0">
          <DialogTitle className="text-xl sm:text-2xl">
            Cari Program yang Cocok
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {step === 'details' && 'Lengkapi informasi dasar Anda'}
            {step === 'additional' && 'Ceritakan lebih lanjut tentang kondisi Anda'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="px-4 sm:px-8 py-3 sm:py-4 border-b shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`flex-1 h-1.5 sm:h-2 rounded-full transition-all ${
              step === 'details' ? 'bg-primary' : 'bg-muted'
            }`} />
            <div className={`flex-1 h-1.5 sm:h-2 rounded-full transition-all ${
              step === 'additional' ? 'bg-primary' : 'bg-muted'
            }`} />
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
          {/* Step 1: Detail Input */}
          {step === 'details' && (
            <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Berikan informasi dasar tentang kondisi Anda untuk membantu kami menemukan program yang sesuai.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="income-modal" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Penghasilan per Bulan (Rp)
                  </label>
                  <Input
                    id="income-modal"
                    type="number"
                    placeholder="contoh: 2000000"
                    value={tempCriteria.income || ''}
                    onChange={(e) => updateTempCriteria({ 
                      income: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="familySize-modal" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Jumlah Anggota Keluarga
                  </label>
                  <Input
                    id="familySize-modal"
                    type="number"
                    placeholder="contoh: 4"
                    value={tempCriteria.familySize || ''}
                    onChange={(e) => updateTempCriteria({ 
                      familySize: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="age-modal" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Usia
                  </label>
                  <Input
                    id="age-modal"
                    type="number"
                    placeholder="contoh: 35"
                    value={tempCriteria.age || ''}
                    onChange={(e) => updateTempCriteria({ 
                      age: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="province-modal" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Provinsi
                  </label>
                  <Input
                    id="province-modal"
                    placeholder="contoh: Jawa Barat"
                    value={tempCriteria.location?.province || ''}
                    onChange={(e) => updateTempCriteria({ 
                      location: { 
                        ...tempCriteria.location, 
                        province: e.target.value 
                      } 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="city-modal" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Kota/Kabupaten
                  </label>
                  <Input
                    id="city-modal"
                    placeholder="contoh: Bandung"
                    value={tempCriteria.location?.city || ''}
                    onChange={(e) => updateTempCriteria({ 
                      location: { 
                        ...tempCriteria.location, 
                        city: e.target.value 
                      } 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="occupation-modal" className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    Pekerjaan
                  </label>
                  <Input
                    id="occupation-modal"
                    placeholder="contoh: Pekerja Informal"
                    value={tempCriteria.occupation || ''}
                    onChange={(e) => updateTempCriteria({ 
                      occupation: e.target.value 
                    })}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasChildren-modal"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={tempCriteria.hasChildren || false}
                      onChange={(e) => updateTempCriteria({ 
                        hasChildren: e.target.checked,
                        childrenCount: e.target.checked ? tempCriteria.childrenCount : undefined
                      })}
                    />
                    <label htmlFor="hasChildren-modal" className="text-sm font-medium flex items-center gap-2">
                      <Baby className="h-4 w-4 text-muted-foreground" />
                      Punya Anak
                    </label>
                  </div>
                </div>

                {tempCriteria.hasChildren && (
                  <div className="space-y-2">
                    <label htmlFor="childrenCount-modal" className="text-sm font-medium flex items-center gap-2">
                      <Baby className="h-4 w-4 text-muted-foreground" />
                      Jumlah Anak
                    </label>
                    <Input
                      id="childrenCount-modal"
                      type="number"
                      placeholder="contoh: 2"
                      value={tempCriteria.childrenCount || ''}
                      onChange={(e) => updateTempCriteria({ 
                        childrenCount: e.target.value ? Number(e.target.value) : undefined 
                      })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Additional Information */}
          {step === 'additional' && (
            <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('details')}
                  className="mb-4"
                >
                  ← Kembali ke Informasi Dasar
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-2">
                    Ceritakan Lebih Lanjut
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Berikan informasi tambahan yang dapat membantu kami dalam mencari program yang cocok untuk kamu. 
                    Misalnya: kondisi kesehatan, status pendidikan, kebutuhan khusus, atau situasi ekonomi keluarga.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="additionalInfo-modal" className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    Informasi Tambahan
                  </label>
                  <textarea
                    id="additionalInfo-modal"
                    className="w-full min-h-[200px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    placeholder="Contoh: Saya memiliki anak usia sekolah dan salah satunya berkebutuhan khusus. Suami saya bekerja sebagai buruh harian. Kami tinggal di daerah pedesaan dengan akses terbatas ke fasilitas kesehatan..."
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Semakin detail informasi yang Anda berikan, semakin akurat rekomendasi program yang kami berikan.
                  </p>
                </div>

                {/* Summary of provided criteria */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h4 className="text-sm font-medium mb-3">Ringkasan Informasi Dasar</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {tempCriteria.income && (
                      <div>
                        <span className="text-muted-foreground">Penghasilan:</span>
                        <p className="font-medium">Rp {tempCriteria.income.toLocaleString()}/bulan</p>
                      </div>
                    )}
                    {tempCriteria.familySize && (
                      <div>
                        <span className="text-muted-foreground">Anggota Keluarga:</span>
                        <p className="font-medium">{tempCriteria.familySize} orang</p>
                      </div>
                    )}
                    {tempCriteria.age && (
                      <div>
                        <span className="text-muted-foreground">Usia:</span>
                        <p className="font-medium">{tempCriteria.age} tahun</p>
                      </div>
                    )}
                    {tempCriteria.location?.province && (
                      <div>
                        <span className="text-muted-foreground">Lokasi:</span>
                        <p className="font-medium">
                          {tempCriteria.location.city ? `${tempCriteria.location.city}, ` : ''}
                          {tempCriteria.location.province}
                        </p>
                      </div>
                    )}
                    {tempCriteria.occupation && (
                      <div>
                        <span className="text-muted-foreground">Pekerjaan:</span>
                        <p className="font-medium">{tempCriteria.occupation}</p>
                      </div>
                    )}
                    {tempCriteria.hasChildren && (
                      <div>
                        <span className="text-muted-foreground">Anak:</span>
                        <p className="font-medium">
                          {tempCriteria.childrenCount ? `${tempCriteria.childrenCount} anak` : 'Ya'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="border-t px-4 sm:px-8 py-3 sm:py-4 shrink-0 bg-muted/10">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <div className="flex items-center gap-2">
              {step === 'details' && (
                <Button
                  onClick={() => setStep('additional')}
                >
                  Lanjut
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {step === 'additional' && (
                <Button onClick={applyFilters} disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Mencari...
                    </>
                  ) : (
                    <>
                      Cari Program
                      <Search className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
