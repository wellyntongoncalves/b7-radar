import type { CostProfileInput } from './analyze.js';

/**
 * Local persistence via chrome.storage.local. The extension works fully offline;
 * a backend sync is optional and additive (not part of the MVP path here).
 */
const KEYS = {
  costProfile: 'b7.costProfile',
  favorites: 'b7.favorites',
  theme: 'b7.theme',
  snapshots: 'b7.snapshots',
} as const;

const MAX_SNAPSHOTS = 60;

export interface SavedListing {
  readonly externalListingId: string;
  readonly title: string;
  readonly url: string;
  readonly priceReais: number | null;
  readonly savedAt: string;
}

/** A real price reading captured from the page at a real moment. */
export interface PriceSnapshot {
  readonly priceReais: number;
  readonly capturedAt: string;
}

async function get<T>(key: string, fallback: T): Promise<T> {
  const res = await chrome.storage.local.get(key);
  return (res[key] as T) ?? fallback;
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export const storage = {
  getCostProfile: () => get<CostProfileInput | null>(KEYS.costProfile, null),
  setCostProfile: (p: CostProfileInput) => set(KEYS.costProfile, p),

  getFavorites: () => get<SavedListing[]>(KEYS.favorites, []),
  async addFavorite(listing: SavedListing): Promise<SavedListing[]> {
    const list = await get<SavedListing[]>(KEYS.favorites, []);
    if (list.some((l) => l.externalListingId === listing.externalListingId)) return list;
    const next = [listing, ...list];
    await set(KEYS.favorites, next);
    return next;
  },
  async removeFavorite(id: string): Promise<SavedListing[]> {
    const list = await get<SavedListing[]>(KEYS.favorites, []);
    const next = list.filter((l) => l.externalListingId !== id);
    await set(KEYS.favorites, next);
    return next;
  },

  getTheme: () => get<'light' | 'dark'>(KEYS.theme, 'light'),
  setTheme: (t: 'light' | 'dark') => set(KEYS.theme, t),

  async getSnapshots(listingId: string): Promise<PriceSnapshot[]> {
    const all = await get<Record<string, PriceSnapshot[]>>(KEYS.snapshots, {});
    return all[listingId] ?? [];
  },
  /**
   * Records a real price reading. Skips duplicates (same price as the last
   * snapshot) so history reflects actual changes, never repeated visits.
   */
  async recordSnapshot(listingId: string, snap: PriceSnapshot): Promise<PriceSnapshot[]> {
    if (!listingId || !Number.isFinite(snap.priceReais)) return [];
    const all = await get<Record<string, PriceSnapshot[]>>(KEYS.snapshots, {});
    const list = all[listingId] ?? [];
    const last = list[list.length - 1];
    if (last && last.priceReais === snap.priceReais) return list;
    const next = [...list, snap].slice(-MAX_SNAPSHOTS);
    all[listingId] = next;
    await set(KEYS.snapshots, all);
    return next;
  },
};
