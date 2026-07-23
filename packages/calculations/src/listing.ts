import { roundHalfAwayFromZero } from './money.js';
import { FORMULA_VERSIONS } from './version.js';

/** Age of a listing in whole days, computed against a reference instant (UTC). */
export function computeListingAgeDays(createdAtIso: string, nowIso: string): number {
  const created = Date.parse(createdAtIso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(created) || Number.isNaN(now)) {
    throw new RangeError('Datas inválidas em computeListingAgeDays');
  }
  const ms = now - created;
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export const LISTING_AGE_FORMULA = FORMULA_VERSIONS.listingAge;

export interface EstimatedSalesInput {
  /** Sales explicitly shown on the page (e.g. "+500 vendidos"). */
  readonly observedSold: number;
  /** Listing age in days. */
  readonly ageDays: number;
  /** Review count, used as a weak secondary demand signal. */
  readonly reviewCount?: number;
}

export interface EstimatedSales {
  readonly formulaVersion: string;
  /** Estimated total sold. Always an ESTIMATE, never presented as exact. */
  readonly estimatedTotal: number;
  readonly perDay: number;
  readonly perMonth: number;
}

/**
 * Deterministic, transparent sales estimate. Mercado Livre shows sold counts in
 * banded/approximate form, so we treat the observed number as a floor and add a
 * small, bounded uplift from review signal. This is intentionally conservative
 * and labelled ESTIMATED downstream — it never claims exactness.
 */
export function estimateSales(input: EstimatedSalesInput): EstimatedSales {
  const base = Math.max(0, input.observedSold);
  // Reviews imply additional unreviewed sales; use a bounded multiplier.
  const reviewUplift = input.reviewCount ? Math.min(base * 0.15, input.reviewCount * 3) : 0;
  const estimatedTotal = roundHalfAwayFromZero(base + reviewUplift);
  const days = Math.max(1, input.ageDays);
  const perDay = Math.round((estimatedTotal / days) * 100) / 100;
  const perMonth = roundHalfAwayFromZero(perDay * 30);
  return {
    formulaVersion: FORMULA_VERSIONS.estimatedSales,
    estimatedTotal,
    perDay,
    perMonth,
  };
}
