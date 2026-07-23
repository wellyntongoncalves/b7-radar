import { describe, expect, it } from 'vitest';
import { ChangeKind, diffSnapshots } from './snapshot.js';

const base = { capturedAt: '2026-07-23T12:00:00Z' };

describe('diffSnapshots', () => {
  it('detects a price decrease', () => {
    const changes = diffSnapshots(
      { ...base, priceReais: 200 },
      { ...base, priceReais: 180 },
    );
    expect(changes).toEqual([{ kind: ChangeKind.PriceDecreased, from: 200, to: 180 }]);
  });

  it('detects stock going out and returning', () => {
    expect(diffSnapshots({ ...base, availableQuantity: 3 }, { ...base, availableQuantity: 0 })[0]?.kind).toBe(
      ChangeKind.StockOut,
    );
    expect(diffSnapshots({ ...base, availableQuantity: 0 }, { ...base, availableQuantity: 4 })[0]?.kind).toBe(
      ChangeKind.StockReturned,
    );
  });

  it('detects sales increase and listing type change', () => {
    const changes = diffSnapshots(
      { ...base, soldQuantity: 100, listingType: 'CLASSIC' },
      { ...base, soldQuantity: 130, listingType: 'PREMIUM' },
    );
    const kinds = changes.map((c) => c.kind);
    expect(kinds).toContain(ChangeKind.SalesUp);
    expect(kinds).toContain(ChangeKind.ListingTypeChanged);
  });

  it('reports no change when values are equal', () => {
    expect(diffSnapshots({ ...base, priceReais: 200 }, { ...base, priceReais: 200 })).toEqual([]);
  });

  it('never fabricates a change when data is missing', () => {
    expect(diffSnapshots({ ...base, priceReais: 200 }, { ...base })).toEqual([]);
    expect(diffSnapshots({ ...base }, { ...base, priceReais: 200 })).toEqual([]);
  });
});
