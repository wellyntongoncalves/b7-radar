import { DataClassification, type MetricValue } from '@b7/shared-types';
import { classificationLabel, confidenceLabel, formatMetricValue } from '../lib/format.js';

const classColor: Record<DataClassification, string> = {
  [DataClassification.Official]: 'var(--b7-info)',
  [DataClassification.Observed]: 'var(--b7-blue)',
  [DataClassification.Calculated]: 'var(--b7-violet)',
  [DataClassification.Estimated]: 'var(--b7-warning)',
  [DataClassification.Configured]: 'var(--b7-gray)',
};

/** A single metric block: value + origin + confidence, never a bare number. */
export function MetricCard({ metric }: { metric: MetricValue }) {
  const unavailable = metric.value === null;
  return (
    <div className="b7-metric" title={metric.note ?? metric.unavailableReason ?? ''}>
      <div className="b7-metric__label">{metricLabel(metric.key)}</div>
      <div className="b7-metric__value" data-unavailable={unavailable}>
        {formatMetricValue(metric)}
      </div>
      <div className="b7-metric__tags">
        <span className="b7-chip" style={{ color: classColor[metric.classification] }}>
          {classificationLabel(metric)}
        </span>
        <span className="b7-chip b7-chip--muted">conf.: {confidenceLabel(metric)}</span>
      </div>
      {unavailable && metric.unavailableReason && (
        <div className="b7-metric__note">{metric.unavailableReason}</div>
      )}
    </div>
  );
}

const LABELS: Record<string, string> = {
  current_price: 'Preço atual',
  estimated_sales_total: 'Vendas estimadas',
  estimated_sales_per_month: 'Vendas estimadas/mês',
  estimated_gross_revenue: 'Receita bruta estimada',
  contribution_margin: 'Margem de contribuição',
  margin_percent: 'Margem (%)',
  roi_percent: 'ROI',
};

function metricLabel(key: string): string {
  return LABELS[key] ?? key;
}
