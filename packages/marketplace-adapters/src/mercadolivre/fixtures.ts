import { FakeElement, FakeRoot } from '../testing/fake-dom.js';
import { mlSelectors } from './selectors.js';

/**
 * Sanitized product fixture. Values are illustrative and do not reproduce any
 * real listing, seller, or proprietary content. Keyed by the exact selector
 * strings from the registry so the DOM adapter can read them.
 */
export function makeProductFixtureRoot(): FakeRoot {
  const p = mlSelectors.product;
  return new FakeRoot({
    [p.title[0]]: new FakeElement('Relógio Digital Esportivo Preto à Prova d’Água'),
    [p.price[0]]: new FakeElement('200'),
    [p.originalPrice[0]]: new FakeElement('260'),
    [p.soldQuantity[0]]: new FakeElement('+500 vendidos'),
    [p.availableQuantity[0]]: new FakeElement('50 disponíveis'),
    [p.reviewCount[0]]: new FakeElement('128'),
    [p.rating[0]]: new FakeElement('4.8'),
    [p.seller.name[0]]: new FakeElement('Loja Exemplo'),
    [p.freeShipping[0]]: new FakeElement('Frete grátis'),
  });
}

export const PRODUCT_FIXTURE_URL =
  'https://www.mercadolivre.com.br/relogio-digital-esportivo/p/MLB123456789';

/** Sanitized search results fixture (two items). */
export function makeSearchFixtureRoot(): FakeRoot {
  const s = mlSelectors.search;
  const item1 = new FakeElement(null, {}, {});
  item1.childrenList = {};
  const wrap1 = new FakeRoot({
    [s.title[0]]: new FakeElement('Relógio Digital Esportivo Preto'),
    [s.price[0]]: new FakeElement('198'),
    [s.link[0]]: new FakeElement('ver', { href: 'https://www.mercadolivre.com.br/p/MLB111' }),
  });
  const wrap2 = new FakeRoot({
    [s.title[0]]: new FakeElement('Relógio Inteligente Amoled'),
    [s.price[0]]: new FakeElement('134'),
    [s.link[0]]: new FakeElement('ver', { href: 'https://www.mercadolivre.com.br/p/MLB222' }),
  });
  // Represent each result item as a queryable element (fixtures cast to element).
  return new FakeRoot(
    {},
    {
      [s.resultItem[0]]: [wrap1 as unknown as FakeElement, wrap2 as unknown as FakeElement],
    },
  );
}
