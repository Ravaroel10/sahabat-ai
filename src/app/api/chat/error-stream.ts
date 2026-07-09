/**
 * Build a graceful UI message stream that delivers a friendly error
 * message as ordinary chat text rather than a hard non-200 HTTP response.
 *
 * Background: when this route used to return `502`/`503`/`504` with a JSON
 * body, the Vercel AI SDK's `DefaultChatTransport` surfaced the response
 * body verbatim as `error.message` to `useChat`, which the chat interface
 * rendered literally — the user saw a string like
 * `{"error":"Layanan AI sedang sibuk…"}` in place of a polished error
 * card. Worse, already-streamed text-deltas from `useChat`'s perspective
 * became orphaned (no matching assistant message) and the user lost
 * reading position. Returning a 200 stream with `finishReason: 'stop'`
 * keeps the SDK's contract intact: one assistant message per request,
 * full text preserved, and the user's reading position is undisturbed.
 *
 * Finish reason is `'stop'` (NOT `'error'`). Setting `'error'` would also
 * cause `useChat` to set its `error` state, which the chat interface
 * renders as an error card below the streamed message — duplicating the
 * user-visible text. With `'stop'`, the SDK's error state stays silent
 * and the user sees exactly one clean message.
 *
 * The message is prefixed with a `⚠️` emoji so users can still spot
 * service-state failures at a glance in their scroll history, even
 * though we no longer trigger the duplicate-error-card UI.
 *
 * Exported so unit tests can verify the regression-protection contract:
 * the proxy MUST never return a hard 502/503/504 with a JSON body whose
 * contents would leak as raw text in the chat.
 */

import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

export function buildErrorStream(message: string): Response {
  const errorStream = createUIMessageStream({
    execute: ({ writer }) => {
      const errorMessageId = crypto.randomUUID();
      writer.write({ type: 'text-start', id: errorMessageId });
      writer.write({
        type: 'text-delta',
        id: errorMessageId,
        delta: `⚠️ *${message}*`,
      });
      writer.write({ type: 'text-end', id: errorMessageId });
      writer.write({ type: 'finish', finishReason: 'stop' });
    },
    onError: () => message,
  });
  return createUIMessageStreamResponse({ stream: errorStream });
}
