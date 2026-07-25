import {
  LISTING_TYPE_LABEL,
  LOGISTICS_TYPE_LABEL,
  type CapturedField,
  type MetricValue,
  type NormalizedListing,
} from '@b7/shared-types';
import { useEffect, useMemo, useState } from 'react';
import { analyzeListing, type CostProfileInput } from '../lib/analyze.js';
import { formatBRL } from '@b7/calculations';
import { isStale, relativeTime } from '../lib/format.js';
import { storage, type PriceSnapshot, type SavedListing } from '../lib/storage.js';
import { summarizePriceHistory } from '../lib/history.js';
import { MetricCard } from './MetricCard.js';

interface PanelProps {
  listing: NormalizedListing;
  onClose: () => void;
}

const TABS = ['visao', 'vendas', 'preco', 'vendedor', 'logistica', 'historico'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  visao: 'Visão geral',
  vendas: 'Vendas',
  preco: 'Preço',
  vendedor: 'Vendedor',
  logistica: 'Logística',
  historico: 'Histórico',
};

// Which metric keys belong to which tab.
const TAB_METRICS: Record<Tab, string[]> = {
  visao: ['current_price', 'sales_reported', 'gross_revenue_calc', 'contribution_margin', 'roi_percent'],
  vendas: ['sales_reported', 'gross_revenue_calc'],
  preco: ['current_price'],
  vendedor: [],
  logistica: [],
  historico: [],
};

