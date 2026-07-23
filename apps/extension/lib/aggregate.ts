import { estimateSales } from '@b7/calculations';
import type { NormalizedListing } from '@b7/shared-types';

/** Aggregated statistics over the listings currently loaded on a search page. */
export interface SearchAggregate {
  readonly count: number;
  readonly withPrice: number;
  readonly avgPriceReais: number | null;
  readonly medianPriceReais: number | null;
  readonly minPriceReais: number | null;
  readonly maxPriceReais: number | null;
  readonly totalObservedSales: number;
  readonly totalEstimatedSales: number;
  readonly estimatedRevenueReais: number;
  readonly freeShippingCount: number;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
    : (sorted[mid] as number);
}

/**
 * Computes page-level aggregates from normalized listings. Only values actually
 * present contribute — missing prices/sales are skipped, never assumed as zero
 * in averages. Sales totals mix observed and (labelled) estimated figures.
 */
export function aggregateSearch(listings: readonly NormalizedListing[]): SearchAggregate {
  const prices: number[] = [];
  let totalObservedSales = 0;
  let totalEstimatedSales = 0;
  let estimatedRevenueCents = 0;
  let freeShippingCount = 0;

  for (const l of listings) {
    const price = l.price.value;
    if (price !== null) prices.push(price);

    const sold = l.soldQuantity.value;
    if (sold !== null) {
      totalObservedSales += sold;
      const est = estimateSales({
        observedSold: sold,
        ageDays: 180,
        reviewCount: l.reviewCount.value ?? 0,
      });
      totalEstimatedSales += est.estimatedTotal;
      if (price !== null) estimatedRevenueCents += Math.round(price * est.estimatedTotal * 100);
    }

    if (l.freeShipping.value) freeShippingCount += 1;
  }

  const avg =
    prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : null;

  return {
    count: listings.length,
    withPrice: prices.length,
    avgPriceReais: avg === null ? null : Math.round(avg * 100) / 100,
    medianPriceReais: median(prices),
    minPriceReais: prices.length ? Math.min(...prices) : null,
    maxPriceReais: prices.length ? Math.max(...prices) : null,
    totalObservedSales,
    totalEstimatedSales,
    estimatedRevenueReais: Math.round(estimatedRevenueCents / 100),
    freeShippingCount,
  };
}
