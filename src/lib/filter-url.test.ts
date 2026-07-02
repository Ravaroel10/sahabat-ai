/**
 * Tests for filter-url encoder/decoder.
 *
 * Tasks covered: 15.3 (unit test filter URL encoding/decoding) and the
 * invalid-input branch of 14.5.
 */

import { encodeFilterParams, parseFilterParams } from './filter-url';
import type { UserCriteria } from '@/contexts/user-context';

describe('filter-url', () => {
  describe('encodeFilterParams', () => {
    it('serializes numeric fields as strings', () => {
      const params = encodeFilterParams({ income: 1500000, age: 35 });
      expect(params.get('income')).toBe('1500000');
      expect(params.get('age')).toBe('35');
    });

    it('omits empty / undefined fields', () => {
      const params = encodeFilterParams({ occupation: 'Petani' });
      expect(params.has('income')).toBe(false);
      expect(params.get('occupation')).toBe('Petani');
    });

    it('serializes location nested fields with explicit keys', () => {
      const params = encodeFilterParams({
        location: { province: 'Jawa Barat', city: 'Bandung' },
      });
      expect(params.get('province')).toBe('Jawa Barat');
      expect(params.get('city')).toBe('Bandung');
    });

    it('drops negative or non-finite numbers', () => {
      const params = encodeFilterParams({ income: -100, age: NaN });
      expect(params.has('income')).toBe(false);
      expect(params.has('age')).toBe(false);
    });
  });

  describe('parseFilterParams', () => {
    it('parses numeric filters with NaN guard', () => {
      const params = new URLSearchParams('income=abc&familySize=4&age=-1');
      const out = parseFilterParams(params);
      expect(out.income).toBeUndefined();
      expect(out.familySize).toBe(4);
      expect(out.age).toBeUndefined();
    });

    it('parses string and location fields', () => {
      const params = new URLSearchParams(
        'occupation=Petani&province=Jawa%20Barat&city=Bandung',
      );
      const out = parseFilterParams(params);
      expect(out.occupation).toBe('Petani');
      expect(out.location?.province).toBe('Jawa Barat');
      expect(out.location?.city).toBe('Bandung');
    });

    it('returns an empty object when no recognized keys are present', () => {
      const params = new URLSearchParams('greeting=hello');
      expect(parseFilterParams(params)).toEqual({});
    });

    it('never throws on null/undefined-shaped input', () => {
      expect(() => parseFilterParams(undefined as unknown as URLSearchParams)).not.toThrow();
      expect(() => parseFilterParams(null as unknown as URLSearchParams)).not.toThrow();
    });
  });

  describe('roundtrip', () => {
    it('encoded then parsed yields equivalent criteria', () => {
      const original: Partial<UserCriteria> = {
        income: 2000000,
        familySize: 4,
        occupation: 'Petani',
        landSize: 0.5,
        location: { province: 'Jawa Tengah', city: 'Solo' },
      };
      const encoded = encodeFilterParams(original);
      const decoded = parseFilterParams(encoded);
      expect(decoded.income).toBe(original.income);
      expect(decoded.familySize).toBe(original.familySize);
      expect(decoded.occupation).toBe(original.occupation);
      expect(decoded.landSize).toBe(original.landSize);
      expect(decoded.location?.province).toBe(original.location?.province);
      expect(decoded.location?.city).toBe(original.location?.city);
    });
  });
});
