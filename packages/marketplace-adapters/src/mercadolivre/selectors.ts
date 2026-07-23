/**
 * Central selector registry for Mercado Livre. Selectors live ONLY here, never
 * in components or ad-hoc queries, so DOM changes are fixed in one place and the
 * registry can be versioned and monitored (failures per selector).
 *
 * NOTE: These are generic, resilient selectors over publicly-displayed markup.
 * They target semantic/structural hooks, not private APIs. When a selector
 * yields nothing, adapters return an "unavailable" field — never an invented
 * value.
 */
export const ML_SELECTOR_REGISTRY_VERSION = 'ml-selectors@1.0.0';

export const mlSelectors = {
  product: {
    title: ['h1.ui-pdp-title', 'h1[class*="title"]'],
    price: ['[data-testid="price-part"] .andes-money-amount__fraction', '.ui-pdp-price__second-line .andes-money-amount__fraction'],
    priceCents: ['.andes-money-amount__cents'],
    originalPrice: ['s .andes-money-amount__fraction', '.ui-pdp-price__original-value .andes-money-amount__fraction'],
    soldQuantity: ['.ui-pdp-subtitle', '[class*="sold"]'],
    availableQuantity: ['[class*="stock"] .ui-pdp-buybox__quantity__available', '.ui-pdp-buybox__quantity__available'],
    reviewCount: ['.ui-pdp-review__amount', '[class*="review"] [class*="amount"]'],
    rating: ['.ui-pdp-review__rating', '[class*="rating"]'],
    seller: {
      name: ['.ui-pdp-seller__link-trigger', '[class*="seller"] [class*="name"]'],
      officialStore: ['.ui-pdp-seller__official-store', '[class*="official"]'],
    },
    freeShipping: ['[class*="shipping"] [class*="free"]', '.ui-pdp-color--GREEN'],
  },
  search: {
    resultItem: ['li.ui-search-layout__item', '[class*="search-layout__item"]'],
    title: ['.ui-search-item__title', 'h2'],
    price: ['.ui-search-price__second-line .andes-money-amount__fraction', '.andes-money-amount__fraction'],
    link: ['a.ui-search-link', 'a[href]'],
    freeShipping: ['[class*="shipping"] [class*="free"]'],
  },
} as const;

/** Data attributes B7 injects into its own nodes (namespaced to avoid clashes). */
export const B7_MARKERS = {
  panelHost: 'b7-radar-panel-host',
  searchCard: 'data-b7-search-card',
  sidebar: 'b7-radar-sidebar-host',
} as const;
