import { describe, expect, it } from 'vitest';
import { FeeListingType } from './fee-schedule.js';
import {
  computeContribution,
  computePriceForMargin,
  toPsychologicalPrice,
} from './margin.js';
import { centsToReais } from './money.js';

describe('computeContribution (Mode A)', () => {
  it('breaks down costs and profit for a classic listing', () => {
    const r = computeContribution({
      priceReais: 200,
      productCostReais: 80,
      taxPercent: 7,
      listingType: FeeListingType.Classic,
    });
    // commission 11% of 200 = 22.00
    expect(r.commissionCents).toBe(2200);
    // tax 7% of 200 = 14.00
    expect(r.taxCents).toBe(1400);
    // price 200 is above top fixed-fee band -> fixed fee 0
    expect(r.fixedFeeCents).toBe(0);
    expect(r.productCostCents).toBe(8000);
    // total = 2200 + 1400 + 8000 = 11600
    expect(r.totalCostCents).toBe(11600);
    // profit = 20000 - 11600 = 8400
    expect(r.unitProfitCents).toBe(8400);
    expect(r.marginPercent).toBeCloseTo(42, 5);
    // ROI = 8400 / 8000 = 105%
    expect(r.roiPercent).toBeCloseTo(105, 5);
  });

  it('applies a fixed fee for low-priced items', () => {
    const r = computeContribution({
      priceReais: 25,
      productCostReais: 5,
      listingType: FeeListingType.Classic,
    });
    // price 2500 cents in [0,2900) -> fixed fee 625
    expect(r.fixedFeeCents).toBe(625);
  });

  it('charges the premium commission for premium listings', () => {
    const classic = computeContribution({
      priceReais: 100,
      productCostReais: 10,
      listingType: FeeListingType.Classic,
    });
    const premium = computeContribution({
      priceReais: 100,
      productCostReais: 10,
      listingType: FeeListingType.Premium,
    });
    expect(classic.commissionCents).toBe(1100); // 11%
    expect(premium.commissionCents).toBe(1600); // 16%
    expect(premium.unitProfitCents).toBeLessThan(classic.unitProfitCents);
  });

  it('projects monthly profit when an estimate is provided', () => {
    const r = computeContribution({
      priceReais: 200,
      productCostReais: 80,
      taxPercent: 7,
      listingType: FeeListingType.Classic,
      monthlySalesEstimate: 170,
    });
    expect(r.monthlyProfitCents).toBe(8400 * 170);
  });

  it('produces a negative profit when costs exceed price', () => {
    const r = computeContribution({
      priceReais: 50,
      productCostReais: 60,
      listingType: FeeListingType.Classic,
    });
    expect(r.unitProfitCents).toBeLessThan(0);
    expect(r.marginPercent).toBeLessThan(0);
  });
});

describe('computePriceForMargin (Mode B)', () => {
  it('finds a price that yields the desired margin', () => {
    const desiredMarginPercent = 30;
    const out = computePriceForMargin({
      productCostReais: 80,
      taxPercent: 7,
      desiredMarginPercent,
      listingType: FeeListingType.Classic,
    });
    // Feed the recommended price back into Mode A and check the margin holds.
    const check = computeContribution({
      priceReais: centsToReais(out.recommendedPriceCents),
      productCostReais: 80,
      taxPercent: 7,
      listingType: FeeListingType.Classic,
    });
    expect(check.marginPercent).toBeCloseTo(desiredMarginPercent, 0);
  });

  it('break-even (minimum) price yields ~0 margin', () => {
    const out = computePriceForMargin({
      productCostReais: 80,
      taxPercent: 7,
      desiredMarginPercent: 25,
      listingType: FeeListingType.Classic,
    });
    const check = computeContribution({
      priceReais: centsToReais(out.minimumPriceCents),
      productCostReais: 80,
      taxPercent: 7,
      listingType: FeeListingType.Classic,
    });
    expect(check.unitProfitCents).toBeGreaterThanOrEqual(-2);
    expect(check.unitProfitCents).toBeLessThanOrEqual(2);
  });

  it('computes difference to the current price', () => {
    const out = computePriceForMargin({
      productCostReais: 80,
      desiredMarginPercent: 30,
      listingType: FeeListingType.Classic,
      currentPriceReais: 100,
    });
    expect(out.differenceToCurrentCents).not.toBeNull();
  });

  it('throws when fees plus margin are infeasible', () => {
    expect(() =>
      computePriceForMargin({
        productCostReais: 10,
        taxPercent: 50,
        adPercent: 40,
        desiredMarginPercent: 30, // 11 + 50 + 40 + 30 > 100
        listingType: FeeListingType.Classic,
      }),
    ).toThrow();
  });
});

describe('toPsychologicalPrice', () => {
  it('rounds up to the next ,90 ending', () => {
    expect(toPsychologicalPrice(18945)).toBe(18990); // R$ 189,90
    expect(toPsychologicalPrice(19000)).toBe(19090); // R$ 190,90
    expect(toPsychologicalPrice(18990)).toBe(18990); // already ,90
  });
});
