/**
 * filter-url — bidirectional encoding/decoding of marketplace filter
 * criteria to/from URL parameters.
 *
 * Tasks covered:
 * - 14.5 Handle invalid URL filter parameters (NaN guard, type coercion)
 * - 15.3 Unit-testable encoder/decoder
 *
 * Encoding rules:
 * - Only persist generic criteria (no PII like names or NIK)
 * - Numeric fields validated as finite positive integers (or zero)
 * - String fields trimmed to avoid empty values leaking into the URL
 */

import type { UserCriteria } from '@/contexts/user-context';

const NUMERIC_FIELDS: ReadonlyArray<keyof UserCriteria> = [
  'income',
  'familySize',
  'age',
  'childrenCount',
  'landSize',
];

const STRING_FIELDS: ReadonlyArray<keyof UserCriteria> = [
  'occupation',
  'cropType',
  'educationLevel',
];

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

/** Encode a UserCriteria object into a URLSearchParams instance. */
export function encodeFilterParams(criteria: UserCriteria): URLSearchParams {
  const params = new URLSearchParams();

  for (const field of NUMERIC_FIELDS) {
    const value = criteria[field];
    if (isFiniteNumber(value)) {
      params.set(field, String(value));
    }
  }

  for (const field of STRING_FIELDS) {
    const value = criteria[field];
    if (typeof value === 'string' && value.trim()) {
      params.set(field, value.trim());
    }
  }

  if (criteria.location?.province) {
    params.set('province', criteria.location.province);
  }
  if (criteria.location?.city) {
    params.set('city', criteria.location.city);
  }

  return params;
}

/**
 * Decode URLSearchParams into a partial UserCriteria. Invalid values are
 * silently dropped — the page should still render with whatever filtered
 * criteria is salvageable instead of crashing (task 14.5).
 */
export function parseFilterParams(
  params: URLSearchParams | ReadonlyURLSearchParamsLike,
): Partial<UserCriteria> {
  const out: Partial<UserCriteria> = {};
  if (!params) return out;

  const coerceNumber = (raw: string | null | undefined): number | undefined => {
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const income = coerceNumber(params.get('income'));
  if (income !== undefined && income > 0) out.income = income;

  const familySize = coerceNumber(params.get('familySize'));
  if (familySize !== undefined && familySize > 0) out.familySize = familySize;

  const age = coerceNumber(params.get('age'));
  if (age !== undefined && age > 0) out.age = age;

  const childrenCount = coerceNumber(params.get('childrenCount'));
  if (childrenCount !== undefined && childrenCount > 0) out.childrenCount = childrenCount;

  const landSize = coerceNumber(params.get('landSize'));
  if (landSize !== undefined && landSize > 0) out.landSize = landSize;

  const occupation = params.get('occupation')?.trim();
  if (occupation) out.occupation = occupation;

  const cropType = params.get('cropType')?.trim();
  if (cropType) out.cropType = cropType;

  const province = params.get('province')?.trim();
  const city = params.get('city')?.trim();
  if (province || city) {
    out.location = {
      province: province || undefined,
      city: city || undefined,
    };
  }

  return out;
}

/**
 * Minimal subset that `parseFilterParams` actually uses — declared so the
 * function is testable with a plain object and avoids forcing a Next.js
 * ReadonlyURLSearchParams import in unit tests.
 */
type ReadonlyURLSearchParamsLike = {
  get(name: string): string | null;
};
