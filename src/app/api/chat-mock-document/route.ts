/**
 * Mock Chat API Route - Document Request Scenario
 * 
 * Tests direct Auto-Birokrasi link when user asks for documents/SKTM
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
        'Tentu! ',
        'Saya ',
        'bisa ',
        'membantu ',
        'Anda ',
        'membuat ',
        'SKTM ',
        '(Surat ',
        'Keterangan ',
        'Tidak ',
        'Mampu) ',
        'secara ',
        'otomatis.\n\n',
        'Silakan ',
        'klik ',
        'tombol ',
        '"Buat ',
        'Dokumen ',
        'Sekarang" ',
        'di ',
        'bawah ',
        'ini. ',
        'Fitur ',
        'Auto-Birokrasi ',
        'akan ',
        'membantu ',
        'Anda ',
        'mengisi ',
        'formulir ',
        'secara ',
        'otomatis ',
        'berdasarkan ',
        'data ',
        'yang ',
        'Anda ',
        'berikan.',
      ];
      
      for (const chunk of textChunks) {
        writer.write({
          type: 'text-delta',
          id: messageId,
          delta: chunk,
        });
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // DIRECT AUTO-BIROKRASI LINK (single primary button)
      writer.write({
        type: 'data-actions',
        data: {
          actions: [
            {
              type: 'auto-birokrasi',
              label: '📄 Buat Dokumen Sekarang',
              href: '/auto-birokrasi?documents=sktm&program=general',
              description: 'Generate SKTM otomatis dengan AI - hanya butuh 2 menit',
              documentType: 'sktm',
              programId: 'general',
            },
          ],
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Citation for reference (what is SKTM)
      writer.write({
        type: 'data-citation',
        data: {
          sectionLabel: 'Referensi',
          citations: [
            {
              type: 'rag-document',
              title: 'Template SKTM',
              source: 'document-templates',
              recordId: 'sktm',
              snippet: 'Surat Keterangan Tidak Mampu digunakan untuk mengajukan bantuan sosial...',
            },
          ],
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // NO PROGRAM CARDS (they just want documents)
      // NO NEXT STEPS (button is the only step they need)
      
      // End text
      writer.write({ type: 'text-end', id: messageId });
      writer.write({ type: 'finish', finishReason: 'stop' });
    },
  });
  
  return createUIMessageStreamResponse({ stream });
}
