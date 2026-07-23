/**
 * Listing cache keyed by listingId. Owned by the background service worker
 * (spec §7). Guarantees isolation between listings — a value stored for listing
 * A is never returned for listing B — and expires entries after a short TTL so
 * stale data is not shown.
 */
export interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
}

export class ListingCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly ttlMs = 5 * 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  /** Composite key isolates variations of the same listing. */
  private key(listingId: string, variationId?: string): string {
    return variationId ? `${listingId}::${variationId}` : listingId;
  }

  set(listingId: string, value: T, variationId?: string): void {
    this.store.set(this.key(listingId, variationId), {
      value,
      expiresAt: this.now() + this.ttlMs,
    });
  }

  /** Returns the cached value for this listing only, or null if absent/expired. */
  get(listingId: string, variationId?: string): T | null {
    const k = this.key(listingId, variationId);
    const entry = this.store.get(k);
    if (!entry) return null;
    if (this.now() >= entry.expiresAt) {
      this.store.delete(k);
      return null;
    }
    return entry.value;
  }

  delete(listingId: string, variationId?: string): void {
    this.store.delete(this.key(listingId, variationId));
  }

  /** Removes expired entries (call periodically). */
  prune(): void {
    const t = this.now();
    for (const [k, entry] of this.store) {
      if (t >= entry.expiresAt) this.store.delete(k);
    }
  }

  get size(): number {
    return this.store.size;
  }
}
