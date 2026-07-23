import type { CaptureMethod, ConfidenceLevel, DataClassification } from './classification.js';
import type { IsoUtcTimestamp } from './metric.js';

/** Supported marketplaces. Only Mercado Livre BR in the MVP. */
export enum Marketplace {
  MercadoLivre = 'MERCADO_LIVRE',
}

/** Kind of listing on the marketplace. */
export enum ListingType {
  Classic = 'CLASSIC',
  Premium = 'PREMIUM',
  Unknown = 'UNKNOWN',
}

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  [ListingType.Classic]: 'Clássico',
  [ListingType.Premium]: 'Premium',
  [ListingType.Unknown]: 'Não identificado',
};

/** Fulfillment / logistics mode observed on a listing. */
export enum LogisticsType {
  Full = 'FULL',
  Flex = 'FLEX',
  Collect = 'COLLECT',
  Correios = 'CORREIOS',
  SellerShipping = 'SELLER_SHIPPING',
  Unknown = 'UNKNOWN',
}

export const LOGISTICS_TYPE_LABEL: Record<LogisticsType, string> = {
  [LogisticsType.Full]: 'Full',
  [LogisticsType.Flex]: 'Flex',
  [LogisticsType.Collect]: 'Coleta',
  [LogisticsType.Correios]: 'Correios',
  [LogisticsType.SellerShipping]: 'Envio pelo vendedor',
  [LogisticsType.Unknown]: 'Não identificado',
};

/** Which kind of Mercado Livre page the extension is looking at. */
export enum PageKind {
  Product = 'PRODUCT',
  Search = 'SEARCH',
  Seller = 'SELLER',
  Category = 'CATEGORY',
  Unsupported = 'UNSUPPORTED',
}

/**
 * A single captured field with provenance. Adapters return these so no raw,
 * unlabelled value ever reaches the domain or UI layers.
 */
export interface CapturedField<T> {
  readonly value: T | null;
  readonly classification: DataClassification;
  readonly confidence: ConfidenceLevel;
  readonly source: string;
  readonly method: CaptureMethod;
  readonly capturedAt: IsoUtcTimestamp;
  /** Raw text as shown by the marketplace (e.g. "+10 mil"), when grouped. */
  readonly rawText?: string;
  /** Marketplace presented a grouped/bucketed value (e.g. "+10 mil"). */
  readonly isGrouped?: boolean;
  readonly error?: string;
}

/** Normalized listing snapshot produced by an adapter. */
export interface NormalizedListing {
  readonly marketplace: Marketplace;
  readonly externalListingId: CapturedField<string>;
  readonly title: CapturedField<string>;
  readonly url: string;
  readonly listingType: CapturedField<ListingType>;
  readonly categoryId: CapturedField<string>;
  readonly price: CapturedField<number>;
  readonly originalPrice: CapturedField<number>;
  readonly soldQuantity: CapturedField<number>;
  readonly availableQuantity: CapturedField<number>;
  readonly reviewCount: CapturedField<number>;
  readonly rating: CapturedField<number>;
  readonly createdAt: CapturedField<IsoUtcTimestamp>;
  readonly logistics: CapturedField<LogisticsType>;
  readonly freeShipping: CapturedField<boolean>;
  readonly shippingCost: CapturedField<number>;
  readonly seller: NormalizedSellerRef;
  readonly capturedAt: IsoUtcTimestamp;
}

export interface NormalizedSellerRef {
  readonly externalSellerId: CapturedField<string>;
  readonly publicName: CapturedField<string>;
  readonly location: CapturedField<string>;
  readonly reputation: CapturedField<string>;
  readonly officialStore: CapturedField<boolean>;
}
