import { describe, expect, it } from 'vitest';
import { parseBrNumber, parseGroupedQuantity } from './capture.js';

describe('parseBrNumber', () => {
  it('parses pt-BR formatted numbers', () => {
    expect(parseBrNumber('1.234,56')).toBeCloseTo(1234.56, 2);
    expect(parseBrNumber('198')).toBe(198);
    expect(parseBrNumber('R$ 1.999')).toBe(1999);
  });

  it('returns null for empty or non-numeric input', () => {
    expect(parseBrNumber('')).toBeNull();
    expect(parseBrNumber(null)).toBeNull();
    expect(parseBrNumber('grátis')).toBeNull();
  });
});

describe('parseGroupedQuantity', () => {
  it('applies the magnitude word (never off by orders of magnitude)', () => {
    const mil = parseGroupedQuantity('+10 mil');
    expect(mil.value).toBe(10000);
    expect(mil.isGrouped).toBe(true);
    expect(mil.rawText).toBe('+10 mil');

    const milhao = parseGroupedQuantity('+2 milhões vendidos');
    expect(milhao.value).toBe(2_000_000);
    expect(milhao.isGrouped).toBe(true);
  });

  it('flags "+N" as grouped but keeps the number', () => {
    const r = parseGroupedQuantity('+500 vendidos');
    expect(r.value).toBe(500);
    expect(r.isGrouped).toBe(true);
    expect(r.rawText).toBe('+500 vendidos');
  });

  it('treats a plain number as not grouped', () => {
    const r = parseGroupedQuantity('42 vendidos');
    expect(r.value).toBe(42);
    expect(r.isGrouped).toBe(false);
  });

  it('returns null value when there is no number', () => {
    expect(parseGroupedQuantity('sem vendas').value).toBeNull();
    expect(parseGroupedQuantity(null).value).toBeNull();
  });
});
