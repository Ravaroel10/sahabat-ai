/**
 * Chat API Route - Streaming proxy to the Python AI service
 *
 * Receives the Vercel AI SDK's UIMessage[] format from the client,
 * forwards the request to the Python service's POST /chat endpoint,
 * consumes the Python SSE stream, and re-emits it as a Vercel AI SDK
 * UI message stream that useChat() consumes transparently.
 *
 * Protocol:
 * - Python emits: data: {"type":"token","data":"..."}\n\n
 * - Proxy emits:  Vercel AI SDK text-delta parts via createUIMessageStream
 *
 * If AI_SERVICE_URL is unset, falls back to a configuration error.
 */

import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai';

// Allow streaming responses up to 50 seconds (covers Python orchestration +
// streamed completion). The hard Vercel limit is 60s on Pro.
export const maxDuration = 50;

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

/**
 * Hard timeout for the Python AI service call. Must be safely below
 * `maxDuration` so we have room to emit a graceful error stream.
 * Task 14.1 — surface a friendly message instead of hitting Vercel's edge
 * timeout, which would otherwise produce an opaque 504 to the client.
 */
const PYTHON_FETCH_TIMEOUT_MS = 45_000;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!AI_SERVICE_URL) {
      return new Response(
        JSON.stringify({
          error:
            'Layanan AI belum dikonfigurasi. Hubungi administrator.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Convert UI messages to a simple conversation format for the Python service
    const modelMessages = await convertToModelMessages(messages);

    // Extract the latest user message and prior conversation
    const lastUserMessageIndex = [...modelMessages]
      .map((m) => m.role)
      .lastIndexOf('user');
    const lastUserMessage = lastUserMessageIndex >= 0
      ? modelMessages[lastUserMessageIndex]
      : undefined;

    /** Extract text content from a model message's content field. */
    function extractText(content: unknown): string {
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content
          .map((c: { text?: string }) => c?.text || '')
          .join('');
      }
      return '';
    }

    const conversation = modelMessages.map((m, i) => ({
      role: m.role,
      content: extractText(m.content),
    })).filter((_, i) => i !== lastUserMessageIndex);

    const messageText = lastUserMessage ? extractText(lastUserMessage.content) : '';

    // Forward to the Python AI service with a hard timeout (task 14.1).
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), PYTHON_FETCH_TIMEOUT_MS);

    let pythonResponse: Response;
    try {
      pythonResponse = await fetch(`${AI_SERVICE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversation,
          user_context: null,
        }),
        signal: abort.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      const isAbort =
        fetchError instanceof Error &&
        (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError');
      // eslint-disable-next-line no-console
      console.error(
        isAbort
          ? `Python AI service timed out after ${PYTHON_FETCH_TIMEOUT_MS}ms`
          : 'Python AI service fetch failed:',
        fetchError,
      );
      return new Response(
        JSON.stringify({
          error: isAbort
            ? 'Layanan AI butuh waktu lebih lama dari biasanya. Silakan coba lagi.'
            : 'Tidak dapat menghubungi layanan AI. Periksa koneksi Anda.',
        }),
        {
          status: isAbort ? 504 : 503,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
    clearTimeout(timeout);

    if (!pythonResponse.ok) {
      console.error('Python AI service error:', pythonResponse.status);
      // 14.2 — log + return a friendly fallback. We deliberately don't echo
      // the upstream status to the user.
      return new Response(
        JSON.stringify({
          error:
            'Layanan AI sedang sibuk. Silakan coba lagi dalam beberapa saat.',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!pythonResponse.body) {
      return new Response(
        JSON.stringify({
          error: 'Tidak ada respons dari layanan AI.',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Consume the Python SSE stream and re-emit as Vercel AI SDK UI message stream
    // TODO: Content transformation (formal→conversational, English removal) runs in the
    // Python service's post-processing step but is not applied to the streamed text in
    // this proxy. Users see raw LLM tokens during streaming. A future iteration could
    // emit the transformed text as a final replacement or apply client-side transformation.
    //
    // AbortController wires the proxy's hard timeout into both the upstream
    // fetch and the downstream Vercel SDK stream so we never blow past
    // maxDuration with no signal to the client.
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const reader = pythonResponse.body!.getReader();
        const decoder = new TextDecoder();
        const messageId = crypto.randomUUID();
        let buffer = '';
        let textStarted = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events (separated by blank lines — handle both LF and CRLF)
            const events = buffer.split(/\n\n|\r\n\r\n/);
            buffer = events.pop() || ''; // Keep incomplete event in buffer

            for (const event of events) {
              // Handle multiple data: lines within a single event
              const lines = event.split(/\r?\n/);
              for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine.startsWith('data: ')) continue;

                try {
                  const jsonStr = trimmedLine.slice(6);
                  console.log('[SSE Parse] Attempting to parse:', jsonStr);
                  const data = JSON.parse(jsonStr);

                if (data.type === 'token' && data.data) {
                  // Emit text-start before the first text-delta
                  if (!textStarted) {
                    console.log('[Stream] Emitting text-start');
                    writer.write({ type: 'text-start', id: messageId });
                    textStarted = true;
                  }
                  writer.write({
                    type: 'text-delta',
                    id: messageId,
                    delta: data.data,
                  });
                } else if (data.type === 'metadata') {
                  // Metadata event — transform into rich message parts
                  console.log('[Stream] Received metadata:', data);
                  const metadata = data;
                  
                  // 1. Emit citations if available
                  if (metadata.citations?.length > 0 || metadata.sources?.length > 0) {
                    const citations = [];
                    
                    // Add regulation citations
                    if (metadata.citations?.length > 0) {
                      citations.push(...metadata.citations.map((c: any) => ({
                        type: 'regulation',
                        title: c.regulation || c.fullCitation || 'Peraturan',
                        regulation: c.regulation || '',
                        article: c.article,
                        verse: c.verse,
                        fullCitation: c.fullCitation || c.full_citation || c.regulation || '',
                      })));
                    }
                    
                    // Add web sources as website citations
                    if (metadata.sources?.length > 0) {
                      citations.push(...metadata.sources.map((s: any) => ({
                        type: 'website',
                        title: s.title || 'Sumber Web',
                        domain: s.domain || new URL(s.url || 'https://example.com').hostname,
                        url: s.url,
                        snippet: s.snippet,
                        publishedDate: s.publishedDate || s.published_date,
                      })));
                    }
                    
                    if (citations.length > 0) {
                      writer.write({
                        type: 'data-citation',
                        data: {
                          citations: citations,
                          sectionLabel: 'Referensi'
                        }
                      });
                    }
                  }
                  
                  // 2. Emit emergency alert if detected
                  if (metadata.emergency) {
                    const emergencyData = typeof metadata.emergency === 'object' 
                      ? metadata.emergency 
                      : { isEmergency: true, keywords: [], type: 'medical' };
                    
                    writer.write({
                      type: 'data-emergency',
                      data: {
                        emergency: {
                          isEmergency: true,
                          type: emergencyData.type || 'medical',
                          keywords: emergencyData.keywords || [],
                        },
                        immediateSteps: metadata.immediateSteps || emergencyData.immediateSteps || [
                          'Hubungi layanan darurat segera',
                          'Catat semua informasi penting',
                        ],
                        contacts: metadata.emergencyContacts || emergencyData.contacts || [],
                      },
                    });
                  }
                  
                  // 3. Emit program cards if available
                  if (metadata.programs?.length > 0) {
                    for (const program of metadata.programs) {
                      writer.write({
                        type: 'data-program',
                        data: {
                          program: {
                            id: program.id || '',
                            name: program.name || '',
                            description: program.description || '',
                            eligibilityCriteria: program.eligibilityCriteria || program.eligibility_criteria || [],
                            benefits: program.benefits || '',
                            regulations: program.regulations || [],
                          },
                        },
                      });
                    }
                  }
                  
                  // Also keep the old message-metadata for backward compatibility
                  if (metadata.citations?.length || metadata.sources?.length || metadata.emergency) {
                    writer.write({
                      type: 'message-metadata',
                      messageMetadata: {
                        citations: metadata.citations || [],
                        sources: metadata.sources || [],
                        emergency: metadata.emergency || false,
                      },
                    });
                  }
                } else if (data.type === 'inline-program') {
                  // Inline program card marker - close current text, emit card, start new text
                  const programId = data.program_id;
                  const programData = data.program;
                  
                  if (programId || programData) {
                    // Close current text part if it's open
                    if (textStarted) {
                      writer.write({ type: 'text-end', id: messageId });
                      textStarted = false;
                    }
                    
                    // Emit the inline program card
                    writer.write({
                      type: 'data-program-inline',
                      data: {
                        program_id: programId,
                        program: programData,
                      },
                    });
                    
                    // Start a new text part for content after the card
                    // (will be started on next token if needed)
                  }
                } else if (data.type === 'inline-action') {
                  // Inline action button marker - close current text, emit action, start new text
                  const actionType = data.action_type;
                  
                  if (actionType) {
                    // Close current text part if it's open
                    if (textStarted) {
                      writer.write({ type: 'text-end', id: messageId });
                      textStarted = false;
                    }
                    
                    // Emit the inline action button
                    writer.write({
                      type: 'data-action-inline',
                      data: {
                        action_type: actionType,
                      },
                    });
                    
                    // Start a new text part for content after the action
                    // (will be started on next token if needed)
                  }
                } else if (data.type === 'error') {
                  // Bug 4 fix: don't emit `type: 'error'` — the Vercel AI SDK
                  // treats that as a stream error event that aborts the
                  // message and discards already-streamed text-deltas from
                  // the user's view. Instead, append a graceful error notice
                  // as a text-delta and finish the stream with
                  // finishReason='error'. The user keeps what they already
                  // saw. Mirrors the catch (streamError) pattern below.
                  const errorMessage =
                    data.message || 'Terjadi kesalahan pada layanan AI.';
                  if (!textStarted) {
                    // Inline marker events (inline-program / inline-action)
                    // close the current text part and leave textStarted=false.
                    // Open a fresh text part for the error notice.
                    writer.write({ type: 'text-start', id: messageId });
                    textStarted = true;
                  }
                  writer.write({
                    type: 'text-delta',
                    id: messageId,
                    delta: `\n\n---\n*Maaf, ${errorMessage} Silakan coba lagi.*`,
                  });
                  writer.write({ type: 'text-end', id: messageId });
                  textStarted = false;
                  writer.write({ type: 'finish', finishReason: 'error' });
                } else if (data.type?.startsWith('data-')) {
                  // Forward custom data parts directly from Python
                  // This allows Python to emit data-program, data-citation, etc. directly
                  writer.write(data);
                }
                  // 'done' type — stream is complete, break to finalize
                  if (data.type === 'done') break;
                } catch (parseError) {
                  // Skip malformed SSE events
                  console.error('[SSE parse error] Line:', trimmedLine, 'Error:', parseError);
                }
              } // end for (const line of lines)
            } // end for (const event of events)
          } // end while (true)

          // Emit text-end and finish to close the message lifecycle
          if (textStarted) {
            console.log('[Stream] Emitting text-end');
            writer.write({ type: 'text-end', id: messageId });
          }
          console.log('[Stream] Emitting finish - stream complete');
          writer.write({ type: 'finish', finishReason: 'stop' });
        } catch (streamError) {
          // Handle mid-stream interruption — close the text part gracefully
          console.error('Stream interrupted:', streamError);
          if (textStarted) {
            writer.write({
              type: 'text-delta',
              id: messageId,
              delta: '\n\n---\n*Maaf, koneksi terputus. Silakan coba lagi.*',
            });
            writer.write({ type: 'text-end', id: messageId });
          }
          writer.write({ type: 'finish', finishReason: 'error' });
        }
      },
      onError: (error) => {
        console.error('UI message stream error:', error);
        return 'Terjadi kesalahan saat menghubungi server. Silakan coba lagi.';
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error('Chat API proxy error:', error);

    return new Response(
      JSON.stringify({
        error:
          'Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
