import { MercadoLivreDomAdapter, type PageContext } from '@b7/marketplace-adapters';
import { PageKind } from '@b7/shared-types';
import { createRoot, type Root } from 'react-dom/client';
import { SearchSidebar } from '../components/SearchSidebar.js';
import './style.css';

const adapter = new MercadoLivreDomAdapter();

// Content script for Mercado Livre search/listing pages. Injects an aggregated
// B7 Radar sidebar (Shadow DOM) summarizing the results currently loaded. It
// reorganizes nothing in the host page and never blocks its controls.
export default defineContentScript({
  matches: ['*://*.mercadolivre.com.br/*', '*://*.mercadolibre.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    if (adapter.identifyPage(location.href) !== PageKind.Search) return;

    const ui = await createShadowRootUi(ctx, {
      name: 'b7-radar-sidebar-host',
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
  const pageCtx: PageContext = {
    url: location.href,
    root: document as unknown as PageContext['root'],
    nowIso: new Date().toISOString(),
  };
  const listings = adapter.extractSearchResults(pageCtx);
  if (listings.length === 0) return null;
  return <SearchSidebar listings={listings} />;
}
