/**
 * Mock Chat API Route - For testing rich message parts
 * 
 * This endpoint returns fake data to test the frontend rendering
 * of program cards, citations, emergency alerts, etc.
 * 
 * Usage: Temporarily change unified-chat-interface.tsx to use '/api/chat-mock'
 */

import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

export const maxDuration = 50;

export async function POST() {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const messageId = crypto.randomUUID();
      
      // Start text message
      writer.write({ type: 'text-start', id: messageId });
      
      // Simulate streaming text
      const textChunks = [
        'Berdasarkan ',
        'situasi ',
        'Anda ',
        'sebagai ',
        'buruh ',
        'bangunan ',
        'dengan ',
        'penghasilan ',
        'Rp 1,5 juta/bulan ',
        'dan ',
        '3 anak ',
        'sekolah, ',
        'Anda ',
        'memenuhi ',
        'syarat ',
        'untuk ',
        'program-program ',
        'berikut:\n\n',
      ];
      
      for (const chunk of textChunks) {
        writer.write({
          type: 'text-delta',
          id: messageId,
          delta: chunk,
        });
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      // Emit first program card (PKH)
      writer.write({
        type: 'data-program',
        data: {
          program: {
            id: 'pkh',
            name: 'Program Keluarga Harapan (PKH)',
            description: 'Bantuan tunai bersyarat untuk keluarga miskin dan rentan yang terdaftar dalam Data Terpadu Kesejahteraan Sosial (DTKS).',
            eligibilityCriteria: [
              'Keluarga terdaftar dalam DTKS',
              'Memiliki komponen kesehatan, pendidikan, atau kesejahteraan sosial',
              'Penghasilan di bawah garis kemiskinan',
            ],
            benefits: 'Rp 3.000.000/tahun per keluarga',
            regulations: ['Permensos No. 1/2024, Pasal 5'],
          },
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Emit second program card (KIP)
      writer.write({
        type: 'data-program',
        data: {
          program: {
            id: 'kip',
            name: 'Kartu Indonesia Pintar (KIP)',
            description: 'Bantuan pendidikan untuk anak-anak dari keluarga kurang mampu agar dapat terus bersekolah.',
            eligibilityCriteria: [
              'Usia 6-21 tahun',
              'Bersekolah di SD/MI, SMP/MTs, SMA/SMK/MA',
              'Keluarga terdaftar dalam DTKS atau penerima PKH',
            ],
            benefits: 'Rp 1.000.000/tahun per anak (jenjang SMP/MTs)',
            regulations: ['Permendikbud No. 10/2020'],
          },
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Continue text
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '\n\nKedua program ini sangat sesuai dengan kondisi Anda. ',
      });
      
      await new Promise(resolve => setTimeout(resolve, 30));
      
      // Emit citations with mixed types
      writer.write({
        type: 'data-citation',
        data: {
          sectionLabel: 'Sumber Informasi',
          citations: [
            // Regulation citation
            {
              type: 'regulation',
              title: 'Permensos No. 1/2024',
              regulation: 'Permensos No. 1/2024',
              article: 'Pasal 5',
              verse: 'Ayat 2',
              fullCitation: 'Permensos No. 1/2024, Pasal 5, Ayat 2',
            },
            // Website citation
            {
              type: 'website',
              title: 'Program Keluarga Harapan (PKH) - Kemensos',
              domain: 'kemensos.go.id',
              url: 'https://kemensos.go.id/program-keluarga-harapan',
              snippet: 'Program Keluarga Harapan (PKH) adalah program bantuan sosial bersyarat kepada keluarga miskin dan rentan...',
              publishedDate: '2024-01-15',
            },
            // RAG document citation
            {
              type: 'rag-document',
              title: 'PKH - Data Program Bantuan Sosial',
              source: 'programs',
              recordId: 'pkh',
              snippet: 'Bantuan tunai bersyarat untuk keluarga miskin yang terdaftar dalam DTKS...',
              score: 0.92,
            },
            // Institution citation
            {
              type: 'institution-info',
              title: 'Kementerian Sosial RI',
              institutionName: 'Kementerian Sosial Republik Indonesia',
              contact: '021-7854 8000',
              source: 'institutions',
            },
          ],
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Emit action buttons with Auto-Birokrasi
      writer.write({
        type: 'data-actions',
        data: {
          actions: [
            {
              type: 'auto-birokrasi',
              label: '📄 Siapkan Dokumen Otomatis',
              href: '/auto-birokrasi?documents=sktm,surat-permohonan,kk&program=pkh',
              description: 'Generate SKTM, Surat Permohonan, dan dokumen lainnya secara otomatis',
              documentType: 'multiple',
              programId: 'pkh',
            },
            {
              type: 'marketplace',
              label: '📋 Lihat Semua Program di Marketplace',
              href: '/marketplace?income=1500000&children=3',
              description: 'Temukan program lain yang sesuai dengan profil Anda',
            },
            {
              type: 'document-template',
              label: '📝 Download Template Manual',
              href: '/templates/pkh',
              description: 'Download template dokumen untuk diisi manual',
            },
            {
              type: 'external',
              label: '🌐 Website Resmi Kemensos',
              href: 'https://kemensos.go.id',
            },
          ],
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Emit next steps with Auto-Birokrasi integration
      writer.write({
        type: 'data-steps',
        data: {
          steps: [
            '📄 Siapkan dokumen dengan fitur Auto-Birokrasi (klik tombol "Siapkan Dokumen Otomatis" di atas)',
            'Atau siapkan manual: KTP, Kartu Keluarga (KK), dan Surat Keterangan Tidak Mampu (SKTM)',
            'Datang ke Dinas Sosial terdekat dengan membawa dokumen lengkap',
            'Isi formulir pendaftaran dan serahkan ke petugas',
            'Tunggu proses verifikasi selama 7-14 hari kerja',
            'Jika lolos verifikasi, Anda akan dihubungi untuk aktivasi bantuan',
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
