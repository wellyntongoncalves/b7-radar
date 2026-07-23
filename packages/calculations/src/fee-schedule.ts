import type { Cents } from './money.js';

/**
 * Marketplace fee schedule. Fees are NEVER hardcoded inside formulas — they
 * live here, versioned and dated, so they can be updated without touching
 * calculation logic. The values below are editable DEFAULTS meant to be
 * overridden by a workspace's configured schedule (or by an official source).
 * They must be verified against current marketplace policy before being
 * treated as authoritative; the UI labels anything derived from them as
 * "Configurado" until an official schedule is connected.
 */

export enum FeeListingType {
  Classic = 'CLASSIC',
  Premium = 'PREMIUM',
}

/** A fixed-fee rule that applies within a price band (in cents). */
export interface FixedFeeRule {
  /** Inclusive lower bound of the sale price band, in cents. */
  readonly minPriceCents: Cents;
  /** Exclusive upper bound, in cents. Null means "no upper bound". */
  readonly maxPriceCents: Cents | null;
  /** Fixed fee charged when the price falls in this band, in cents. */
  readonly feeCents: Cents;
}

export interface CommissionRule {
  readonly listingType: FeeListingType;
  /** Commission as a whole-number percent, e.g. 14 for 14%. */
  readonly percent: number;
}

export interface FeeSchedule {
  readonly id: string;
  readonly marketplace: 'MERCADO_LIVRE';
  readonly version: string;
  /** ISO date this schedule takes effect. */
  readonly effectiveFrom: string;
  readonly source: 'DEFAULT' | 'CONFIGURED' | 'OFFICIAL';
  readonly commission: readonly CommissionRule[];
  readonly fixedFees: readonly FixedFeeRule[];
  /** Free-shipping obligation threshold, in cents (informational). */
  readonly freeShippingThresholdCents: Cents;
}

/**
 * Editable default. NOT an official statement of Mercado Livre fees — a
 * placeholder structure with plausible bands so the calculator runs before a
 * workspace configures its real numbers.
 */
export const DEFAULT_ML_FEE_SCHEDULE: FeeSchedule = {
  id: 'ml-default-v1',
  marketplace: 'MERCADO_LIVRE',
  version: 'ml-fees@1.0.0-default',
  effectiveFrom: '2026-01-01',
  source: 'DEFAULT',
  commission: [
    { listingType: FeeListingType.Classic, percent: 11 },
    { listingType: FeeListingType.Premium, percent: 16 },
  ],
  // Fixed fee bands for lower-priced items (in cents). Above the top band the
  // fixed fee is zero.
  fixedFees: [
    { minPriceCents: 0, maxPriceCents: 2900, feeCents: 625 },
    { minPriceCents: 2900, maxPriceCents: 5000, feeCents: 650 },
    { minPriceCents: 5000, maxPriceCents: 7900, feeCents: 675 },
    { minPriceCents: 7900, maxPriceCents: null, feeCents: 0 },
  ],
  freeShippingThresholdCents: 7900,
};

/** Resolves the commission percent for a listing type from a schedule. */
export function resolveCommissionPercent(
  schedule: FeeSchedule,
  listingType: FeeListingType,
): number {
  const rule = schedule.commission.find((c) => c.listingType === listingType);
  if (!rule) {
    throw new Error(
      `Comissão não definida para o tipo ${listingType} na tabela ${schedule.id}`,
    );
  }
  return rule.percent;
}

/** Resolves the fixed fee (in cents) for a sale price from a schedule. */
export function resolveFixedFeeCents(schedule: FeeSchedule, priceCents: Cents): Cents {
  const rule = schedule.fixedFees.find(
    (r) =>
      priceCents >= r.minPriceCents &&
      (r.maxPriceCents === null || priceCents < r.maxPriceCents),
  );
  return rule?.feeCents ?? 0;
}
