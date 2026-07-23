/**
 * Money math in integer cents (centavos). All financial calculations run in
 * cents to avoid binary floating-point drift; conversion to/from reais happens
 * only at the edges. Rounding is explicit and documented per operation.
 */

/** Amount in centavos (integer). 100 cents = R$ 1,00. */
export type Cents = number;

/** Rounds a real (BRL, possibly fractional) into integer cents, half away from zero. */
export function reaisToCents(reais: number): Cents {
  if (!Number.isFinite(reais)) {
    throw new RangeError(`reaisToCents: valor não finito (${reais})`);
  }
  return roundHalfAwayFromZero(reais * 100);
}

/** Converts integer cents back to reais as a number (may be fractional). */
export function centsToReais(cents: Cents): number {
  return cents / 100;
}

/**
 * Rounds to the nearest integer, ties away from zero (matches how prices are
 * usually rounded in retail, and is symmetric for negative margins).
 */
export function roundHalfAwayFromZero(n: number): number {
  return n < 0 ? -Math.round(-n) : Math.round(n);
}

/**
 * Applies a percentage (e.g. 14.5 for 14.5%) to a cents amount and rounds to
 * cents, half away from zero. Percent is expressed as a whole-number percent,
 * never a 0..1 ratio, to keep call sites unambiguous.
 */
export function percentOfCents(base: Cents, percent: number): Cents {
  return roundHalfAwayFromZero((base * percent) / 100);
}

/** Formats cents as pt-BR currency, e.g. 20085 -> "R$ 200,85". */
export function formatBRL(cents: Cents): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centsToReais(cents));
}

/** Formats a whole-number percent for the UI, e.g. 14.35 -> "14,35%". */
export function formatPercent(percent: number, fractionDigits = 2): string {
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(percent)}%`;
}
