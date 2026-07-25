'use client';

import {
  computeContribution,
  computePriceForMargin,
  FeeListingType,
  formatBRL,
  formatPercent,
  type ContributionResult,
  type PriceForMarginResult,
} from '@b7/calculations';
import { useMemo, useState } from 'react';

type Mode = 'price' | 'margin';

interface Inputs {
  priceReais: number;
  productCostReais: number;
  extraCostsReais: number;
  taxPercent: number;
  adPercent: number;
  monthlySalesEstimate: number;
  desiredMarginPercent: number;
}

const INITIAL: Inputs = {
  priceReais: 200,
  productCostReais: 80,
  extraCostsReais: 0,
  taxPercent: 7,
  adPercent: 0,
  monthlySalesEstimate: 0,
  desiredMarginPercent: 30,
};

/** B7 Margem — Modo A (preço informado) e Modo B (margem desejada). */
export function MargemCalculator() {
  const [mode, setMode] = useState<Mode>('price');
  const [inputs, setInputs] = useState<Inputs>(INITIAL);

  function set<K extends keyof Inputs>(key: K, value: number) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <div className="b7-segmented" role="tablist" aria-label="Modo de cálculo">
        <button
          role="tab"
          aria-selected={mode === 'price'}
          className="b7-seg"
          onClick={() => setMode('price')}
        >
          Preço informado
        </button>
        <button
          role="tab"
          aria-selected={mode === 'margin'}
          className="b7-seg"
          onClick={() => setMode('margin')}
        >
          Margem desejada
        </button>
      </div>

      <div className="b7-grid b7-grid--2">
        <div className="b7-card">
          <h2>Entradas</h2>
          <NumberField label="Custo do produto (R$)" value={inputs.productCostReais} onChange={(v) => set('productCostReais', v)} />
          <NumberField label="Custos extras (R$)" value={inputs.extraCostsReais} onChange={(v) => set('extraCostsReais', v)} />
          <NumberField label="Imposto (%)" value={inputs.taxPercent} onChange={(v) => set('taxPercent', v)} />
          <NumberField label="Publicidade (%)" value={inputs.adPercent} onChange={(v) => set('adPercent', v)} />
          {mode === 'price' ? (
            <>
              <NumberField label="Preço de venda (R$)" value={inputs.priceReais} onChange={(v) => set('priceReais', v)} />
              <NumberField label="Vendas/mês (estimativa)" value={inputs.monthlySalesEstimate} onChange={(v) => set('monthlySalesEstimate', v)} />
            </>
          ) : (
            <>
              <NumberField label="Margem desejada (%)" value={inputs.desiredMarginPercent} onChange={(v) => set('desiredMarginPercent', v)} />
              <NumberField label="Preço atual (R$, opcional)" value={inputs.priceReais} onChange={(v) => set('priceReais', v)} />
            </>
          )}
        </div>

        <div className="b7-card">
          {mode === 'price' ? <ModeAResults inputs={inputs} /> : <ModeBResults inputs={inputs} />}
        </div>
      </div>
    </>
  );
}

function ModeAResults({ inputs }: { inputs: Inputs }) {
  const results = useMemo(() => {
    const base = {
      priceReais: inputs.priceReais,
      productCostReais: inputs.productCostReais,
      extraCostsReais: inputs.extraCostsReais,
      taxPercent: inputs.taxPercent,
      adPercent: inputs.adPercent,
      ...(inputs.monthlySalesEstimate > 0 ? { monthlySalesEstimate: inputs.monthlySalesEstimate } : {}),
    };
    return {
      classic: computeContribution({ ...base, listingType: FeeListingType.Classic }),
      premium: computeContribution({ ...base, listingType: FeeListingType.Premium }),
    };
  }, [inputs]);

  return (
    <>
      <h2>Comparação de modalidades</h2>
      <div className="b7-grid b7-grid--2">
        <ContribColumn title="Clássico" r={results.classic} win />
        <ContribColumn title="Premium" r={results.premium} />
      </div>
      <p className="b7-disclaimer">
        <span className="b7-badge b7-badge--calc">Calculado</span> por @b7/calculations
        ({results.classic.formulaVersion}). Tarifas na tabela configurável.
      </p>
    </>
  );
}

function ModeBResults({ inputs }: { inputs: Inputs }) {
  const results = useMemo(() => {
    const base = {
      productCostReais: inputs.productCostReais,
      extraCostsReais: inputs.extraCostsReais,
      taxPercent: inputs.taxPercent,
      adPercent: inputs.adPercent,
      desiredMarginPercent: inputs.desiredMarginPercent,
      ...(inputs.priceReais > 0 ? { currentPriceReais: inputs.priceReais } : {}),
    };
    try {
      return {
        classic: computePriceForMargin({ ...base, listingType: FeeListingType.Classic }),
        premium: computePriceForMargin({ ...base, listingType: FeeListingType.Premium }),
        error: null as string | null,
      };
    } catch (err) {
      return { classic: null, premium: null, error: (err as Error).message };
    }
  }, [inputs]);

  if (results.error) {
    return (
      <>
        <h2>Preço recomendado</h2>
        <p className="b7-disclaimer" role="alert">
          Combinação inviável: as taxas somadas à margem desejada ultrapassam 100% do preço.
          Reduza a margem, o imposto ou a publicidade.
        </p>
      </>
    );
  }

  return (
    <>
      <h2>Preço recomendado</h2>
      <div className="b7-grid b7-grid--2">
        <PriceColumn title="Clássico" r={results.classic!} win />
        <PriceColumn title="Premium" r={results.premium!} />
      </div>
      <p className="b7-disclaimer">
        <span className="b7-badge b7-badge--calc">Calculado</span> — preço mínimo (equilíbrio),
        recomendado (margem desejada) e psicológico (termina em ,90).
      </p>
    </>
  );
}

function ContribColumn({ title, r, win }: { title: string; r: ContributionResult; win?: boolean }) {
  const profitClass = r.unitProfitCents >= 0 ? 'b7-pos' : 'b7-neg';
  return (
    <div className={win ? 'b7-mode b7-mode--win' : 'b7-mode'}>
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

function PriceColumn({ title, r, win }: { title: string; r: PriceForMarginResult; win?: boolean }) {
  return (
    <div className={win ? 'b7-mode b7-mode--win' : 'b7-mode'}>
      <div className="b7-kpi__label">{title}</div>
      <div className="b7-kpi__value">{formatBRL(r.recommendedPriceCents)}</div>
      <div className="b7-kpi__hint">preço recomendado</div>
      <div style={{ marginTop: 12 }}>
        <Row label="Preço mínimo" value={formatBRL(r.minimumPriceCents)} />
        <Row label="Preço psicológico" value={formatBRL(r.psychologicalPriceCents)} />
        {r.differenceToCurrentCents !== null && (
          <Row
            label="Diferença p/ atual"
            value={`${r.differenceToCurrentCents >= 0 ? '+' : ''}${formatBRL(r.differenceToCurrentCents)}`}
          />
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
