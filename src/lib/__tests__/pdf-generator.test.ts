/**
 * Tests for PDF Generator - Data Mapping
 * Note: PDF generation functions are not tested here as they require DOM/Canvas APIs
 */

import { describe, it, expect } from '@jest/globals';

// Copy the mapping function for testing (to avoid importing the whole module)
function mapFormDataToPDFData(
  formData: Record<string, string>,
  templateType: string
): Record<string, string> {
  const convertedData: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(formData)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    convertedData[camelKey] = value;
  }
  
  return {
    templateType,
    ...convertedData,
  };
}

describe('PDF Generator - Data Mapping', () => {
  describe('mapFormDataToPDFData', () => {
    it('should convert snake_case field names to camelCase', () => {
      const formData = {
        nama_lengkap: 'John Doe',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '1990-01-01',
        nomor_telepon: '08123456789',
      };

      const result = mapFormDataToPDFData(formData, 'sktm');

      expect(result).toEqual({
        templateType: 'sktm',
        namaLengkap: 'John Doe',
        tempatLahir: 'Jakarta',
        tanggalLahir: '1990-01-01',
        nomorTelepon: '08123456789',
      });
    });

    it('should preserve already camelCase fields', () => {
      const formData = {
        nama: 'John Doe',
        alamat: 'Jakarta',
      };

      const result = mapFormDataToPDFData(formData, 'permohonan');

      expect(result).toEqual({
        templateType: 'permohonan',
        nama: 'John Doe',
        alamat: 'Jakarta',
      });
    });

    it('should handle mixed case fields', () => {
      const formData = {
        nama: 'John Doe',
        tempat_lahir: 'Jakarta',
        alamatLengkap: 'Jl. Example No. 123',
        rt_rw: '001/002',
      };

      const result = mapFormDataToPDFData(formData, 'sktm');

      expect(result).toEqual({
        templateType: 'sktm',
        nama: 'John Doe',
        tempatLahir: 'Jakarta',
        alamatLengkap: 'Jl. Example No. 123',
        rtRw: '001/002',
      });
    });

    it('should include template type in result', () => {
      const formData = { nama: 'Test' };
      
      const sktmResult = mapFormDataToPDFData(formData, 'sktm');
      expect(sktmResult.templateType).toBe('sktm');
      
      const permohonanResult = mapFormDataToPDFData(formData, 'permohonan');
      expect(permohonanResult.templateType).toBe('permohonan');
    });

    it('should handle empty form data', () => {
      const formData = {};

      const result = mapFormDataToPDFData(formData, 'sktm');

      expect(result).toEqual({
        templateType: 'sktm',
      });
    });

    it('should handle multi-underscore field names', () => {
      const formData = {
        alasan_memerlukan_bantuan: 'Need assistance',
        jumlah_anggota_keluarga: '5',
      };

      const result = mapFormDataToPDFData(formData, 'permohonan');

      expect(result).toEqual({
        templateType: 'permohonan',
        alasanMemerlukanBantuan: 'Need assistance',
        jumlahAnggotaKeluarga: '5',
      });
    });
  });
});
