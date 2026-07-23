/**
 * B7 Monitor — alert rule evaluation (pure). Given a metric value and a rule,
 * decide whether the alert triggers. Kept free of I/O so it can be unit-tested
 * and reused by both the extension (local) and the worker (server).
 */

export enum AlertOperator {
  GreaterThan = 'GT',
  GreaterOrEqual = 'GTE',
  LessThan = 'LT',
  LessOrEqual = 'LTE',
  Equal = 'EQ',
  /** Fires when the value changed at all versus the previous observation. */
  Changed = 'CHANGED',
  /** Fires when the value dropped versus the previous observation. */
  Decreased = 'DECREASED',
  /** Fires when the value rose versus the previous observation. */
  Increased = 'INCREASED',
}

export interface AlertRule {
  readonly metric: string;
  readonly operator: AlertOperator;
  /** Threshold for comparison operators. Ignored by change operators. */
  readonly threshold?: number;
  readonly enabled?: boolean;
}

export interface AlertContext {
  /** Current metric value; null means unavailable (never triggers). */
  readonly current: number | null;
  /** Previous value, when a prior snapshot exists. */
  readonly previous?: number | null;
}

/** Evaluates a single rule against a metric context. */
export function evaluateAlert(rule: AlertRule, ctx: AlertContext): boolean {
  if (rule.enabled === false) return false;
  const { current, previous } = ctx;
  if (current === null || current === undefined) return false;

  switch (rule.operator) {
    case AlertOperator.GreaterThan:
      return rule.threshold !== undefined && current > rule.threshold;
    case AlertOperator.GreaterOrEqual:
      return rule.threshold !== undefined && current >= rule.threshold;
    case AlertOperator.LessThan:
      return rule.threshold !== undefined && current < rule.threshold;
    case AlertOperator.LessOrEqual:
      return rule.threshold !== undefined && current <= rule.threshold;
    case AlertOperator.Equal:
      return rule.threshold !== undefined && current === rule.threshold;
    case AlertOperator.Changed:
      return previous !== undefined && previous !== null && current !== previous;
    case AlertOperator.Decreased:
      return previous !== undefined && previous !== null && current < previous;
    case AlertOperator.Increased:
      return previous !== undefined && previous !== null && current > previous;
    default:
      return false;
  }
}

/** Evaluates many rules and returns those that fired. */
export function evaluateRules(
  rules: readonly AlertRule[],
  contextFor: (metric: string) => AlertContext,
): AlertRule[] {
  return rules.filter((rule) => evaluateAlert(rule, contextFor(rule.metric)));
}
