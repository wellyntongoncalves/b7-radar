import { FORMULA_VERSIONS } from './version.js';

/**
 * B7 Opportunity Score — a transparent 0..100 score. No black box: each factor
 * contributes a weighted, normalized sub-score, and the result exposes exactly
 * which factors pushed the score up or down. Weights are configurable.
 */

export interface OpportunityFactors {
  /** Observed/estimated demand signal, normalized 0..1 (higher = more demand). */
  readonly demand: number;
  /** Sales pace signal, 0..1 (higher = faster). */
  readonly salesPace: number;
  /** Competition intensity, 0..1 (higher = MORE competition, i.e. worse). */
  readonly competition: number;
  /** Estimated margin health, 0..1 (higher = healthier). */
  readonly marginHealth: number;
  /** Sales concentration among top sellers, 0..1 (higher = MORE concentrated, worse). */
  readonly concentration: number;
  /** Maturity of leading listings, 0..1 (higher = older/entrenched, worse). */
  readonly maturity: number;
}

export interface OpportunityWeights {
  readonly demand: number;
  readonly salesPace: number;
  readonly competition: number;
  readonly marginHealth: number;
  readonly concentration: number;
  readonly maturity: number;
}

/** Default weights. Positive factors and inverted-negative factors sum to 1. */
export const DEFAULT_OPPORTUNITY_WEIGHTS: OpportunityWeights = {
  demand: 0.25,
  salesPace: 0.2,
  competition: 0.2,
  marginHealth: 0.2,
  concentration: 0.1,
  maturity: 0.05,
};

export interface FactorContribution {
  readonly key: keyof OpportunityFactors;
  readonly label: string;
  /** Points this factor added to the final 0..100 score. */
  readonly points: number;
  readonly positive: boolean;
}

export interface OpportunityScore {
  readonly formulaVersion: string;
  /** Final score, integer 0..100. */
  readonly score: number;
  readonly contributions: readonly FactorContribution[];
  readonly positives: readonly FactorContribution[];
  readonly attentionPoints: readonly FactorContribution[];
}

const FACTOR_LABELS: Record<keyof OpportunityFactors, string> = {
  demand: 'demanda',
  salesPace: 'ritmo de vendas',
  competition: 'concorrência',
  marginHealth: 'margem estimada',
  concentration: 'concentração de vendas',
  maturity: 'maturidade dos líderes',
};

/** Factors where a HIGHER raw value is WORSE and must be inverted. */
const NEGATIVE_FACTORS: ReadonlySet<keyof OpportunityFactors> = new Set([
  'competition',
  'concentration',
  'maturity',
]);

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function computeOpportunityScore(
  factors: OpportunityFactors,
  weights: OpportunityWeights = DEFAULT_OPPORTUNITY_WEIGHTS,
): OpportunityScore {
  const keys = Object.keys(weights) as (keyof OpportunityFactors)[];
  const contributions: FactorContribution[] = keys.map((key) => {
    const raw = clamp01(factors[key]);
    const effective = NEGATIVE_FACTORS.has(key) ? 1 - raw : raw;
    const points = effective * weights[key] * 100;
    return {
      key,
      label: FACTOR_LABELS[key],
      points: Math.round(points * 10) / 10,
      // "positive" means the factor is currently helping the opportunity.
      positive: effective >= 0.5,
    };
  });

  const score = Math.round(
    contributions.reduce((sum, c) => sum + c.points, 0),
  );
  const clamped = Math.min(100, Math.max(0, score));

  return {
    formulaVersion: FORMULA_VERSIONS.opportunityScore,
    score: clamped,
    contributions,
    positives: contributions.filter((c) => c.positive),
    attentionPoints: contributions.filter((c) => !c.positive),
  };
}
