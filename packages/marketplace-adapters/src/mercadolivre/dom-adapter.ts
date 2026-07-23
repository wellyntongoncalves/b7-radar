import {
  CaptureMethod,
  ConfidenceLevel,
  DataClassification,
  ListingType,
  LogisticsType,
  Marketplace,
  PageKind,
  type CapturedField,
  type NormalizedListing,
  type NormalizedSellerRef,
} from '@b7/shared-types';
import type { AdapterSourceMetadata, MarketplaceAdapter, PageContext } from '../adapter.js';
import { captured, firstText, parseBrNumber, parseFirstInt, unavailable } from '../capture.js';
import { ML_SELECTOR_REGISTRY_VERSION, mlSelectors } from './selectors.js';

const SOURCE = 'mercadolivre.dom';

/** Adapter over publicly-displayed Mercado Livre markup. */
export class MercadoLivreDomAdapter implements MarketplaceAdapter {
  readonly marketplace = Marketplace.MercadoLivre;

  identifyPage(url: string): PageKind {
    let host = '';
    let path = '';
    try {
      const u = new URL(url);
      host = u.hostname;
      path = u.pathname;
    } catch {
      return PageKind.Unsupported;
    }
    if (!/mercadolivre\.com|mercadolibre\.com/.test(host)) return PageKind.Unsupported;
    if (/^\/(MLB-?\d|p\/MLB)/i.test(path) || /\/p\//.test(path)) return PageKind.Product;
    if (path.includes('/perfil/') || host.startsWith('perfil.')) return PageKind.Seller;
    if (/\/(listado|search)/.test(path) || url.includes('#D[')) return PageKind.Search;
    if (host.startsWith('lista.') || path.split('/').length <= 2) return PageKind.Search;
    return PageKind.Unsupported;
  }

  extractListing(ctx: PageContext): NormalizedListing {
    const now = ctx.nowIso;
    const s = mlSelectors.product;

    const title = textField(ctx, s.title, ConfidenceLevel.High, CaptureMethod.DomText, now);
    const price = numberField(ctx, s.price, now, 'preço');
    const originalPrice = numberField(ctx, s.originalPrice, now, 'preço original');
    const soldRaw = firstText(ctx.root, s.soldQuantity);
    const soldQuantity = intFromField(soldRaw, now, 'quantidade vendida');
    const availableQuantity = intFromField(
      firstText(ctx.root, s.availableQuantity),
      now,
      'estoque',
    );
    const reviewCount = intFromField(firstText(ctx.root, s.reviewCount), now, 'avaliações');
    const rating = ratingField(firstText(ctx.root, s.rating), now);

    const seller = this.extractSeller(ctx);

    return {
      marketplace: Marketplace.MercadoLivre,
      externalListingId: idFromUrl(ctx.url, now),
      title,
      url: ctx.url,
      listingType: enumField(ListingType.Unknown, now),
      categoryId: unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'categoria não exposta no DOM'),
      price,
      originalPrice,
      soldQuantity,
      availableQuantity,
      reviewCount,
      rating,
      createdAt: unavailable<string>(SOURCE, CaptureMethod.ApiField, now, 'data de criação disponível apenas via API'),
      logistics: logisticsField(ctx, now),
      freeShipping: boolField(!!firstText(ctx.root, s.freeShipping), now),
      shippingCost: unavailable<number>(SOURCE, CaptureMethod.DomText, now, 'frete varia por CEP'),
      seller,
      capturedAt: now,
    };
  }

  extractSearchResults(ctx: PageContext): NormalizedListing[] {
    const now = ctx.nowIso;
    const s = mlSelectors.search;
    const items = Array.from(ctx.root.querySelectorAll(s.resultItem[0]));
    return items.map((item) => {
      // In the browser and in fixtures, a result item is itself queryable.
      const root = item as unknown as PageContext['root'];
      const title = firstText(root, s.title);
      const priceText = firstText(root, s.price);
      const url = root.querySelector(s.link[0])?.getAttribute('href') ?? ctx.url;
      return {
        marketplace: Marketplace.MercadoLivre,
        externalListingId: idFromUrl(url, now),
        title: title
          ? captured(title, {
              classification: DataClassification.Observed,
              confidence: ConfidenceLevel.High,
              source: SOURCE,
              method: CaptureMethod.DomText,
              capturedAt: now,
            })
          : unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'título não encontrado'),
        url,
        listingType: enumField(ListingType.Unknown, now),
        categoryId: unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
        price: intFromNumber(parseBrNumber(priceText), now, 'preço'),
        originalPrice: unavailable<number>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
        soldQuantity: unavailable<number>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
        availableQuantity: unavailable<number>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
        reviewCount: unavailable<number>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
        rating: unavailable<number>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
        createdAt: unavailable<string>(SOURCE, CaptureMethod.ApiField, now, 'n/d'),
        logistics: enumField(LogisticsType.Unknown, now),
        freeShipping: boolField(!!firstText(root, s.freeShipping), now),
        shippingCost: unavailable<number>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
        seller: emptySeller(now),
        capturedAt: now,
      } satisfies NormalizedListing;
    });
  }

  extractSeller(ctx: PageContext): NormalizedSellerRef {
    const now = ctx.nowIso;
    const s = mlSelectors.product.seller;
    const name = firstText(ctx.root, s.name);
    return {
      externalSellerId: unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'id do vendedor via API'),
      publicName: name
        ? captured(name, {
            classification: DataClassification.Observed,
            confidence: ConfidenceLevel.High,
            source: SOURCE,
            method: CaptureMethod.DomText,
            capturedAt: now,
          })
        : unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'vendedor não encontrado'),
      location: unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
      reputation: unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
      officialStore: boolField(!!firstText(ctx.root, s.officialStore), now),
    };
  }

  getSourceMetadata(): AdapterSourceMetadata {
    return {
      marketplace: Marketplace.MercadoLivre,
      strategy: 'DOM',
      selectorRegistryVersion: ML_SELECTOR_REGISTRY_VERSION,
      capturedFrom: SOURCE,
    };
  }
}

