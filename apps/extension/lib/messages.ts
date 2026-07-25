import type { NormalizedListing } from '@b7/shared-types';

/** Typed message contract between content scripts and the background worker. */
export type B7Message =
  | { type: 'b7:cache:set'; listingId: string; variationId?: string; value: NormalizedListing }
  | { type: 'b7:cache:get'; listingId: string; variationId?: string }
  | { type: 'b7:cache:delete'; listingId: string; variationId?: string }
  | {
      type: 'b7:alert:price';
      listingId: string;
      title: string;
      url: string;
      direction: 'up' | 'down';
      previousReais: number;
      currentReais: number;
    }
  | {
      type: 'b7:alert:target';
      listingId: string;
      title: string;
      url: string;
      targetReais: number;
      currentReais: number;
    };

export interface CacheGetResponse {
  readonly value: NormalizedListing | null;
}

/** Fire-and-forget alert (price change or target hit); background notifies. */
export function notifyAlert(
  msg: Extract<B7Message, { type: 'b7:alert:price' | 'b7:alert:target' }>,
): void {
  try {
    void chrome.runtime.sendMessage(msg);
  } catch {
    // Background may be asleep; alerts are best-effort.
  }
}

/** Fire-and-forget cache write for a listing (isolated by listingId). */
export function cacheListing(listing: NormalizedListing): void {
  const listingId = listing.externalListingId.value;
  if (!listingId) return;
  const msg: B7Message = { type: 'b7:cache:set', listingId, value: listing };
  try {
    void chrome.runtime.sendMessage(msg);
  } catch {
    // Background may be asleep; safe to ignore (cache is best-effort).
  }
}
