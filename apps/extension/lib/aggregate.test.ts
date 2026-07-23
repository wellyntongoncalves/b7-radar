import { describe, expect, it } from 'vitest';
import {
  MercadoLivreDomAdapter,
  makeSearchFixtureRoot,
} from '@b7/marketplace-adapters';
import { aggregateSearch } from './aggregate.js';

const adapter = new MercadoLivreDomAdapter();

describe('aggregateSearch', () => {
  const listings = adapter.extractSearchResults({
    url: 'https://lista.mercadolivre.com.br/relogio',
    root: makeSearchFixtureRoot(),
    nowIso: '2026-07-23T12:00:00Z',
  });

  it('counts loaded results and priced items', () => {
    const agg = aggregateSearch(listings);
    expect(agg.count).toBe(2);
    expect(agg.withPrice).toBe(2);
  });

  it('computes min, max and average price', () => {
    const agg = aggregateSearch(listings);
    expect(agg.minPriceReais).toBe(134);
    expect(agg.maxPriceReais).toBe(198);
    expect(agg.avgPriceReais).toBe(166);
  });

  it('never throws on empty input and returns null stats', () => {
    const agg = aggregateSearch([]);
    expect(agg.count).toBe(0);
    expect(agg.avgPriceReais).toBeNull();
    expect(agg.medianPriceReais).toBeNull();
  });
});
