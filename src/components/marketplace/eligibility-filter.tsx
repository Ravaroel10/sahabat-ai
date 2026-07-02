'use client';

/**
 * EligibilityFilter - Progressive disclosure filter panel for program eligibility
 * 
 * Features:
 * - Basic filters (income, family size, location)
 * - Advanced filters with "Tambah Detail" expansion
 * - Conditional fields (e.g., agriculture for farmers)
 * - Filter presets/templates
 * - URL parameter synchronization
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Sparkles, DollarSign, Users, MapPin, Briefcase } from 'lucide-react';
import { useUserContext, type UserCriteria } from '@/contexts/user-context';

interface EligibilityFilterProps {
  onFilterChange?: (criteria: UserCriteria) => void;
  showPresets?: boolean;
}

// Filter preset templates
const FILTER_PRESETS = [
  {
    id: 'ibu-rumah-tangga',
    name: 'Ibu Rumah Tangga dengan Anak',
    icon: '👩‍👧‍👦',
    criteria: {
      occupation: 'Ibu Rumah Tangga',
      hasChildren: true,
      childrenCount: 2,
      income: 1500000,
    }
  },
  {
    id: 'pekerja-informal',
    name: 'Pekerja Informal',
    icon: '👷',
    criteria: {
      occupation: 'Pekerja Informal',
      income: 2000000,
      housingStatus: 'rent' as const,
    }
  },
  {
    id: 'lansia',
    name: 'Lansia',
    icon: '👴',
    criteria: {
      age: 65,
      income: 1000000,
    }
  },
  {
    id: 'petani',
    name: 'Petani',
    icon: '🌾',
    criteria: {
      occupation: 'Petani',
      landSize: 0.5,
      income: 1800000,
    }
  }
];

export function EligibilityFilter({ onFilterChange, showPresets = true }: EligibilityFilterProps) {
  const { userCriteria, updateUserCriteria } = useUserContext();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showConditionalFields, setShowConditionalFields] = useState(false);

  // Update filter and notify parent
  const handleCriteriaUpdate = (updates: Partial<UserCriteria>) => {
    const newCriteria = { ...userCriteria, ...updates };
    updateUserCriteria(updates);
    onFilterChange?.(newCriteria);

    // Show conditional fields based on occupation
    if (updates.occupation === 'Petani') {
      setShowConditionalFields(true);
    } else if (updates.occupation && updates.occupation !== 'Petani') {
      setShowConditionalFields(false);
    }
  };

  // Apply preset template
  const applyPreset = (criteria: UserCriteria) => {
    updateUserCriteria(criteria);
    onFilterChange?.({ ...userCriteria, ...criteria });
    
    // Show conditional fields if needed
    if (criteria.occupation === 'Petani') {
      setShowConditionalFields(true);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    updateUserCriteria({
      income: undefined,
      familySize: undefined,
      location: undefined,
      occupation: undefined,
      hasChildren: undefined,
      childrenCount: undefined,
      hasDisability: undefined,
      isPregnant: undefined,
      age: undefined,
      landSize: undefined,
      cropType: undefined,
      hasElectricity: undefined,
      housingStatus: undefined,
      educationLevel: undefined,
    });
    onFilterChange?.({});
    setShowConditionalFields(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Filter Kelayakan</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Presets */}
        {showPresets && (
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Template Cepat
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {FILTER_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 flex flex-col items-start gap-1"
                  onClick={() => applyPreset(preset.criteria)}
                >
                  <span className="text-lg">{preset.icon}</span>
                  <span className="text-xs font-medium">{preset.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Basic Filters */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Penghasilan per Bulan (Rp)
            </Label>
            <Input
              id="income"
              type="number"
              placeholder="contoh: 2000000"
              value={userCriteria.income || ''}
              onChange={(e) => handleCriteriaUpdate({ 
                income: e.target.value ? Number(e.target.value) : undefined 
              })}
            />
            {userCriteria.income && (
              <Badge variant="secondary" className="text-xs">
                Rp {userCriteria.income.toLocaleString('id-ID')}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="familySize" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Jumlah Anggota Keluarga
            </Label>
            <Input
              id="familySize"
              type="number"
              placeholder="contoh: 4"
              value={userCriteria.familySize || ''}
              onChange={(e) => handleCriteriaUpdate({ 
                familySize: e.target.value ? Number(e.target.value) : undefined 
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="province" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Provinsi
            </Label>
            <Input
              id="province"
              placeholder="contoh: Jawa Barat"
              value={userCriteria.location?.province || ''}
              onChange={(e) => handleCriteriaUpdate({ 
                location: { 
                  ...userCriteria.location, 
                  province: e.target.value 
                } 
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Kota/Kabupaten
            </Label>
            <Input
              id="city"
              placeholder="contoh: Bandung"
              value={userCriteria.location?.city || ''}
              onChange={(e) => handleCriteriaUpdate({ 
                location: { 
                  ...userCriteria.location, 
                  city: e.target.value 
                } 
              })}
            />
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Sembunyikan Detail
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Tambah Detail
            </>
          )}
        </Button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="occupation" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Pekerjaan
              </Label>
              <Select
                value={userCriteria.occupation || ''}
                onValueChange={(value) => handleCriteriaUpdate({ occupation: value || undefined })}
              >
                <SelectTrigger id="occupation">
                  <SelectValue placeholder="Pilih pekerjaan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ibu Rumah Tangga">Ibu Rumah Tangga</SelectItem>
                  <SelectItem value="Pekerja Informal">Pekerja Informal</SelectItem>
                  <SelectItem value="Buruh">Buruh</SelectItem>
                  <SelectItem value="Petani">Petani</SelectItem>
                  <SelectItem value="Nelayan">Nelayan</SelectItem>
                  <SelectItem value="Pedagang Kecil">Pedagang Kecil</SelectItem>
                  <SelectItem value="Pensiunan">Pensiunan</SelectItem>
                  <SelectItem value="Tidak Bekerja">Tidak Bekerja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Usia</Label>
              <Input
                id="age"
                type="number"
                placeholder="contoh: 35"
                value={userCriteria.age || ''}
                onChange={(e) => handleCriteriaUpdate({ 
                  age: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hasChildren">Status Anak</Label>
              <Select
                value={userCriteria.hasChildren === undefined ? '' : String(userCriteria.hasChildren)}
                onValueChange={(value) => handleCriteriaUpdate({ 
                  hasChildren: value === 'true' 
                })}
              >
                <SelectTrigger id="hasChildren">
                  <SelectValue placeholder="Punya anak?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Punya Anak</SelectItem>
                  <SelectItem value="false">Tidak Punya Anak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userCriteria.hasChildren && (
              <div className="space-y-2">
                <Label htmlFor="childrenCount">Jumlah Anak</Label>
                <Input
                  id="childrenCount"
                  type="number"
                  placeholder="contoh: 2"
                  value={userCriteria.childrenCount || ''}
                  onChange={(e) => handleCriteriaUpdate({ 
                    childrenCount: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="housingStatus">Status Tempat Tinggal</Label>
              <Select
                value={userCriteria.housingStatus || ''}
                onValueChange={(value: any) => handleCriteriaUpdate({ housingStatus: value })}
              >
                <SelectTrigger id="housingStatus">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="own">Milik Sendiri</SelectItem>
                  <SelectItem value="rent">Sewa/Kontrak</SelectItem>
                  <SelectItem value="family">Milik Keluarga</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hasDisability">Disabilitas</Label>
              <Select
                value={userCriteria.hasDisability === undefined ? '' : String(userCriteria.hasDisability)}
                onValueChange={(value) => handleCriteriaUpdate({ 
                  hasDisability: value === 'true' 
                })}
              >
                <SelectTrigger id="hasDisability">
                  <SelectValue placeholder="Ada anggota keluarga disabilitas?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ya</SelectItem>
                  <SelectItem value="false">Tidak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Fields for Agriculture */}
            {showConditionalFields && userCriteria.occupation === 'Petani' && (
              <>
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="landSize" className="text-xs text-muted-foreground">
                    Khusus Petani
                  </Label>
                  <Label htmlFor="landSize">Luas Lahan (hektar)</Label>
                  <Input
                    id="landSize"
                    type="number"
                    step="0.1"
                    placeholder="contoh: 0.5"
                    value={userCriteria.landSize || ''}
                    onChange={(e) => handleCriteriaUpdate({ 
                      landSize: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cropType">Jenis Tanaman</Label>
                  <Select
                    value={userCriteria.cropType || ''}
                    onValueChange={(value) => handleCriteriaUpdate({ cropType: value || undefined })}
                  >
                    <SelectTrigger id="cropType">
                      <SelectValue placeholder="Pilih jenis tanaman" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Padi">Padi</SelectItem>
                      <SelectItem value="Jagung">Jagung</SelectItem>
                      <SelectItem value="Sayuran">Sayuran</SelectItem>
                      <SelectItem value="Buah">Buah-buahan</SelectItem>
                      <SelectItem value="Kopi">Kopi</SelectItem>
                      <SelectItem value="Kelapa Sawit">Kelapa Sawit</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}

        {/* Warning about data privacy */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          ⚠️ <strong>Perhatian:</strong> Jangan bagikan URL dengan informasi pribadi Anda ke orang lain.
          Filter ini hanya untuk membantu Anda menemukan program yang sesuai.
        </div>
      </CardContent>
    </Card>
  );
}
