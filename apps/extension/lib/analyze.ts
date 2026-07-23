import {
  computeContribution,
  FeeListingType,
  type ContributionResult,
} from '@b7/calculations';
import {
  CaptureMethod,
  ConfidenceLevel,
  DataClassification,
  ListingType,
  MetricScope,
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
 * Composes a normalized listing and the user's cost profile into
 * provenance-stamped metrics bound to this listing.
 *
 * Compliance with the "Dados do Anúncio Atual" spec:
 * - NO estimated sales, NO monthly sales derived from listing age.
 * - "Vendas informadas" is shown exactly as the marketplace presents it
 *   (grouped text preserved, flagged), never converted to false precision.
 * - Gross revenue is CALCULATED (price × reported quantity), clearly labelled,
 *   never presented as real historical revenue.
 * - Every metric carries scope (listing) so it is never confused with catalog
 *   or seller figures.
 */
export function analyzeListing(
  listing: NormalizedListing,
  profile: CostProfileInput | null,
): ListingAnalysis {
  const now = listing.capturedAt;
  const listingId = listing.externalListingId.value ?? undefined;
  const metrics: MetricValue[] = [];

  const base = {
    scope: MetricScope.Listing,
    source: 'mercadolivre.dom',
    capturedAt: now,
    method: CaptureMethod.DomText,
    ...(listingId ? { listingId } : {}),
  } as const;

  // Preço atual (observado, escopo: anúncio).
  const price = listing.price.value;
  metrics.push({
    key: 'current_price',
    value: price,
    unit: MetricUnit.BRL,
    classification: DataClassification.Observed,
    confidence: listing.price.confidence,
    note: 'Preço atual exibido no anúncio.',
    ...base,
    ...(price === null ? { unavailableReason: 'Preço não encontrado na página.' } : {}),
  });

  // Vendas informadas — exatamente como o marketplace apresenta (texto
  // agrupado preservado). Nunca vira número exato quando é agrupado.
  const soldValue = listing.soldQuantity.value;
  const soldRaw = listing.soldQuantity.rawText ?? null;
  const grouped = listing.soldQuantity.isGrouped === true;
  metrics.push({
    key: 'sales_reported',
    value: soldValue,
    unit: MetricUnit.Count,
    classification: DataClassification.Observed,
    confidence: soldValue === null ? ConfidenceLevel.Unavailable : ConfidenceLevel.Medium,
    note: 'Quantidade vendida informada pelo Mercado Livre.',
    ...base,
    ...(soldRaw ? { rawText: soldRaw } : {}),
    ...(grouped
      ? {
          isGrouped: true,
          limitation:
            'O Mercado Livre pode apresentar quantidades agrupadas ou arredondadas para anúncios públicos.',
        }
      : {}),
    ...(soldValue === null ? { unavailableReason: 'Quantidade vendida não exibida.' } : {}),
  });

  // Faturamento bruto CALCULADO = preço × quantidade informada. Não é receita
  // real histórica (preço pode ter mudado, cupons, devoluções, variações).
  if (price !== null && soldValue !== null) {
    metrics.push({
      key: 'gross_revenue_calc',
      value: Math.round(price * soldValue),
      unit: MetricUnit.BRL,
      classification: DataClassification.Calculated,
      confidence: grouped ? ConfidenceLevel.Low : ConfidenceLevel.Medium,
      formula: 'gross-revenue',
      formulaVersion: 'gross-revenue@1.0.0',
      note: 'Faturamento bruto calculado (preço atual × vendas informadas).',
      limitation:
        'Não representa a receita histórica real: o preço pode ter mudado, e pode haver cupons, descontos, devoluções e variações.',
      ...base,
    });
  }

  // Rentabilidade CALCULADA — só quando o usuário configurou custo/imposto.
  let contribution: ContributionResult | null = null;
  if (profile && price !== null) {
    contribution = computeContribution({
      priceReais: price,
      productCostReais: profile.productCostReais,
      taxPercent: profile.taxPercent,
      extraCostsReais: profile.extraCostsReais ?? 0,
      listingType: profile.listingType ?? mapListingType(listing.listingType.value),
    });
    const calc = {
      classification: DataClassification.Calculated,
      confidence: ConfidenceLevel.High,
      method: CaptureMethod.Computed,
      formula: 'contribution-margin',
      formulaVersion: contribution.formulaVersion,
      scope: MetricScope.Listing,
      source: 'b7.calculations',
      capturedAt: now,
      ...(listingId ? { listingId } : {}),
    } as const;
    metrics.push({
      key: 'contribution_margin',
      value: contribution.contributionMarginCents / 100,
      unit: MetricUnit.BRL,
      note: 'Margem de contribuição a partir do preço e dos custos configurados.',
      ...calc,
    });
    metrics.push({
      key: 'margin_percent',
      value: Math.round(contribution.marginPercent * 100) / 100,
      unit: MetricUnit.Percent,
      ...calc,
    });
    metrics.push({
      key: 'roi_percent',
      value: Math.round(contribution.roiPercent * 100) / 100,
      unit: MetricUnit.Percent,
      ...calc,
    });
  }

  return { metrics, contribution };
}

function mapListingType(value: ListingType | null): FeeListingType {
  return value === ListingType.Premium ? FeeListingType.Premium : FeeListingType.Classic;
}
