/**
 * Data honesty layer.
 *
 * Every value B7 Radar shows must declare where it came from and how much we
 * trust it. This is both the product's differentiator and its legal safeguard:
 * we never present an estimate as a fact.
 */

/**
 * How a value was obtained. Ordered from strongest to weakest guarantee.
 *
 * Per the "Dados do Anúncio Atual" spec, `Estimated` is NOT a display class:
 * the tool never presents an estimate as real data. It is kept only as a
 * deprecated internal marker and must not reach the UI.
 */
export enum DataClassification {
  /** Received from an official API. */
  Official = 'OFFICIAL',
  /** Received from the authenticated owner's account (private, authorized). */
  Authorized = 'AUTHORIZED',
  /** Publicly displayed on the page and read by the extension. */
  Observed = 'OBSERVED',
  /** Derived from real B7 snapshots over time (observed deltas). */
  Historical = 'HISTORICAL',
  /** Produced by a deterministic formula over known inputs. */
  Calculated = 'CALCULATED',
  /** Provided manually by the user. */
  Configured = 'CONFIGURED',
  /**
   * @deprecated Not a display class. Never render a metric with this value.
   * Kept only so legacy internal utilities type-check during migration.
   */
  Estimated = 'ESTIMATED',
}

/** Portuguese (pt-BR) labels for the UI. Code stays in English. */
export const DATA_CLASSIFICATION_LABEL: Record<DataClassification, string> = {
  [DataClassification.Official]: 'Oficial',
  [DataClassification.Authorized]: 'Autorizado',
  [DataClassification.Observed]: 'Observado',
  [DataClassification.Historical]: 'Histórico',
  [DataClassification.Calculated]: 'Calculado',
  [DataClassification.Configured]: 'Configurado',
  [DataClassification.Estimated]: 'Estimado',
};

/**
 * Scope a metric belongs to — the key distinction the spec demands so a
 * catalog/seller number is never confused with the individual listing's.
 */
export enum MetricScope {
  Listing = 'listing',
  CatalogProduct = 'catalog-product',
  CatalogOffer = 'catalog-offer',
  Seller = 'seller',
  SearchPage = 'search-page',
  AuthorizedAccount = 'authorized-account',
}

export const METRIC_SCOPE_LABEL: Record<MetricScope, string> = {
  [MetricScope.Listing]: 'deste anúncio',
  [MetricScope.CatalogProduct]: 'do catálogo',
  [MetricScope.CatalogOffer]: 'desta oferta',
  [MetricScope.Seller]: 'do vendedor',
  [MetricScope.SearchPage]: 'da página',
  [MetricScope.AuthorizedAccount]: 'da sua conta',
};

/** Concrete origin of a value (finer-grained than classification). */
export enum MetricSource {
  OfficialApi = 'official-api',
  AuthorizedAccount = 'authorized-account',
  PublicPage = 'public-page',
  B7Snapshot = 'b7-snapshot',
  UserInput = 'user-input',
  Calculated = 'calculated',
}

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
