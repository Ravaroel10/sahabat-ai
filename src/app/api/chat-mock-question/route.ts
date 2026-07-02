/**
 * Mock Chat API Route - Simple Question Scenario
 * 
 * Tests that simple questions DON'T spam all features
 * (no program cards, no actions, no next steps - just answer the question)
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
        'Program ',
        'Keluarga ',
        'Harapan ',
        '(PKH) ',
        'adalah ',
        'program ',
        'bantuan ',
        'sosial ',
        'bersyarat ',
        'dari ',
        'pemerintah ',
        'Indonesia.\n\n',
        'PKH ',
        'memberikan ',
        'bantuan ',
        'tunai ',
        'kepada ',
        'keluarga ',
        'miskin ',
        'dan ',
        'rentan ',
        'yang ',
        'terdaftar ',
        'dalam ',
        'DTKS. ',
        'Besaran ',
        'bantuan ',
        'sekitar ',
        'Rp 3.000.000 ',
        'per ',
        'tahun ',
        'per ',
        'keluarga.\n\n',
        'Bantuan ',
        'ini ',
        'bersyarat, ',
        'artinya ',
        'penerima ',
        'harus ',
        'memenuhi ',
        'kewajiban ',
        'seperti ',
        'memeriksakan ',
        'kesehatan ',
        'anak ',
        'dan ',
        'memastikan ',
        'anak ',
        'bersekolah.',
      ];
      
      for (const chunk of textChunks) {
        writer.write({
          type: 'text-delta',
          id: messageId,
          delta: chunk,
        });
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // For simple question, ONLY emit citation (source of info)
      // NO program cards, NO actions, NO next steps
      writer.write({
        type: 'data-citation',
        data: {
          sectionLabel: 'Sumber Informasi',
          citations: [
            {
              type: 'regulation',
              title: 'Permensos No. 1/2024',
              regulation: 'Permensos No. 1/2024',
              fullCitation: 'Permensos No. 1/2024 tentang Program Keluarga Harapan',
            },
            {
              type: 'website',
              title: 'Program Keluarga Harapan - Kemensos',
              domain: 'kemensos.go.id',
              url: 'https://kemensos.go.id/program-keluarga-harapan',
              snippet: 'PKH adalah program bantuan sosial bersyarat...',
            },
          ],
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // End text - NO ACTIONS, NO NEXT STEPS
      // Let them ask follow-up naturally!
      writer.write({ type: 'text-end', id: messageId });
      writer.write({ type: 'finish', finishReason: 'stop' });
    },
  });
  
  return createUIMessageStreamResponse({ stream });
}
