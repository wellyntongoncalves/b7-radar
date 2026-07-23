/**
 * B7 Radar design tokens (single source of truth).
 * "Inteligência de mercado por Bloco 7 — Dados organizados. Decisões mais fortes."
 *
 * Consumed by the web app, the extension panel and the UI package. Keep in sync
 * with tokens.css (the CSS custom-property mirror used at runtime).
 */

export const brandColors = {
  /** Azul Bloco — primary. */
  blue: '#2457FF',
  /** Violeta 7 — secondary. */
  violet: '#6D35FF',
  /** Preto Estrutural — surfaces/text on light. */
  black: '#0B0D12',
  /** Ciano de Dados — data accent. */
  cyan: '#19C9E8',
  /** Branco Gelo — light background. */
  white: '#F6F8FC',
  /** Cinza de Interface — muted text/borders. */
  gray: '#667085',
} as const;

export const semanticColors = {
  success: '#16B364',
  warning: '#F79009',
  error: '#F04438',
  info: '#2E90FA',
} as const;

/** Institutional gradient — use sparingly (primary button, active accent, premium). */
export const institutionalGradient =
  'linear-gradient(135deg, #2457FF 0%, #6D35FF 55%, #19C9E8 100%)';

export const typography = {
  /** Brand, titles, headlines. */
  display: "'Sora', system-ui, sans-serif",
  /** UI, forms, tables, metrics. */
  body: "'Inter', system-ui, sans-serif",
  weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

/** Border radii — cards 8–12px, inputs 6–8px, buttons restrained. */
export const radius = {
  input: '6px',
  button: '8px',
  card: '12px',
  pill: '999px',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
} as const;

export const elevation = {
  /** Soft, discreet shadows only. */
  card: '0 1px 2px rgba(11,13,18,0.06), 0 4px 12px rgba(11,13,18,0.06)',
  panel: '0 8px 32px rgba(11,13,18,0.16)',
} as const;

/** Confidence colors used by metric chips. */
export const confidenceColors = {
  HIGH: semanticColors.success,
  MEDIUM: semanticColors.warning,
  LOW: semanticColors.error,
  UNAVAILABLE: brandColors.gray,
} as const;

export const brand = {
  name: 'B7 Radar',
  signature: 'Inteligência de mercado por Bloco 7',
  slogan: 'Dados organizados. Decisões mais fortes.',
} as const;
