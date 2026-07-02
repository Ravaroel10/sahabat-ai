/**
 * Analytics — minimal journey tracking injection point.
 *
 * Today this logs to console and queues events in a bounded ring buffer
 * (max 200 events) so a future analytics provider (Plausible, Posthog,
 * Google Analytics) can be dropped in without UI changes.
 *
 * Tasks covered:
 * - 9.12 Journey completion tracking (chat → marketplace → documents)
 * - 9.13 Drop-off identification helpers
 *
 * The queue is not persisted — it is intentionally volatile. The intent is to
 * prove the instrumentation surface without committing to a provider.
 */

export type JourneyStep =
  | 'chat_to_market'
  | 'market_to_doc'
  | 'doc_to_chat'
  | 'drop_off';

export interface JourneyEvent {
  step: JourneyStep;
  timestamp: number;
  payload?: Record<string, unknown>;
}

const MAX_BUFFER = 200;
const buffer: JourneyEvent[] = [];

/**
 * Track a cross-feature journey step. Safe to call from any client component.
 * The function never throws — analytics should not break the app.
 */
export function trackJourney(
  step: JourneyStep,
  payload?: Record<string, unknown>,
): void {
  try {
    const event: JourneyEvent = {
      step,
      timestamp: Date.now(),
      payload,
    };

    // Bounded ring buffer so memory stays predictable (task 13.x concern).
    if (buffer.length >= MAX_BUFFER) {
      buffer.shift();
    }
    buffer.push(event);

    // Surface in dev for inspection.
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', event);
    }

    // Future: ship `buffer` to a real provider via `navigator.sendBeacon`
    // when the user navigates or after a debounce window.
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('trackJourney failed:', err);
  }
}

/**
 * Snapshot the buffered events — useful for QA or testing the journey in a
 * single session. Read-only.
 */
export function getJourneySnapshot(): ReadonlyArray<JourneyEvent> {
  return buffer.slice();
}

/**
 * Test helper — clears the buffer.
 */
export function _resetJourneyBuffer(): void {
  buffer.length = 0;
}
