import { describe, expect, it } from 'vitest';
import { isStale, relativeTime } from './format.js';

const now = Date.parse('2026-07-25T12:00:00Z');

describe('isStale', () => {
  it('is false for a fresh capture', () => {
    expect(isStale('2026-07-25T11:50:00Z', 30, now)).toBe(false);
  });

  it('is true past the max age', () => {
    expect(isStale('2026-07-25T11:20:00Z', 30, now)).toBe(true);
  });
});

describe('relativeTime', () => {
  it('reports minutes', () => {
    expect(relativeTime('2026-07-25T11:55:00Z', now)).toBe('há 5 min');
  });

  it('reports "agora" under a minute', () => {
    expect(relativeTime('2026-07-25T11:59:40Z', now)).toBe('agora');
  });
});
