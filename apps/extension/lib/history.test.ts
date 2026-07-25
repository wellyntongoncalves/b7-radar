import { describe, expect, it } from 'vitest';
import { summarizePriceHistory } from './history.js';
import type { PriceSnapshot } from './storage.js';

const snap = (priceReais: number, capturedAt: string): PriceSnapshot => ({ priceReais, capturedAt });

describe('summarizePriceHistory', () => {
  it('returns null with fewer than two snapshots', () => {
    expect(summarizePriceHistory([])).toBeNull();
    expect(summarizePriceHistory([snap(100, '2026-07-01T00:00:00Z')])).toBeNull();
  });

  it('computes delta, percent, min and max from real readings', () => {
    const s = summarizePriceHistory([
      snap(100, '2026-07-01T00:00:00Z'),
      snap(120, '2026-07-10T00:00:00Z'),
      snap(90, '2026-07-20T00:00:00Z'),
    ]);
    expect(s).not.toBeNull();
    expect(s!.firstReais).toBe(100);
    expect(s!.lastReais).toBe(90);
    expect(s!.minReais).toBe(90);
    expect(s!.maxReais).toBe(120);
    expect(s!.deltaReais).toBe(-10);
    expect(s!.deltaPercent).toBe(-10);
  });

  it('reports null percent when the first price is zero', () => {
    const s = summarizePriceHistory([snap(0, 'a'), snap(50, 'b')]);
    expect(s!.deltaPercent).toBeNull();
  });
});
