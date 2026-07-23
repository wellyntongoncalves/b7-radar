import {
  MercadoLivreDomAdapter,
  PRODUCT_FIXTURE_URL,
  makeProductFixtureRoot,
} from '@b7/marketplace-adapters';
import { FeeListingType } from '@b7/calculations';
import { DataClassification } from '@b7/shared-types';
import { describe, expect, it } from 'vitest';
import { analyzeListing } from './analyze.js';

const adapter = new MercadoLivreDomAdapter();
const listing = adapter.extractListing({
  url: PRODUCT_FIXTURE_URL,
  root: makeProductFixtureRoot(),
  nowIso: '2026-07-23T12:00:00Z',
});

describe('analyzeListing — conformidade', () => {
  it('nunca emite métrica com classificação Estimado', () => {
    const { metrics } = analyzeListing(listing, null);
    expect(metrics.every((m) => m.classification !== DataClassification.Estimated)).toBe(true);
  });

  it('toda métrica carrega escopo e vínculo com o listingId', () => {
    const { metrics } = analyzeListing(listing, null);
    expect(metrics.length).toBeGreaterThan(0);
    for (const m of metrics) {
      expect(m.scope).toBeTruthy();
      expect(m.listingId).toBe('MLB123456789');
    }
  });

  it('"Vendas informadas" preserva o texto agrupado e a flag', () => {
    const { metrics } = analyzeListing(listing, null);
    const sales = metrics.find((m) => m.key === 'sales_reported');
    expect(sales?.rawText).toBe('+500 vendidos');
    expect(sales?.isGrouped).toBe(true);
    expect(sales?.classification).toBe(DataClassification.Observed);
  });

  it('faturamento é Calculado (preço × quantidade informada), não estimado', () => {
    const { metrics } = analyzeListing(listing, null);
    const rev = metrics.find((m) => m.key === 'gross_revenue_calc');
    expect(rev?.classification).toBe(DataClassification.Calculated);
    expect(rev?.value).toBe(200 * 500);
    expect(rev?.limitation).toBeTruthy();
  });

  it('margem/ROI só aparecem com perfil de custo configurado', () => {
    const semPerfil = analyzeListing(listing, null).metrics.map((m) => m.key);
    expect(semPerfil).not.toContain('contribution_margin');
    const comPerfil = analyzeListing(listing, {
      productCostReais: 80,
      taxPercent: 7,
      listingType: FeeListingType.Classic,
    }).metrics.map((m) => m.key);
    expect(comPerfil).toContain('contribution_margin');
  });
});
