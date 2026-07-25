import { formatBRL, formatPercent } from '@b7/calculations';
import {
  CONFIDENCE_LABEL,
  DATA_CLASSIFICATION_LABEL,
  MetricUnit,
  type MetricValue,
} from '@b7/shared-types';

/** Formats a metric's value for display according to its unit. */
export function formatMetricValue(m: MetricValue): string {
  if (m.value === null) return '—';
  // Honesty: when the marketplace grouped the value ("+10 mil"), show the raw
  // text exactly, never a false-precision number.
  if (m.isGrouped && m.rawText) return m.rawText;
  switch (m.unit) {
    case MetricUnit.BRL:
      return formatBRL(Math.round((m.value as number) * 100));
    case MetricUnit.Percent:
      return formatPercent(m.value as number);
    case MetricUnit.PerMonth:
      return `${new Intl.NumberFormat('pt-BR').format(m.value as number)}/mês`;
    case MetricUnit.PerDay:
      return `${new Intl.NumberFormat('pt-BR').format(m.value as number)}/dia`;
    case MetricUnit.Count:
    case MetricUnit.Score:
      return new Intl.NumberFormat('pt-BR').format(m.value as number);
    default:
      return String(m.value);
  }
}

export function classificationLabel(m: MetricValue): string {
  return DATA_CLASSIFICATION_LABEL[m.classification];
}

export function confidenceLabel(m: MetricValue): string {
  return CONFIDENCE_LABEL[m.confidence];
}

/** Whether a captured timestamp is older than `maxAgeMin` (default 30 min). */
export function isStale(iso: string, maxAgeMin = 30, nowMs = Date.now()): boolean {
  return nowMs - Date.parse(iso) > maxAgeMin * 60000;
}

/** "há 5 minutos" style relative time in pt-BR from an ISO timestamp. */
export function relativeTime(iso: string, nowMs = Date.now()): string {
  const diffMs = nowMs - Date.parse(iso);
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} d`;
}
