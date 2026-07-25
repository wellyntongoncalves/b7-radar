import { FeeListingType, formatBRL } from '@b7/calculations';
import { useEffect, useState } from 'react';
import type { CostProfileInput } from '../../lib/analyze.js';
import { storage, type SavedListing } from '../../lib/storage.js';
import { summarizePriceHistory, type PriceHistorySummary } from '../../lib/history.js';

/** Popup: configure cost profile, toggle theme, and review saved listings. */
export function App() {
  const [profile, setProfile] = useState<CostProfileInput>({
    productCostReais: 0,
    taxPercent: 7,
    extraCostsReais: 0,
    listingType: FeeListingType.Classic,
  });
  const [favorites, setFavorites] = useState<SavedListing[]>([]);
  const [history, setHistory] = useState<Record<string, PriceHistorySummary | null>>({});
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    storage.getCostProfile().then((p) => p && setProfile(p));
    storage.getFavorites().then(loadFavorites);
    storage.getTheme().then((t) => {
      setTheme(t);
      document.documentElement.setAttribute('data-theme', t);
    });
  }, []);

  async function loadFavorites(list: SavedListing[]) {
    setFavorites(list);
    const entries = await Promise.all(
      list.slice(0, 8).map(async (f) => {
        const snaps = await storage.getSnapshots(f.externalListingId);
        return [f.externalListingId, summarizePriceHistory(snaps)] as const;
      }),
    );
    setHistory(Object.fromEntries(entries));
  }

  async function saveProfile() {
    await storage.setCostProfile(profile);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1500);
  }

  async function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    await storage.setTheme(next);
  }

  return (
    <div className="b7-popup">
      <header className="b7-popup__header">
        <span className="b7-logo" aria-hidden />
        <div>
          <strong>B7 Radar</strong>
          <div className="b7-popup__slogan">Dados organizados. Decisões mais fortes.</div>
        </div>
        <button className="b7-icon-btn" onClick={toggleTheme} title="Tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      <section className="b7-card">
        <h2>Perfil de custo</h2>
        <label>
          Custo do produto (R$)
          <input
            type="number"
            min={0}
            step="0.01"
            value={profile.productCostReais}
            onChange={(e) =>
              setProfile({ ...profile, productCostReais: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Custos extras (R$)
          <input
            type="number"
            min={0}
            step="0.01"
            value={profile.extraCostsReais ?? 0}
            onChange={(e) => setProfile({ ...profile, extraCostsReais: Number(e.target.value) })}
          />
        </label>
        <label>
          Imposto (%)
          <input
            type="number"
            min={0}
            step="0.01"
            value={profile.taxPercent}
            onChange={(e) => setProfile({ ...profile, taxPercent: Number(e.target.value) })}
          />
        </label>
        <label>
          Tipo de anúncio
          <select
            value={profile.listingType}
            onChange={(e) =>
              setProfile({ ...profile, listingType: e.target.value as FeeListingType })
            }
          >
            <option value={FeeListingType.Classic}>Clássico</option>
            <option value={FeeListingType.Premium}>Premium</option>
          </select>
        </label>
        <button className="b7-btn b7-btn--primary" onClick={saveProfile}>
          {savedMsg ? 'Salvo ✓' : 'Salvar perfil'}
        </button>
      </section>

      <section className="b7-card">
        <h2>Salvos no B7 Monitor ({favorites.length})</h2>
        {favorites.length === 0 && <p className="b7-muted">Nenhum anúncio salvo ainda.</p>}
        <ul className="b7-fav-list">
          {favorites.slice(0, 8).map((f) => {
            const h = history[f.externalListingId];
            return (
              <li key={f.externalListingId}>
                <div className="b7-fav-main">
                  <a href={f.url} target="_blank" rel="noreferrer">
                    {f.title}
                  </a>
                  {h && (
                    <span className="b7-fav-meta">
                      {formatBRL(Math.round(h.lastReais * 100))}
                      <span
                        className={`b7-delta ${h.deltaReais > 0 ? 'b7-delta--up' : h.deltaReais < 0 ? 'b7-delta--down' : ''}`}
                      >
                        {h.deltaReais === 0
                          ? 'estável'
                          : `${h.deltaReais > 0 ? '▲' : '▼'} ${formatBRL(Math.round(Math.abs(h.deltaReais) * 100))}`}
                      </span>
                    </span>
                  )}
                </div>
                <button
                  className="b7-icon-btn"
                  onClick={() => storage.removeFavorite(f.externalListingId).then(loadFavorites)}
                  title="Remover"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="b7-popup__footer">Inteligência de mercado por Bloco 7</footer>
    </div>
  );
}
