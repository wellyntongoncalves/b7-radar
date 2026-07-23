/**
 * B7 Monitor — snapshot diffing (pure). Compares two observations of a listing
 * and reports meaningful changes, which feed alerts and history. Only fields
 * present in both snapshots are compared; missing data never fabricates a change.
 */

export interface MonitoredSnapshot {
  readonly capturedAt: string;
  readonly priceReais?: number | null;
  readonly availableQuantity?: number | null;
  readonly soldQuantity?: number | null;
  readonly listingType?: string | null;
  readonly title?: string | null;
  readonly freeShipping?: boolean | null;
}

export enum ChangeKind {
  PriceIncreased = 'PRICE_INCREASED',
  PriceDecreased = 'PRICE_DECREASED',
  StockOut = 'STOCK_OUT',
  StockReturned = 'STOCK_RETURNED',
  SalesUp = 'SALES_UP',
  ListingTypeChanged = 'LISTING_TYPE_CHANGED',
  TitleChanged = 'TITLE_CHANGED',
  ShippingChanged = 'SHIPPING_CHANGED',
}

export interface SnapshotChange {
  readonly kind: ChangeKind;
  readonly from: string | number | boolean | null;
  readonly to: string | number | boolean | null;
}

function present<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}

export function diffSnapshots(
  prev: MonitoredSnapshot,
  next: MonitoredSnapshot,
): SnapshotChange[] {
  const changes: SnapshotChange[] = [];

  if (present(prev.priceReais) && present(next.priceReais) && prev.priceReais !== next.priceReais) {
    changes.push({
      kind: next.priceReais > prev.priceReais ? ChangeKind.PriceIncreased : ChangeKind.PriceDecreased,
      from: prev.priceReais,
      to: next.priceReais,
    });
  }

  if (present(prev.availableQuantity) && present(next.availableQuantity)) {
    if (prev.availableQuantity > 0 && next.availableQuantity === 0) {
      changes.push({ kind: ChangeKind.StockOut, from: prev.availableQuantity, to: 0 });
    } else if (prev.availableQuantity === 0 && next.availableQuantity > 0) {
      changes.push({
        kind: ChangeKind.StockReturned,
        from: 0,
        to: next.availableQuantity,
      });
    }
  }

  if (present(prev.soldQuantity) && present(next.soldQuantity) && next.soldQuantity > prev.soldQuantity) {
    changes.push({ kind: ChangeKind.SalesUp, from: prev.soldQuantity, to: next.soldQuantity });
  }

  if (present(prev.listingType) && present(next.listingType) && prev.listingType !== next.listingType) {
    changes.push({
      kind: ChangeKind.ListingTypeChanged,
      from: prev.listingType,
      to: next.listingType,
    });
  }

  if (present(prev.title) && present(next.title) && prev.title !== next.title) {
    changes.push({ kind: ChangeKind.TitleChanged, from: prev.title, to: next.title });
  }

  if (present(prev.freeShipping) && present(next.freeShipping) && prev.freeShipping !== next.freeShipping) {
    changes.push({
      kind: ChangeKind.ShippingChanged,
      from: prev.freeShipping,
      to: next.freeShipping,
    });
  }

  return changes;
}
