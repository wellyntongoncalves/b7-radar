import type { NormalizedListing } from '@b7/shared-types';

/**
 * Aggregated statistics over the listings currently loaded on a search page.
 * Only observed values contribute — no estimated sales/revenue (the spec
 * forbids presenting estimates as real data). Sales totals are the reported
 * (possibly grouped) quantities, labelled "observado na página".
 */
export interface SearchAggregate {
  readonly count: number;
  readonly withPrice: number;
  readonly avgPriceReais: number | null;
  readonly medianPriceReais: number | null;
  readonly minPriceReais: number | null;
  readonly maxPriceReais: number | null;
  /** Sum of reported sold quantities across listings that expose one. */
  readonly totalReportedSales: number;
  /** Whether any reported quantity was grouped (e.g. "+10 mil"). */
  readonly hasGroupedSales: boolean;
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

export function aggregateSearch(listings: readonly NormalizedListing[]): SearchAggregate {
  const prices: number[] = [];
  let totalReportedSales = 0;
  let hasGroupedSales = false;
  let freeShippingCount = 0;

  for (const l of listings) {
    const price = l.price.value;
    if (price !== null) prices.push(price);

    const sold = l.soldQuantity.value;
    if (sold !== null) {
      totalReportedSales += sold;
      if (l.soldQuantity.isGrouped === true) hasGroupedSales = true;
    }

    if (l.freeShipping.value) freeShippingCount += 1;
  }

  const avg = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : null;

  return {
    count: listings.length,
    withPrice: prices.length,
    avgPriceReais: avg === null ? null : Math.round(avg * 100) / 100,
    medianPriceReais: median(prices),
    minPriceReais: prices.length ? Math.min(...prices) : null,
    maxPriceReais: prices.length ? Math.max(...prices) : null,
    totalReportedSales,
    hasGroupedSales,
    freeShippingCount,
  };
}
