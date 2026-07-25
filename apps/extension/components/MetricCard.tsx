import { ConfidenceLevel, DataClassification, METRIC_SCOPE_LABEL, type MetricValue } from '@b7/shared-types';
import { classificationLabel, confidenceLabel, formatMetricValue, relativeTime } from '../lib/format.js';

const confClass: Record<ConfidenceLevel, string> = {
  [ConfidenceLevel.High]: 'b7-conf--high',
  [ConfidenceLevel.Medium]: 'b7-conf--medium',
  [ConfidenceLevel.Low]: 'b7-conf--low',
  [ConfidenceLevel.Unavailable]: 'b7-conf--na',
};

const classChipClass: Record<DataClassification, string> = {
  [DataClassification.Official]: 'b7-chip--ofi',
  [DataClassification.Authorized]: 'b7-chip--auth',
  [DataClassification.Observed]: 'b7-chip--obs',
  [DataClassification.Historical]: 'b7-chip--hist',
  [DataClassification.Calculated]: 'b7-chip--cal',
  [DataClassification.Configured]: 'b7-chip--cfg',
  [DataClassification.Estimated]: 'b7-chip--cfg',
};

const SOURCE_LABEL: Record<string, string> = {
  'mercadolivre.dom': 'Mercado Livre',
  'mercadolivre.api': 'Mercado Livre (API)',
  'b7.calculations': 'Cálculo B7 Radar',
  'b7.model': 'B7 Radar',
  'b7.snapshot': 'B7 Radar (snapshots)',
  user: 'Você',
};

/** A single metric block: value + scope + origin + confidence + freshness. */
export function MetricCard({ metric }: { metric: MetricValue }) {
  const unavailable = metric.value === null;
  const sourceLabel = SOURCE_LABEL[metric.source] ?? metric.source;
  const scopeLabel = METRIC_SCOPE_LABEL[metric.scope];
  return (
    <div className="b7-metric">
      <div className="b7-metric__label">{metricLabel(metric.key)}</div>
      <div className="b7-metric__value" data-unavailable={unavailable}>
        {formatMetricValue(metric)}
      </div>
      <div className="b7-metric__tags">
        <span className={`b7-chip ${classChipClass[metric.classification]}`}>
          {classificationLabel(metric)}
        </span>
        <span className="b7-chip b7-chip--muted">{scopeLabel}</span>
        <span className={`b7-conf ${confClass[metric.confidence]}`}>
          <i aria-hidden /> conf.: {confidenceLabel(metric)}
        </span>
      </div>
      <div className="b7-metric__meta">
        <span>Fonte: {sourceLabel}</span>
        <span>Atualizado {relativeTime(metric.capturedAt)}</span>
      </div>
      {(metric.limitation || metric.note) && (
        <div className="b7-metric__note">{metric.limitation ?? metric.note}</div>
      )}
      {unavailable && metric.unavailableReason && (
        <div className="b7-metric__note">{metric.unavailableReason}</div>
      )}
    </div>
  );
}

const LABELS: Record<string, string> = {
  current_price: 'Preço atual',
  sales_reported: 'Vendas informadas',
  observed_sales_period: 'Vendas observadas no período',
  gross_revenue_calc: 'Faturamento bruto calculado',
  contribution_margin: 'Margem de contribuição',
  margin_percent: 'Margem (%)',
  roi_percent: 'ROI',
};

function metricLabel(key: string): string {
  return LABELS[key] ?? key;
}
