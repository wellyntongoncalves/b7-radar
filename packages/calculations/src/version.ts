/**
 * Formula versions. Every calculation carries a version so historical
 * `Calculation` rows remain reproducible and changes are auditable. Bump the
 * version whenever a formula's behavior changes and record it in the changelog.
 */
export const FORMULA_VERSIONS = {
  contributionMargin: 'contribution-margin@1.0.0',
  priceForMargin: 'price-for-margin@1.0.0',
  opportunityScore: 'opportunity-score@1.0.0',
  listingAge: 'listing-age@1.0.0',
  estimatedSales: 'estimated-sales@1.0.0',
} as const;

export type FormulaKey = keyof typeof FORMULA_VERSIONS;
