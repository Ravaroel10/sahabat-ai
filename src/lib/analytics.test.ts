/**
 * Tests for analytics journey buffer.
 *
 * Task 9.12: ensure trackJourney never throws and respects the bounded
 * buffer.
 */

import {
  trackJourney,
  getJourneySnapshot,
  _resetJourneyBuffer,
} from './analytics';

describe('analytics', () => {
  beforeEach(() => {
    _resetJourneyBuffer();
  });

  it('records events in insertion order', () => {
    trackJourney('chat_to_market', { income: 1500000 });
    trackJourney('market_to_doc', { programId: 'pkh' });

    const events = getJourneySnapshot();
    expect(events).toHaveLength(2);
    expect(events[0].step).toBe('chat_to_market');
    expect(events[1].step).toBe('market_to_doc');
    expect(events[0].payload).toEqual({ income: 1500000 });
  });

  it('keeps the buffer bounded at 200 entries', () => {
    for (let i = 0; i < 250; i++) {
      trackJourney('chat_to_market', { i });
    }
    expect(getJourneySnapshot().length).toBe(200);
    // The first 50 should be evicted, so the oldest remaining carries i=50.
    expect(getJourneySnapshot()[0].payload).toEqual({ i: 50 });
  });

  it('captures a timestamp for each event', () => {
    const before = Date.now();
    trackJourney('doc_to_chat');
    const after = Date.now();
    const [event] = getJourneySnapshot();
    expect(event.timestamp).toBeGreaterThanOrEqual(before);
    expect(event.timestamp).toBeLessThanOrEqual(after);
  });

  it('does not throw on nullish payload', () => {
    expect(() => trackJourney('drop_off', undefined)).not.toThrow();
  });
});
