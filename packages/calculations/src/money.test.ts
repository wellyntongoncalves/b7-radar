import { describe, expect, it } from 'vitest';
import {
  centsToReais,
  formatBRL,
  formatPercent,
  percentOfCents,
  reaisToCents,
  roundHalfAwayFromZero,
} from './money.js';

describe('money', () => {
  it('converts reais to cents rounding half away from zero', () => {
    expect(reaisToCents(189.45)).toBe(18945);
    expect(reaisToCents(0.1)).toBe(10);
    expect(reaisToCents(2.005)).toBe(201); // 200.5 -> 201
  });

  it('avoids floating point drift', () => {
    expect(reaisToCents(0.1 + 0.2)).toBe(30);
  });

  it('round trips cents to reais', () => {
    expect(centsToReais(20085)).toBeCloseTo(200.85, 5);
  });

  it('rounds ties away from zero symmetrically', () => {
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
  });

  it('computes percent of cents', () => {
    expect(percentOfCents(20085, 14.35)).toBe(2882); // 2882.2 -> 2882
    expect(percentOfCents(10000, 7)).toBe(700);
  });

  it('formats BRL in pt-BR', () => {
    expect(formatBRL(20085).replace(/\s/g, ' ')).toBe('R$ 200,85');
  });

  it('formats percent in pt-BR', () => {
    expect(formatPercent(14.35)).toBe('14,35%');
  });
});
