'use client';

import {
  computeContribution,
  FeeListingType,
  formatBRL,
  formatPercent,
  type ContributionResult,
} from '@b7/calculations';
import { useMemo, useState } from 'react';

interface Inputs {
  priceReais: number;
  productCostReais: number;
  extraCostsReais: number;
  taxPercent: number;
  adPercent: number;
  monthlySalesEstimate: number;
}

const INITIAL: Inputs = {
  priceReais: 200,
  productCostReais: 80,
  extraCostsReais: 0,
  taxPercent: 7,
  adPercent: 0,
  monthlySalesEstimate: 0,
};

/** B7 Margem — Modo A (preço informado) com comparação Clássico × Premium. */
export function MargemCalculator() {
  const [inputs, setInputs] = useState<Inputs>(INITIAL);

  const results = useMemo(() => {
    const base = {
      priceReais: inputs.priceReais,
      productCostReais: inputs.productCostReais,
      extraCostsReais: inputs.extraCostsReais,
      taxPercent: inputs.taxPercent,
      adPercent: inputs.adPercent,
      // Only include the optional estimate when the user provided one, to
      // satisfy exactOptionalPropertyTypes (no explicit undefined).
      ...(inputs.monthlySalesEstimate > 0
        ? { monthlySalesEstimate: inputs.monthlySalesEstimate }
        : {}),
    };
    return {
      classic: computeContribution({ ...base, listingType: FeeListingType.Classic }),
      premium: computeContribution({ ...base, listingType: FeeListingType.Premium }),
    };
  }, [inputs]);

  function set<K extends keyof Inputs>(key: K, value: number) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="b7-grid b7-grid--2">
      <div className="b7-card">
        <h2>Entradas</h2>
        <NumberField label="Preço de venda (R$)" value={inputs.priceReais} onChange={(v) => set('priceReais', v)} />
        <NumberField label="Custo do produto (R$)" value={inputs.productCostReais} onChange={(v) => set('productCostReais', v)} />
        <NumberField label="Custos extras (R$)" value={inputs.extraCostsReais} onChange={(v) => set('extraCostsReais', v)} />
        <NumberField label="Imposto (%)" value={inputs.taxPercent} onChange={(v) => set('taxPercent', v)} />
        <NumberField label="Publicidade (%)" value={inputs.adPercent} onChange={(v) => set('adPercent', v)} />
        <NumberField label="Vendas/mês (estimativa)" value={inputs.monthlySalesEstimate} onChange={(v) => set('monthlySalesEstimate', v)} />
      </div>

      <div className="b7-card">
        <h2>Comparação de modalidades</h2>
        <div className="b7-grid b7-grid--2">
          <ResultColumn title="Clássico" r={results.classic} />
          <ResultColumn title="Premium" r={results.premium} />
        </div>
        <p className="b7-disclaimer">
          Valores <span className="b7-badge b7-badge--calc">Calculado</span> pelo módulo
          @b7/calculations ({results.classic.formulaVersion}). As tarifas usam a tabela padrão
          configurável — verifique-a contra a política vigente do marketplace.
        </p>
      </div>
    </div>
  );
}

function ResultColumn({ title, r }: { title: string; r: ContributionResult }) {
  const profitClass = r.unitProfitCents >= 0 ? 'b7-pos' : 'b7-neg';
  return (
    <div>
      <div className="b7-kpi__label">{title}</div>
      <div className={`b7-kpi__value ${profitClass}`}>{formatBRL(r.contributionMarginCents)}</div>
      <div className="b7-kpi__hint">margem de contribuição</div>
      <div style={{ marginTop: 12 }}>
        <Row label="Comissão" value={formatBRL(r.commissionCents)} />
        <Row label="Tarifa fixa" value={formatBRL(r.fixedFeeCents)} />
        <Row label="Imposto" value={formatBRL(r.taxCents)} />
        <Row label="Custo total" value={formatBRL(r.totalCostCents)} />
        <Row label="Margem %" value={formatPercent(Math.round(r.marginPercent * 100) / 100)} />
        <Row label="ROI" value={formatPercent(Math.round(r.roiPercent * 100) / 100)} />
        <Row label="Preço mínimo" value={formatBRL(r.breakEvenPriceCents)} />
        {r.monthlyProfitCents !== null && (
          <Row label="Lucro mensal est." value={formatBRL(r.monthlyProfitCents)} />
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="b7-result-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        step="0.01"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
