import {
  MercadoLivreDomAdapter,
  type PageContext,
} from '@b7/marketplace-adapters';
import { PageKind } from '@b7/shared-types';
import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Panel } from '../components/Panel.js';
import { listingIdFromUrl, onUrlChange } from '../lib/spa.js';
import './style.css';

const adapter = new MercadoLivreDomAdapter();

// Content script: only runs on Mercado Livre. Detects the page kind and, on a
// product page, injects the B7 Radar panel into an isolated Shadow DOM. It never
// mutates the host page's own nodes, reloads, or blocks purchase buttons.
export default defineContentScript({
  matches: ['*://*.mercadolivre.com.br/*', '*://*.mercadolibre.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    if (adapter.identifyPage(location.href) !== PageKind.Product) return;

    const ui = await createShadowRootUi(ctx, {
      name: 'b7-radar-panel-host',
      position: 'overlay',
      anchor: 'body',
      onMount(container) {
        const root = createRoot(container);
        root.render(<Mount />);
        return root;
      },
      onRemove(root: Root | undefined) {
        root?.unmount();
      },
    });
    ui.mount();
  },
});

function Mount() {
  const [url, setUrl] = useState(location.href);
  const [closedFor, setClosedFor] = useState<string | null>(null);

  // Re-bind to the new listing whenever the SPA navigates. Keying <Panel> by
  // listingId forces a full remount, clearing the previous listing's data.
  useEffect(() => onUrlChange(setUrl), []);

  if (adapter.identifyPage(url) !== PageKind.Product) return null;

  const listingId = listingIdFromUrl(url);
  if (closedFor === listingId) return null;

  const ctx: PageContext = {
    url,
    root: document as unknown as PageContext['root'],
    nowIso: new Date().toISOString(),
  };
  const listing = adapter.extractListing(ctx);
  return (
    <Panel key={listingId ?? url} listing={listing} onClose={() => setClosedFor(listingId)} />
  );
}
