/**
 * Mock Chat API Route - Emergency Scenario
 * 
 * Tests emergency alert rendering with immediate action steps
 */

import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

export const maxDuration = 50;

export async function POST() {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const messageId = crypto.randomUUID();
      
      // Emit emergency alert FIRST (highest priority)
      writer.write({
        type: 'data-emergency',
        data: {
          emergency: {
            isEmergency: true,
            type: 'medical' as const,
            keywords: ['jatuh', 'perancah', 'rumah sakit', 'kecelakaan kerja'],
          },
          immediateSteps: [
            'Pastikan korban dalam kondisi aman dan stabil',
            'Hubungi ambulans 119 jika belum dilakukan',
            'Laporkan ke perusahaan tempat bekerja SEGERA',
            'Hubungi BPJS Ketenagakerjaan di 1500-410 untuk klaim kecelakaan kerja',
            'Simpan semua bukti: foto, catatan medis, saksi',
          ],
          contacts: [
            {
              name: 'Ambulans Darurat',
              phone: '119',
              description: 'Layanan ambulans 24 jam',
            },
            {
              name: 'BPJS Ketenagakerjaan',
              phone: '1500-410',
              description: 'Klaim kecelakaan kerja dan Jaminan Kecelakaan Kerja (JKK)',
            },
            {
              name: 'Posko Kesehatan Kemenkes',
              phone: '021-5210411',
              description: 'Konsultasi medis dan rujukan',
            },
          ],
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start text message
      writer.write({ type: 'text-start', id: messageId });
      
      const textChunks = [
        'Saya ',
        'memahami ',
        'ini ',
        'situasi ',
        'darurat. ',
        'Suami ',
        'Anda ',
        'mengalami ',
        'kecelakaan ',
        'kerja ',
        'yang ',
        'serius. ',
        '\n\n',
        'Selain ',
        'langkah ',
        'darurat ',
        'di ',
        'atas, ',
        'berikut ',
        'bantuan ',
        'yang ',
        'bisa ',
        'Anda ',
        'akses:\n\n',
      ];
      
      for (const chunk of textChunks) {
        writer.write({
          type: 'text-delta',
          id: messageId,
          delta: chunk,
        });
        await new Promise(resolve => setTimeout(resolve, 40));
      }
      
      // Emit JKK program
      writer.write({
        type: 'data-program',
        data: {
          program: {
            id: 'jkk',
            name: 'Jaminan Kecelakaan Kerja (JKK)',
            description: 'Perlindungan bagi pekerja yang mengalami kecelakaan kerja atau penyakit akibat kerja, termasuk biaya pengobatan dan santunan.',
            eligibilityCriteria: [
              'Terdaftar sebagai peserta BPJS Ketenagakerjaan',
              'Kecelakaan terjadi saat bekerja atau dalam perjalanan ke/dari tempat kerja',
            ],
            benefits: 'Biaya pengobatan penuh + santunan sementara tidak mampu bekerja + santunan cacat/kematian',
            regulations: ['UU No. 40/2004 tentang SJSN', 'PP No. 44/2015'],
          },
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Emit BSU (if income criteria met)
      writer.write({
        type: 'data-program',
        data: {
          program: {
            id: 'bsu',
            name: 'Bantuan Sosial Darurat (BSU)',
            description: 'Bantuan tunai untuk keluarga yang mengalami musibah atau kondisi darurat yang menyebabkan hilangnya sumber pendapatan.',
            eligibilityCriteria: [
              'Terdampak musibah atau kecelakaan',
              'Kehilangan sumber pendapatan utama',
              'Terdaftar dalam DTKS atau dapat diverifikasi oleh Dinas Sosial',
            ],
            benefits: 'Rp 2.400.000 (bantuan satu kali)',
            regulations: ['Permensos No. 14/2022'],
          },
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Citation with mixed types
      writer.write({
        type: 'data-citation',
        data: {
          sectionLabel: 'Dasar Hukum & Sumber',
          citations: [
            {
              type: 'regulation',
              title: 'UU No. 40/2004',
              regulation: 'UU No. 40/2004',
              fullCitation: 'UU No. 40/2004 tentang Sistem Jaminan Sosial Nasional',
            },
            {
              type: 'regulation',
              title: 'PP No. 44/2015',
              regulation: 'PP No. 44/2015',
              fullCitation: 'PP No. 44/2015 tentang Jaminan Kecelakaan Kerja dan Jaminan Kematian',
            },
            {
              type: 'website',
              title: 'Panduan Klaim JKK - BPJS Ketenagakerjaan',
              domain: 'bpjsketenagakerjaan.go.id',
              url: 'https://www.bpjsketenagakerjaan.go.id/panduan-klaim-jkk',
              snippet: 'Jaminan Kecelakaan Kerja memberikan perlindungan atas risiko kecelakaan yang terjadi dalam hubungan kerja...',
            },
          ],
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Action buttons with Auto-Birokrasi for emergency docs
      writer.write({
        type: 'data-actions',
        data: {
          actions: [
            {
              type: 'auto-birokrasi',
              label: '📄 Siapkan Dokumen Klaim JKK',
              href: '/auto-birokrasi?documents=surat-keterangan-kecelakaan,kronologi,form-klaim-jkk&program=jkk',
              description: 'Generate dokumen klaim kecelakaan kerja secara otomatis',
              documentType: 'jkk-claim',
              programId: 'jkk',
            },
            {
              type: 'external',
              label: '🏥 Cek Status Klaim BPJS TK',
              href: 'https://sso.bpjsketenagakerjaan.go.id',
            },
            {
              type: 'marketplace',
              label: '📋 Program Bantuan Lainnya',
              href: '/marketplace',
            },
          ],
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Next steps with Auto-Birokrasi prioritized
      writer.write({
        type: 'data-steps',
        data: {
          steps: [
            '🚨 PRIORITAS: Pastikan kondisi medis suami Anda stabil dan terpantau',
            'Hubungi HRD/perusahaan untuk melaporkan kecelakaan kerja',
            '📄 Gunakan fitur Auto-Birokrasi untuk menyiapkan dokumen klaim (klik tombol di atas)',
            'Atau siapkan manual: KTP, kartu BPJS TK, kronologi kejadian tertulis',
            'Ajukan klaim JKK ke BPJS Ketenagakerjaan dalam 2x24 jam',
            'Hubungi Dinas Sosial untuk Bantuan Sosial Darurat (BSU)',
            'Simpan semua bukti medis dan biaya untuk klaim',
          ],
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // End text
      writer.write({ type: 'text-end', id: messageId });
      writer.write({ type: 'finish', finishReason: 'stop' });
    },
  });
  
  return createUIMessageStreamResponse({ stream });
}
