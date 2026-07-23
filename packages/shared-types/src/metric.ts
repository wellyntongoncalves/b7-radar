import type {
  CaptureMethod,
  ConfidenceLevel,
  DataClassification,
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
  /** Stable key from the metric catalog, e.g. "estimated_gross_revenue". */
  readonly key: string;
  /** The value itself, or null when unavailable (we never invent a value). */
  readonly value: T | null;
  readonly unit: MetricUnit;
  readonly classification: DataClassification;
  readonly confidence: ConfidenceLevel;
  /** Origin string, e.g. "mercadolivre.dom", "mercadolivre.api", "user". */
  readonly source: string;
  readonly capturedAt: IsoUtcTimestamp;
  readonly method: CaptureMethod;
  readonly period?: MetricPeriod;
  /** Formula key + version for calculated/estimated values. */
  readonly formula?: string;
  readonly formulaVersion?: string;
  /** Human-readable note shown in tooltips, in pt-BR. */
  readonly note?: string;
  /** Message shown when value is null. */
  readonly unavailableReason?: string;
}

/** Convenience factory for an unavailable metric (keeps call sites honest). */
export function unavailableMetric(
  key: string,
  unit: MetricUnit,
  source: string,
  capturedAt: IsoUtcTimestamp,
  method: CaptureMethod,
  reason: string,
): MetricValue {
  return {
    key,
    value: null,
    unit,
    classification: 'OBSERVED' as DataClassification,
    confidence: 'UNAVAILABLE' as ConfidenceLevel,
    source,
    capturedAt,
    method,
    unavailableReason: reason,
  };
}
