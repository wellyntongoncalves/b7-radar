import {
  DEFAULT_ML_FEE_SCHEDULE,
  FeeListingType,
  resolveCommissionPercent,
  resolveFixedFeeCents,
  type FeeSchedule,
} from './fee-schedule.js';
import { percentOfCents, reaisToCents, roundHalfAwayFromZero, type Cents } from './money.js';
import { FORMULA_VERSIONS } from './version.js';

/** Shared cost/fee inputs, expressed in reais and whole-number percents. */
export interface CostInput {
  readonly productCostReais: number;
  readonly packagingReais?: number;
  readonly extraCostsReais?: number;
  /** Tax as a whole-number percent of the sale price, e.g. 7 for 7%. */
  readonly taxPercent?: number;
  /** Advertising as a whole-number percent of the sale price. */
  readonly adPercent?: number;
  /** Expected return rate as a whole-number percent, applied to product+shipping. */
  readonly returnRatePercent?: number;
  /** Seller-borne shipping cost in reais. */
  readonly shippingCostReais?: number;
  /** Shipping subsidy (discount) the marketplace grants, in reais. */
  readonly shippingSubsidyReais?: number;
  readonly listingType: FeeListingType;
  readonly feeSchedule?: FeeSchedule;
}

/** Mode A input: the user provides the sale price. */
export interface ContributionInput extends CostInput {
  readonly priceReais: number;
  /** Optional monthly sales estimate to project monthly profit. */
  readonly monthlySalesEstimate?: number;
}

/** Full breakdown, all monetary fields in cents. */
export interface ContributionResult {
  readonly formulaVersion: string;
  readonly priceCents: Cents;
  readonly commissionCents: Cents;
  readonly fixedFeeCents: Cents;
  readonly taxCents: Cents;
  readonly adCents: Cents;
  readonly productCostCents: Cents;
  readonly packagingCents: Cents;
  readonly extraCostsCents: Cents;
  readonly shippingCents: Cents;
  readonly expectedReturnCents: Cents;
  readonly totalCostCents: Cents;
  /** Price minus marketplace-side deductions (commission, fixed fee, tax, shipping). */
  readonly netRevenueCents: Cents;
  readonly unitProfitCents: Cents;
  readonly contributionMarginCents: Cents;
  /** Contribution margin as a percent of price. */
  readonly marginPercent: number;
  /** Return on the cash the seller invests (product + packaging + extras). */
  readonly roiPercent: number;
  /** Minimum price to break even given current costs. */
  readonly breakEvenPriceCents: Cents;
  readonly monthlyProfitCents: Cents | null;
}

function coalesceCosts(input: CostInput) {
  const schedule = input.feeSchedule ?? DEFAULT_ML_FEE_SCHEDULE;
  const productCostCents = reaisToCents(input.productCostReais);
  const packagingCents = reaisToCents(input.packagingReais ?? 0);
  const extraCostsCents = reaisToCents(input.extraCostsReais ?? 0);
  const grossShipping = reaisToCents(input.shippingCostReais ?? 0);
  const subsidy = reaisToCents(input.shippingSubsidyReais ?? 0);
  const shippingCents = Math.max(0, grossShipping - subsidy);
  const commissionPercent = resolveCommissionPercent(schedule, input.listingType);
  const taxPercent = input.taxPercent ?? 0;
  const adPercent = input.adPercent ?? 0;
  const returnRatePercent = input.returnRatePercent ?? 0;
  // Expected return cost models the loss on returned units: a fraction of the
  // product + shipping cost, independent of sale price.
  const expectedReturnCents = percentOfCents(
    productCostCents + shippingCents,
    returnRatePercent,
  );
  const investedCents = productCostCents + packagingCents + extraCostsCents;
  return {
    schedule,
    productCostCents,
    packagingCents,
    extraCostsCents,
    shippingCents,
    commissionPercent,
    taxPercent,
    adPercent,
    expectedReturnCents,
    investedCents,
  };
}

