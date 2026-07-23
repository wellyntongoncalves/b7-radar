import {
  computeContribution,
  computeListingAgeDays,
  estimateSales,
  FeeListingType,
  type ContributionResult,
} from '@b7/calculations';
import {
  CaptureMethod,
  ConfidenceLevel,
  DataClassification,
  ListingType,
  MetricUnit,
  type MetricValue,
  type NormalizedListing,
} from '@b7/shared-types';

export interface CostProfileInput {
  readonly productCostReais: number;
  readonly taxPercent: number;
  readonly extraCostsReais?: number;
  readonly listingType: FeeListingType;
}

export interface ListingAnalysis {
  readonly metrics: MetricValue[];
  readonly contribution: ContributionResult | null;
}

/**
 * Composes a normalized listing and the user's cost profile into a set of
 * provenance-stamped metrics plus a margin breakdown. Every value keeps its
 * classification and confidence — nothing is presented as more certain than it
 * is, and missing inputs yield unavailable metrics rather than invented ones.
 */
export function analyzeListing(
  listing: NormalizedListing,
  profile: CostProfileInput | null,
): ListingAnalysis {
  const now = listing.capturedAt;
  const metrics: MetricValue[] = [];
  const src = 'mercadolivre.dom';

  const price = listing.price.value;
  metrics.push({
    key: 'current_price',
    value: price,
    unit: MetricUnit.BRL,
    classification: DataClassification.Observed,
    confidence: listing.price.confidence,
    source: src,
    capturedAt: now,
    method: CaptureMethod.DomText,
    note: 'Preço atual exibido no anúncio.',
    ...(price === null ? { unavailableReason: 'Preço não encontrado na página.' } : {}),
  });

  // Estimated sales (clearly labelled ESTIMATED).
  const observedSold = listing.soldQuantity.value;
  if (observedSold !== null) {
    const ageDays = listing.createdAt.value
      ? computeListingAgeDays(listing.createdAt.value, now)
      : 180; // conservative default when creation date is unavailable
    const est = estimateSales({
      observedSold,
      ageDays,
      reviewCount: listing.reviewCount.value ?? 0,
    });
    metrics.push({
      key: 'estimated_sales_total',
      value: est.estimatedTotal,
      unit: MetricUnit.Count,
      classification: DataClassification.Estimated,
      confidence: ConfidenceLevel.Medium,
      source: 'b7.model',
      capturedAt: now,
      method: CaptureMethod.Computed,
      formula: 'estimated-sales',
      formulaVersion: est.formulaVersion,
      note: 'Estimativa baseada nas vendas observadas, idade e avaliações. Não é um valor exato.',
    });
    metrics.push({
      key: 'estimated_sales_per_month',
      value: est.perMonth,
      unit: MetricUnit.PerMonth,
      classification: DataClassification.Estimated,
      confidence: ConfidenceLevel.Medium,
      source: 'b7.model',
      capturedAt: now,
      method: CaptureMethod.Computed,
      formula: 'estimated-sales',
      formulaVersion: est.formulaVersion,
    });

    // Estimated gross revenue = price × estimated sales (labelled ESTIMATED).
    if (price !== null) {
      metrics.push({
        key: 'estimated_gross_revenue',
        value: Math.round(price * est.estimatedTotal),
        unit: MetricUnit.BRL,
        classification: DataClassification.Estimated,
        confidence: ConfidenceLevel.Medium,
        source: 'b7.model',
        capturedAt: now,
        method: CaptureMethod.Computed,
        formula: 'gross-revenue',
        formulaVersion: est.formulaVersion,
        note: 'Receita bruta estimada com base no preço atual e nas vendas estimadas.',
      });
    }
  }

  // Margin breakdown (CALCULATED) — only when the user configured a cost profile.
  let contribution: ContributionResult | null = null;
  if (profile && price !== null) {
    contribution = computeContribution({
      priceReais: price,
      productCostReais: profile.productCostReais,
      taxPercent: profile.taxPercent,
      extraCostsReais: profile.extraCostsReais ?? 0,
      listingType: profile.listingType ?? mapListingType(listing.listingType.value),
    });
    metrics.push({
      key: 'contribution_margin',
      value: contribution.contributionMarginCents / 100,
      unit: MetricUnit.BRL,
      classification: DataClassification.Calculated,
      confidence: ConfidenceLevel.High,
      source: 'b7.calculations',
      capturedAt: now,
      method: CaptureMethod.Computed,
      formula: 'contribution-margin',
      formulaVersion: contribution.formulaVersion,
      note: 'Margem de contribuição calculada a partir do preço e dos custos configurados.',
    });
    metrics.push({
      key: 'margin_percent',
      value: Math.round(contribution.marginPercent * 100) / 100,
      unit: MetricUnit.Percent,
      classification: DataClassification.Calculated,
      confidence: ConfidenceLevel.High,
      source: 'b7.calculations',
      capturedAt: now,
      method: CaptureMethod.Computed,
      formula: 'contribution-margin',
      formulaVersion: contribution.formulaVersion,
    });
    metrics.push({
      key: 'roi_percent',
      value: Math.round(contribution.roiPercent * 100) / 100,
      unit: MetricUnit.Percent,
      classification: DataClassification.Calculated,
      confidence: ConfidenceLevel.High,
      source: 'b7.calculations',
      capturedAt: now,
      method: CaptureMethod.Computed,
      formula: 'contribution-margin',
      formulaVersion: contribution.formulaVersion,
    });
  }

  return { metrics, contribution };
}

function mapListingType(value: ListingType | null): FeeListingType {
  return value === ListingType.Premium ? FeeListingType.Premium : FeeListingType.Classic;
}
