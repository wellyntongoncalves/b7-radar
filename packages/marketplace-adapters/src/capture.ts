import {
  CaptureMethod,
  ConfidenceLevel,
  DataClassification,
  type CapturedField,
} from '@b7/shared-types';
import type { ElementLike, ParentLike } from './adapter.js';

/** Builds a successfully-captured field with provenance. */
export function captured<T>(
  value: T,
  opts: {
    classification: DataClassification;
    confidence: ConfidenceLevel;
    source: string;
    method: CaptureMethod;
    capturedAt: string;
  },
): CapturedField<T> {
  return { value, ...opts };
}

/** Builds an unavailable field (value could not be read). Never invents data. */
export function unavailable<T>(
  source: string,
  method: CaptureMethod,
  capturedAt: string,
  error: string,
): CapturedField<T> {
  return {
    value: null,
    classification: DataClassification.Observed,
    confidence: ConfidenceLevel.Unavailable,
    source,
    method,
    capturedAt,
    error,
  };
}

/** Tries each selector in order and returns the first non-empty text. */
export function firstText(
  root: ParentLike,
  selectors: readonly string[],
): string | null {
  for (const sel of selectors) {
    const el: ElementLike | null = root.querySelector(sel);
    const text = el?.textContent?.trim();
    if (text) return text;
  }
  return null;
}

/** Parses a Brazilian-formatted number string ("1.234" or "1.234,56") to number. */
export function parseBrNumber(text: string | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Extracts the first integer found in a text ("+500 vendidos" -> 500). */
export function parseFirstInt(text: string | null): number | null {
  if (!text) return null;
  const match = text.replace(/\./g, '').match(/\d+/);
  return match ? Number(match[0]) : null;
}
