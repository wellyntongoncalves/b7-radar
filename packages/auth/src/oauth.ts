import { createHash, randomBytes } from 'node:crypto';

/**
 * OAuth helpers for connecting a marketplace account (Mercado Livre uses the
 * standard authorization-code flow with PKCE). These build URLs and PKCE pairs;
 * the actual token exchange happens server-side with the client secret from env.
 * We never store the marketplace password — only OAuth tokens, encrypted.
 */

export interface OAuthConfig {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly authorizeEndpoint: string;
  readonly tokenEndpoint: string;
}

/** Default endpoints for Mercado Livre Brazil. */
export const MERCADO_LIVRE_OAUTH: Omit<OAuthConfig, 'clientId' | 'redirectUri'> = {
  authorizeEndpoint: 'https://auth.mercadolivre.com.br/authorization',
  tokenEndpoint: 'https://api.mercadolibre.com/oauth/token',
};

export interface PkcePair {
  readonly verifier: string;
  readonly challenge: string;
  readonly method: 'S256';
}

function base64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateState(): string {
  return base64Url(randomBytes(24));
}

export function createPkcePair(): PkcePair {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge, method: 'S256' };
}

export function buildAuthorizationUrl(
  config: OAuthConfig,
  params: { state: string; codeChallenge: string },
): string {
  const url = new URL(config.authorizeEndpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export interface TokenExchangeConfig extends OAuthConfig {
  readonly clientSecret: string;
}

export interface OAuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly expiresInSeconds: number;
  readonly externalUserId: string | null;
  readonly scope: string | null;
}

/** Minimal fetch signature so the exchange is testable without a real network. */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export class OAuthExchangeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'OAuthExchangeError';
  }
}

/**
 * Exchanges an authorization code for tokens (authorization-code + PKCE). The
 * client secret is used only here, server-side. Returns tokens the caller must
 * encrypt at rest — this function never persists or logs them.
 */
export async function exchangeCodeForToken(
  config: TokenExchangeConfig,
  params: { code: string; codeVerifier: string },
  fetchFn: FetchLike = globalThis.fetch as unknown as FetchLike,
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: params.code,
    redirect_uri: config.redirectUri,
    code_verifier: params.codeVerifier,
  }).toString();

  const res = await fetchFn(config.tokenEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body,
  });

  if (!res.ok) {
    throw new OAuthExchangeError('Falha na troca de token OAuth.', res.status);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const accessToken = typeof data.access_token === 'string' ? data.access_token : null;
  if (!accessToken) {
    throw new OAuthExchangeError('Resposta de token inválida (sem access_token).', 502);
  }
  return {
    accessToken,
    refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : null,
    expiresInSeconds: typeof data.expires_in === 'number' ? data.expires_in : 0,
    externalUserId:
      data.user_id === undefined || data.user_id === null ? null : String(data.user_id),
    scope: typeof data.scope === 'string' ? data.scope : null,
  };
}
