/**
 * Data honesty layer.
 *
 * Every value B7 Radar shows must declare where it came from and how much we
 * trust it. This is both the product's differentiator and its legal safeguard:
 * we never present an estimate as a fact.
 */

/** How a value was obtained. Ordered from strongest to weakest guarantee. */
export enum DataClassification {
  /** Received from an official API or authorized integration. */
  Official = 'OFFICIAL',
  /** Publicly displayed on the page and read by the extension. */
  Observed = 'OBSERVED',
  /** Produced by a deterministic formula over known inputs. */
  Calculated = 'CALCULATED',
  /** Approximated from hypotheses, history or models. Never exact. */
  Estimated = 'ESTIMATED',
  /** Provided manually by the user. */
  Configured = 'CONFIGURED',
}

/** Portuguese (pt-BR) labels for the UI. Code stays in English. */
export const DATA_CLASSIFICATION_LABEL: Record<DataClassification, string> = {
  [DataClassification.Official]: 'Oficial',
  [DataClassification.Observed]: 'Observado',
  [DataClassification.Calculated]: 'Calculado',
  [DataClassification.Estimated]: 'Estimado',
  [DataClassification.Configured]: 'Configurado',
};

/** Confidence in a value, independent from its classification. */
export enum ConfidenceLevel {
  High = 'HIGH',
  Medium = 'MEDIUM',
  Low = 'LOW',
  /** We could not determine a value at all. */
  Unavailable = 'UNAVAILABLE',
}

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  [ConfidenceLevel.High]: 'alta',
  [ConfidenceLevel.Medium]: 'média',
  [ConfidenceLevel.Low]: 'baixa',
  [ConfidenceLevel.Unavailable]: 'indisponível',
};

/** How a captured field was read, for observability and debugging. */
export enum CaptureMethod {
  ApiField = 'API_FIELD',
  DomText = 'DOM_TEXT',
  DomAttribute = 'DOM_ATTRIBUTE',
  Computed = 'COMPUTED',
  UserInput = 'USER_INPUT',
  Fixture = 'FIXTURE',
}
