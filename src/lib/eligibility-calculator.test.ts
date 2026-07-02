/**
 * Tests for eligibility-calculator.
 *
 * Task 15.2: unit tests for eligibility calculation logic. Focused on the
 * status decision (eligible / ineligible / partial) and the gap analysis
 * output, since those drive marketplace UX.
 */

import { calculateEligibility, sortProgramsByEligibility } from './eligibility-calculator';
import type { SocialProgram } from '@/components/marketplace/program-card';

const baseProgram: SocialProgram = {
  id: 'pkh',
  name: 'Program Keluarga Harapan',
  shortName: 'PKH',
  description: '',
  category: 'cash',
  provider: 'Kemensos',
  benefits: [],
  requirements: {
    maxIncome: 2_000_000,
    minAge: 18,
    maxAge: 60,
    hasChildren: true,
  },
};

describe('calculateEligibility', () => {
  it('marks a program eligible when every requirement matches', () => {
    const result = calculateEligibility(baseProgram, {
      income: 1_500_000,
      age: 35,
      hasChildren: true,
    });
    expect(result.status).toBe('eligible');
    expect(result.unmatchedRequirements).toHaveLength(0);
    expect(result.missingInformation).toHaveLength(0);
  });

  it('marks a program ineligible with a gap analysis when income is too high', () => {
    const result = calculateEligibility(baseProgram, {
      income: 2_500_000,
      age: 35,
      hasChildren: true,
    });
    expect(result.status).toBe('ineligible');
    expect(result.gapAnalysis?.field).toBe('Penghasilan');
    expect(result.gapAnalysis?.difference).toBe(500_000);
  });

  it('marks a program partial when some required info is missing', () => {
    const result = calculateEligibility(baseProgram, { income: 1_500_000 });
    expect(result.status).toBe('partial');
    expect(result.missingInformation.length).toBeGreaterThan(0);
  });

  it('falls back to partial for programs with no structured requirements', () => {
    const vague: SocialProgram = {
      ...baseProgram,
      requirements: {},
    };
    const result = calculateEligibility(vague, { income: 1_500_000 });
    expect(result.status).toBe('partial');
    expect(result.missingInformation).toContain(
      'Kriteria eligibility belum tersedia secara terstruktur',
    );
  });
});

describe('sortProgramsByEligibility', () => {
  it('orders results eligible → partial → ineligible', () => {
    const programs = [
      { program: { ...baseProgram, id: 'a' }, eligibility: { status: 'ineligible' as const, matchedRequirements: [], unmatchedRequirements: ['x'], missingInformation: [] } },
      { program: { ...baseProgram, id: 'b' }, eligibility: { status: 'eligible' as const, matchedRequirements: ['x'], unmatchedRequirements: [], missingInformation: [] } },
      { program: { ...baseProgram, id: 'c' }, eligibility: { status: 'partial' as const, matchedRequirements: [], unmatchedRequirements: [], missingInformation: ['x'] } },
    ];
    const sorted = sortProgramsByEligibility(programs);
    expect(sorted.map(({ program }) => program.id)).toEqual(['b', 'c', 'a']);
  });
});
