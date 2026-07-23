import { describe, expect, it } from 'vitest';
import { computeOpportunityScore } from './opportunity.js';

describe('computeOpportunityScore', () => {
  it('scores a strong opportunity high', () => {
    const s = computeOpportunityScore({
      demand: 0.9,
      salesPace: 0.9,
      competition: 0.2,
      marginHealth: 0.8,
      concentration: 0.2,
      maturity: 0.2,
    });
    expect(s.score).toBeGreaterThan(75);
    expect(s.positives.length).toBeGreaterThan(0);
  });

  it('scores a weak opportunity low', () => {
    const s = computeOpportunityScore({
      demand: 0.1,
      salesPace: 0.1,
      competition: 0.9,
      marginHealth: 0.2,
      concentration: 0.9,
      maturity: 0.9,
    });
    expect(s.score).toBeLessThan(25);
    expect(s.attentionPoints.length).toBeGreaterThan(0);
  });

  it('inverts negative factors (high competition reduces score)', () => {
    const low = computeOpportunityScore({
      demand: 0.5,
      salesPace: 0.5,
      competition: 0.1,
      marginHealth: 0.5,
      concentration: 0.5,
      maturity: 0.5,
    });
    const high = computeOpportunityScore({
      demand: 0.5,
      salesPace: 0.5,
      competition: 0.9,
      marginHealth: 0.5,
      concentration: 0.5,
      maturity: 0.5,
    });
    expect(high.score).toBeLessThan(low.score);
  });

  it('clamps out-of-range factors and stays within 0..100', () => {
    const s = computeOpportunityScore({
      demand: 5,
      salesPace: -3,
      competition: 2,
      marginHealth: 1.5,
      concentration: -1,
      maturity: 0,
    });
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
  });
});
