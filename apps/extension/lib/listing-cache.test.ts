import { describe, expect, it } from 'vitest';
import { ListingCache } from './listing-cache.js';

describe('ListingCache', () => {
  it('isolates values by listingId (A never returns B)', () => {
    const cache = new ListingCache<number>();
    cache.set('MLB111', 111);
    cache.set('MLB222', 222);
    expect(cache.get('MLB111')).toBe(111);
    expect(cache.get('MLB222')).toBe(222);
    expect(cache.get('MLB333')).toBeNull();
  });

  it('isolates variations of the same listing', () => {
    const cache = new ListingCache<string>();
    cache.set('MLB1', 'preto', 'var-preto');
    cache.set('MLB1', 'azul', 'var-azul');
    expect(cache.get('MLB1', 'var-preto')).toBe('preto');
    expect(cache.get('MLB1', 'var-azul')).toBe('azul');
  });

  it('expires entries after the TTL', () => {
    let t = 1_000;
    const cache = new ListingCache<number>(100, () => t);
    cache.set('MLB1', 1);
    t = 1_050;
    expect(cache.get('MLB1')).toBe(1); // not yet expired
    t = 1_200;
    expect(cache.get('MLB1')).toBeNull(); // expired
  });

  it('prunes expired entries', () => {
    let t = 0;
    const cache = new ListingCache<number>(100, () => t);
    cache.set('A', 1);
    cache.set('B', 2);
    t = 200;
    cache.prune();
    expect(cache.size).toBe(0);
  });

  it('deletes a single listing without touching others', () => {
    const cache = new ListingCache<number>();
    cache.set('A', 1);
    cache.set('B', 2);
    cache.delete('A');
    expect(cache.get('A')).toBeNull();
    expect(cache.get('B')).toBe(2);
  });
});
