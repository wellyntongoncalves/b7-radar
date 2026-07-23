import { describe, expect, it } from 'vitest';
import { computeListingAgeDays, estimateSales } from './listing.js';

describe('computeListingAgeDays', () => {
  it('computes whole-day age in UTC', () => {
    expect(
      computeListingAgeDays('2026-01-01T00:00:00Z', '2026-01-11T00:00:00Z'),
    ).toBe(10);
  });

  it('never returns negative age', () => {
    expect(
      computeListingAgeDays('2026-02-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    ).toBe(0);
  });

  it('throws on invalid dates', () => {
    expect(() => computeListingAgeDays('not-a-date', '2026-01-01T00:00:00Z')).toThrow();
  });
});

describe('estimateSales', () => {
  it('treats observed sold as a floor', () => {
    const e = estimateSales({ observedSold: 500, ageDays: 100 });
    expect(e.estimatedTotal).toBeGreaterThanOrEqual(500);
  });

  it('derives per-day and per-month from age', () => {
    const e = estimateSales({ observedSold: 300, ageDays: 30 });
    expect(e.perDay).toBeCloseTo(10, 1);
    expect(e.perMonth).toBeGreaterThan(0);
  });

  it('guards against division by zero on brand-new listings', () => {
    const e = estimateSales({ observedSold: 5, ageDays: 0 });
    expect(Number.isFinite(e.perDay)).toBe(true);
  });
});
