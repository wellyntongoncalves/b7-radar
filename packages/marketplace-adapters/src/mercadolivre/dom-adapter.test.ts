import { ConfidenceLevel, DataClassification, PageKind } from '@b7/shared-types';
import { describe, expect, it } from 'vitest';
import { MercadoLivreDomAdapter } from './dom-adapter.js';
import {
  PRODUCT_FIXTURE_URL,
  makeProductFixtureRoot,
  makeSearchFixtureRoot,
} from './fixtures.js';

const NOW = '2026-07-23T12:00:00Z';
const adapter = new MercadoLivreDomAdapter();

describe('identifyPage', () => {
  it('detects a product page', () => {
    expect(adapter.identifyPage(PRODUCT_FIXTURE_URL)).toBe(PageKind.Product);
  });

  it('detects a search page', () => {
    expect(
      adapter.identifyPage('https://lista.mercadolivre.com.br/relogio-digital'),
    ).toBe(PageKind.Search);
  });

  it('rejects non-Mercado Livre URLs', () => {
    expect(adapter.identifyPage('https://example.com/x')).toBe(PageKind.Unsupported);
  });

  it('handles malformed URLs without throwing', () => {
    expect(adapter.identifyPage('not a url')).toBe(PageKind.Unsupported);
  });
});

describe('extractListing (product)', () => {
  const listing = adapter.extractListing({
    url: PRODUCT_FIXTURE_URL,
    root: makeProductFixtureRoot(),
    nowIso: NOW,
  });

  it('captures the title as observed with high confidence', () => {
    expect(listing.title.value).toContain('Relógio');
    expect(listing.title.classification).toBe(DataClassification.Observed);
    expect(listing.title.confidence).toBe(ConfidenceLevel.High);
  });

  it('parses price and original price', () => {
    expect(listing.price.value).toBe(200);
    expect(listing.originalPrice.value).toBe(260);
  });

  it('parses sold quantity from "+500 vendidos"', () => {
    expect(listing.soldQuantity.value).toBe(500);
  });

  it('extracts the listing id from the URL', () => {
    expect(listing.externalListingId.value).toBe('MLB123456789');
  });

  it('marks unavailable fields honestly (no invented values)', () => {
    expect(listing.createdAt.value).toBeNull();
    expect(listing.createdAt.confidence).toBe(ConfidenceLevel.Unavailable);
    expect(listing.createdAt.error).toBeTruthy();
  });

  it('stamps provenance on every captured field', () => {
    expect(listing.price.source).toBe('mercadolivre.dom');
    expect(listing.price.capturedAt).toBe(NOW);
  });

  it('detects free shipping', () => {
    expect(listing.freeShipping.value).toBe(true);
  });
});

describe('extractSearchResults', () => {
  it('normalizes each result with provenance', () => {
    const results = adapter.extractSearchResults({
      url: 'https://lista.mercadolivre.com.br/relogio',
      root: makeSearchFixtureRoot(),
      nowIso: NOW,
    });
    expect(results).toHaveLength(2);
    expect(results[0]?.price.value).toBe(198);
    expect(results[0]?.externalListingId.value).toBe('MLB111');
    expect(results[1]?.title.value).toContain('Amoled');
  });
});

describe('getSourceMetadata', () => {
  it('reports the DOM strategy and selector registry version', () => {
    const meta = adapter.getSourceMetadata();
    expect(meta.strategy).toBe('DOM');
    expect(meta.selectorRegistryVersion).toMatch(/ml-selectors@/);
  });
});
