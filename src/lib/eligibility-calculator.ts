/**
 * Eligibility Calculator - Determines program eligibility based on user criteria
 * 
 * Calculates eligibility status and provides gap analysis for ineligible programs
 */

import type { UserCriteria } from '@/contexts/user-context';
import type { SocialProgram, EligibilityResult } from '@/components/marketplace/program-card';

export function calculateEligibility(
  program: SocialProgram,
  criteria: UserCriteria
): EligibilityResult {
  const matchedRequirements: string[] = [];
  const unmatchedRequirements: string[] = [];
  const missingInformation: string[] = [];
  let gapAnalysis: EligibilityResult['gapAnalysis'];

  // Check income requirement
  if (program.requirements.maxIncome !== undefined) {
    if (criteria.income === undefined) {
      missingInformation.push('Penghasilan per bulan');
    } else if (criteria.income <= program.requirements.maxIncome) {
      matchedRequirements.push(`Penghasilan ≤ Rp ${program.requirements.maxIncome.toLocaleString('id-ID')}`);
    } else {
      unmatchedRequirements.push(`Penghasilan ≤ Rp ${program.requirements.maxIncome.toLocaleString('id-ID')}`);
      gapAnalysis = {
        field: 'Penghasilan',
        currentValue: criteria.income,
        requiredValue: program.requirements.maxIncome,
        difference: criteria.income - program.requirements.maxIncome,
      };
    }
  }

  // Check age requirement
  if (program.requirements.minAge !== undefined || program.requirements.maxAge !== undefined) {
    if (criteria.age === undefined) {
      missingInformation.push('Usia');
    } else {
      let ageMatches = true;
      
      if (program.requirements.minAge !== undefined && criteria.age < program.requirements.minAge) {
        ageMatches = false;
        unmatchedRequirements.push(`Usia minimal ${program.requirements.minAge} tahun`);
      }
      
      if (program.requirements.maxAge !== undefined && criteria.age > program.requirements.maxAge) {
        ageMatches = false;
        unmatchedRequirements.push(`Usia maksimal ${program.requirements.maxAge} tahun`);
      }
      
      if (ageMatches) {
        if (program.requirements.minAge && program.requirements.maxAge) {
          matchedRequirements.push(
            `Usia ${program.requirements.minAge}-${program.requirements.maxAge} tahun`
          );
        } else if (program.requirements.minAge) {
          matchedRequirements.push(`Usia ≥ ${program.requirements.minAge} tahun`);
        } else if (program.requirements.maxAge) {
          matchedRequirements.push(`Usia ≤ ${program.requirements.maxAge} tahun`);
        }
      }
    }
  }

  // Check children requirement
  if (program.requirements.hasChildren !== undefined) {
    if (criteria.hasChildren === undefined) {
      missingInformation.push('Status memiliki anak');
    } else if (criteria.hasChildren === program.requirements.hasChildren) {
      matchedRequirements.push(
        program.requirements.hasChildren ? 'Memiliki anak' : 'Tidak memiliki anak'
      );
      
      // Check minimum children count if required
      if (program.requirements.minChildren !== undefined && criteria.hasChildren) {
        if (criteria.childrenCount === undefined) {
          missingInformation.push('Jumlah anak');
        } else if (criteria.childrenCount >= program.requirements.minChildren) {
          matchedRequirements.push(`Minimal ${program.requirements.minChildren} anak`);
        } else {
          unmatchedRequirements.push(`Minimal ${program.requirements.minChildren} anak`);
        }
      }
    } else {
      unmatchedRequirements.push(
        program.requirements.hasChildren ? 'Harus memiliki anak' : 'Tidak boleh memiliki anak'
      );
    }
  }

  // Check disability requirement
  if (program.requirements.hasDisability !== undefined) {
    if (criteria.hasDisability === undefined) {
      missingInformation.push('Status disabilitas');
    } else if (criteria.hasDisability === program.requirements.hasDisability) {
      matchedRequirements.push(
        program.requirements.hasDisability 
          ? 'Ada anggota keluarga dengan disabilitas' 
          : 'Tidak ada disabilitas'
      );
    } else {
      unmatchedRequirements.push(
        program.requirements.hasDisability 
          ? 'Harus memiliki anggota keluarga dengan disabilitas'
          : 'Program untuk non-disabilitas'
      );
    }
  }

  // Check pregnancy requirement
  if (program.requirements.isPregnant !== undefined) {
    if (criteria.isPregnant === undefined) {
      missingInformation.push('Status kehamilan');
    } else if (criteria.isPregnant === program.requirements.isPregnant) {
      matchedRequirements.push(
        program.requirements.isPregnant ? 'Ibu hamil' : 'Tidak hamil'
      );
    } else {
      unmatchedRequirements.push(
        program.requirements.isPregnant ? 'Hanya untuk ibu hamil' : 'Tidak untuk ibu hamil'
      );
    }
  }

  // Check occupation requirement
  if (program.requirements.occupation && program.requirements.occupation.length > 0) {
    if (!criteria.occupation) {
      missingInformation.push('Pekerjaan');
    } else if (program.requirements.occupation.includes(criteria.occupation)) {
      matchedRequirements.push(`Pekerjaan: ${criteria.occupation}`);
    } else {
      unmatchedRequirements.push(
        `Pekerjaan harus: ${program.requirements.occupation.join(', ')}`
      );
    }
  }

  // Determine overall eligibility status
  let status: EligibilityResult['status'];

  if (unmatchedRequirements.length > 0) {
    status = 'ineligible';
  } else if (missingInformation.length > 0) {
    status = 'partial';
  } else if (matchedRequirements.length === 0) {
    // No structured requirements to check — we can't determine eligibility
    // automatically. Show as "partial" with a hint to read the full criteria.
    status = 'partial';
    missingInformation.push('Kriteria eligibility belum tersedia secara terstruktur');
  } else {
    status = 'eligible';
  }

  return {
    status,
    matchedRequirements,
    unmatchedRequirements,
    missingInformation,
    gapAnalysis,
  };
}

/**
 * Sort programs by eligibility status (eligible first, then partial, then ineligible)
 */
export function sortProgramsByEligibility(
  programs: Array<{ program: SocialProgram; eligibility: EligibilityResult }>
): Array<{ program: SocialProgram; eligibility: EligibilityResult }> {
  const statusOrder = { eligible: 0, partial: 1, ineligible: 2 };
  
  return [...programs].sort((a, b) => {
    return statusOrder[a.eligibility.status] - statusOrder[b.eligibility.status];
  });
}
