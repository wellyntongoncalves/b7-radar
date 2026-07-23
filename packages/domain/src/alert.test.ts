import { describe, expect, it } from 'vitest';
import { AlertOperator, evaluateAlert, evaluateRules } from './alert.js';

describe('evaluateAlert', () => {
  it('handles comparison operators', () => {
    expect(evaluateAlert({ metric: 'p', operator: AlertOperator.GreaterThan, threshold: 100 }, { current: 120 })).toBe(true);
    expect(evaluateAlert({ metric: 'p', operator: AlertOperator.LessThan, threshold: 100 }, { current: 120 })).toBe(false);
    expect(evaluateAlert({ metric: 'p', operator: AlertOperator.LessOrEqual, threshold: 100 }, { current: 100 })).toBe(true);
  });

  it('handles change operators against a previous value', () => {
    expect(evaluateAlert({ metric: 'p', operator: AlertOperator.Decreased }, { current: 90, previous: 100 })).toBe(true);
    expect(evaluateAlert({ metric: 'p', operator: AlertOperator.Increased }, { current: 110, previous: 100 })).toBe(true);
    expect(evaluateAlert({ metric: 'p', operator: AlertOperator.Changed }, { current: 100, previous: 100 })).toBe(false);
  });

  it('never triggers on unavailable current value', () => {
    expect(evaluateAlert({ metric: 'p', operator: AlertOperator.GreaterThan, threshold: 1 }, { current: null })).toBe(false);
  });

  it('never triggers a change operator without a previous value', () => {
    expect(evaluateAlert({ metric: 'p', operator: AlertOperator.Decreased }, { current: 90 })).toBe(false);
  });

  it('respects the enabled flag', () => {
    expect(
      evaluateAlert({ metric: 'p', operator: AlertOperator.GreaterThan, threshold: 1, enabled: false }, { current: 100 }),
    ).toBe(false);
  });

  it('evaluateRules returns only fired rules', () => {
    const fired = evaluateRules(
      [
        { metric: 'price', operator: AlertOperator.LessThan, threshold: 100 },
        { metric: 'stock', operator: AlertOperator.LessOrEqual, threshold: 0 },
      ],
      (metric) => (metric === 'price' ? { current: 80 } : { current: 5 }),
    );
    expect(fired).toHaveLength(1);
    expect(fired[0]?.metric).toBe('price');
  });
});
