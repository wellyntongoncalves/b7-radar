import type { PriceSnapshot } from './storage.js';

export interface PriceHistorySummary {
  readonly count: number;
  readonly firstReais: number;
  readonly lastReais: number;
  readonly minReais: number;
  readonly maxReais: number;
  /** Change from first to last snapshot, in reais. */
  readonly deltaReais: number;
  /** Percentage change from first to last, or null when first price is 0. */
  readonly deltaPercent: number | null;
}

/**
 * Summarizes a listing's real price snapshots. Returns null with fewer than two
 * snapshots — the spec forbids implying history from a single reading.
 */
export function summarizePriceHistory(snapshots: PriceSnapshot[]): PriceHistorySummary | null {
  if (snapshots.length < 2) return null;
  const prices = snapshots.map((s) => s.priceReais);
  const first = prices[0]!;
  const last = prices[prices.length - 1]!;
  const delta = Math.round((last - first) * 100) / 100;
  return {
    count: snapshots.length,
    firstReais: first,
    lastReais: last,
    minReais: Math.min(...prices),
    maxReais: Math.max(...prices),
    deltaReais: delta,
    deltaPercent: first === 0 ? null : Math.round((delta / first) * 10000) / 100,
  };
}
