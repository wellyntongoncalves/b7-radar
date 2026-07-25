import type { NormalizedListing } from '@b7/shared-types';
import { ListingCache } from '../lib/listing-cache.js';
import type { B7Message, CacheGetResponse } from '../lib/messages.js';

// Background service worker. Owns the per-listingId cache (spec §7): values are
// isolated by listingId and expire after a short TTL, so data from one listing
// is never served for another. This is the store the official-API integration
// (fase 2) will read/write through.
export default defineBackground(() => {
  const cache = new ListingCache<NormalizedListing>();
  // Maps an open price-alert notification to the listing URL to open on click.
  const alertUrls = new Map<string, string>();

  chrome.runtime.onMessage.addListener((message: B7Message, _sender, sendResponse) => {
    switch (message.type) {
      case 'b7:cache:set':
        cache.set(message.listingId, message.value, message.variationId);
        return false;
      case 'b7:cache:get': {
        const value = cache.get(message.listingId, message.variationId);
        sendResponse({ value } satisfies CacheGetResponse);
        return true;
      }
      case 'b7:cache:delete':
        cache.delete(message.listingId, message.variationId);
        return false;
      case 'b7:alert:price': {
        const brl = (r: number) =>
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r);
        const arrow = message.direction === 'down' ? 'caiu' : 'subiu';
        const notifId = `b7-price-${message.listingId}`;
        alertUrls.set(notifId, message.url);
        chrome.notifications?.create(notifId, {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icon/128.png'),
          title: `B7 Radar — preço ${arrow}`,
          message: `${message.title}\n${brl(message.previousReais)} → ${brl(message.currentReais)}`,
        });
        return false;
      }
      default:
        return false;
    }
  });

  chrome.notifications?.onClicked.addListener((id) => {
    const url = alertUrls.get(id);
    if (url) {
      void chrome.tabs.create({ url });
      alertUrls.delete(id);
      chrome.notifications.clear(id);
    }
  });

  // Periodic pruning keeps memory bounded without a persistent timer.
  chrome.alarms?.create('b7-cache-prune', { periodInMinutes: 5 });
  chrome.alarms?.onAlarm.addListener((alarm) => {
    if (alarm.name === 'b7-cache-prune') cache.prune();
  });
});
