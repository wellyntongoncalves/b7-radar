import {
  MercadoLivreDomAdapter,
  type PageContext,
} from '@b7/marketplace-adapters';
import { PageKind } from '@b7/shared-types';
import { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Panel } from '../components/Panel.js';
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
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  const ctx: PageContext = {
    url: location.href,
    root: document as unknown as PageContext['root'],
    nowIso: new Date().toISOString(),
  };
  const listing = adapter.extractListing(ctx);
  return <Panel listing={listing} onClose={() => setClosed(true)} />;
}