// ── field builders ────────────────────────────────────────────────────────────

function textField(
  ctx: PageContext,
  selectors: readonly string[],
  confidence: ConfidenceLevel,
  method: CaptureMethod,
  now: string,
): CapturedField<string> {
  const text = firstText(ctx.root, selectors);
  return text
    ? captured(text, {
        classification: DataClassification.Observed,
        confidence,
        source: SOURCE,
        method,
        capturedAt: now,
      })
    : unavailable<string>(SOURCE, method, now, 'não encontrado no DOM');
}

function numberField(
  ctx: PageContext,
  selectors: readonly string[],
  now: string,
  label: string,
): CapturedField<number> {
  const n = parseBrNumber(firstText(ctx.root, selectors));
  return intFromNumber(n, now, label);
}

function intFromNumber(n: number | null, now: string, label: string): CapturedField<number> {
  return n !== null
    ? captured(n, {
        classification: DataClassification.Observed,
        confidence: ConfidenceLevel.High,
        source: SOURCE,
        method: CaptureMethod.DomText,
        capturedAt: now,
      })
    : unavailable<number>(SOURCE, CaptureMethod.DomText, now, `${label} não encontrado`);
}

function intFromField(text: string | null, now: string, label: string): CapturedField<number> {
  const n = parseFirstInt(text);
  return intFromNumber(n, now, label);
}

function ratingField(text: string | null, now: string): CapturedField<number> {
  const n = text ? Number(text.replace(',', '.').match(/[\d.]+/)?.[0]) : NaN;
  return Number.isFinite(n)
    ? captured(n, {
        classification: DataClassification.Observed,
        confidence: ConfidenceLevel.Medium,
        source: SOURCE,
        method: CaptureMethod.DomText,
        capturedAt: now,
      })
    : unavailable<number>(SOURCE, CaptureMethod.DomText, now, 'nota não encontrada');
}

function enumField<T>(value: T, now: string): CapturedField<T> {
  return captured(value, {
    classification: DataClassification.Observed,
    confidence: ConfidenceLevel.Low,
    source: SOURCE,
    method: CaptureMethod.DomAttribute,
    capturedAt: now,
  });
}

function boolField(value: boolean, now: string): CapturedField<boolean> {
  return captured(value, {
    classification: DataClassification.Observed,
    confidence: ConfidenceLevel.Medium,
    source: SOURCE,
    method: CaptureMethod.DomText,
    capturedAt: now,
  });
}

function logisticsField(ctx: PageContext, now: string): CapturedField<LogisticsType> {
  const s = mlSelectors.product;
  const free = firstText(ctx.root, s.freeShipping);
  const value = free ? LogisticsType.Full : LogisticsType.Unknown;
  return enumField(value, now);
}

function idFromUrl(url: string, now: string): CapturedField<string> {
  const match = url.match(/MLB-?\d+/i);
  return match
    ? captured(match[0].replace('-', ''), {
        classification: DataClassification.Observed,
        confidence: ConfidenceLevel.High,
        source: SOURCE,
        method: CaptureMethod.DomAttribute,
        capturedAt: now,
      })
    : unavailable<string>(SOURCE, CaptureMethod.DomAttribute, now, 'id não encontrado na URL');
}

function emptySeller(now: string): NormalizedSellerRef {
  return {
    externalSellerId: unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
    publicName: unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
    location: unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
    reputation: unavailable<string>(SOURCE, CaptureMethod.DomText, now, 'n/d'),
    officialStore: boolField(false, now),
  };
}
