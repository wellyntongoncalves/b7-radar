import { formatBRL } from '@b7/calculations';
import type { NormalizedListing } from '@b7/shared-types';
import { useState } from 'react';
import { aggregateSearch } from '../lib/aggregate.js';

function brl(reais: number | null): string {
  return reais === null ? '—' : formatBRL(Math.round(reais * 100));
}

/** Aggregated B7 Radar summary for a search results page. */
export function SearchSidebar({ listings }: { listings: NormalizedListing[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const agg = aggregateSearch(listings);

  return (
    <div className="b7-panel b7-panel--search" data-collapsed={collapsed}>
      <header className="b7-panel__header">
        <div className="b7-panel__brand">
          <span className="b7-logo" aria-hidden />
          <div>
            <strong>B7 Radar</strong>
            <div className="b7-panel__sub">Resumo da busca · {agg.count} anúncios</div>
          </div>
        </div>
        <button className="b7-icon-btn" onClick={() => setCollapsed((c) => !c)} title="Minimizar">
          {collapsed ? '▸' : '▾'}
        </button>
      </header>

      {!collapsed && (
        <div className="b7-panel__body">
          <div className="b7-metrics-grid">
            <Stat label="Anúncios analisados" value={agg.count.toLocaleString('pt-BR')} />
            <Stat label="Com preço" value={agg.withPrice.toLocaleString('pt-BR')} />
            <Stat label="Preço médio" value={brl(agg.avgPriceReais)} scope="da página" />
            <Stat label="Mediana" value={brl(agg.medianPriceReais)} scope="da página" />
            <Stat label="Menor preço" value={brl(agg.minPriceReais)} scope="da página" />
            <Stat label="Maior preço" value={brl(agg.maxPriceReais)} scope="da página" />
            <Stat
              label="Vendas informadas (total)"
              value={
                agg.totalReportedSales.toLocaleString('pt-BR') + (agg.hasGroupedSales ? '+' : '')
              }
              scope="da página"
            />
            <Stat label="Com frete grátis" value={`${agg.freeShippingCount}/${agg.count}`} />
          </div>
          <p className="b7-disclaimer">
            Somatórios e médias são calculados sobre os anúncios carregados nesta página, a partir
            das quantidades informadas pelo Mercado Livre (que podem ser agrupadas). Não são
            estimativas de vendas.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, scope }: { label: string; value: string; scope?: string }) {
  return (
    <div className="b7-metric">
      <div className="b7-metric__label">{label}</div>
      <div className="b7-metric__value">{value}</div>
      {scope && (
        <div className="b7-metric__tags">
          <span className="b7-chip b7-chip--muted">{scope}</span>
        </div>
      )}
    </div>
  );
}
