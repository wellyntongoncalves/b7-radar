import type { NormalizedListing } from '@b7/shared-types';
import { useEffect, useState } from 'react';
import { analyzeListing, type CostProfileInput } from '../lib/analyze.js';
import { relativeTime } from '../lib/format.js';
import { storage, type SavedListing } from '../lib/storage.js';
import { MetricCard } from './MetricCard.js';

interface PanelProps {
  listing: NormalizedListing;
  onClose: () => void;
}

/** The B7 Radar product-page panel. Recolhível, salva localmente, sem quebrar a página. */
export function Panel({ listing, onClose }: PanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState<CostProfileInput | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    storage.getCostProfile().then(setProfile);
    storage.getFavorites().then((f) =>
      setSaved(f.some((l) => l.externalListingId === listing.externalListingId.value)),
    );
  }, [listing.externalListingId.value]);

  const { metrics } = analyzeListing(listing, profile);

  async function handleSave() {
    const fav: SavedListing = {
      externalListingId: listing.externalListingId.value ?? listing.url,
      title: listing.title.value ?? 'Anúncio',
      url: listing.url,
      priceReais: listing.price.value,
      savedAt: new Date().toISOString(),
    };
    await storage.addFavorite(fav);
    setSaved(true);
  }

  return (
    <div className="b7-panel" data-collapsed={collapsed}>
      <header className="b7-panel__header">
        <div className="b7-panel__brand">
          <span className="b7-logo" aria-hidden />
          <div>
            <strong>B7 Radar</strong>
            <div className="b7-panel__sub">{truncate(listing.title.value ?? 'Anúncio', 42)}</div>
          </div>
        </div>
        <div className="b7-panel__actions">
          <button className="b7-icon-btn" onClick={() => setCollapsed((c) => !c)} title="Minimizar">
            {collapsed ? '▸' : '▾'}
          </button>
          <button className="b7-icon-btn" onClick={onClose} title="Fechar">
            ✕
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="b7-panel__body">
          <div className="b7-panel__meta">
            <span>ID: {listing.externalListingId.value ?? '—'}</span>
            <span>Atualizado {relativeTime(listing.capturedAt)}</span>
          </div>

          <div className="b7-metrics-grid">
            {metrics.map((m) => (
              <MetricCard key={m.key} metric={m} />
            ))}
          </div>

          {!profile && (
            <div className="b7-hint">
              Configure custo e imposto no popup da extensão para ver margem, ROI e ponto de
              equilíbrio.
            </div>
          )}

          <button className="b7-btn b7-btn--primary" onClick={handleSave} disabled={saved}>
            {saved ? 'Salvo no B7 Monitor' : 'Salvar no B7 Monitor'}
          </button>

          <p className="b7-disclaimer">
            Valores marcados como “Estimado” são aproximações, não dados exatos. A origem e a
            confiança de cada métrica são exibidas em cada bloco.
          </p>
        </div>
      )}
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
