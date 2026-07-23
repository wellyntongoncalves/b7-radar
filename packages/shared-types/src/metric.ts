import {
  CaptureMethod,
  ConfidenceLevel,
  DataClassification,
  type MetricScope,
} from './classification.js';

/** ISO-8601 UTC timestamp string. Storage is always UTC; the UI localizes. */
export type IsoUtcTimestamp = string;

/** Unit of a metric value, used for formatting and never guessed at render time. */
export enum MetricUnit {
  BRL = 'BRL',
  Percent = 'PERCENT',
  Count = 'COUNT',
  Days = 'DAYS',
  PerDay = 'PER_DAY',
  PerMonth = 'PER_MONTH',
  Score = 'SCORE',
  Ratio = 'RATIO',
  None = 'NONE',
}

/** Time window a metric refers to, when applicable. */
export interface MetricPeriod {
  readonly from?: IsoUtcTimestamp;
  readonly to?: IsoUtcTimestamp;
  readonly label?: string;
}

/**
 * The single carrier for any number B7 Radar shows. A bare number is never
 * rendered — it always travels wrapped with its provenance so the UI can show
 * origin, confidence, freshness and (for calculated values) the formula.
 */
export interface MetricValue<T = number> {
  /** Stable key from the metric catalog, e.g. "gross_revenue_calc". */
  readonly key: string;
  /** The value itself, or null when unavailable (we never invent a value). */
  readonly value: T | null;
  readonly unit: MetricUnit;
  readonly classification: DataClassification;
  readonly confidence: ConfidenceLevel;
  /**
   * Scope this metric belongs to — so a catalog/seller number is never shown
   * as the individual listing's. Required by the "Dados do Anúncio Atual" spec.
   */
  readonly scope: MetricScope;
  /** Origin string, e.g. "mercadolivre.dom", "mercadolivre.api", "user". */
  readonly source: string;
  readonly capturedAt: IsoUtcTimestamp;
  readonly method: CaptureMethod;
  /** The listing this metric is bound to (isolation key). */
  readonly listingId?: string;
  readonly catalogProductId?: string;
  readonly sellerId?: string;
  readonly variationId?: string;
  readonly period?: MetricPeriod;
  /** Formula key + version for calculated values. */
  readonly formula?: string;
  readonly formulaVersion?: string;
  /** Raw text as shown by the marketplace (e.g. "+10 mil"), when grouped. */
  readonly rawText?: string;
  /** Marketplace presented a rounded value. */
  readonly isRounded?: boolean;
  /** Marketplace presented a grouped/bucketed value (e.g. "+10 mil"). */
  readonly isGrouped?: boolean;
  /** Known limitation shown in tooltips, in pt-BR. */
  readonly limitation?: string;
  /** Human-readable note shown in tooltips, in pt-BR. */
  readonly note?: string;
  /** Message shown when value is null. */
  readonly unavailableReason?: string;
}

/** Convenience factory for an unavailable metric (keeps call sites honest). */
export function unavailableMetric(
  key: string,
  unit: MetricUnit,
  scope: MetricScope,
  source: string,
  capturedAt: IsoUtcTimestamp,
  method: CaptureMethod,
  reason: string,
): MetricValue {
  return {
    key,
    value: null,
    unit,
    classification: DataClassification.Observed,
    confidence: ConfidenceLevel.Unavailable,
    scope,
    source,
    capturedAt,
    method,
    unavailableReason: reason,
  };
}