/** Mode A — price given. Returns the full contribution breakdown. */
export function computeContribution(input: ContributionInput): ContributionResult {
  const c = coalesceCosts(input);
  const priceCents = reaisToCents(input.priceReais);
  const commissionCents = percentOfCents(priceCents, c.commissionPercent);
  const fixedFeeCents = resolveFixedFeeCents(c.schedule, priceCents);
  const taxCents = percentOfCents(priceCents, c.taxPercent);
  const adCents = percentOfCents(priceCents, c.adPercent);

  const totalCostCents =
    commissionCents +
    fixedFeeCents +
    taxCents +
    adCents +
    c.productCostCents +
    c.packagingCents +
    c.extraCostsCents +
    c.shippingCents +
    c.expectedReturnCents;

  const netRevenueCents = priceCents - commissionCents - fixedFeeCents - taxCents - c.shippingCents;
  const unitProfitCents = priceCents - totalCostCents;
  const marginPercent = priceCents === 0 ? 0 : (unitProfitCents / priceCents) * 100;
  const roiPercent = c.investedCents === 0 ? 0 : (unitProfitCents / c.investedCents) * 100;

  const breakEvenPriceCents = solvePriceCents({
    schedule: c.schedule,
    variableRatePercent: c.commissionPercent + c.taxPercent + c.adPercent,
    priceIndependentCostsCents:
      c.productCostCents + c.packagingCents + c.extraCostsCents + c.shippingCents + c.expectedReturnCents,
    marginPercent: 0,
  });

  const monthlyProfitCents =
    input.monthlySalesEstimate !== undefined
      ? roundHalfAwayFromZero(unitProfitCents * input.monthlySalesEstimate)
      : null;

  return {
    formulaVersion: FORMULA_VERSIONS.contributionMargin,
    priceCents,
    commissionCents,
    fixedFeeCents,
    taxCents,
    adCents,
    productCostCents: c.productCostCents,
    packagingCents: c.packagingCents,
    extraCostsCents: c.extraCostsCents,
    shippingCents: c.shippingCents,
    expectedReturnCents: c.expectedReturnCents,
    totalCostCents,
    netRevenueCents,
    unitProfitCents,
    contributionMarginCents: unitProfitCents,
    marginPercent,
    roiPercent,
    breakEvenPriceCents,
    monthlyProfitCents,
  };
}

/** Mode B input: the user provides a desired margin (percent of price). */
export interface PriceForMarginInput extends CostInput {
  readonly desiredMarginPercent: number;
  /** Optional current price to compute the difference. */
  readonly currentPriceReais?: number;
}

export interface PriceForMarginResult {
  readonly formulaVersion: string;
  readonly recommendedPriceCents: Cents;
  readonly minimumPriceCents: Cents;
  readonly psychologicalPriceCents: Cents;
  readonly differenceToCurrentCents: Cents | null;
}

/** Mode B — desired margin given. Returns recommended pricing. */
export function computePriceForMargin(input: PriceForMarginInput): PriceForMarginResult {
  const c = coalesceCosts(input);
  const priceIndependentCostsCents =
    c.productCostCents + c.packagingCents + c.extraCostsCents + c.shippingCents + c.expectedReturnCents;
  const variableRatePercent = c.commissionPercent + c.taxPercent + c.adPercent;

  const recommendedPriceCents = solvePriceCents({
    schedule: c.schedule,
    variableRatePercent,
    priceIndependentCostsCents,
    marginPercent: input.desiredMarginPercent,
  });
  const minimumPriceCents = solvePriceCents({
    schedule: c.schedule,
    variableRatePercent,
    priceIndependentCostsCents,
    marginPercent: 0,
  });
  const psychologicalPriceCents = toPsychologicalPrice(recommendedPriceCents);
  const differenceToCurrentCents =
    input.currentPriceReais !== undefined
      ? recommendedPriceCents - reaisToCents(input.currentPriceReais)
      : null;

  return {
    formulaVersion: FORMULA_VERSIONS.priceForMargin,
    recommendedPriceCents,
    minimumPriceCents,
    psychologicalPriceCents,
    differenceToCurrentCents,
  };
}

interface SolvePriceArgs {
  readonly schedule: FeeSchedule;
  /** Sum of price-proportional rates (commission + tax + ad), whole-number percent. */
  readonly variableRatePercent: number;
  /** Costs that do not depend on price, in cents. */
  readonly priceIndependentCostsCents: Cents;
  /** Desired margin as percent of price (0 = break-even). */
  readonly marginPercent: number;
}

/**
 * Solves for the sale price (cents) that yields the desired margin, accounting
 * for the price-band fixed fee. Because the fixed fee is piecewise-constant, we
 * try each band and keep the solution that actually lands inside its band.
 *
 * Model: price*(1 - v/100 - m/100) = fixedFee(band) + fixedCosts
 */
function solvePriceCents(args: SolvePriceArgs): Cents {
  const denom = 1 - args.variableRatePercent / 100 - args.marginPercent / 100;
  if (denom <= 0) {
    throw new RangeError(
      'Combinação de taxas e margem inviável: o denominador de preço é não-positivo.',
    );
  }
  let fallback: Cents | null = null;
  for (const band of args.schedule.fixedFees) {
    const priceReal = (band.feeCents + args.priceIndependentCostsCents) / denom;
    const priceCents = roundHalfAwayFromZero(priceReal);
    const withinBand =
      priceCents >= band.minPriceCents &&
      (band.maxPriceCents === null || priceCents < band.maxPriceCents);
    if (withinBand) {
      return priceCents;
    }
    fallback = priceCents;
  }
  // No band matched exactly (edge rounding); return the last computed price.
  return fallback ?? 0;
}

/** Rounds a price up to the nearest value ending in ,90 (e.g. 18945 -> 18990). */
export function toPsychologicalPrice(cents: Cents): Cents {
  const candidate = Math.ceil(cents / 100) * 100 - 10;
  return candidate < cents ? candidate + 100 : candidate;
}
