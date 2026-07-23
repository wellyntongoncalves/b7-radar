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
            <Stat label="Preço médio" value={brl(agg.avgPriceReais)} />
            <Stat label="Mediana" value={brl(agg.medianPriceReais)} />
            <Stat label="Menor preço" value={brl(agg.minPriceReais)} />
            <Stat label="Maior preço" value={brl(agg.maxPriceReais)} />
            <Stat label="Vendas observadas" value={agg.totalObservedSales.toLocaleString('pt-BR')} />
            <Stat
              label="Vendas estimadas"
              value={agg.totalEstimatedSales.toLocaleString('pt-BR')}
              estimated
            />
            <Stat label="Receita estimada" value={brl(agg.estimatedRevenueReais)} estimated />
            <Stat label="Com frete grátis" value={`${agg.freeShippingCount}/${agg.count}`} />
          </div>
          <p className="b7-disclaimer">
            Vendas e receita estimadas são aproximações rotuladas, calculadas a partir dos
            anúncios carregados nesta página — não são valores exatos.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, estimated }: { label: string; value: string; estimated?: boolean }) {
  return (
    <div className="b7-metric">
      <div className="b7-metric__label">{label}</div>
      <div className="b7-metric__value">{value}</div>
      {estimated && (
        <div className="b7-metric__tags">
          <span className="b7-chip" style={{ color: 'var(--b7-warning)' }}>
            Estimado
          </span>
        </div>
      )}
    </div>
  );
}
