/**
 * Regression-protection tests for `buildErrorStream` in error-stream.ts.
 *
 * Bug 5 fix: the old code returned `502`/`503`/`504` JSON responses from
 * the proxy when the Python AI service failed. The Vercel AI SDK's
 * `DefaultChatTransport` then surfaced the response body verbatim as
 * `error.message`, and the chat interface rendered it literally, exposing
 * strings like `{"error":"Layanan AI sedang sibuk…"}` to end users.
 *
 * These tests pin down the contract that the proxy ALWAYS returns a 200
 * streaming response, even on error paths, so that bug cannot regress.
 */

import { buildErrorStream } from './error-stream';

/**
 * Read the full body of a `Response`-shaped object as text. Tolerates
 * whether the test environment exposes the body as `Response.body`
 * (Node 18+ global), `ReadableStream`, or already-decoded text. Always
 * returns a string.
 */
async function readBody(response: Response): Promise<string> {
  if (typeof response.text === 'function') {
    return response.text();
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

describe('buildErrorStream (regression-protection contract)', () => {
  it('returns a 200 response, never a hard 502/503/504', () => {
    const response = buildErrorStream('Layanan AI sedang sibuk.');
    expect(response.status).toBe(200);
    expect(response.status).not.toBe(502);
    expect(response.status).not.toBe(503);
    expect(response.status).not.toBe(504);
  });

  it('never returns a JSON body that the AI SDK could surface as raw text', async () => {
    const response = buildErrorStream('Layanan AI sedang sibuk.');
    const body = await readBody(response);
    expect(body).not.toMatch(/^\s*\{/);
    expect(body).not.toMatch(/"error"\s*:/);
  });

  it('embeds the friendly Indonesian message in the streamed body', async () => {
    const message = 'Layanan AI sedang sibuk. Silakan coba lagi dalam beberapa saat.';
    const response = buildErrorStream(message);
    const body = await readBody(response);
    expect(body).toContain(message);
  });

  it('prefixes the message with a ⚠️ marker so users can spot errors in scroll history', async () => {
    const response = buildErrorStream('Test message.');
    const body = await readBody(response);
    expect(body).toContain('⚠️');
    expect(body).toContain('Test message.');
  });

  it('emits finishReason:stop, not finishReason:error (avoids duplicate error-card display)', async () => {
    const response = buildErrorStream('Test message.');
    const body = await readBody(response);
    expect(body).not.toMatch(/finishReason["']?\s*:\s*["']error["']/);
  });

  it('handles unicode/multibyte Indonesian characters without breaking the stream', async () => {
    const message = 'Tidak dapat menghubungi layanan AI. Periksa koneksi Anda.';
    const response = buildErrorStream(message);
    const body = await readBody(response);
    expect(body).toContain(message);
  });

  it('does not let user-supplied JSON-ish characters leak through as raw JSON', async () => {
    const trickyMessage =
      'Pesan error dengan {kurung kurawal} dan "tanda kutip" yang terlihat JSON-ish.';
    const response = buildErrorStream(trickyMessage);
    const body = await readBody(response);
    expect(body.length).toBeGreaterThan(trickyMessage.length);
    expect(body).toContain(trickyMessage);
  });
});