/** Painel de análise do anúncio, com abas — reflete os mockups B7 Radar. */
export function Panel({ listing, onClose }: PanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [compact, setCompact] = useState(false);
  const [tab, setTab] = useState<Tab>('visao');
  const [profile, setProfile] = useState<CostProfileInput | null>(null);
  const [saved, setSaved] = useState(false);
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);

  const listingId = listing.externalListingId.value;
  const stale = isStale(listing.capturedAt);

  useEffect(() => {
    storage.getCostProfile().then(setProfile);
    storage.getFavorites().then((f) => setSaved(f.some((l) => l.externalListingId === listingId)));
    if (listingId && listing.price.value !== null) {
      storage
        .recordSnapshot(listingId, { priceReais: listing.price.value, capturedAt: listing.capturedAt })
        .then(setSnapshots);
    } else if (listingId) {
      storage.getSnapshots(listingId).then(setSnapshots);
    }
  }, [listingId, listing.price.value, listing.capturedAt]);

  const history = useMemo(() => summarizePriceHistory(snapshots), [snapshots]);

  const { metrics } = useMemo(() => analyzeListing(listing, profile), [listing, profile]);
  const byKey = useMemo(() => new Map(metrics.map((m) => [m.key, m])), [metrics]);

  async function handleSave() {
    await storage.addFavorite({
      externalListingId: listingId ?? listing.url,
      title: listing.title.value ?? 'Anúncio',
      url: listing.url,
      priceReais: listing.price.value,
      savedAt: new Date().toISOString(),
    } satisfies SavedListing);
    setSaved(true);
  }

  return (
    <section
      className="b7-panel"
      data-collapsed={collapsed}
      data-compact={compact}
      role="complementary"
      aria-label="Painel B7 Radar"
    >
      <header className="b7-panel__header">
        <div className="b7-panel__brand">
          <span className="b7-logo" aria-hidden />
          <div>
            <strong>B7 Radar</strong>
            <div className="b7-panel__sub">{truncate(listing.title.value ?? 'Anúncio', 40)}</div>
            <div className="b7-panel__id">
              ID: {listingId ?? '—'} · atualizado {relativeTime(listing.capturedAt)}
              {stale && (
                <span className="b7-stale" title="Recarregue a página para capturar dados atuais.">
                  Desatualizado
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="b7-panel__actions">
          <button
            className="b7-icon-btn"
            onClick={() => setCompact((c) => !c)}
            aria-label={compact ? 'Modo confortável' : 'Modo compacto'}
            aria-pressed={compact}
            title={compact ? 'Modo confortável' : 'Modo compacto'}
          >
            {compact ? '▤' : '▥'}
          </button>
          <button className="b7-icon-btn" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? 'Expandir painel' : 'Minimizar painel'} aria-expanded={!collapsed}>
            {collapsed ? '▸' : '▾'}
          </button>
          <button className="b7-icon-btn" onClick={onClose} aria-label="Fechar painel">✕</button>
        </div>
      </header>

      {!collapsed && (
        <>
          <nav className="b7-tabs" aria-label="Seções da análise">
            {TABS.map((t) => (
              <button
                key={t}
                className="b7-tab"
                aria-current={tab === t ? 'page' : undefined}
                onClick={() => setTab(t)}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </nav>

          <div className="b7-panel__body">
            {(tab === 'visao' || tab === 'vendas' || tab === 'preco') && (
              <MetricGrid metrics={pick(byKey, TAB_METRICS[tab])} />
            )}

            {tab === 'vendas' && (
              <>
                <ListingField label="Avaliação média" field={listing.rating} scope="deste anúncio" />
                <ListingField label="Nº de avaliações" field={listing.reviewCount} scope="deste anúncio" />
                <FieldRow
                  label="Vendas observadas no período"
                  value={null}
                  unavailableReason="Requer histórico de snapshots ou dados da sua conta autorizada."
                  scope="deste anúncio"
                />
              </>
            )}

            {tab === 'preco' && (
              <>
                <ListingField label="Preço original" field={listing.originalPrice} money scope="deste anúncio" />
                <EnumField label="Tipo de anúncio" field={listing.listingType} labels={LISTING_TYPE_LABEL} scope="deste anúncio" />
                <ListingField label="Estoque disponível" field={listing.availableQuantity} scope="deste anúncio" />
              </>
            )}

            {tab === 'vendedor' && (
              <>
                <ListingField label="Vendedor" field={listing.seller.publicName} scope="do vendedor" />
                <ListingField label="ID do vendedor" field={listing.seller.externalSellerId} scope="do vendedor" />
                <ListingField label="Reputação" field={listing.seller.reputation} scope="do vendedor" />
                <ListingField label="Localização" field={listing.seller.location} scope="do vendedor" />
                <BoolField label="Loja oficial" field={listing.seller.officialStore} scope="do vendedor" />
              </>
            )}

            {tab === 'logistica' && (
              <>
                <EnumField
                  label="Logística"
                  field={listing.logistics}
                  labels={LOGISTICS_TYPE_LABEL}
                  scope="deste anúncio"
                />
                <BoolField label="Frete grátis" field={listing.freeShipping} scope="deste anúncio" />
                <ListingField label="Custo do frete" field={listing.shippingCost} money scope="deste anúncio" />
              </>
            )}

            {tab === 'historico' &&
              (history ? (
                <PriceHistory history={history} />
              ) : (
                <div className="b7-empty">
                  <strong>Histórico começando agora</strong>
                  <p>
                    A B7 Radar registrou {snapshots.length === 1 ? '1 leitura' : `${snapshots.length} leituras`} de
                    preço deste anúncio. Assim que o preço mudar em uma próxima visita, a variação real aparece aqui —
                    nada é estimado.
                  </p>
                </div>
              ))}

            {tab === 'visao' && !profile && (
              <div className="b7-hint">
                Configure custo e imposto no popup da extensão para ver margem, ROI e ponto de equilíbrio.
              </div>
            )}

            <button className="b7-btn b7-btn--primary" onClick={handleSave} disabled={saved}>
              {saved ? 'Salvo no B7 Monitor' : 'Salvar no B7 Monitor'}
            </button>

            <p className="b7-disclaimer">
              Cada métrica mostra sua origem e escopo. Valores agrupados pelo Mercado Livre (ex.: “+10 mil”) são exibidos como informados — não são convertidos em números exatos.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: MetricValue[] }) {
  if (metrics.length === 0) {
    return <div className="b7-empty"><p>Sem dados disponíveis nesta seção.</p></div>;
  }
  return (
    <div className="b7-metrics-grid">
      {metrics.map((m) => (
        <MetricCard key={m.key} metric={m} />
      ))}
    </div>
  );
}

function pick(byKey: Map<string, MetricValue>, keys: string[]): MetricValue[] {
  return keys.map((k) => byKey.get(k)).filter((m): m is MetricValue => m !== undefined);
}

function PriceHistory({
  history,
}: {
  history: import('../lib/history.js').PriceHistorySummary;
}) {
  const cents = (r: number) => formatBRL(Math.round(r * 100));
  const up = history.deltaReais > 0;
  const flat = history.deltaReais === 0;
  const dirClass = flat ? 'b7-chip--muted' : up ? 'b7-chip--cal' : 'b7-chip--auth';
  const sign = up ? '+' : '';
  return (
    <div className="b7-history">
      <div className="b7-metric">
        <div className="b7-metric__label">Variação de preço observada</div>
        <div className="b7-metric__value">
          {cents(history.firstReais)} → {cents(history.lastReais)}
        </div>
        <div className="b7-metric__tags">
          <span className={`b7-chip ${dirClass}`}>
            {flat ? 'estável' : `${sign}${cents(history.deltaReais)}`}
            {history.deltaPercent !== null && !flat ? ` (${sign}${history.deltaPercent}%)` : ''}
          </span>
          <span className="b7-chip b7-chip--muted">deste anúncio</span>
        </div>
        <div className="b7-metric__note">
          {history.count} leituras reais · mín {cents(history.minReais)} · máx {cents(history.maxReais)}
        </div>
      </div>
    </div>
  );
}

// ── field renderers for captured (non-metric) listing fields ────────────────

function FieldRow({
  label,
  value,
  scope,
  unavailableReason,
}: {
  label: string;
  value: string | null;
  scope: string;
  unavailableReason?: string;
}) {
  const unavailable = value === null;
  return (
    <div className="b7-metric">
      <div className="b7-metric__label">{label}</div>
      <div className="b7-metric__value" data-unavailable={unavailable}>{value ?? '—'}</div>
      <div className="b7-metric__tags"><span className="b7-chip b7-chip--muted">{scope}</span></div>
      {unavailable && unavailableReason && <div className="b7-metric__note">{unavailableReason}</div>}
    </div>
  );
}

function ListingField({
  label,
  field,
  scope,
  money,
}: {
  label: string;
  field: CapturedField<string> | CapturedField<number>;
  scope: string;
  money?: boolean;
}) {
  const v = field.value;
  const text = v === null ? null : money ? formatBRL(Math.round(Number(v) * 100)) : String(v);
  return <FieldRow label={label} value={text} scope={scope} unavailableReason={field.error ?? 'Indisponível nesta página.'} />;
}

function BoolField({ label, field, scope }: { label: string; field: CapturedField<boolean>; scope: string }) {
  const v = field.value;
  return <FieldRow label={label} value={v === null ? null : v ? 'Sim' : 'Não'} scope={scope} unavailableReason="Indisponível." />;
}

function EnumField<T extends string>({
  label,
  field,
  labels,
  scope,
}: {
  label: string;
  field: CapturedField<T>;
  labels: Record<T, string>;
  scope: string;
}) {
  const v = field.value;
  return <FieldRow label={label} value={v === null ? null : labels[v]} scope={scope} unavailableReason="Não identificado." />;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
