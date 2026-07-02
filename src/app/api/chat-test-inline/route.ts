/**
 * Test Route for Inline Program Cards
 * 
 * This route simulates an LLM response with inline program markers
 * to verify that the frontend correctly renders cards within text flow.
 * 
 * Usage: Temporarily change the API URL in unified-chat-interface.tsx to /api/chat-test-inline
 */

import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

export async function POST() {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const messageId = crypto.randomUUID();
      
      // Simulate delay
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Start text part 1
      writer.write({ type: 'text-start', id: messageId });
      
      await delay(100);
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: 'Berdasarkan situasi Anda sebagai buruh dengan 3 anak sekolah, saya rekomendasikan 2 program utama:\n\n',
      });
      
      await delay(100);
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '**1. Program Keluarga Harapan (PKH)**\n\n',
      });
      
      // End text part 1 before inline card
      writer.write({ type: 'text-end', id: messageId });
      
      await delay(200);
      
      // Inline program card 1
      writer.write({
        type: 'data-program-inline',
        data: {
          program_id: 'pkh',
          program: {
            id: 'pkh',
            name: 'Program Keluarga Harapan',
            description: 'Bantuan tunai bersyarat untuk keluarga miskin dengan anak sekolah, ibu hamil/menyusui, atau lansia',
            benefits: 'Rp 550.000 - Rp 3.000.000 per keluarga per tahun',
            eligibilityCriteria: [
              'Keluarga miskin/rentan miskin',
              'Punya anak sekolah, balita, ibu hamil/menyusui, atau lansia',
              'Terdaftar di DTKS (Data Terpadu Kesejahteraan Sosial)',
            ],
            regulations: ['Permensos No. 1/2024'],
          },
        },
      });
      
      await delay(200);
      
      // Start text part 2 after inline card
      writer.write({ type: 'text-start', id: messageId });
      
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '\n\nProgram ini cocok karena Anda memiliki 3 anak usia sekolah. Bantuan diberikan per tahun dengan komponen untuk setiap anak.\n\n',
      });
      
      await delay(100);
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '**2. Kartu Indonesia Pintar (KIP)**\n\n',
      });
      
      // End text part 2 before inline card
      writer.write({ type: 'text-end', id: messageId });
      
      await delay(200);
      
      // Inline program card 2
      writer.write({
        type: 'data-program-inline',
        data: {
          program_id: 'kip',
          program: {
            id: 'kip',
            name: 'Kartu Indonesia Pintar',
            description: 'Bantuan pendidikan untuk siswa dari keluarga miskin, mulai dari SD hingga SMA/SMK',
            benefits: 'Rp 450.000 (SD), Rp 750.000 (SMP), Rp 1.000.000 (SMA/SMK) per tahun per anak',
            eligibilityCriteria: [
              'Siswa dari keluarga miskin/rentan miskin',
              'Terdaftar di DTKS',
              'Siswa aktif di sekolah',
            ],
            regulations: ['Permendikbud No. 10/2022'],
          },
        },
      });
      
      await delay(200);
      
      // Start text part 3 after inline card
      writer.write({ type: 'text-start', id: messageId });
      
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '\n\nKIP memberikan bantuan langsung untuk biaya pendidikan. Setiap anak bisa mendapatkan bantuan sesuai jenjang pendidikannya.\n\n',
      });
      
      await delay(100);
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '## Langkah Selanjutnya:\n\n',
      });
      
      await delay(50);
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '1. **Daftar ke Kelurahan** - Pastikan keluarga Anda sudah terdaftar di DTKS\n',
      });
      
      await delay(50);
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '2. **Hubungi Sekolah** - Tanyakan tentang KIP untuk 3 anak Anda\n',
      });
      
      await delay(50);
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '3. **Siapkan Dokumen** - KTP, Kartu Keluarga, SKTM\n\n',
      });
      
      await delay(100);
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: 'Jika Anda butuh bantuan membuat dokumen:\n\n',
      });
      
      // End text before inline action
      writer.write({ type: 'text-end', id: messageId });
      
      await delay(200);
      
      // Inline action button
      writer.write({
        type: 'data-action-inline',
        data: {
          action_type: 'auto-birokrasi',
        },
      });
      
      await delay(200);
      
      // Start text after inline action
      writer.write({ type: 'text-start', id: messageId });
      
      await delay(50);
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '\n\nUntuk melihat semua program lainnya:\n\n',
      });
      
      // End text before second inline action
      writer.write({ type: 'text-end', id: messageId });
      
      await delay(200);
      
      // Second inline action button
      writer.write({
        type: 'data-action-inline',
        data: {
          action_type: 'marketplace',
        },
      });
      
      await delay(200);
      
      // Start final text
      writer.write({ type: 'text-start', id: messageId });
      
      await delay(50);
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: '\n\nSemoga membantu! 🙏',
      });
      
      // End text part 3
      writer.write({ type: 'text-end', id: messageId });
      
      await delay(100);
      
      // Emit reference cards (metadata)
      writer.write({
        type: 'data-program',
        data: {
          program: {
            id: 'pkh',
            name: 'Program Keluarga Harapan',
            description: 'Bantuan tunai bersyarat untuk keluarga miskin',
            benefits: 'Rp 550.000 - 3.000.000/tahun',
            eligibilityCriteria: [
              'Keluarga miskin/rentan miskin',
              'Punya anak sekolah/balita/ibu hamil/lansia',
              'Terdaftar di DTKS',
            ],
            regulations: ['Permensos No. 1/2024'],
            eligibilityStatus: 'eligible' as const,
          },
        },
      });
      
      writer.write({
        type: 'data-program',
        data: {
          program: {
            id: 'kip',
            name: 'Kartu Indonesia Pintar',
            description: 'Bantuan pendidikan untuk siswa dari keluarga miskin',
            benefits: 'Rp 450.000 - 1.000.000/tahun per anak',
            eligibilityCriteria: [
              'Siswa dari keluarga miskin',
              'Terdaftar di DTKS',
              'Siswa aktif di sekolah',
            ],
            regulations: ['Permendikbud No. 10/2022'],
            eligibilityStatus: 'eligible' as const,
          },
        },
      });
      
      // Finish
      writer.write({ type: 'finish', finishReason: 'stop' });
    },
  });
  
  return createUIMessageStreamResponse({ stream });
}
