import type {
  Marketplace,
  NormalizedListing,
  NormalizedSellerRef,
  PageKind,
} from '@b7/shared-types';

/** Minimal shape an adapter needs from a page context (DOM or fixture). */
export interface PageContext {
  readonly url: string;
  /** Root element to query. In the browser this is `document`. */
  readonly root: ParentLike;
  /** Reference "now" as ISO UTC, injected for deterministic tests. */
  readonly nowIso: string;
}

/** Structural subset of Document/Element we depend on (keeps tests DOM-light). */
export interface ParentLike {
  querySelector(selectors: string): ElementLike | null;
  querySelectorAll(selectors: string): ArrayLike<ElementLike>;
}

export interface ElementLike {
  textContent: string | null;
  getAttribute(name: string): string | null;
}

/**
 * Contract every marketplace integration implements. Concrete adapters exist
 * for the official API, publicly-displayed DOM, and fixtures — never mixing
 * selectors into UI components.
 */
export interface MarketplaceAdapter {
  readonly marketplace: Marketplace;
  identifyPage(url: string): PageKind;
  extractListing(ctx: PageContext): NormalizedListing;
  extractSearchResults(ctx: PageContext): NormalizedListing[];
  extractSeller(ctx: PageContext): NormalizedSellerRef;
  getSourceMetadata(): AdapterSourceMetadata;
}

export interface AdapterSourceMetadata {
  readonly marketplace: Marketplace;
  readonly strategy: 'DOM' | 'API' | 'FIXTURE';
  readonly selectorRegistryVersion: string;
  readonly capturedFrom: string;
}
